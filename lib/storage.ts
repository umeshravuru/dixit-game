import { kv } from '@vercel/kv';
import type { GameState } from './types';

// In production we use Vercel KV. For local dev without KV credentials,
// we fall back to an in-memory Map (only works with `next dev` single process).
const memory = new Map<string, GameState>();
const hasKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

const TTL_SECONDS = 60 * 60 * 6; // rooms expire after 6h

export async function getRoom(code: string): Promise<GameState | null> {
  if (hasKV) {
    const data = await kv.get<GameState>(`room:${code}`);
    return data ?? null;
  }
  return memory.get(code) ?? null;
}

export async function setRoom(state: GameState): Promise<void> {
  if (hasKV) {
    await kv.set(`room:${state.code}`, state, { ex: TTL_SECONDS });
  } else {
    memory.set(state.code, state);
  }
}

export async function deleteRoom(code: string): Promise<void> {
  if (hasKV) {
    await kv.del(`room:${code}`);
  } else {
    memory.delete(code);
  }
}
