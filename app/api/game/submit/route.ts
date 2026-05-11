import { NextResponse } from 'next/server';
import { getRoom, setRoom } from '@/lib/storage';
import { broadcastRoom } from '@/lib/pusher-server';
import { shuffle } from '@/lib/game';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { code, playerId, cardId } = await req.json();
  const state = await getRoom(code?.toUpperCase());
  if (!state) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (state.phase !== 'submit') return NextResponse.json({ error: 'Not submit phase' }, { status: 409 });

  const storyteller = state.players[state.storytellerIndex];
  if (playerId === storyteller.id) {
    return NextResponse.json({ error: 'Storyteller does not submit' }, { status: 403 });
  }
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return NextResponse.json({ error: 'Not in room' }, { status: 403 });
  if (state.submissions.some((s) => s.playerId === playerId)) {
    return NextResponse.json({ error: 'Already submitted' }, { status: 409 });
  }
  const cardIdx = player.hand.indexOf(cardId);
  if (cardIdx === -1) return NextResponse.json({ error: 'Card not in hand' }, { status: 400 });

  player.hand.splice(cardIdx, 1);
  state.submissions.push({ playerId, cardId });

  // If everyone submitted, move to voting and shuffle face-up reveal
  const needed = state.players.length - 1;
  if (state.submissions.length === needed) {
    const all = [state.storytellerCardId!, ...state.submissions.map((s) => s.cardId)];
    state.shuffledCards = shuffle(all);
    state.phase = 'vote';
  }

  await setRoom(state);
  await broadcastRoom(state);
  return NextResponse.json({ ok: true });
}
