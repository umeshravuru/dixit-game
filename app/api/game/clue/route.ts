import { NextResponse } from 'next/server';
import { getRoom, setRoom } from '@/lib/storage';
import { broadcastRoom } from '@/lib/pusher-server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { code, playerId, cardId, clue } = await req.json();
  const state = await getRoom(code?.toUpperCase());
  if (!state) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (state.phase !== 'clue') return NextResponse.json({ error: 'Not clue phase' }, { status: 409 });

  const storyteller = state.players[state.storytellerIndex];
  if (storyteller.id !== playerId) {
    return NextResponse.json({ error: 'Not your turn' }, { status: 403 });
  }
  const cardIdx = storyteller.hand.indexOf(cardId);
  if (cardIdx === -1) return NextResponse.json({ error: 'Card not in hand' }, { status: 400 });
  const trimmedClue = String(clue || '').slice(0, 100).trim();
  if (!trimmedClue) return NextResponse.json({ error: 'Clue required' }, { status: 400 });

  storyteller.hand.splice(cardIdx, 1);
  state.storytellerCardId = cardId;
  state.clue = trimmedClue;
  state.phase = 'submit';
  state.submissions = [];
  state.votes = [];

  await setRoom(state);
  await broadcastRoom(state);
  return NextResponse.json({ ok: true });
}
