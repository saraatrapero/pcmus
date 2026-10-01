import React from 'react';
import { Player } from '../types';
import { FournierCard } from './FournierCard';
import { CharacterAvatar } from './CharacterAvatar';
import { GazeTarget, SEAT_NAMES, señaShortLabel } from '../gazeSystem';

export type SeatPosition = 'south' | 'north' | 'east' | 'west';

// Approximate on-screen direction of each seat around the table (x: right, y: down)
export const SEAT_SCREEN_POS: Record<number, { x: number; y: number }> = {
  0: { x: 0, y: 1 },
  1: { x: 1, y: 0 },
  2: { x: 0, y: -1 },
  3: { x: -1, y: 0 },
};

// Head transform so the character turns its neck towards whoever it is looking at
export const getHeadTransform = (seatIndex: number, gaze: number) => {
  const self = SEAT_SCREEN_POS[seatIndex];
  const target = gaze === -1 ? { x: 0, y: 0 } : SEAT_SCREEN_POS[gaze];
  let dx = target.x - self.x;
  let dy = target.y - self.y;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len;
  dy /= len;
  // Looking down at own cards: bow the head a bit more
  const bow = gaze === -1 ? 10 : 0;
  return `perspective(320px) translate(${(dx * 7).toFixed(1)}px, ${(dy * 4 + bow * 0.3).toFixed(1)}px) rotateY(${(dx * 38).toFixed(1)}deg) rotateX(${(-dy * 20 - bow).toFixed(1)}deg) rotate(${(dx * 7).toFixed(1)}deg)`;
};

export const gazeArrow = (seatIndex: number, gaze: number) => {
  if (gaze === -1) return '🃏';
  const self = SEAT_SCREEN_POS[seatIndex];
  const target = SEAT_SCREEN_POS[gaze];
  const dx = target.x - self.x;
  const dy = target.y - self.y;
  if (Math.abs(dx) > Math.abs(dy) * 1.6) return dx > 0 ? '➡️' : '⬅️';
  if (Math.abs(dy) > Math.abs(dx) * 1.6) return dy > 0 ? '⬇️' : '⬆️';
  if (dx > 0) return dy > 0 ? '↘️' : '↗️';
  return dy > 0 ? '↙️' : '↖️';
};

interface SeatedPlayerProps {
  player: Player;
  seatPosition: 'north' | 'east' | 'west';
  seatIndex: number;
  isMano: boolean;
  showAllCards?: boolean;
  gaze?: GazeTarget;
  isWatchedByYou?: boolean;
  knownByYourTeam?: string[]; // señas of this player your team knows
  knowsYourSeñas?: string[]; // your señas this player's team knows
  onWatch?: () => void;
  headRef?: (el: HTMLDivElement | null) => void;
}

