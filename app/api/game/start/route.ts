import { NextResponse } from 'next/server';
import { getRoom, setRoom } from '@/lib/storage';
import { broadcastRoom } from '@/lib/pusher-server';
import { refillHands } from '@/lib/game';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { code, playerId, maxRounds } = await req.json();
  const state = await getRoom(code?.toUpperCase());
  if (!state) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const me = state.players.find((p) => p.id === playerId);
  if (!me?.isHost) return NextResponse.json({ error: 'Host only' }, { status: 403 });
  if (state.phase !== 'lobby') return NextResponse.json({ error: 'Already started' }, { status: 409 });
  if (state.players.length < 3) {
    return NextResponse.json({ error: 'Need at least 3 players' }, { status: 409 });
  }

  refillHands(state);
  state.phase = 'clue';
  state.round = 1;
  state.maxRounds = Math.max(3, Math.min(20, Number(maxRounds) || state.players.length * 2));
  state.storytellerIndex = 0;

  await setRoom(state);
  await broadcastRoom(state);
  return NextResponse.json({ ok: true });
}
