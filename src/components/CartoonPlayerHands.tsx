import React from 'react';
import { Card } from '../types';
import { FournierCard } from './FournierCard';
import { getHandSum, evaluatePares, getCardSumValue } from '../musLogic';

interface CartoonPlayerHandsProps {
  cards: Card[];
  selectedIndices?: number[];
  isDiscardPhase?: boolean;
  onCardClick?: (index: number) => void;
}

export const CartoonPlayerHands: React.FC<CartoonPlayerHandsProps> = ({
  cards,
  selectedIndices = [],
  isDiscardPhase = false,
  onCardClick,
}) => {
  // Hand numerical statistics (Punto / Juego y Pares)
  const handSum = cards.length === 4 ? getHandSum(cards) : 0;
  const paresEval = cards.length === 4 ? evaluatePares(cards) : null;
  const hasJuego = handSum >= 31;
  const hasPares = !!paresEval && paresEval.type !== 'none';

  const getParesLabel = () => {
    if (!paresEval || paresEval.type === 'none') return 'Sin Pares';
    if (paresEval.type === 'duples') return '¡Duples!';
    if (paresEval.type === 'medias') return '¡Medias!';
    return 'Pareja';
  };

  return (
    <div className="relative flex flex-col items-center select-none pt-1 pb-1">
      {/* THE 4 PLAYER CARDS (Completely unobstructed, fully visible, comfortable size) */}
      <div className="relative z-20 flex items-end justify-center -space-x-3 sm:-space-x-4 md:-space-x-5 py-1">
        {cards.map((card, idx) => {
          const isSelected = selectedIndices.includes(idx);
          const rotations = [-3, -1, 1, 3];
          const rot = rotations[idx] || 0;

          return (
            <div
              key={card.id || idx}
              style={{
                transform: isSelected
                  ? `translateY(-26px) scale(1.06) rotate(${rot * 0.5}deg)`
                  : `rotate(${rot}deg)`,
                transformOrigin: 'bottom center',
              }}
              className="transition-all duration-200 z-10"
            >
              <FournierCard
                card={card}
                hidden={false}
                size="hand"
                selectable={isDiscardPhase}
                selected={isSelected}
                onClick={onCardClick ? () => onCardClick(idx) : undefined}
                className="shadow-[0_10px_20px_rgba(0,0,0,0.6)] border-2 border-stone-950"
              />
            </div>
          );
        })}
      </div>

      {/* DISCREET NUMERICAL HAND SUMMARY (Clean, unobtrusive, placed below cards) */}
      {cards.length === 4 && (
        <div className="mt-1 flex items-center gap-2 bg-stone-950/85 border border-amber-500/60 px-3 py-0.5 rounded-full shadow-lg text-stone-200 text-[10px] sm:text-xs font-mono">
          <span className="text-amber-400 font-bold">Mano:</span>
          <span className="font-black text-amber-200">
            {cards.map((c) => getCardSumValue(c.number)).join('+')} =
          </span>
          <span
            className={`font-black px-1.5 py-0.2 rounded ${
              hasJuego
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-stone-800 text-amber-300'
            }`}
          >
            {hasJuego ? `Juego ${handSum}` : `Punto ${handSum}`}
          </span>
          {hasPares && (
            <span className="bg-emerald-800 text-emerald-100 font-bold px-1.5 py-0.2 rounded">
              {getParesLabel()}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

