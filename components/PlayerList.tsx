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

export function PlayerList({ players, storytellerId, meId, submittedIds, votedIds }: Props) {
  return (
    <div className="bg-ink/60 backdrop-blur rounded-xl p-4 border border-plum/30">
      <h3 className="text-gold font-bold text-sm uppercase tracking-wider mb-3">Players</h3>
      <ul className="space-y-2">
        {players.map((p) => {
          const isStoryteller = p.id === storytellerId;
          const isMe = p.id === meId;
          const submitted = submittedIds?.has(p.id);
          const voted = votedIds?.has(p.id);
          return (
            <li
              key={p.id}
              className={`flex items-center justify-between p-2 rounded-lg ${
                isStoryteller ? 'bg-gold/15 border border-gold/40' : ''
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {isStoryteller && <span title="Storyteller">🎭</span>}
                {p.isHost && !isStoryteller && <span title="Host" className="text-xs">👑</span>}
                <span className={`truncate ${isMe ? 'text-gold font-bold' : 'text-cream'}`}>
                  {p.name}{isMe && ' (you)'}
                </span>
                {submitted && <span className="text-green-400 text-xs">✓</span>}
                {voted && <span className="text-blue-300 text-xs">🗳</span>}
              </div>
              <span className="text-cream font-bold tabular-nums">{p.score}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
