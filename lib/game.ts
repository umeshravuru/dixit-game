import type { GameState, RoundResult } from './types';
import { CARD_COUNT, HAND_SIZE } from './cards-meta';

// Fisher-Yates shuffle (mutates)
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no easily-confused chars
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function newDeck(): number[] {
  return shuffle(Array.from({ length: CARD_COUNT }, (_, i) => i));
}

// Deal cards from the deck. If the deck runs out we reshuffle a fresh deck.
export function dealCards(state: GameState, count: number): number[] {
  const dealt: number[] = [];
  for (let i = 0; i < count; i++) {
    if (state.deck.length === 0) state.deck = newDeck();
    dealt.push(state.deck.pop()!);
  }
  return dealt;
}

export function refillHands(state: GameState): void {
  for (const p of state.players) {
    const need = HAND_SIZE - p.hand.length;
    if (need > 0) p.hand.push(...dealCards(state, need));
  }
}

// Dixit scoring:
//  - If ALL non-storytellers vote for the storyteller's card OR NONE do:
//      storyteller gets 0, all others get 2.
//  - Otherwise:
//      storyteller gets 3, plus each correct voter gets 3.
//  - Every player (except storyteller) gets 1 bonus point for each vote their
//    decoy card received.
export function scoreRound(state: GameState): RoundResult {
  const storyteller = state.players[state.storytellerIndex];
  const storytellerCardId = state.storytellerCardId!;
  const others = state.players.filter((p) => p.id !== storyteller.id);

  const correctVoters = state.votes.filter((v) => v.cardId === storytellerCardId);
  const allCorrect = correctVoters.length === others.length;
  const noneCorrect = correctVoters.length === 0;

  const delta: Record<string, number> = {};
  for (const p of state.players) delta[p.id] = 0;

  if (allCorrect || noneCorrect) {
    for (const p of others) delta[p.id] += 2;
  } else {
    delta[storyteller.id] += 3;
    for (const v of correctVoters) delta[v.voterId] += 3;
  }

  // Bonus: decoy votes (votes on a non-storyteller card -> that card's owner +1)
  for (const v of state.votes) {
    if (v.cardId === storytellerCardId) continue;
    const owner = state.submissions.find((s) => s.cardId === v.cardId);
    if (owner) delta[owner.playerId] = (delta[owner.playerId] || 0) + 1;
  }

  for (const p of state.players) p.score += delta[p.id] || 0;

  return {
    storytellerId: storyteller.id,
    storytellerCardId,
    clue: state.clue!,
    submissions: [...state.submissions],
    votes: [...state.votes],
    scoreDelta: delta,
  };
}
