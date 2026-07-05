'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function savePlayerId(code: string, playerId: string) {
    localStorage.setItem(`dixit:${code}:playerId`, playerId);
    localStorage.setItem(`dixit:${code}:name`, name);
  }

  async function createRoom() {
    if (!name.trim()) return setError('Enter a name');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      savePlayerId(data.code, data.playerId);
      router.push(`/room/${data.code}`);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  async function joinRoom() {
    if (!name.trim()) return setError('Enter a name');
    if (!code.trim()) return setError('Enter a code');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase(), playerName: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      savePlayerId(data.code, data.playerId);
      router.push(`/room/${data.code}`);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center animate-fade-up">
          <p className="eyebrow mb-4 text-coral">A storytelling card game</p>
          <h1 className="font-display text-7xl font-medium leading-none tracking-tight text-ink">
            Dixit
          </h1>
          <p className="mt-4 font-display text-lg italic text-muted">
            Pick a card. Give a clue. Trick some, but not all.
          </p>
        </div>

        <div
          className="rounded-2xl border border-line bg-card p-7 shadow-frame animate-fade-up"
          style={{ animationDelay: '80ms' }}
        >
          {mode === 'menu' && (
            <div className="space-y-3">
              <button
                onClick={() => setMode('create')}
                className="w-full rounded-xl bg-ink py-4 text-base font-semibold text-paper transition-colors hover:bg-ink/90"
              >
                Create a room
              </button>
              <button
                onClick={() => setMode('join')}
                className="w-full rounded-xl border border-line bg-paper py-4 text-base font-semibold text-ink transition-colors hover:border-ink/30 hover:bg-line/40"
              >
                Join a room
              </button>
              <div className="flex items-center justify-center gap-3 pt-3 text-sm text-muted">
                <span>3–8 players</span>
                <span className="h-1 w-1 rounded-full bg-line" />
                <span>~10 minutes</span>
              </div>
            </div>
          )}

          {mode !== 'menu' && (
            <div className="space-y-4">
              <button
                onClick={() => { setMode('menu'); setError(''); }}
                className="text-sm font-medium text-muted transition-colors hover:text-ink"
              >
                ← back
              </button>
              <div className="space-y-1.5">
                <label className="eyebrow block text-muted">Your name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ada"
                  maxLength={20}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-ink placeholder-muted/50 transition-colors focus:border-coral focus:ring-2 focus:ring-coral/20"
                />
              </div>
              {mode === 'join' && (
                <div className="space-y-1.5">
                  <label className="eyebrow block text-muted">Room code</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ABCDE"
                    maxLength={5}
                    className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-center font-display text-2xl tracking-[0.4em] text-ink placeholder-muted/40 transition-colors focus:border-coral focus:ring-2 focus:ring-coral/20"
                  />
                </div>
              )}
              {error && (
                <p className="rounded-lg bg-coral/10 px-3 py-2 text-sm font-medium text-coralink">
                  {error}
                </p>
              )}
              <button
                onClick={mode === 'create' ? createRoom : joinRoom}
                disabled={loading}
                className="w-full rounded-xl bg-coral py-4 text-base font-semibold text-paper transition-colors hover:bg-coralink disabled:opacity-50"
              >
                {loading ? 'One moment…' : mode === 'create' ? 'Create room' : 'Join room'}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
