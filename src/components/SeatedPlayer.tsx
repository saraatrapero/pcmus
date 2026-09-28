import React from 'react';
import { Player } from '../types';
import { FournierCard } from './FournierCard';

interface SeatedPlayerProps {
  player: Player;
  seatPosition: 'north' | 'east' | 'west';
  seatIndex: number;
  isMano: boolean;
  showAllCards?: boolean;
}

export const SeatedPlayer: React.FC<SeatedPlayerProps> = ({
  player,
  seatPosition,
  seatIndex,
  isMano,
  showAllCards = false,
}) => {
  const isPartner = player.team === 0;

  return (
    <div className="relative flex flex-col items-center select-none z-20">
      {/* Player Identity Plaque (Minimalist, elegant, no photos, no card obstruction) */}
      <div
        className={`
          flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-lg backdrop-blur-md mb-1.5
          transition-all duration-200
          ${
            player.currentSpeech
              ? 'bg-amber-950/90 border-amber-400 ring-2 ring-amber-400 scale-105'
              : 'bg-stone-950/85 border-amber-500/50'
          }
        `}
      >
        {/* Mano Marker Badge ("M") */}
        {isMano && (
          <span
            className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 font-mono font-black text-[10px] flex items-center justify-center shadow"
            title="Mano de la jugada"
          >
            M
          </span>
        )}

        {/* Player Name */}
        <span className="font-serif font-black text-xs sm:text-sm text-amber-200 truncate max-w-[110px] sm:max-w-[130px]">
          {player.name}
        </span>

        {/* Team Tag */}
        <span
          className={`text-[8px] sm:text-[9px] font-mono font-black px-1.5 py-0.2 rounded uppercase tracking-wider ${
            isPartner ? 'bg-emerald-800 text-emerald-100' : 'bg-rose-800 text-rose-100'
          }`}
        >
          {isPartner ? 'Pareja' : 'Rival'}
        </span>

        {/* Speaking Audio Indicator */}
        {player.currentSpeech && (
          <span className="text-amber-300 text-xs animate-bounce" title="Hablando">
            🔊
          </span>
        )}

        {/* Seña / Gesture Badge (Compact, non-intrusive) */}
        {player.lastGesture && (
          <span
            className="bg-amber-400 text-stone-950 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border border-stone-950 shadow animate-pulse"
            title={`Seña: ${player.lastGesture}`}
          >
            🤫 {player.lastGesture}
          </span>
        )}
      </div>

      {/* 4 Fournier Cards (100% visible, unobstructed, clean fanning) */}
      <div className="relative z-10 flex items-center justify-center -space-x-3 sm:-space-x-4">
        {player.cards.map((card, idx) => {
          const rot = [-4, -1.5, 1.5, 4][idx] || 0;
          return (
            <div
              key={card.id || idx}
              style={{
                transform: `rotate(${rot}deg)`,
                transformOrigin: 'bottom center',
              }}
              className="transition-transform hover:-translate-y-1 hover:z-20"
            >
              <FournierCard
                card={card}
                hidden={!showAllCards}
                size="sm"
                className="shadow-[0_4px_10px_rgba(0,0,0,0.6)] border-2 border-stone-950"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

