import React, { useState } from 'react';
import { Player, LancePhase, LanceBetState, TeamScore } from '../types';
import { SeatedPlayer } from './SeatedPlayer';
import { CartoonPlayerHands } from './CartoonPlayerHands';
import { tavernBgImg, tabernaNocheImg } from '../characterPortraits';

interface TableProps {
  players: Player[];
  manoIndex: number;
  currentLanceName: string;
  phase: LancePhase;
  betState: LanceBetState;
  showAllCards: boolean;
  onCardClick: (cardIndex: number) => void;
  recentEvent?: string | null;
  scoreTeam0?: TeamScore;
  scoreTeam1?: TeamScore;
  targetPiedras?: number;
}

export const Table: React.FC<TableProps> = ({
  players,
  manoIndex,
  currentLanceName,
  phase,
  betState,
  showAllCards,
  onCardClick,
  recentEvent,
  scoreTeam0,
  scoreTeam1,
  targetPiedras = 40,
}) => {
  const isDiscardPhase = phase === 'discarding';

  // Seats:
  // 0: South (Player - First-person hands)
  // 1: East (Rival 1)
  // 2: North (Partner)
  // 3: West (Rival 2)
  const pSouth = players[0];
  const pEast = players[1];
  const pNorth = players[2];
  const pWest = players[3];

  // Traditional Spanish tavern night atmosphere ("es noche")
  const [isNight, setIsNight] = useState<boolean>(true);

  // Active dialogue across any player (rendered centrally without covering cards)
  const activeSpeakingPlayer = players.find((p) => !!p.currentSpeech);

  // Realistic 3D Garbanzo / Amarraco element with stamped numerical value ("los números")
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
      {/* Specular light dot */}
      <div className="absolute top-0.5 left-0.5 w-1 h-1 rounded-full bg-white opacity-80 pointer-events-none" />
    </div>
  );

  return (
    <div className="relative w-full max-w-5xl mx-auto my-1 aspect-[4/3] sm:aspect-[16/10] rounded-3xl border-4 border-stone-900 shadow-2xl overflow-hidden select-none flex flex-col justify-between">
      {/* 1. TAVERN BAR BACKGROUND ("es noche" - Nocturnal Atmosphere) */}
      <div className="absolute inset-0 z-0">
        <img
          src={isNight ? tabernaNocheImg : tavernBgImg}
          alt="Taberna Tradicional PC Mus"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center pointer-events-none transition-all duration-700"
        />
        {/* Warm nighttime lighting vignette */}
        <div
          className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${
            isNight
              ? 'bg-gradient-to-t from-stone-950/75 via-amber-950/20 to-black/60'
              : 'bg-gradient-to-t from-stone-950/40 via-transparent to-black/30'
          }`}
        />
        {/* Amber spotlight simulating the tavern hanging lamp above the table */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
      </div>

      {/* 🌙 Atmósfera de Noche Toggle Pill */}
      <button
        type="button"
        onClick={() => setIsNight(!isNight)}
        className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-stone-950/85 hover:bg-stone-900 border border-amber-500/70 hover:border-amber-400 text-amber-200 font-mono text-[10px] sm:text-xs flex items-center gap-1.5 shadow-xl transition transform hover:scale-105 cursor-pointer"
        title="Cambiar atmósfera de iluminación (Noche de taberna tradicional / Tarde)"
      >
        <span>{isNight ? '🌙 Noche Tradicional' : '☀️ Tarde en Taberna'}</span>
      </button>

      {/* Central Dialogue Subtitle Bar (Clean, non-intrusive, NEVER blocks cards) */}
      {activeSpeakingPlayer && activeSpeakingPlayer.currentSpeech && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-40 bg-stone-950/95 border-2 border-amber-400 text-amber-100 px-4 py-1.5 rounded-full text-xs font-mono font-bold shadow-2xl flex items-center gap-2 max-w-md pointer-events-none animate-fade-in">
          <span className="text-amber-400 font-serif font-black">{activeSpeakingPlayer.name}:</span>
          <span className="text-white font-mono">"{activeSpeakingPlayer.currentSpeech}"</span>
        </div>
      )}

      {/* 3. NORTH SEATED PLAYER (Center-Top across table) */}
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

      {/* 4. THE OVAL WOODEN TABLE (Tablero de Madera) & SEATED PLAYERS */}
      <div className="relative z-20 flex-1 flex items-center justify-between px-2 sm:px-6 my-1">
        {/* WEST SEATED PLAYER (Left) */}
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
        <div className="flex-1 mx-2 sm:mx-6 h-[72%] rounded-[100px] border-[5px] sm:border-[7px] border-[#381a06] bg-gradient-to-b from-[#d99f60] via-[#c68945] to-[#b06f2d] shadow-[inset_0_4px_25px_rgba(0,0,0,0.6),0_12px_24px_rgba(0,0,0,0.8)] relative p-3 flex flex-col items-center justify-between overflow-hidden">
          {/* Wooden planks horizontal texture lines */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, #261203 0px, #261203 2px, transparent 2px, transparent 36px)`,
            }}
          />

          {/* TABLE OBJECT 1: DECK OF CARDS (Taco de baraja sobre la mesa en el lado izquierdo) */}
          <div
            className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center z-10"
            title="Baraja Española de 40 naipes (Heraclio Fournier 1996)"
          >
            <div className="w-9 h-14 sm:w-11 sm:h-17 rounded border-2 border-stone-950 bg-red-800 shadow-[3px_4px_8px_rgba(0,0,0,0.7)] relative overflow-hidden transform -rotate-12">
              <div className="absolute inset-0.5 border border-amber-400/40 bg-gradient-to-br from-red-950 to-red-800 flex items-center justify-center">
                <span className="text-[7px] font-mono font-black text-amber-300 opacity-75">
                  40
                </span>
              </div>
            </div>
            {/* Card stack 3D thickness rim */}
            <div className="w-8 h-1.5 bg-stone-900 rounded-b -mt-0.5 transform -rotate-12 shadow" />
          </div>

          {/* TABLE OBJECT 2: PIZARRA DE TANTEO DE LA TABERNA ("LOS NÚMEROS") */}
          <div className="z-20 bg-stone-950/90 border-2 border-amber-600/80 px-3 py-1 rounded-xl shadow-[3px_3px_0px_#000] flex items-center gap-3 text-stone-200 font-mono text-[10px] sm:text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-black">NOSOTROS:</span>
              <span className="text-amber-300 font-black text-sm bg-stone-900 px-1.5 py-0.2 rounded border border-amber-500/50">
                {scoreTeam0?.piedras ?? 0}
              </span>
            </div>
            <span className="text-amber-500 font-bold">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-rose-400 font-black">ELLOS:</span>
              <span className="text-amber-300 font-black text-sm bg-stone-900 px-1.5 py-0.2 rounded border border-amber-500/50">
                {scoreTeam1?.piedras ?? 0}
              </span>
            </div>
            {targetPiedras && (
              <span className="text-stone-400 text-[9px] hidden sm:inline border-l border-stone-700 pl-2">
                Faltan: <strong className="text-amber-300">{Math.max(0, targetPiedras - Math.max(scoreTeam0?.piedras || 0, scoreTeam1?.piedras || 0))}</strong>
              </span>
            )}
          </div>

          {/* TABLE OBJECT 3: SCATTERED AMARRAKOS / GARBANZOS WITH NUMERICAL STAMPS */}
          {/* North garbanzos */}
          <div className="flex items-center gap-1.5 mt-0.5 z-10">
            {renderGarbanzo('n_am', true)}
            {renderGarbanzo('n_pd', false)}
          </div>

          {/* Center: Lance Status Placard & Numbers in Play */}
          <div className="my-auto z-20 flex flex-col items-center max-w-xs text-center">
            {/* Retro MS-DOS Lance Banner */}
            <div className="bg-blue-900 border-2 border-yellow-400 px-3 py-1 rounded-lg shadow-[3px_3px_0px_#000] text-yellow-300 font-mono font-black">
              <div className="text-[9px] uppercase tracking-widest text-amber-200 leading-none">
                LANCE ACTUAL
              </div>
              <div className="text-base sm:text-lg uppercase text-white drop-shadow">
                {currentLanceName}
              </div>
            </div>

            {/* Bet Indicator with Numbers */}
            {betState.currentBet > 0 && (
              <div className="mt-1 bg-amber-400 text-stone-950 px-2.5 py-0.5 rounded-full border-2 border-stone-950 font-mono font-black text-[11px] shadow flex items-center gap-1">
                <span>
                  {betState.isOrdago
                    ? '🔥 ¡ÓRDAGO VIVO!'
                    : `🪙 NÚMERO DE PIEDRAS: ${betState.currentBet}`}
                </span>
                {betState.accepted && (
                  <span className="bg-emerald-700 text-white text-[8px] px-1 rounded uppercase">
                    Quiero
                  </span>
                )}
              </div>
            )}

            {/* Recent Event Commentary */}
            {recentEvent && (
              <div className="mt-1 text-[10px] sm:text-xs text-amber-100 font-mono font-bold bg-black/60 px-2 py-0.5 rounded border border-amber-500/40 truncate max-w-[220px]">
                {recentEvent}
              </div>
            )}
          </div>

          {/* Left & Right & South garbanzos with numbers */}
          <div className="w-full flex items-center justify-between px-6 z-10 mb-0.5">
            {/* West garbanzo */}
            <div className="flex items-center gap-1">
              {renderGarbanzo('w1', false)}
            </div>

            {/* South garbanzos */}
            <div className="flex items-center gap-1.5">
              {renderGarbanzo('s_am', true)}
              {renderGarbanzo('s1', false)}
              {renderGarbanzo('s2', false)}
            </div>

            {/* East garbanzos */}
            <div className="flex items-center gap-1">
              {renderGarbanzo('e_am', true)}
              {renderGarbanzo('e1', false)}
            </div>
          </div>
        </div>

        {/* EAST SEATED PLAYER (Right) */}
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

      {/* 4. SOUTH: PLAYER'S CARDS (Bottom Center - 100% Unobstructed, Large, Clean) */}
      <div className="relative z-30 flex flex-col items-center pb-1">
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