export const SeatedPlayer: React.FC<SeatedPlayerProps> = ({
  player,
  seatPosition,
  seatIndex,
  isMano,
  showAllCards = false,
  gaze = -1,
  isWatchedByYou = false,
  knownByYourTeam = [],
  knowsYourSeñas = [],
  onWatch,
  headRef,
}) => {
  const isPartner = player.team === 0;
  const isLookingAtYou = gaze === 0;

  const seatLabel = {
    north: 'Norte (Compañero)',
    west: 'Oeste (Rival)',
    east: 'Este (Rival)',
  }[seatPosition];

  const gazeLabel =
    gaze === -1
      ? 'Mira sus cartas'
      : gaze === 0
      ? '¡Te está mirando!'
      : `Mira a ${gaze === 2 ? 'tu compañero' : SEAT_NAMES[gaze]}`;

  const torsoColor = player.avatarColor?.startsWith('from-')
    ? `bg-gradient-to-b ${player.avatarColor}`
    : player.avatarColor || 'bg-stone-700';

  return (
    <div
      className={`relative flex flex-col items-center select-none z-20 ${onWatch ? 'cursor-pointer' : ''}`}
      onClick={onWatch}
      title={onWatch ? `Mirar a ${player.name} (para recibir o cazar señas)` : undefined}
    >
      {/* Gesture bubble: only rendered when your team actually saw the seña */}
      {player.lastGesture && (
        <div
          className={`absolute top-0 z-40 w-max max-w-[170px] text-center bg-amber-400 text-stone-950 text-[10px] sm:text-xs font-mono font-black px-2 py-1 rounded-xl border-2 border-stone-950 shadow-lg animate-bounce ${
            seatPosition === 'north'
              ? 'right-full mr-2'
              : seatPosition === 'west'
              ? 'left-1/2 -translate-y-full'
              : 'right-1/2 -translate-y-full'
          }`}
        >
          🤫 {player.lastGesture}
        </div>
      )}

      {/* Speech bubble */}
      {player.currentSpeech && (
        <div
          className={`absolute z-40 w-max max-w-[160px] bg-white text-stone-900 text-[10px] font-bold px-2 py-1 rounded-xl border-2 border-stone-900 shadow-lg pointer-events-none ${
            seatPosition === 'north'
              ? 'left-full ml-2 top-2'
              : seatPosition === 'west'
              ? 'left-full ml-1 top-0'
              : 'right-full mr-1 top-0'
          }`}
        >
          {player.currentSpeech}
        </div>
      )}

      {/* 1. SEATED FIGURE: head (turns its neck) + neck + torso + arms holding the cards */}
      <div className="relative flex flex-col items-center">
        {/* Head */}
        <div
          ref={headRef}
          className="relative z-20 transition-transform duration-500 ease-out will-change-transform"
          style={{ transform: getHeadTransform(seatIndex, gaze), transformStyle: 'preserve-3d' }}
        >
          <CharacterAvatar
            characterId={player.id}
            characterName={player.name}
            size="md"
            isSpeaking={!!player.currentSpeech}
            className={`rounded-2xl ${
              isLookingAtYou
                ? 'ring-4 ring-rose-500 shadow-[0_0_14px_rgba(244,63,94,0.8)]'
                : isWatchedByYou
                ? 'ring-4 ring-sky-400'
                : 'ring-2 ring-stone-900'
            }`}
          />
          {isMano && (
            <span
              className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-amber-400 text-stone-950 font-mono font-black text-xs flex items-center justify-center shadow-lg border-2 border-stone-950 z-30 animate-bounce"
              title="Mano de la ronda de Mus"
            >
              M
            </span>
          )}
          {/* Gaze direction marker */}
          <span
            className={`absolute -top-2 -right-3 text-[11px] leading-none px-1 py-0.5 rounded-full border border-stone-950 shadow z-30 ${
              isLookingAtYou ? 'bg-rose-500 animate-pulse' : 'bg-stone-100'
            }`}
            title={gazeLabel}
          >
            {isLookingAtYou ? '👁️' : gazeArrow(seatIndex, gaze)}
          </span>
        </div>

        {/* Neck */}
        <div className="w-4 h-2 -mt-0.5 bg-gradient-to-b from-amber-200 to-amber-400 border-x border-stone-900/60 z-10" />

        {/* Torso with shoulders */}
        <div
          className={`relative -mt-0.5 w-20 sm:w-32 h-10 sm:h-12 rounded-t-[44px] border-2 border-stone-950 shadow-[inset_0_-6px_10px_rgba(0,0,0,0.45)] ${torsoColor}`}
        >
          {/* Shirt collar */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[9px] border-r-[9px] border-t-[12px] border-l-transparent border-r-transparent border-t-white/80" />
          {/* Arms reaching for the cards */}
          <div className="absolute -left-1 bottom-0 w-5 h-9 rounded-full bg-black/25 border border-stone-950/70 rotate-[24deg] origin-bottom" />
          <div className="absolute -right-1 bottom-0 w-5 h-9 rounded-full bg-black/25 border border-stone-950/70 -rotate-[24deg] origin-bottom" />
        </div>

        {/* Cards held over the edge of the table */}
        <div className="relative z-30 -mt-6 flex items-center justify-center -space-x-7 sm:-space-x-4">
          {player.cards.map((card, idx) => {
            const rot = [-8, -3, 3, 8][idx] || 0;
            return (
              <div
                key={card.id || idx}
                style={{ transform: `rotate(${rot}deg)`, transformOrigin: 'bottom center' }}
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

      {/* 2. NAMEPLATE */}
      <div
        className={`mt-1 flex flex-col items-center bg-stone-950/95 border-2 px-2 py-1 rounded-xl shadow-xl transition ${
          isWatchedByYou ? 'border-sky-400' : 'border-stone-800 hover:border-amber-500/80'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <span className="font-serif font-black text-xs sm:text-sm text-amber-200 truncate max-w-[100px] sm:max-w-[130px]">
            {player.name}
          </span>
          <span
            className={`text-[8px] font-mono font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
              isPartner
                ? 'bg-emerald-700 text-emerald-100 border border-emerald-500/50'
                : 'bg-rose-800 text-rose-100 border border-rose-600/50'
            }`}
          >
            {isPartner ? 'Pareja' : 'Rival'}
          </span>
        </div>
        <div className="text-[9px] text-stone-400 font-mono">{seatLabel}</div>
        <div
          className={`text-[9px] font-mono font-bold ${
            isLookingAtYou ? 'text-rose-400' : gaze === -1 ? 'text-stone-500' : 'text-stone-300'
          }`}
        >
          {gazeArrow(seatIndex, gaze)} {gazeLabel}
        </div>

        {knownByYourTeam.length > 0 && (
          <div
            className={`mt-0.5 text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full border ${
              isPartner
                ? 'bg-emerald-900/80 text-emerald-200 border-emerald-500/60'
                : 'bg-sky-900/80 text-sky-200 border-sky-500/60'
            }`}
            title={isPartner ? 'Señas recibidas de tu compañero' : 'Señas que tu equipo ha cazado a este rival'}
          >
            {isPartner ? '🤝 Te dice: ' : '🕵️ Cazado: '}
            {knownByYourTeam.map(señaShortLabel).join(' · ')}
          </div>
        )}
        {knowsYourSeñas.length > 0 && (
          <div
            className="mt-0.5 text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full border bg-rose-950/80 text-rose-200 border-rose-500/60"
            title="Este rival ha visto tus señas: conoce tus cartas"
          >
            ⚠️ Sabe tu {knowsYourSeñas.map(señaShortLabel).join(' · ')}
          </div>
        )}
      </div>
    </div>
  );
};
