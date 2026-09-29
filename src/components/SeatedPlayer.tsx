import React from 'react';
import { Player } from '../types';
import { FournierCard } from './FournierCard';
import { CharacterAvatar } from './CharacterAvatar';

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

  // Safe placement for speech bubble:
  // - North: Placed cleanly to the right of the avatar or above it, NEVER down over the cards
  // - West: Placed cleanly above the avatar/cards, NEVER over the table or cards
  // - East: Placed cleanly above the avatar/cards, NEVER over the table or cards
  const speechBubblePlacement = {
    north: 'left-full ml-3 top-1/2 -translate-y-1/2',
    west: 'bottom-full mb-2 left-0',
    east: 'bottom-full mb-2 right-0',
  }[seatPosition];

  const seatLabel = {
    north: 'Norte (Compañero)',
    west: 'Oeste (Rival)',
    east: 'Este (Rival)',
  }[seatPosition];

  return (
    <div className="relative flex flex-col items-center select-none z-20">
      {/* 1. SEATED PLAYER CARD (Prominent portrait, clear role and visibility - Never covered) */}
      <div className="relative flex items-center gap-2 mb-1.5 bg-stone-950 border-2 border-stone-800 hover:border-amber-500/80 px-2.5 py-1.5 rounded-2xl shadow-xl transition">
        {/* Player Avatar: Prominent size 'md' (56px) so character is fully visible */}
        <div className="relative shrink-0">
          <CharacterAvatar
            characterId={player.id}
            characterName={player.name}
            size="md"
            isSpeaking={!!player.currentSpeech}
            className="ring-2 ring-stone-900 shadow-md"
          />

          {/* Mano Marker Badge ("M") pinned on avatar corner */}
          {isMano && (
            <span
              className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-amber-400 text-stone-950 font-mono font-black text-xs flex items-center justify-center shadow-lg border-2 border-stone-950 z-30 animate-bounce"
              title="Mano de la ronda de Mus"
            >
              M
            </span>
          )}
        </div>

        {/* Player Nameplate, Position & Team Tag */}
        <div className="flex flex-col min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="font-serif font-black text-sm sm:text-base text-amber-200 truncate max-w-[100px] sm:max-w-[140px]">
              {player.name}
            </span>
            <span
              className={`text-[8px] sm:text-[9px] font-mono font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-xs ${
                isPartner
                  ? 'bg-emerald-700 text-emerald-100 border border-emerald-500/50'
                  : 'bg-rose-800 text-rose-100 border border-rose-600/50'
              }`}
            >
              {isPartner ? 'Pareja' : 'Rival'}
            </span>
          </div>

          <div className="text-[10px] text-stone-400 font-mono flex items-center gap-1">
            <span>{seatLabel}</span>
          </div>

          {/* Seña / Gesture Badge if active */}
          {player.lastGesture && (
            <div className="mt-0.5">
              <span
                className="bg-amber-400 text-stone-950 text-[9px] font-mono font-black px-2 py-0.5 rounded-full border border-stone-950 shadow animate-pulse inline-block"
                title={`Seña enviada: ${player.lastGesture}`}
              >
                🤫 {player.lastGesture}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. FOUR SPANISH CARDS (100% visible, unobstructed, clean fanning with authentic figures) */}
      <div className="relative z-10 flex items-center justify-center -space-x-3 sm:-space-x-4">
        {player.cards.map((card, idx) => {
          const rot = [-5, -2, 2, 5][idx] || 0;
          return (
            <div
              key={card.id || idx}
              style={{
                transform: `rotate(${rot}deg)`,
                transformOrigin: 'bottom center',
              }}
              className="transition-transform hover:-translate-y-2 hover:z-20"
            >
              <FournierCard
                card={card}
                hidden={!showAllCards}
                size="sm"
                className="shadow-[0_4px_12px_rgba(0,0,0,0.7)] border-2 border-stone-950"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
