'use client';

import { CARDS } from '@/lib/cards';

interface Props {
  cardId: number;
  selected?: boolean;
  highlighted?: boolean; // gold glow (e.g. storyteller's card on reveal)
  disabled?: boolean;
  onClick?: () => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Card({ cardId, selected, highlighted, disabled, onClick, label, size = 'md' }: Props) {
  const card = CARDS[cardId];
  const sizes = {
    sm: 'w-24 h-32',
    md: 'w-36 h-48',
    lg: 'w-48 h-64',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`card-tile relative rounded-xl overflow-hidden card-shadow ${sizes[size]} ${
        selected ? 'glow-plum' : highlighted ? 'glow-gold' : ''
      } ${disabled ? 'disabled' : ''}`}
      style={{ background: '#1a0f2e' }}
    >
      {card ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.url}
          alt={card.title}
          className="w-full h-full object-cover"
          loading="lazy"
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
    sm: 'w-24 h-32',
    md: 'w-36 h-48',
    lg: 'w-48 h-64',
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
