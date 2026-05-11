import { NextResponse } from 'next/server';
import { getRoom, setRoom } from '@/lib/storage';
import { broadcastRoom } from '@/lib/pusher-server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { code, playerName } = await req.json();
  if (!code || !playerName) {
    return NextResponse.json({ error: 'code and playerName required' }, { status: 400 });
  }

  const state = await getRoom(code.toUpperCase());
  if (!state) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (state.phase !== 'lobby') {
    return NextResponse.json({ error: 'Game already started' }, { status: 409 });
  }
  if (state.players.length >= 8) {
    return NextResponse.json({ error: 'Room full (max 8)' }, { status: 409 });
  }
  if (state.players.some((p) => p.name === playerName)) {
    return NextResponse.json({ error: 'Name taken' }, { status: 409 });
  }

  const playerId = crypto.randomUUID();
  state.players.push({
    id: playerId,
    name: playerName.slice(0, 20),
    score: 0,
    hand: [],
    isHost: false,
    connected: true,
  });
  await setRoom(state);
  await broadcastRoom(state);

  return NextResponse.json({ code: state.code, playerId });
}
