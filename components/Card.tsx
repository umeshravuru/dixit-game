'use client';

import { CARDS } from '@/lib/cards';

interface Props {
  cardId: number;
  selected?: boolean;
  highlighted?: boolean; // gold ring (e.g. storyteller's card on reveal)
  outcome?: 'correct' | 'decoy'; // reveal-phase emphasis: sage = storyteller's, coral = decoy
  disabled?: boolean;
  readOnly?: boolean; // display-only: no hover-lift, no pointer, not focusable
  onClick?: () => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Card({ cardId, selected, highlighted, outcome, disabled, readOnly, onClick, label, size = 'md' }: Props) {
  const card = CARDS[cardId];
  // Responsive sizes — bigger on mobile (where cards stack), smaller on desktop (where they fan out).
  const sizes = {
    sm: 'w-32 h-44 sm:w-28 sm:h-40 md:w-24 md:h-32',
    md: 'w-64 h-80 sm:w-44 sm:h-60 md:w-40 md:h-56 lg:w-44 lg:h-60',
    lg: 'w-72 h-96 sm:w-56 sm:h-72 md:w-48 md:h-64 lg:w-56 lg:h-72',
  };

  const ring =
    outcome === 'correct' ? 'ring-correct'
    : outcome === 'decoy' ? 'ring-decoy'
    : selected ? 'ring-select'
    : highlighted ? 'ring-story'
    : 'shadow-frame';

  const className = `card-frame group relative rounded-lg p-2 pb-3 ${sizes[size]} ${ring} ${
    disabled ? 'is-disabled' : ''
  } ${readOnly ? 'is-static' : ''} ${selected ? 'is-selected' : ''}`;

  const inner = (
    <>
      {/* Inner mat + artwork */}
      <div className="relative h-full w-full overflow-hidden rounded-sm bg-ink/5 shadow-inset">
        {card ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.url}
            alt={card.title}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src !== card.localUrl) img.src = card.localUrl;
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-3xl italic text-muted/50">
            ?
          </div>
        )}
        {label && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent px-2 pb-2 pt-6 text-center text-xs font-semibold tracking-wide text-paper">
            {label}
          </div>
        )}
      </div>
    </>
  );

  if (readOnly) {
    return <div className={className}>{inner}</div>;
  }

  return (
    <button onClick={onClick} disabled={disabled} className={className}>
      {inner}
    </button>
  );
}

export function CardBack({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-32 h-44 sm:w-28 sm:h-40 md:w-24 md:h-32',
    md: 'w-64 h-80 sm:w-44 sm:h-60 md:w-40 md:h-56 lg:w-44 lg:h-60',
    lg: 'w-72 h-96 sm:w-56 sm:h-72 md:w-48 md:h-64 lg:w-56 lg:h-72',
  };
  return (
    <div
      className={`${sizes[size]} flex items-center justify-center rounded-lg p-2 shadow-frame`}
      style={{ background: '#fbfaf6' }}
    >
      <div
        className="flex h-full w-full items-center justify-center rounded-sm"
        style={{
          background:
            'repeating-linear-gradient(45deg, #efe9dc 0 10px, #f4f1ea 10px 20px)',
          border: '1px solid #e3ddd0',
        }}
      >
        <div className="font-display text-4xl italic text-coral">D</div>
      </div>
    </div>
  );
}
