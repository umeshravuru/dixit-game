'use client';

import { CARDS } from '@/lib/cards';

interface Props {
  cardId: number;
  selected?: boolean;
  highlighted?: boolean; // gold glow (e.g. storyteller's card on reveal)
  outcome?: 'correct' | 'decoy'; // reveal-phase emphasis: green = storyteller's, red = decoy
  disabled?: boolean;
  onClick?: () => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Card({ cardId, selected, highlighted, outcome, disabled, onClick, label, size = 'md' }: Props) {
  const card = CARDS[cardId];
  // Responsive sizes — bigger on mobile (where cards stack), smaller on desktop (where they fan out).
  const sizes = {
    sm: 'w-32 h-44 sm:w-28 sm:h-40 md:w-24 md:h-32',
    md: 'w-64 h-80 sm:w-44 sm:h-60 md:w-40 md:h-56 lg:w-44 lg:h-60',
    lg: 'w-72 h-96 sm:w-56 sm:h-72 md:w-48 md:h-64 lg:w-56 lg:h-72',
  };

  const glow =
    outcome === 'correct' ? 'glow-green'
    : outcome === 'decoy' ? 'glow-red'
    : selected ? 'glow-plum'
    : highlighted ? 'glow-gold'
    : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`card-tile relative rounded-xl overflow-hidden card-shadow ${sizes[size]} ${glow} ${disabled ? 'disabled' : ''}`}
      style={{ background: '#1a0f2e' }}
    >
      {card ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.url}
          alt={card.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src !== card.localUrl) img.src = card.localUrl;
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-cream/40">?</div>
      )}
      {label && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent text-cream text-xs p-2 text-center font-bold">
          {label}
        </div>
      )}
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
    <div className={`${sizes[size]} rounded-xl card-shadow flex items-center justify-center`}
      style={{
        background: 'linear-gradient(135deg, #6b4a8b 0%, #2a1f3d 100%)',
        border: '2px solid #c9a455',
      }}
    >
      <div className="text-gold text-4xl font-serif italic">D</div>
    </div>
  );
}
