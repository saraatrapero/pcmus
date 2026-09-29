import React, { useState } from 'react';
import { Player, LancePhase, LanceBetState, TeamScore } from '../types';
import { SeatedPlayer } from './SeatedPlayer';
import { CartoonPlayerHands } from './CartoonPlayerHands';
import { CharacterAvatar } from './CharacterAvatar';
import { UserProfile } from '../userProfileEngine';
import tabernaLimpiaImg from '../assets/images/taberna_madrid_limpia_1790674574086.jpg';

interface TableProps {
  players: Player[]; // [South(0), East(1), North(2), West(3)]
  manoIndex: number;
  currentLanceName: string;
  phase: LancePhase;
  betState: LanceBetState;
  showAllCards?: boolean;
  onCardClick?: (index: number) => void;
  recentEvent?: string | null;
  scoreTeam0?: TeamScore;
  scoreTeam1?: TeamScore;
  targetPiedras?: number;
  onOpenUserControl?: () => void;
  activeUser?: UserProfile;
  gameSpeed?: 'tranquilo' | 'normal' | 'rapido';
  onChangeGameSpeed?: () => void;
}

export const Table: React.FC<TableProps> = ({
  players,
  manoIndex,
  currentLanceName,
  phase,
  betState,
  showAllCards = false,
  onCardClick,
  recentEvent,
  scoreTeam0,
  scoreTeam1,
  targetPiedras,
  onOpenUserControl,
  activeUser,
  gameSpeed = 'tranquilo',
  onChangeGameSpeed,
}) => {
  const isDiscardPhase = phase === 'discarding';
  const pSouth = players[0];
  const pEast = players[1];
  const pNorth = players[2];
  const pWest = players[3];

  // Traditional Spanish tavern night atmosphere
  const [isNight, setIsNight] = useState<boolean>(true);

  // Active dialogue across any player
  const activeSpeakingPlayer = players.find((p) => !!p.currentSpeech);

  // Realistic 3D Garbanzo / Amarraco element with stamped numerical value
  const renderGarbanzo = (key: string | number, isAmarraco: boolean = false, className: string = '') => (
    <div
      key={key}
      className={`rounded-full border border-stone-950 shadow-[1px_2px_4px_rgba(0,0,0,0.6)] relative inline-flex items-center justify-center font-mono font-black select-none ${
        isAmarraco
          ? 'w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-yellow-300 via-amber-500 to-amber-800 text-stone-950 text-[9px]'
          : 'w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gradient-to-br from-amber-100 via-amber-300 to-amber-700 text-stone-900 text-[8px]'
      } ${className}`}
      title={isAmarraco ? 'Amarraco (Valor: 5 piedras)' : 'Piedra (Valor: 1 piedra)'}
    >
      <span className="leading-none">{isAmarraco ? '5' : '1'}</span>
      <div className="absolute top-0.5 left-0.5 w-1 h-1 rounded-full bg-white opacity-80 pointer-events-none" />
    </div>
  );

  return (
    <div className="relative w-full max-w-5xl mx-auto my-1 rounded-3xl border-4 border-stone-900 shadow-2xl overflow-hidden select-none flex flex-col justify-between min-h-[500px] sm:min-h-[540px]">
      {/* 1. TAVERN BAR BACKGROUND (Clean wallpaper, no UI, no bottom settings/icons) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={tabernaLimpiaImg}
          alt="Taberna Tradicional PC Mus"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-top pointer-events-none transition-all duration-700"
        />
        {/* Warm nighttime lighting vignette */}
        <div
          className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${
            isNight
              ? 'bg-gradient-to-t from-stone-950/85 via-amber-950/20 to-black/50'
              : 'bg-gradient-to-t from-stone-950/60 via-transparent to-black/30'
          }`}
        />
      </div>

      {/* TOP UTILITY BAR (Controls on sides, clean space in center) */}
      <div className="relative z-30 flex items-center justify-between px-3 pt-2">
        <div className="flex items-center gap-1.5">
          {/* 🌙 Atmósfera de Noche Toggle Pill */}
          <button
            type="button"
            onClick={() => setIsNight(!isNight)}
            className="px-3 py-1 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-amber-500/70 hover:border-amber-400 text-amber-200 font-mono text-[10px] sm:text-xs flex items-center gap-1.5 shadow-xl transition transform hover:scale-105 cursor-pointer"
            title="Cambiar atmósfera de iluminación (Noche de taberna tradicional / Tarde)"
          >
            <span>{isNight ? '🌙 Noche' : '☀️ Tarde'}</span>
          </button>

          {/* ⏱ Ritmo de Partida Toggle Pill */}
          {onChangeGameSpeed && (
            <button
              type="button"
              onClick={onChangeGameSpeed}
              className="px-3 py-1 rounded-full bg-stone-950/90 hover:bg-stone-900 border border-amber-500/80 hover:border-amber-400 text-amber-300 font-mono text-[10px] sm:text-xs flex items-center gap-1.5 shadow-xl transition transform hover:scale-105 cursor-pointer"
              title="Cambiar velocidad de la partida y del recuento de tantos (Pausado / Normal / Rápido)"
            >
              <span>{gameSpeed === 'tranquilo' ? '🐢' : gameSpeed === 'normal' ? '⚖️' : '⚡'}</span>
              <span className="capitalize">{gameSpeed === 'tranquilo' ? 'Pausado' : gameSpeed}</span>
            </button>
          )}
        </div>

        {/* 💬 RECOLOCATED DIALOGUE TICKER (Clean banner at top center, never blocking players) */}
        {activeSpeakingPlayer && activeSpeakingPlayer.currentSpeech ? (
          <div className="mx-2 bg-stone-950/95 border-2 border-amber-400 text-amber-100 px-3 py-1 rounded-full text-xs font-mono font-bold shadow-2xl flex items-center gap-2 max-w-sm sm:max-w-md animate-fade-in pointer-events-none">
            <span className="text-amber-400 font-serif font-black shrink-0">
              💬 {activeSpeakingPlayer.name}:
            </span>
            <span className="text-white font-mono truncate">
              "{activeSpeakingPlayer.currentSpeech}"
            </span>
          </div>
        ) : recentEvent ? (
          <div className="mx-2 bg-black/60 border border-amber-500/30 text-amber-200/90 px-3 py-1 rounded-full text-[11px] font-mono shadow truncate max-w-xs sm:max-w-sm">
            {recentEvent}
          </div>
        ) : (
          <div className="h-6" />
        )}

        {/* 🧠 IA Adaptativa & Control de Usuarios Indicator Button */}
        {onOpenUserControl && (
          <button
            type="button"
            onClick={onOpenUserControl}
            className="px-3 py-1 rounded-full bg-stone-950/90 hover:bg-stone-900 border border-amber-500/80 hover:border-amber-400 text-amber-300 font-mono text-[10px] sm:text-xs flex items-center gap-1.5 shadow-xl transition transform hover:scale-105 cursor-pointer"
            title="Abrir panel de control de usuarios y análisis táctico de la IA"
          >
            <span>🧠 IA Adaptada:</span>
            <span className="text-white font-bold max-w-[80px] sm:max-w-[120px] truncate">
              {activeUser?.name || 'Tú'}
            </span>
          </button>
        )}
      </div>

      {/* 2. NORTH SEATED PLAYER (Center-Top across table - Fully Visible) */}
      <div className="relative z-30 pt-1 flex justify-center">
        {pNorth && (
          <SeatedPlayer
            player={pNorth}
            seatPosition="north"
            seatIndex={2}
            isMano={manoIndex === 2}
            showAllCards={showAllCards}
          />
        )}
      </div>

      {/* 3. THE OVAL WOODEN TABLE & WEST/EAST PLAYERS */}
      <div className="relative z-20 flex-1 flex items-center justify-between px-2 sm:px-4 my-1">
        {/* WEST SEATED PLAYER (Left - Fully Visible) */}
        <div className="relative z-30 flex-shrink-0">
          {pWest && (
            <SeatedPlayer
              player={pWest}
              seatPosition="west"
              seatIndex={3}
              isMano={manoIndex === 3}
              showAllCards={showAllCards}
            />
          )}
        </div>

        {/* OVAL WOODEN TABLE SURFACE */}
        <div className="flex-1 mx-2 sm:mx-4 h-full min-h-[160px] sm:min-h-[180px] rounded-[100px] border-[5px] sm:border-[7px] border-[#381a06] bg-gradient-to-b from-[#d99f60] via-[#c68945] to-[#b06f2d] shadow-[inset_0_4px_25px_rgba(0,0,0,0.6),0_12px_24px_rgba(0,0,0,0.8)] relative p-3 flex flex-col items-center justify-between overflow-hidden">
          {/* Wooden planks horizontal texture lines */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, #261203 0px, #261203 2px, transparent 2px, transparent 36px)`,
            }}
          />

          {/* TABLE OBJECT 1: DECK OF SPANISH CARDS (Taco de baraja sobre la mesa) */}
          <div
            className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center z-10 hidden sm:flex"
            title="Baraja Española de 40 naipes (Heraclio Fournier 1996)"
          >
            <div className="w-10 h-15 rounded-lg border-2 border-stone-950 bg-red-800 shadow-[3px_4px_8px_rgba(0,0,0,0.7)] relative overflow-hidden transform -rotate-12">
              <div className="absolute inset-0.5 border border-amber-400/40 bg-gradient-to-br from-red-950 to-red-800 flex items-center justify-center">
                <span className="text-[8px] font-mono font-black text-amber-300 opacity-90">
                  40
                </span>
              </div>
            </div>
            <div className="w-9 h-1.5 bg-stone-900 rounded-b -mt-0.5 transform -rotate-12 shadow" />
          </div>

          {/* Center: Sleek Lance Status Placard (Crisp, high-contrast, centered) */}
          <div className="my-auto z-20 flex flex-col items-center max-w-xs text-center">
            {/* Lance Banner */}
            <div className="bg-blue-900 border-2 border-yellow-400 px-4 py-1.5 rounded-xl shadow-lg text-yellow-300 font-mono font-black">
              <div className="text-[9px] uppercase tracking-widest text-amber-200 leading-none">
                LANCE ACTUAL
              </div>
              <div className="text-base sm:text-xl uppercase text-white font-serif font-black">
                {currentLanceName}
              </div>
            </div>

            {/* Active Bet Indicator */}
            {betState.currentBet > 0 && (
              <div className="mt-1 bg-amber-400 text-stone-950 px-3 py-0.5 rounded-full border-2 border-stone-950 font-mono font-black text-xs shadow flex items-center gap-1.5">
                <span>
                  {betState.isOrdago
                    ? '🔥 ¡ÓRDAGO VIVO!'
                    : `🪙 APUESTA: ${betState.currentBet} PIEDRAS`}
                </span>
                {betState.accepted && (
                  <span className="bg-emerald-700 text-white text-[8px] px-1.5 py-0.2 rounded uppercase">
                    Quiero
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* EAST SEATED PLAYER (Right - Fully Visible) */}
        <div className="relative z-30 flex-shrink-0">
          {pEast && (
            <SeatedPlayer
              player={pEast}
              seatPosition="east"
              seatIndex={1}
              isMano={manoIndex === 1}
              showAllCards={showAllCards}
            />
          )}
        </div>
      </div>

      {/* 4. SOUTH: HUMAN PLAYER PRESENCE & CARDS (Bottom Center - Clear player presence + 100% Unobstructed Hand) */}
      <div className="relative z-30 flex flex-col items-center pb-2 pt-1">
        {/* South Player Badge with prominent Avatar (Crisp, sharp, non-blurry, never covering cards) */}
        {pSouth && (
          <div className="flex items-center gap-2.5 mb-1 px-3.5 py-1.5 rounded-2xl bg-stone-950 border-2 border-stone-800 hover:border-amber-500/70 shadow-xl">
            <div className="relative shrink-0">
              <CharacterAvatar
                characterId={activeUser?.avatarId || pSouth.id}
                characterName={activeUser?.name || pSouth.name}
                size="md"
                isSpeaking={!!pSouth.currentSpeech}
                className="ring-2 ring-stone-900 shadow-md"
              />
              {manoIndex === 0 && (
                <span
                  className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-amber-400 text-stone-950 font-mono font-black text-xs flex items-center justify-center shadow-lg border-2 border-stone-950 z-30 animate-bounce"
                  title="Mano de la ronda de Mus"
                >
                  M
                </span>
              )}
            </div>

            <div className="flex flex-col min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-black text-sm sm:text-base text-amber-200 truncate max-w-[120px] sm:max-w-[160px]">
                  {activeUser?.name || pSouth.name}
                </span>
                <span className="text-[8px] sm:text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-emerald-700 text-emerald-100 uppercase tracking-wider border border-emerald-500/50">
                  Tú (Sur)
                </span>
              </div>
              <div className="text-[10px] text-stone-400 font-mono">
                Pareja de {pNorth?.name || 'Norte'}
              </div>
            </div>
          </div>
        )}

        {/* 4 Player Cards with authentic Spanish Figures (Sota, Caballo, Rey) and Faros */}
        {pSouth && (
          <CartoonPlayerHands
            cards={pSouth.cards}
            selectedIndices={pSouth.selectedToDiscard}
            isDiscardPhase={isDiscardPhase}
            onCardClick={onCardClick}
          />
        )}
      </div>
    </div>
  );
};
