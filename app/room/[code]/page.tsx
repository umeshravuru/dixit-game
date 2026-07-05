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
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="font-display text-lg italic text-muted animate-pulse-soft">Loading…</p>
      </main>
    );
  }

  const me = state.players.find((p) => p.id === playerId);
  if (!me) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center">
        <p className="font-display text-2xl italic text-ink">You're not in this room.</p>
        <button
          onClick={() => router.push('/')}
          className="rounded-xl bg-ink px-6 py-3 font-semibold text-paper transition-colors hover:bg-ink/90"
        >
          Back home
        </button>
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
      <main className="mx-auto max-w-4xl p-4 md:p-8">
        <Header code={code} phase={state.phase} round={state.round} maxRounds={state.maxRounds} />
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <div className="rounded-2xl border border-line bg-card p-8 shadow-frame animate-fade-up">
              <h2 className="font-display text-3xl font-medium text-ink">The room is open</h2>
              <p className="mt-2 text-muted">Share this code with your friends to let them in.</p>

              <div className="ticket my-7 rounded-2xl border border-line px-6 py-7 text-center">
                <div className="eyebrow mb-3 text-muted">Room code</div>
                <div className="font-display text-6xl font-semibold tracking-[0.25em] text-ink">
                  {code}
                </div>
                <button
                  onClick={() => navigator.clipboard?.writeText(code)}
                  className="mt-4 text-sm font-medium text-coral transition-colors hover:text-coralink"
                >
                  Copy code
                </button>
              </div>

              {me.isHost ? (
                <button
                  onClick={() => apiCall('/api/game/start', { code, playerId, maxRounds: state.players.length * 2 })}
                  disabled={state.players.length < 3 || busy}
                  className="w-full rounded-xl bg-coral py-4 text-base font-semibold text-paper transition-colors hover:bg-coralink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {state.players.length < 3
                    ? `Need ${3 - state.players.length} more player${3 - state.players.length === 1 ? '' : 's'}`
                    : 'Start game'}
                </button>
              ) : (
                <p className="text-center font-display italic text-muted">
                  Waiting for the host to start…
                </p>
              )}
            </div>
          </div>
          <PlayerList players={state.players} storytellerId={null} meId={playerId} />
        </div>
        {error && <ErrorNote>{error}</ErrorNote>}
      </main>
    );
  }

  // ============ PHASE: CLUE (storyteller picks card + clue) ============
  if (state.phase === 'clue') {
    return (
      <main className="mx-auto max-w-6xl p-4 md:p-8">
        <Header code={code} phase={state.phase} round={state.round} maxRounds={state.maxRounds} />
        <div className="mt-8 grid gap-6 md:grid-cols-4">
          <div className="space-y-5 md:col-span-3">
            {isStoryteller ? (
              <>
                <div className="rounded-2xl border border-gold/40 bg-gold/10 p-6 animate-fade-up">
                  <p className="eyebrow mb-2 text-gold">🎭 You are the storyteller</p>
                  <p className="text-ink/80">
                    Choose a card, then give a clue. Score the most when{' '}
                    <em className="font-display not-italic font-semibold">some — but not all</em> —
                    guess your card.
                  </p>
                </div>
                <div className="rounded-2xl border border-line bg-card p-5 shadow-frame">
                  <label className="eyebrow mb-2 block text-muted">Your clue</label>
                  <input
                    value={clue}
                    onChange={(e) => setClue(e.target.value)}
                    placeholder="A word, a phrase, a sound…"
                    maxLength={100}
                    className="w-full rounded-xl border border-line bg-paper px-4 py-3 font-display text-lg italic text-ink placeholder-muted/50 transition-colors focus:border-coral focus:ring-2 focus:ring-coral/20"
                  />
                  <button
                    onClick={() => apiCall('/api/game/clue', { code, playerId, cardId: selectedCard, clue })}
                    disabled={selectedCard === null || !clue.trim() || busy}
                    className="mt-3 w-full rounded-xl bg-coral py-3 font-semibold text-paper transition-colors hover:bg-coralink disabled:opacity-40"
                  >
                    {selectedCard === null ? 'Select a card below' : 'Submit clue & card'}
                  </button>
                </div>
                <Hand hand={hand} selectedCard={selectedCard} onSelect={setSelectedCard} />
              </>
            ) : (
              <>
                <WaitingCard
                  title={storyteller.name}
                  subtitle="is dreaming up a clue…"
                  emoji="🎭"
                />
                <Hand
                  hand={hand}
                  readOnly
                  label="Your hand"
                  hint="Take a look — you'll pick a match once the clue arrives"
                />
              </>
            )}
          </div>
          <PlayerList players={state.players} storytellerId={storyteller.id} meId={playerId} />
        </div>
        {error && <ErrorNote>{error}</ErrorNote>}
      </main>
    );
  }

  // ============ PHASE: SUBMIT (others pick decoy) ============
  if (state.phase === 'submit') {
    return (
      <main className="mx-auto max-w-6xl p-4 md:p-8">
        <Header code={code} phase={state.phase} round={state.round} maxRounds={state.maxRounds} />
        <ClueBanner clue={state.clue} author={storyteller.name} />
        <div className="mt-6 grid gap-6 md:grid-cols-4">
          <div className="md:col-span-3">
            {isStoryteller ? (
              <WaitingCard
                title="Your storytellers are choosing"
                subtitle={`${state.submissions.length} of ${state.players.length - 1} have picked a decoy`}
              />
            ) : iSubmitted ? (
              <WaitingCard
                title="Card locked in"
                subtitle={`Waiting for ${state.players.length - 1 - state.submissions.length} more…`}
                done
              />
            ) : (
              <>
                <div className="mb-4 rounded-2xl border border-line bg-card p-5 shadow-frame">
                  <p className="text-ink/80">
                    Pick a card that fits the clue — you want others to mistake{' '}
                    <em className="font-display not-italic font-semibold">yours</em> for the
                    storyteller's.
                  </p>
                  <button
                    onClick={() => apiCall('/api/game/submit', { code, playerId, cardId: selectedCard })}
                    disabled={selectedCard === null || busy}
                    className="mt-3 w-full rounded-xl bg-coral py-3 font-semibold text-paper transition-colors hover:bg-coralink disabled:opacity-40"
                  >
                    {selectedCard === null ? 'Select a card below' : 'Submit card'}
                  </button>
                </div>
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
        {error && <ErrorNote>{error}</ErrorNote>}
      </main>
    );
  }

  // ============ PHASE: VOTE ============
  if (state.phase === 'vote') {
    return (
      <main className="mx-auto max-w-6xl p-4 md:p-8">
        <Header code={code} phase={state.phase} round={state.round} maxRounds={state.maxRounds} />
        <ClueBanner clue={state.clue} author={storyteller.name} />
        <div className="mt-6 grid gap-6 md:grid-cols-4">
          <div className="md:col-span-3">
            {isStoryteller ? (
              <div className="mb-5">
                <WaitingCard
                  title="Sit tight — you can't vote"
                  subtitle={`${state.votes.length} of ${state.players.length - 1} have voted`}
                />
              </div>
            ) : iVoted ? (
              <div className="mb-5">
                <WaitingCard title="Vote cast" subtitle="Waiting for the others…" done />
              </div>
            ) : (
              <div className="mb-5 rounded-2xl border border-line bg-card p-5 shadow-frame">
                <p className="text-ink/80">
                  Which card do you think is the{' '}
                  <em className="font-display not-italic font-semibold">storyteller's</em>?
                </p>
                <button
                  onClick={() => apiCall('/api/game/vote', { code, playerId, cardId: selectedCard })}
                  disabled={selectedCard === null || busy}
                  className="mt-3 w-full rounded-xl bg-coral py-3 font-semibold text-paper transition-colors hover:bg-coralink disabled:opacity-40"
                >
                  {selectedCard === null ? 'Select a card below' : 'Cast your vote'}
                </button>
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-4 md:gap-3">
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
        {error && <ErrorNote>{error}</ErrorNote>}
      </main>
    );
  }

  // ============ PHASE: REVEAL ============
  if (state.phase === 'reveal' || state.phase === 'ended') {
    const result = state.lastResult;
    return (
      <main className="mx-auto max-w-6xl p-4 md:p-8">
        <Header code={code} phase={state.phase} round={state.round} maxRounds={state.maxRounds} />
        {state.phase === 'ended' ? (
          <EndScreen state={state} />
        ) : (
          <>
            <ClueBanner clue={state.clue} author={storyteller.name} pastTense />
            <h2 className="mt-8 text-center font-display text-3xl font-medium text-ink">
              The reveal
            </h2>
            <div className="m-2 mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-sage" /> storyteller's card
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-coral" /> decoy that drew votes
              </span>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-6 md:gap-4">
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
                  <div
                    key={cardId}
                    className="flex w-64 flex-col items-center gap-2 animate-scale-in sm:w-44 md:w-40"
                  >
                    <Card
                      cardId={cardId}
                      outcome={outcome}
                      size="md"
                      label={isStoryCard ? `🎭 ${ownerName}` : ownerName}
                    />
                    {isStoryCard && (
                      <div className="eyebrow text-sage">✦ Storyteller's card</div>
                    )}
                    {!isStoryCard && voteCount > 0 && (
                      <div className="eyebrow text-coral">Decoy</div>
                    )}
                    <div className="text-sm font-medium text-ink/70">
                      {voteCount} vote{voteCount === 1 ? '' : 's'}
                    </div>
                    {voters.length > 0 && (
                      <div className="text-center text-xs leading-tight text-muted">
                        {voters.join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {result && (
              <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-line bg-card p-6 shadow-frame">
                <h3 className="eyebrow mb-4 text-center text-muted">Points this round</h3>
                <ul className="divide-y divide-line">
                  {state.players.map((p) => {
                    const delta = result.scoreDelta[p.id] || 0;
                    return (
                      <li key={p.id} className="flex items-center justify-between py-2 text-ink">
                        <span className="text-ink/80">{p.name}</span>
                        <span
                          className={`font-display text-lg font-semibold tabular-nums ${
                            delta > 0 ? 'text-sage' : 'text-muted/50'
                          }`}
                        >
                          {delta > 0 ? `+${delta}` : '—'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {me.isHost ? (
              <div className="mt-8 text-center">
                <button
                  onClick={() => apiCall('/api/game/next', { code, playerId })}
                  disabled={busy}
                  className="rounded-xl bg-ink px-10 py-3.5 font-semibold text-paper transition-colors hover:bg-ink/90 disabled:opacity-50"
                >
                  Next round →
                </button>
              </div>
            ) : (
              <p className="mt-8 text-center font-display italic text-muted">Waiting for the host…</p>
            )}
          </>
        )}
        {error && <ErrorNote>{error}</ErrorNote>}
      </main>
    );
  }

  return null;
}

function Header({ code, phase, round, maxRounds }: { code: string; phase: Phase; round: number; maxRounds: number }) {
  return (
    <header className="flex items-center justify-between border-b border-line pb-4">
      <a href="/" className="font-display text-2xl font-semibold tracking-tight text-ink">
        Dixit
      </a>
      <div className="flex items-center gap-2.5 text-sm text-muted">
        <span className="font-medium">Room {code}</span>
        <span className="h-1 w-1 rounded-full bg-line" />
        <span>{phase === 'lobby' ? 'Lobby' : `Round ${round} of ${maxRounds}`}</span>
      </div>
    </header>
  );
}

function ClueBanner({
  clue, author, pastTense,
}: { clue: string | null; author: string; pastTense?: boolean }) {
  return (
    <div className="mt-6 rounded-2xl border border-line bg-card px-6 py-6 text-center shadow-frame animate-fade-up">
      <p className="eyebrow mb-2 text-coral">{pastTense ? 'The clue was' : 'The clue'}</p>
      <p className="font-display text-3xl italic text-ink md:text-4xl">
        <span className="text-coral/40">“</span>
        {clue}
        <span className="text-coral/40">”</span>
      </p>
      <p className="mt-2 text-sm text-muted">— {author}</p>
    </div>
  );
}

function WaitingCard({
  title, subtitle, emoji, done,
}: { title: string; subtitle: string; emoji?: string; done?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-10 text-center shadow-frame animate-fade-up">
      {emoji && <div className="mb-3 text-4xl">{emoji}</div>}
      {done && (
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-sage/15 text-sage">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      <p className="font-display text-2xl font-medium text-ink">{title}</p>
      <p className="mt-1.5 text-muted">{subtitle}</p>
      {!done && (
        <div className="mt-5 flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-coral animate-pulse-soft"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mx-auto mt-6 max-w-md rounded-xl bg-coral/10 px-4 py-2.5 text-center text-sm font-medium text-coralink">
      {children}
    </p>
  );
}

function Hand({
  hand, selectedCard, onSelect, readOnly, label, hint,
}: {
  hand: number[];
  selectedCard?: number | null;
  onSelect?: (id: number) => void;
  readOnly?: boolean;
  label?: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="eyebrow text-muted">{label ?? 'Your hand'}</p>
        {hint && <p className="text-xs italic text-muted">{hint}</p>}
      </div>
      <div className="flex flex-wrap gap-3">
        {hand.map((cardId) => (
          <Card
            key={cardId}
            cardId={cardId}
            selected={!readOnly && selectedCard === cardId}
            onClick={readOnly ? undefined : () => onSelect?.(cardId)}
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
    <div className="mx-auto mt-8 max-w-lg animate-fade-up text-center">
      <p className="eyebrow mb-3 text-coral">Game over</p>
      <div className="mb-6 text-5xl">🏆</div>
      <h2 className="font-display text-4xl font-medium text-ink">{winner.name} wins</h2>
      <p className="mt-2 text-muted">with {winner.score} points</p>

      <ol className="mx-auto mb-8 mt-8 space-y-2 text-left">
        {ranked.map((p, i) => (
          <li
            key={p.id}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
              i === 0 ? 'border-gold/40 bg-gold/10' : 'border-line bg-card'
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="font-display text-lg font-semibold text-muted">{i + 1}</span>
              <span className="text-ink">{p.name}</span>
            </span>
            <span className="font-display text-lg font-semibold tabular-nums text-ink">{p.score}</span>
          </li>
        ))}
      </ol>

      <a
        href="/"
        className="inline-block rounded-xl bg-ink px-10 py-3.5 font-semibold text-paper transition-colors hover:bg-ink/90"
      >
        New game
      </a>
    </div>
  );
}
