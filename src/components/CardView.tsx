import React from 'react';
import { Card, Suit } from '../types';
import { getMusRank } from '../musLogic';

interface CardViewProps {
  card?: Card;
  hidden?: boolean;
  selected?: boolean;
  selectable?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  hidden = false,
  selected = false,
  selectable = false,
  onClick,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-12 h-18 text-xs',
    md: 'w-20 h-30 text-sm',
    lg: 'w-24 h-36 text-base',
  }[size];

  if (hidden || !card) {
    return (
      <div
        className={`${sizeClasses} relative rounded-lg border-2 border-stone-700 bg-red-900 shadow-lg flex items-center justify-center overflow-hidden cursor-default select-none transition-transform`}
      >
        <div className="absolute inset-1 rounded border border-amber-500/40 bg-gradient-to-br from-red-950 via-red-800 to-red-950 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-1 opacity-20 transform -rotate-12">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="w-3 h-3 border border-amber-300 transform rotate-45" />
            ))}
          </div>
          <span className="font-serif font-black text-amber-400 text-xs tracking-widest opacity-60">
            MUS
          </span>
        </div>
      </div>
    );
  }

  const { suit, number } = card;
  const musRank = getMusRank(number);

  const getNumberLabel = (num: number) => {
    switch (num) {
      case 1:
        return '1';
      case 10:
        return '10'; // Sota
      case 11:
        return '11'; // Caballo
      case 12:
        return '12'; // Rey
      default:
        return `${num}`;
    }
  };

  const getRoleName = (num: number) => {
    if (num === 1) return 'As';
    if (num === 2) return 'Dos (=As)';
    if (num === 3) return 'Tres (=Rey)';
    if (num === 10) return 'Sota';
    if (num === 11) return 'Caballo';
    if (num === 12) return 'Rey';
    return '';
  };

  const renderSuitIcon = (suitName: Suit, isLarge = false) => {
    const iconSize = isLarge ? 'text-3xl sm:text-4xl' : 'text-base';
    switch (suitName) {
      case 'oros':
        return (
          <span className={`${iconSize} drop-shadow-sm`} title="Oros">
            🪙
          </span>
        );
      case 'copas':
        return (
          <span className={`${iconSize} drop-shadow-sm`} title="Copas">
            🏆
          </span>
        );
      case 'espadas':
        return (
          <span className={`${iconSize} drop-shadow-sm`} title="Espadas">
            ⚔️
          </span>
        );
      case 'bastos':
        return (
          <span className={`${iconSize} drop-shadow-sm`} title="Bastos">
            🪵
          </span>
        );
    }
  };

  const suitColors: Record<Suit, { text: string; bg: string; border: string }> = {
    oros: { text: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-600' },
    copas: { text: 'text-rose-800', bg: 'bg-rose-50', border: 'border-rose-600' },
    espadas: { text: 'text-blue-900', bg: 'bg-blue-50', border: 'border-blue-700' },
    bastos: { text: 'text-emerald-900', bg: 'bg-emerald-50', border: 'border-emerald-700' },
  };

  const colors = suitColors[suit];
  const roleName = getRoleName(number);

  return (
    <div
      onClick={selectable ? onClick : undefined}
      className={`
        ${sizeClasses}
        relative rounded-lg border-2 shadow-md flex flex-col justify-between p-1.5
        bg-[#fffdf7] ${colors.border}
        transition-all duration-200 select-none
        ${selectable ? 'cursor-pointer hover:-translate-y-2 hover:shadow-xl' : 'cursor-default'}
        ${selected ? '-translate-y-3 ring-4 ring-amber-400 border-amber-500 shadow-2xl scale-105' : ''}
      `}
    >
      {/* Corner Top Left */}
      <div className="flex items-center justify-between leading-none">
        <span className={`font-black font-serif ${colors.text} text-sm sm:text-base`}>
          {getNumberLabel(number)}
        </span>
        <div className="scale-75">{renderSuitIcon(suit)}</div>
      </div>

      {/* Center Art */}
      <div className="my-auto flex flex-col items-center justify-center">
        <div className="my-0.5">{renderSuitIcon(suit, true)}</div>
        {roleName && (
          <span className="text-[10px] font-bold uppercase tracking-tight text-stone-700 font-sans px-1 rounded bg-stone-100/90 border border-stone-300">
            {roleName}
          </span>
        )}
      </div>

      {/* Corner Bottom Right */}
      <div className="flex items-center justify-between leading-none transform rotate-180">
        <span className={`font-black font-serif ${colors.text} text-sm sm:text-base`}>
          {getNumberLabel(number)}
        </span>
        <div className="scale-75">{renderSuitIcon(suit)}</div>
      </div>

      {/* Mus Rank Hint Badge (8 Reyes) */}
      {(number === 3 || number === 2) && (
        <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-stone-950 text-[9px] font-extrabold px-1 rounded-full shadow border border-amber-200">
          {number === 3 ? 'REY' : 'AS'}
        </div>
      )}

      {selected && (
        <div className="absolute inset-0 bg-amber-500/20 rounded-lg flex items-center justify-center pointer-events-none">
          <span className="bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
            Descartar
          </span>
        </div>
      )}
    </div>
  );
};
