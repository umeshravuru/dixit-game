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
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-center text-5xl font-serif text-gold mb-2 tracking-wide">Dreamscape</h1>
        <p className="text-center text-cream/70 italic mb-10">a storytelling card game</p>

        <div className="bg-ink/60 backdrop-blur rounded-2xl p-8 card-shadow border border-plum/30">
          {mode === 'menu' && (
            <div className="space-y-3">
              <button
                onClick={() => setMode('create')}
                className="w-full py-4 rounded-xl bg-gold text-ink font-bold text-lg hover:bg-gold/90 transition"
              >
                Create Room
              </button>
              <button
                onClick={() => setMode('join')}
                className="w-full py-4 rounded-xl border-2 border-plum text-cream font-bold text-lg hover:bg-plum/30 transition"
              >
                Join Room
              </button>
              <p className="text-center text-cream/50 text-sm pt-4">3–8 players · 10 minutes</p>
            </div>
          )}

          {mode !== 'menu' && (
            <div className="space-y-4">
              <button
                onClick={() => { setMode('menu'); setError(''); }}
                className="text-cream/60 hover:text-cream text-sm"
              >
                ← back
              </button>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={20}
                className="w-full px-4 py-3 rounded-lg bg-ink/80 border border-plum/40 text-cream placeholder-cream/40 focus:outline-none focus:border-gold"
              />
              {mode === 'join' && (
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ROOM CODE"
                  maxLength={5}
                  className="w-full px-4 py-3 rounded-lg bg-ink/80 border border-plum/40 text-cream placeholder-cream/40 focus:outline-none focus:border-gold tracking-widest text-center text-xl"
                />
              )}
              {error && <p className="text-red-300 text-sm">{error}</p>}
              <button
                onClick={mode === 'create' ? createRoom : joinRoom}
                disabled={loading}
                className="w-full py-4 rounded-xl bg-gold text-ink font-bold text-lg hover:bg-gold/90 transition disabled:opacity-50"
              >
                {loading ? '...' : mode === 'create' ? 'Create' : 'Join'}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-cream/40 text-xs mt-8">
          Pick a card. Give a clue. Trick some, but not all.
        </p>
      </div>
    </main>
  );
}
