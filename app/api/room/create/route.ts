import { NextResponse } from 'next/server';
import { setRoom, getRoom } from '@/lib/storage';
import { generateRoomCode, newDeck } from '@/lib/game';
import type { GameState } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { hostName } = await req.json();
  if (!hostName || typeof hostName !== 'string') {
    return NextResponse.json({ error: 'hostName required' }, { status: 400 });
  }

  // Find an unused code
  let code = '';
  for (let i = 0; i < 10; i++) {
    code = generateRoomCode();
    if (!(await getRoom(code))) break;
  }

  const hostId = crypto.randomUUID();
  const state: GameState = {
    code,
    phase: 'lobby',
    players: [
      { id: hostId, name: hostName.slice(0, 20), score: 0, hand: [], isHost: true, connected: true },
    ],
    storytellerIndex: 0,
    clue: null,
    storytellerCardId: null,
    submissions: [],
    shuffledCards: [],
    votes: [],
    deck: newDeck(),
    round: 0,
    maxRounds: 0,
    lastResult: null,
    createdAt: Date.now(),
  };
  await setRoom(state);

  return NextResponse.json({ code, playerId: hostId });
}
