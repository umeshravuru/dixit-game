'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Pusher from 'pusher-js';
import { Card, CardBack } from '@/components/Card';
import { PlayerList } from '@/components/PlayerList';
import { CARDS } from '@/lib/cards';

type Phase = 'lobby' | 'clue' | 'submit' | 'vote' | 'reveal' | 'ended';

interface PublicPlayer {
  id: string; name: string; score: number; handCount: number; isHost: boolean; connected: boolean;
}
interface RoundResult {
  storytellerId: string;
  storytellerCardId: number;
  clue: string;
  submissions: { playerId: string; cardId: number }[];
  votes: { voterId: string; cardId: number }[];
  scoreDelta: Record<string, number>;
}
interface PublicState {
  code: string;
  phase: Phase;
  players: PublicPlayer[];
  storytellerIndex: number;
  clue: string | null;
  submissions: { playerId: string }[];
  shuffledCards: number[];
  votes: { voterId: string }[];
  round: number;
  maxRounds: number;
  lastResult: RoundResult | null;
}

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = params.code.toUpperCase();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [state, setState] = useState<PublicState | null>(null);
  const [hand, setHand] = useState<number[]>([]);
  const [revealedStorytellerCard, setRevealedStorytellerCard] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [clue, setClue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Restore player id from localStorage
  useEffect(() => {
    const pid = localStorage.getItem(`dixit:${code}:playerId`);
    if (!pid) {
      router.push('/');
      return;
    }
    setPlayerId(pid);
  }, [code, router]);

  // Fetch full state (state + hand)
  const refresh = useCallback(async () => {
    if (!playerId) return;
    const res = await fetch(`/api/room/state?code=${code}&playerId=${playerId}`);
    if (!res.ok) return;
    const data = await res.json();
    setState(data.state);
    setHand(data.hand);
    if (data.storytellerCardId !== null) setRevealedStorytellerCard(data.storytellerCardId);
    else setRevealedStorytellerCard(null);
  }, [code, playerId]);

  useEffect(() => { refresh(); }, [refresh]);

  // Pusher subscription
  useEffect(() => {
    if (!playerId) return;
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) {
      // Fallback: poll every 2s if Pusher not configured
      const id = setInterval(refresh, 2000);
      return () => clearInterval(id);
    }
    const pusher = new Pusher(key, { cluster });
    const channel = pusher.subscribe(`room-${code}`);
    channel.bind('state', (newState: PublicState) => {
      setState(newState);
      // re-fetch hand because it can change after dealing
      refresh();
    });
    return () => {
      pusher.unsubscribe(`room-${code}`);
      pusher.disconnect();
    };
  }, [code, playerId, refresh]);

  // Reset selection when phase changes
  useEffect(() => { setSelectedCard(null); setClue(''); }, [state?.phase, state?.round]);

  async function apiCall(path: string, body: any) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!state || !playerId) {
    return <main className="min-h-screen flex items-center justify-center text-cream">Loading…</main>;
  }

  const me = state.players.find((p) => p.id === playerId);
  if (!me) {
    return (
      <main className="min-h-screen flex items-center justify-center text-cream flex-col gap-4">
        <p>You're not in this room.</p>
        <button onClick={() => router.push('/')} className="px-4 py-2 bg-gold text-ink rounded">Home</button>
      </main>
    );
  }

  const storyteller = state.players[state.storytellerIndex];
  const isStoryteller = storyteller?.id === playerId;
  const submittedIds = new Set(state.submissions.map((s) => s.playerId));
  const votedIds = new Set(state.votes.map((v) => v.voterId));
  const iSubmitted = submittedIds.has(playerId);
  const iVoted = votedIds.has(playerId);

  // ============ PHASE: LOBBY ============
  if (state.phase === 'lobby') {
    return (
      <main className="min-h-screen p-3 md:p-6 max-w-4xl mx-auto">
        <Header code={code} phase={state.phase} round={state.round} maxRounds={state.maxRounds} />
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-ink/60 backdrop-blur rounded-2xl p-8 border border-plum/30">
              <h2 className="text-2xl text-gold font-serif mb-2">Waiting for players…</h2>
              <p className="text-cream/70 mb-6">Share the code with friends:</p>
              <div className="bg-ink/80 rounded-xl p-6 text-center mb-6">
                <div className="text-cream/50 text-sm uppercase tracking-wider mb-2">Room Code</div>
                <div className="text-5xl font-bold text-gold tracking-widest">{code}</div>
              </div>
              {me.isHost && (
                <button
                  onClick={() => apiCall('/api/game/start', { code, playerId, maxRounds: state.players.length * 2 })}
                  disabled={state.players.length < 3 || busy}
                  className="w-full py-4 rounded-xl bg-gold text-ink font-bold text-lg disabled:opacity-50 hover:bg-gold/90"
                >
                  {state.players.length < 3 ? `Need ${3 - state.players.length} more player(s)` : 'Start Game'}
                </button>
              )}
              {!me.isHost && <p className="text-cream/60 text-center italic">Waiting for host to start…</p>}
            </div>
          </div>
          <PlayerList players={state.players} storytellerId={null} meId={playerId} />
        </div>
        {error && <p className="text-red-300 text-center mt-4">{error}</p>}
      </main>
    );
  }

  // ============ PHASE: CLUE (storyteller picks card + clue) ============
  if (state.phase === 'clue') {
    return (
      <main className="min-h-screen p-3 md:p-6 max-w-6xl mx-auto">
        <Header code={code} phase={state.phase} round={state.round} maxRounds={state.maxRounds} />
        <div className="grid md:grid-cols-4 gap-6 mt-6">
          <div className="md:col-span-3 space-y-4">
            {isStoryteller ? (
              <>
                <div className="bg-gold/15 border-2 border-gold/50 rounded-xl p-5">
                  <p className="text-gold font-bold mb-1">🎭 You are the storyteller</p>
                  <p className="text-cream/80 text-sm">Pick a card from your hand, then give a clue. Be clever — you score most when <em>some but not all</em> players guess your card.</p>
                </div>
                <input
                  value={clue}
                  onChange={(e) => setClue(e.target.value)}
                  placeholder="Your clue (a word, phrase, sound...)"
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-lg bg-ink/80 border border-plum/40 text-cream placeholder-cream/40 focus:outline-none focus:border-gold"
                />
                <button
                  onClick={() => apiCall('/api/game/clue', { code, playerId, cardId: selectedCard, clue })}
                  disabled={selectedCard === null || !clue.trim() || busy}
                  className="w-full py-3 rounded-xl bg-gold text-ink font-bold disabled:opacity-50"
                >
                  Submit clue & card
                </button>
                <Hand hand={hand} selectedCard={selectedCard} onSelect={setSelectedCard} />
              </>
            ) : (
              <div className="bg-ink/60 rounded-2xl p-8 text-center">
                <p className="text-2xl text-gold mb-2">🎭 {storyteller.name}</p>
                <p className="text-cream/70 italic">is dreaming up a clue…</p>
              </div>
            )}
          </div>
          <PlayerList players={state.players} storytellerId={storyteller.id} meId={playerId} />
        </div>
        {error && <p className="text-red-300 text-center mt-4">{error}</p>}
      </main>
    );
  }

  // ============ PHASE: SUBMIT (others pick decoy) ============
  if (state.phase === 'submit') {
    return (
      <main className="min-h-screen p-3 md:p-6 max-w-6xl mx-auto">
        <Header code={code} phase={state.phase} round={state.round} maxRounds={state.maxRounds} />
        <div className="bg-plum/20 border-2 border-plum/50 rounded-xl p-5 mt-6 text-center">
          <p className="text-cream/60 text-xs uppercase tracking-wider mb-1">The clue is</p>
          <p className="text-3xl text-gold font-serif italic">"{state.clue}"</p>
          <p className="text-cream/60 text-sm mt-2">— {storyteller.name}</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6 mt-6">
          <div className="md:col-span-3">
            {isStoryteller ? (
              <div className="bg-ink/60 rounded-2xl p-8 text-center">
                <p className="text-cream/70">Others are picking their cards…</p>
                <p className="text-cream/50 text-sm mt-2">
                  {state.submissions.length} / {state.players.length - 1} submitted
                </p>
              </div>
            ) : iSubmitted ? (
              <div className="bg-ink/60 rounded-2xl p-8 text-center">
                <p className="text-cream/70">Card submitted ✓</p>
                <p className="text-cream/50 text-sm mt-2">
                  Waiting for {state.players.length - 1 - state.submissions.length} more…
                </p>
              </div>
            ) : (
              <>
                <p className="text-cream/80 mb-3">Pick a card that matches the clue — try to fool the others.</p>
                <button
                  onClick={() => apiCall('/api/game/submit', { code, playerId, cardId: selectedCard })}
                  disabled={selectedCard === null || busy}
                  className="w-full py-3 rounded-xl bg-gold text-ink font-bold disabled:opacity-50 mb-4"
                >
                  Submit card
                </button>
                <Hand hand={hand} selectedCard={selectedCard} onSelect={setSelectedCard} />
              </>
            )}
          </div>
          <PlayerList
            players={state.players}
            storytellerId={storyteller.id}
            meId={playerId}
            submittedIds={submittedIds}
          />
        </div>
        {error && <p className="text-red-300 text-center mt-4">{error}</p>}
      </main>
    );
  }

  // ============ PHASE: VOTE ============
  if (state.phase === 'vote') {
    return (
      <main className="min-h-screen p-3 md:p-6 max-w-6xl mx-auto">
        <Header code={code} phase={state.phase} round={state.round} maxRounds={state.maxRounds} />
        <div className="bg-plum/20 border-2 border-plum/50 rounded-xl p-5 mt-6 text-center">
          <p className="text-cream/60 text-xs uppercase tracking-wider mb-1">The clue is</p>
          <p className="text-3xl text-gold font-serif italic">"{state.clue}"</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6 mt-6">
          <div className="md:col-span-3">
            {isStoryteller ? (
              <div className="bg-ink/60 rounded-2xl p-6 text-center mb-4">
                <p className="text-cream/70">Others are voting…</p>
                <p className="text-cream/50 text-sm mt-2">{state.votes.length} / {state.players.length - 1} voted</p>
              </div>
            ) : iVoted ? (
              <div className="bg-ink/60 rounded-2xl p-6 text-center mb-4">
                <p className="text-cream/70">Vote cast ✓</p>
                <p className="text-cream/50 text-sm mt-2">Waiting for others…</p>
              </div>
            ) : (
              <>
                <p className="text-cream/80 mb-3">Which card do you think is the storyteller's?</p>
                <button
                  onClick={() => apiCall('/api/game/vote', { code, playerId, cardId: selectedCard })}
                  disabled={selectedCard === null || busy}
                  className="w-full py-3 rounded-xl bg-gold text-ink font-bold disabled:opacity-50 mb-4"
                >
                  Vote
                </button>
              </>
            )}
            <div className="flex flex-wrap gap-4 md:gap-3 justify-center">
              {state.shuffledCards.map((cardId) => {
                const myOwnCard = state.submissions.find(
                  (s) => s.playerId === playerId
                );
                // We can't see other players' cardIds, but we DO know our own
                // submission via the hand difference. Simpler: query backend if needed.
                // For UI: just disable our own card by checking against original hand.
                const isMine = myOwnCard !== undefined && false; // server enforces
                return (
                  <Card
                    key={cardId}
                    cardId={cardId}
                    selected={selectedCard === cardId}
                    onClick={() => !iVoted && !isStoryteller && setSelectedCard(cardId)}
                    disabled={iVoted || isStoryteller || isMine}
                    size="md"
                  />
                );
              })}
            </div>
          </div>
          <PlayerList
            players={state.players}
            storytellerId={storyteller.id}
            meId={playerId}
            votedIds={votedIds}
          />
        </div>
        {error && <p className="text-red-300 text-center mt-4">{error}</p>}
      </main>
    );
  }

  // ============ PHASE: REVEAL ============
  if (state.phase === 'reveal' || state.phase === 'ended') {
    const result = state.lastResult;
    return (
      <main className="min-h-screen p-3 md:p-6 max-w-6xl mx-auto">
        <Header code={code} phase={state.phase} round={state.round} maxRounds={state.maxRounds} />
        {state.phase === 'ended' ? (
          <EndScreen state={state} />
        ) : (
          <>
            <div className="bg-plum/20 border-2 border-plum/50 rounded-xl p-5 mt-6 text-center">
              <p className="text-cream/60 text-xs uppercase tracking-wider mb-1">Clue was</p>
              <p className="text-3xl text-gold font-serif italic">"{state.clue}"</p>
              <p className="text-cream/60 text-sm mt-2">— {storyteller.name}</p>
            </div>
            <h2 className="text-2xl text-gold font-serif text-center mt-6 mb-2">Reveal</h2>
            <p className="text-center text-cream/60 text-sm mb-4">
              <span className="text-green-400 font-bold">Green</span> = storyteller's card ·{' '}
              <span className="text-red-400 font-bold">Red</span> = decoy that got votes
            </p>
            <div className="flex flex-wrap gap-6 md:gap-4 justify-center">
              {state.shuffledCards.map((cardId) => {
                const isStoryCard = cardId === revealedStorytellerCard;
                const owner =
                  result?.submissions.find((s) => s.cardId === cardId) ||
                  (isStoryCard ? { playerId: storyteller.id } : null);
                const ownerName = owner ? state.players.find((p) => p.id === owner.playerId)?.name : '';
                const voters =
                  result?.votes.filter((v) => v.cardId === cardId)
                    .map((v) => state.players.find((p) => p.id === v.voterId)?.name)
                    .filter(Boolean) ?? [];
                const voteCount = voters.length;
                const outcome: 'correct' | 'decoy' | undefined =
                  isStoryCard ? 'correct' : voteCount > 0 ? 'decoy' : undefined;
                return (
                  <div key={cardId} className="flex flex-col items-center gap-2 w-64 sm:w-44 md:w-40">
                    <Card
                      cardId={cardId}
                      outcome={outcome}
                      size="md"
                      label={isStoryCard ? `🎭 ${ownerName}` : ownerName}
                    />
                    {isStoryCard && (
                      <div className="text-green-400 font-bold text-xs uppercase tracking-wider">
                        ✅ Storyteller's card
                      </div>
                    )}
                    {!isStoryCard && voteCount > 0 && (
                      <div className="text-red-400 font-bold text-xs uppercase tracking-wider">
                        ❌ Decoy
                      </div>
                    )}
                    <div className="text-cream/80 text-sm">
                      {voteCount} vote{voteCount === 1 ? '' : 's'}
                    </div>
                    {voters.length > 0 && (
                      <div className="text-cream/50 text-xs text-center leading-tight">
                        voted by: {voters.join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {result && (
              <div className="bg-ink/60 rounded-xl p-5 mt-6 max-w-lg mx-auto">
                <h3 className="text-gold font-bold mb-3 text-center">Score this round</h3>
                <ul className="space-y-1">
                  {state.players.map((p) => {
                    const delta = result.scoreDelta[p.id] || 0;
                    return (
                      <li key={p.id} className="flex justify-between text-cream">
                        <span>{p.name}</span>
                        <span className={delta > 0 ? 'text-green-400' : 'text-cream/50'}>
                          {delta > 0 ? `+${delta}` : '—'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {me.isHost && (
              <div className="text-center mt-6">
                <button
                  onClick={() => apiCall('/api/game/next', { code, playerId })}
                  disabled={busy}
                  className="px-8 py-3 rounded-xl bg-gold text-ink font-bold hover:bg-gold/90 disabled:opacity-50"
                >
                  Next round →
                </button>
              </div>
            )}
            {!me.isHost && <p className="text-center text-cream/60 italic mt-6">Waiting for host…</p>}
          </>
        )}
        {error && <p className="text-red-300 text-center mt-4">{error}</p>}
      </main>
    );
  }

  return null;
}

function Header({ code, phase, round, maxRounds }: { code: string; phase: Phase; round: number; maxRounds: number }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-serif text-gold">Dixit</h1>
        <p className="text-cream/50 text-xs uppercase tracking-wider mt-1">
          Room {code} · {phase === 'lobby' ? 'Lobby' : `Round ${round}/${maxRounds}`}
        </p>
      </div>
    </div>
  );
}

function Hand({
  hand, selectedCard, onSelect,
}: { hand: number[]; selectedCard: number | null; onSelect: (id: number) => void }) {
  return (
    <div>
      <p className="text-cream/60 text-xs uppercase tracking-wider mb-2">Your hand</p>
      <div className="flex flex-wrap gap-3">
        {hand.map((cardId) => (
          <Card
            key={cardId}
            cardId={cardId}
            selected={selectedCard === cardId}
            onClick={() => onSelect(cardId)}
            size="md"
          />
        ))}
      </div>
    </div>
  );
}

function EndScreen({ state }: { state: PublicState }) {
  const ranked = [...state.players].sort((a, b) => b.score - a.score);
  const winner = ranked[0];
  return (
    <div className="bg-ink/60 backdrop-blur rounded-2xl p-8 mt-6 text-center">
      <h2 className="text-4xl text-gold font-serif mb-2">Game Over</h2>
      <p className="text-cream/70 mb-6">🏆 {winner.name} wins with {winner.score} points!</p>
      <ol className="max-w-sm mx-auto space-y-2 mb-8">
        {ranked.map((p, i) => (
          <li key={p.id} className="flex justify-between text-cream bg-ink/50 rounded px-4 py-2">
            <span>{i + 1}. {p.name}</span>
            <span className="font-bold">{p.score}</span>
          </li>
        ))}
      </ol>
      <a href="/" className="inline-block px-8 py-3 rounded-xl bg-gold text-ink font-bold hover:bg-gold/90">
        New game
      </a>
    </div>
  );
}
