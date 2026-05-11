import { NextResponse } from 'next/server';
import { getRoom, setRoom } from '@/lib/storage';
import { broadcastRoom } from '@/lib/pusher-server';
import { scoreRound } from '@/lib/game';
import { WIN_SCORE } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { code, playerId, cardId } = await req.json();
  const state = await getRoom(code?.toUpperCase());
  if (!state) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (state.phase !== 'vote') return NextResponse.json({ error: 'Not vote phase' }, { status: 409 });

  const storyteller = state.players[state.storytellerIndex];
  if (playerId === storyteller.id) {
    return NextResponse.json({ error: 'Storyteller cannot vote' }, { status: 403 });
  }
  if (state.votes.some((v) => v.voterId === playerId)) {
    return NextResponse.json({ error: 'Already voted' }, { status: 409 });
  }
  // Cannot vote for your own submitted card
  const own = state.submissions.find((s) => s.playerId === playerId);
  if (own && own.cardId === cardId) {
    return NextResponse.json({ error: 'Cannot vote for your own card' }, { status: 400 });
  }
  if (!state.shuffledCards.includes(cardId)) {
    return NextResponse.json({ error: 'Invalid card' }, { status: 400 });
  }

  state.votes.push({ voterId: playerId, cardId });

  // If everyone (except storyteller) voted, score & move to reveal
  const needed = state.players.length - 1;
  if (state.votes.length === needed) {
    const result = scoreRound(state);
    state.lastResult = result;
    state.phase = 'reveal';

    // Check end conditions: max rounds reached or someone hit win score
    const maxScore = Math.max(...state.players.map((p) => p.score));
    if (state.round >= state.maxRounds || maxScore >= WIN_SCORE) {
      state.phase = 'ended';
    }
  }

  await setRoom(state);
  await broadcastRoom(state);
  return NextResponse.json({ ok: true });
}
