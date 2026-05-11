import Pusher from 'pusher';
import type { GameState } from './types';

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// Strip private info (other players' hands) from broadcasts.
// Each client merges the public state with their own hand fetched separately.
export function publicState(state: GameState) {
  return {
    code: state.code,
    phase: state.phase,
    players: state.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      handCount: p.hand.length,
      isHost: p.isHost,
      connected: p.connected,
    })),
    storytellerIndex: state.storytellerIndex,
    clue: state.clue,
    submissions: state.submissions.map((s) => ({ playerId: s.playerId })), // hide cardId until reveal
    shuffledCards: state.shuffledCards,
    votes: state.votes.map((v) => ({ voterId: v.voterId })), // hide vote until reveal
    round: state.round,
    maxRounds: state.maxRounds,
    lastResult: state.lastResult,
    deckCount: state.deck.length,
  };
}

export async function broadcastRoom(state: GameState) {
  await pusherServer.trigger(`room-${state.code}`, 'state', publicState(state));
}
