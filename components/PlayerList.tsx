'use client';

interface Player {
  id: string;
  name: string;
  score: number;
  handCount: number;
  isHost: boolean;
}

interface Props {
  players: Player[];
  storytellerId: string | null;
  meId: string;
  submittedIds?: Set<string>;
  votedIds?: Set<string>;
}

// Deterministic warm-toned avatar color from the player's id.
const AVATAR_COLORS = ['#e0533d', '#3f7a6d', '#b98a2e', '#8a5a9e', '#3d6ea5', '#c2603d'];
function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function PlayerList({ players, storytellerId, meId, submittedIds, votedIds }: Props) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-frame">
      <h3 className="eyebrow mb-4 text-muted">Players</h3>
      <ul className="space-y-1">
        {players.map((p) => {
          const isStoryteller = p.id === storytellerId;
          const isMe = p.id === meId;
          const submitted = submittedIds?.has(p.id);
          const voted = votedIds?.has(p.id);
          const initial = p.name.trim().charAt(0).toUpperCase() || '?';
          return (
            <li
              key={p.id}
              className={`flex items-center justify-between rounded-xl px-2.5 py-2 transition-colors ${
                isStoryteller ? 'bg-gold/10 ring-1 ring-inset ring-gold/30' : ''
              }`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-semibold text-paper"
                  style={{ background: avatarColor(p.id) }}
                >
                  {initial}
                </span>
                <span className={`truncate text-sm ${isMe ? 'font-semibold text-ink' : 'text-ink/80'}`}>
                  {p.name}
                  {isMe && <span className="text-muted"> (you)</span>}
                </span>
                {isStoryteller && (
                  <span title="Storyteller" className="text-xs" aria-label="Storyteller">🎭</span>
                )}
                {p.isHost && !isStoryteller && (
                  <span title="Host" className="text-[10px]" aria-label="Host">👑</span>
                )}
              </div>
              <div className="flex flex-none items-center gap-2">
                {submitted && (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-sage"
                    title="Submitted"
                    aria-label="Submitted"
                  />
                )}
                {voted && (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-coral"
                    title="Voted"
                    aria-label="Voted"
                  />
                )}
                <span className="min-w-[1.5rem] text-right font-display text-base font-semibold tabular-nums text-ink">
                  {p.score}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
