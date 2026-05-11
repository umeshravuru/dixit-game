import { NextResponse } from 'next/server';
import { getRoom } from '@/lib/storage';
import { publicState } from '@/lib/pusher-server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code')?.toUpperCase();
  const playerId = url.searchParams.get('playerId');
  if (!code || !playerId) {
    return NextResponse.json({ error: 'code and playerId required' }, { status: 400 });
  }
  const state = await getRoom(code);
  if (!state) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const me = state.players.find((p) => p.id === playerId);
  return NextResponse.json({
    state: publicState(state),
    hand: me?.hand ?? [],
    storytellerCardId: state.phase === 'reveal' || state.phase === 'ended' ? state.storytellerCardId : null,
  });
}
