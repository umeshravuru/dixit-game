import { NextResponse } from 'next/server';
import { getRoom, setRoom } from '@/lib/storage';
import { broadcastRoom } from '@/lib/pusher-server';
import { refillHands } from '@/lib/game';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { code, playerId } = await req.json();
  const state = await getRoom(code?.toUpperCase());
  if (!state) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  const me = state.players.find((p) => p.id === playerId);
  if (!me?.isHost) return NextResponse.json({ error: 'Host only' }, { status: 403 });
  if (state.phase !== 'reveal') {
    return NextResponse.json({ error: 'Not at reveal phase' }, { status: 409 });
  }

  // Advance storyteller, refill hands, reset round state
  state.storytellerIndex = (state.storytellerIndex + 1) % state.players.length;
  state.round += 1;
  state.clue = null;
  state.storytellerCardId = null;
  state.submissions = [];
  state.shuffledCards = [];
  state.votes = [];
  state.phase = 'clue';
  refillHands(state);

  await setRoom(state);
  await broadcastRoom(state);
  return NextResponse.json({ ok: true });
}
