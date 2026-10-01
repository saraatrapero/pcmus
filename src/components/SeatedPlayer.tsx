import React from 'react';
import { Player } from '../types';
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
  gaze?: GazeTarget;
  isWatchedByYou?: boolean;
  knownByYourTeam?: string[]; // señas of this player your team knows
  knowsYourSeñas?: string[]; // your señas this player's team knows
  onWatch?: () => void;
  headRef?: (el: HTMLDivElement | null) => void;
}

// A character sitting at the table: head (turns its neck), neck, shoulders and arms resting
// towards the table. Cards are drawn on the table itself, and every text label stays
// outside the felt so nothing covers the game.
export const SeatedPlayer: React.FC<SeatedPlayerProps> = ({
  player,
  seatPosition,
  seatIndex,
  isMano,
  gaze = -1,
  isWatchedByYou = false,
  knownByYourTeam = [],
  knowsYourSeñas = [],
  onWatch,
  headRef,
}) => {
  const isPartner = player.team === 0;
  const isLookingAtYou = gaze === 0;

  const gazeLabel =
    gaze === -1
      ? 'Mira sus cartas'
      : gaze === 0
      ? '¡Te mira!'
      : `Mira a ${gaze === 2 ? 'tu pareja' : SEAT_NAMES[gaze]}`;

  const torsoColor = player.avatarColor?.startsWith('from-')
    ? `bg-gradient-to-b ${player.avatarColor}`
    : player.avatarColor || 'bg-stone-700';

  // Arms reach towards the table: down for North, to the right for West, to the left for East
  const armStyle = {
    north: { left: 'rotate-[18deg]', right: '-rotate-[18deg]' },
    west: { left: 'rotate-[8deg]', right: '-rotate-[48deg]' },
    east: { left: 'rotate-[48deg]', right: '-rotate-[8deg]' },
  }[seatPosition];

  const nameplate = (
    <div
      className={`flex flex-col items-center bg-stone-950/90 border px-1.5 py-0.5 rounded-lg shadow-lg max-w-[82px] sm:max-w-[150px] ${
        isWatchedByYou ? 'border-sky-400' : 'border-stone-700'
      }`}
    >
      <div className="flex items-center gap-1 max-w-full">
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${isPartner ? 'bg-emerald-400' : 'bg-rose-400'}`}
          title={isPartner ? 'Tu pareja' : 'Rival'}
        />
        <span className="font-serif font-black text-[10px] sm:text-xs text-amber-200 truncate">
          {player.name}
        </span>
      </div>
      <div
        className={`text-[8px] sm:text-[9px] font-mono font-bold truncate max-w-full ${
          isLookingAtYou ? 'text-rose-400' : gaze === -1 ? 'text-stone-500' : 'text-stone-300'
        }`}
      >
        {gazeArrow(seatIndex, gaze)} {gazeLabel}
      </div>
      {knownByYourTeam.length > 0 && (
        <div
          className={`mt-0.5 text-[8px] sm:text-[9px] font-mono font-black px-1 rounded-full border max-w-full truncate ${
            isPartner
              ? 'bg-emerald-900/80 text-emerald-200 border-emerald-500/60'
              : 'bg-sky-900/80 text-sky-200 border-sky-500/60'
          }`}
          title={isPartner ? 'Señas recibidas de tu compañero' : 'Señas que tu equipo ha cazado a este rival'}
        >
          {isPartner ? '🤝 ' : '🕵️ '}
          {knownByYourTeam.map(señaShortLabel).join(' · ')}
        </div>
      )}
      {knowsYourSeñas.length > 0 && (
        <div
          className="mt-0.5 text-[8px] sm:text-[9px] font-mono font-black px-1 rounded-full border bg-rose-950/80 text-rose-200 border-rose-500/60 max-w-full truncate"
          title="Este rival ha visto tus señas: conoce tus cartas"
        >
          ⚠️ Sabe: {knowsYourSeñas.map(señaShortLabel).join(' · ')}
        </div>
      )}
    </div>
  );

  const figure = (
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
            className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-amber-400 text-stone-950 font-mono font-black text-[10px] flex items-center justify-center shadow-lg border-2 border-stone-950 z-30"
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
        {/* Seña gesture: just the face emoji, the explanation goes to the top ticker */}
        {player.lastGesture && (
          <span
            className="absolute -bottom-2 -right-3 z-40 text-lg leading-none bg-amber-400 rounded-full border-2 border-stone-950 px-0.5 shadow-lg animate-bounce"
            title={player.lastGesture}
          >
            {player.lastGesture.split(' ')[0]}
          </span>
        )}
      </div>

      {/* Neck */}
      <div className="w-4 h-2 -mt-0.5 bg-gradient-to-b from-[#e8b98a] to-[#c98f5e] border-x border-stone-900/50 z-10" />

      {/* Shoulders & torso */}
      <div
        className={`relative -mt-0.5 w-16 sm:w-28 h-9 sm:h-12 rounded-t-[44px] border-2 border-stone-950 shadow-[inset_0_-8px_12px_rgba(0,0,0,0.5),0_8px_14px_rgba(0,0,0,0.55)] ${torsoColor}`}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[11px] border-l-transparent border-r-transparent border-t-white/80" />
        <div className={`absolute -left-1 bottom-0 w-4 sm:w-5 h-8 sm:h-9 rounded-full bg-black/25 border border-stone-950/70 origin-bottom ${armStyle.left}`} />
        <div className={`absolute -right-1 bottom-0 w-4 sm:w-5 h-8 sm:h-9 rounded-full bg-black/25 border border-stone-950/70 origin-bottom ${armStyle.right}`} />
      </div>
    </div>
  );

  return (
    <div
      className={`relative flex items-center select-none z-20 ${onWatch ? 'cursor-pointer' : ''} ${
        seatPosition === 'north' ? 'flex-row gap-2' : 'flex-col gap-1'
      }`}
      onClick={onWatch}
      title={onWatch ? `Mirar a ${player.name} (para recibir o cazar señas)` : undefined}
    >
      {seatPosition === 'north' ? (
        <>
          {nameplate}
          {figure}
        </>
      ) : (
        <>
          {figure}
          {nameplate}
        </>
      )}
    </div>
  );
};
