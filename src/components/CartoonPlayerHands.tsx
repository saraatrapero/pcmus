import React from 'react';
import { Card } from '../types';
import { FournierCard } from './FournierCard';
import { describeParesHand, describeJuegoHand, getCardSumValue } from '../musLogic';

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
  const paresInfo = cards.length === 4 ? describeParesHand(cards) : null;
  const juegoInfo = cards.length === 4 ? describeJuegoHand(cards) : null;

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

      {/* ASESOR VISUAL CLARO DE TU MANO (Pares y Juego explícitos) */}
      {cards.length === 4 && paresInfo && juegoInfo && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5 max-w-lg mx-auto">
          {/* PARES PILL */}
          <div
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] sm:text-xs font-mono font-bold shadow transition ${
              paresInfo.hasPares
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/50'
                : 'bg-stone-900/90 border-stone-700 text-stone-400'
            }`}
            title={paresInfo.detail}
          >
            <span>{paresInfo.hasPares ? '✅' : '❌'}</span>
            <span className="font-black text-amber-300">Pares:</span>
            <span>{paresInfo.hasPares ? paresInfo.detail : 'Sin Pares'}</span>
          </div>

          {/* JUEGO PILL */}
          <div
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] sm:text-xs font-mono font-bold shadow transition ${
              juegoInfo.hasJuego
                ? 'bg-amber-950/90 border-amber-500 text-amber-200 ring-1 ring-amber-500/50'
                : 'bg-stone-900/90 border-stone-700 text-stone-400'
            }`}
            title={juegoInfo.detail}
          >
            <span>{juegoInfo.hasJuego ? '✅' : '❌'}</span>
            <span className="font-black text-amber-300">Juego (&ge;31):</span>
            <span>
              {juegoInfo.hasJuego
                ? `SÍ (${juegoInfo.sum})`
                : `NO (Punto: ${juegoInfo.sum})`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

