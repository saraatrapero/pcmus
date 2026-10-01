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
  controlsNode?: React.ReactNode;
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
  controlsNode,
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

  const team0Piedras = scoreTeam0?.piedras || 0;
  const team1Piedras = scoreTeam1?.piedras || 0;
  const target = targetPiedras || 40;

  // Realistic Platillo de Piedras / Tanteo Tray sitting directly on the table felt
  const renderPlatillo = (
    teamName: string,
    isUserTeam: boolean,
    piedras: number,
    targetVal: number
  ) => {
    const amarracos = Math.floor(piedras / 5);
    const sueltas = piedras % 5;

    return (
      <div
        className={`rounded-2xl border-2 p-2 sm:p-2.5 flex flex-col items-center justify-between shadow-2xl backdrop-blur-xs select-none transition-all duration-300 w-[125px] sm:w-[155px] shrink-0 z-20 ${
          isUserTeam
            ? 'bg-gradient-to-b from-[#2a1708]/95 via-[#1c0f04]/95 to-[#120a02]/95 border-emerald-500/80 shadow-[0_8px_20px_rgba(0,0,0,0.85),inset_0_2px_8px_rgba(16,185,129,0.3)]'
            : 'bg-gradient-to-b from-[#2a1708]/95 via-[#1c0f04]/95 to-[#120a02]/95 border-rose-500/80 shadow-[0_8px_20px_rgba(0,0,0,0.85),inset_0_2px_8px_rgba(244,63,94,0.3)]'
        }`}
        title={`Platillo de piedras en la mesa - ${teamName}: ${piedras} de ${targetVal} piedras`}
      >
        {/* Header with team tag & stones tally */}
        <div className="w-full flex items-center justify-between gap-1 pb-1 border-b border-amber-900/60 font-mono text-[9px] sm:text-[10px]">
          <span
            className={`font-black uppercase tracking-wider flex items-center gap-1 ${
              isUserTeam ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            <span>{isUserTeam ? '🟢' : '🔴'}</span>
            <span className="truncate max-w-[70px] sm:max-w-[95px]">{teamName}</span>
          </span>
          <span className="font-mono font-black text-amber-300 text-xs sm:text-sm bg-black/75 px-1.5 py-0.2 rounded border border-amber-500/40 shadow-xs">
            {piedras}
            <span className="text-[8.5px] text-stone-400 font-normal">/{targetVal}</span>
          </span>
        </div>

        {/* Dish Basin with tactile 3D Chips / Stones */}
        <div className="w-full my-1 py-1 px-1 rounded-xl bg-gradient-to-b from-[#081e0f] via-[#0a2613] to-[#041208] border border-emerald-900/70 shadow-inner flex flex-col items-center justify-center min-h-[46px] gap-1">
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {/* Amarracos (Fichas doradas metálicas = 5 piedras cada una) */}
            {amarracos > 0 && (
              <div
                className="flex items-center gap-0.5"
                title={`${amarracos} amarraco(s) = ${amarracos * 5} piedras`}
              >
                <span className="text-[9px] font-mono font-black text-amber-300">
                  {amarracos}x
                </span>
                <div className="flex items-center -space-x-1">
                  {[...Array(Math.min(amarracos, 6))].map((_, i) => (
                    <div
                      key={`am_${i}`}
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-yellow-200 via-amber-400 to-amber-700 border border-yellow-200 shadow-[1px_2px_4px_rgba(0,0,0,0.8)] relative flex items-center justify-center text-[9px] font-black text-stone-950 font-mono select-none"
                    >
                      <span>5</span>
                      <div className="absolute top-0.5 left-0.5 w-1 h-1 rounded-full bg-white opacity-80 pointer-events-none" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Piedras sueltas (Fichas de hueso/marfil = 1 piedra cada una) */}
            {sueltas > 0 && (
              <div
                className="flex items-center gap-0.5"
                title={`${sueltas} piedra(s) suelta(s) = ${sueltas} piedras`}
              >
                <span className="text-[9px] font-mono font-black text-stone-300">
                  {sueltas}x
                </span>
                <div className="flex items-center -space-x-1">
                  {[...Array(sueltas)].map((_, i) => (
                    <div
                      key={`su_${i}`}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-br from-stone-100 via-stone-300 to-stone-500 border border-white shadow-[1px_2px_4px_rgba(0,0,0,0.8)] relative flex items-center justify-center text-[8px] font-black text-stone-900 font-mono select-none"
                    >
                      <span>1</span>
                      <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 rounded-full bg-white opacity-90 pointer-events-none" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {amarracos === 0 && sueltas === 0 && (
              <span className="text-[8.5px] text-stone-500 font-mono italic">
                0 piedras
              </span>
            )}
          </div>

          {/* Legend */}
          <div className="text-[7.5px] sm:text-[8px] text-stone-400 font-mono flex items-center gap-1 leading-none">
            <span className="text-amber-300 font-bold">
              {amarracos} am.
            </span>
            <span>•</span>
            <span className="text-stone-300 font-bold">
              {sueltas} p.
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto my-1 rounded-3xl border-4 border-stone-900 shadow-2xl overflow-hidden select-none flex flex-col justify-between flex-1 min-h-[560px] sm:min-h-[620px]">
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

        {/* GRAND OVAL SPANISH TAVERN TABLE WITH TAPETE VERDE */}
        <div className="flex-1 mx-1.5 sm:mx-3 h-full min-h-[190px] sm:min-h-[220px] rounded-[50px] sm:rounded-[80px] border-[6px] sm:border-[8px] border-[#381907] bg-gradient-to-b from-[#4a240d] via-[#2f1506] to-[#1a0a02] shadow-[inset_0_4px_30px_rgba(0,0,0,0.85),0_15px_30px_rgba(0,0,0,0.9)] relative p-2 sm:p-3 flex flex-col justify-between overflow-hidden">
          {/* TAPETE VERDE DE PAÑO DE MUS (Traditional Green Baize Felt) */}
          <div className="absolute inset-2 sm:inset-3 rounded-[40px] sm:rounded-[68px] border-2 border-amber-600/40 bg-gradient-to-b from-[#134e2b] via-[#155e34] to-[#0f3c21] shadow-[inset_0_3px_20px_rgba(0,0,0,0.7)] overflow-hidden pointer-events-none">
            {/* Subtle felt baize weave */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, #ffffff 1px, transparent 1px)`,
                backgroundSize: '16px 16px',
              }}
            />
            {/* Decorative gold stitched border line */}
            <div className="absolute inset-1.5 rounded-[34px] sm:rounded-[62px] border border-amber-400/25 pointer-events-none" />
          </div>

          {/* TABLE SURFACE CONTENT: SIDE CHIP TRAYS + CENTER LANCE & DECLARATIONS */}
          <div className="relative z-10 w-full h-full flex flex-col md:flex-row items-center justify-between gap-1.5 sm:gap-2 my-auto px-1 sm:px-2">
            {/* LEFT SIDE OF TABLE: Platillo de Piedras de Tu Pareja + Baraja */}
            <div className="flex items-center gap-1.5 shrink-0 justify-center">
              {renderPlatillo('Tu Pareja', true, team0Piedras, target)}

              {/* Taco de Baraja Española Fournier 1996 sobre el tapete verde */}
              <div
                className="hidden lg:flex flex-col items-center select-none"
                title="Baraja Española Fournier 1996 (40 naipes) sobre el tapete verde"
              >
                <div className="w-9 h-14 rounded-lg border-2 border-stone-950 bg-red-900 shadow-[3px_4px_8px_rgba(0,0,0,0.75)] relative overflow-hidden transform -rotate-6">
                  <div className="absolute inset-0.5 border border-amber-400/50 bg-gradient-to-br from-red-950 via-red-900 to-red-800 flex items-center justify-center">
                    <span className="text-[7.5px] font-mono font-black text-amber-300">
                      40
                    </span>
                  </div>
                </div>
                <div className="w-8 h-1 bg-stone-900 rounded-b -mt-0.5 transform -rotate-6 shadow" />
                <span className="text-[7.5px] font-mono font-bold text-amber-200/80 mt-0.5">
                  Baraja
                </span>
              </div>
            </div>

            {/* CENTER OF TABLE: Lance Placard, Active Bet Pot & Declarations Panel */}
            <div className="flex-1 flex flex-col items-center max-w-sm sm:max-w-md text-center w-full px-1 z-20">
              {/* Lance Banner */}
              <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 border-2 border-yellow-400 px-3 py-1 rounded-xl shadow-xl text-yellow-300 font-mono font-black flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-widest text-amber-200 leading-none">
                  LANCE:
                </span>
                <span className="text-xs sm:text-base uppercase text-white font-serif font-black">
                  {currentLanceName}
                </span>
              </div>

              {/* Active Bet Pot / Chips in Litigation on the Center of the Table */}
              {betState.currentBet > 0 && (
                <div className="mt-1 bg-amber-400 text-stone-950 px-2.5 py-0.5 rounded-full border-2 border-stone-950 font-mono font-black text-xs shadow-lg flex items-center gap-1.5 animate-bounce">
                  <span>
                    {betState.isOrdago
                      ? '🔥 ¡ÓRDAGO EN LITIGIO!'
                      : `🪙 BOTE EN JUEGO: ${betState.currentBet} PIEDRAS`}
                  </span>
                  {betState.accepted && (
                    <span className="bg-emerald-800 text-white text-[8px] px-1.5 py-0.2 rounded uppercase">
                      Quiero
                    </span>
                  )}
                </div>
              )}

              {/* Panel de Declaraciones Oficiales (Pares y Juego) - Visible a todos */}
              <div className="mt-1 w-full bg-stone-950/95 border border-amber-600/70 rounded-xl p-1.5 shadow-xl backdrop-blur-xs text-[10px] font-mono">
                <div className="flex items-center justify-between pb-0.5 border-b border-stone-800 text-[8.5px] sm:text-[9px] uppercase tracking-wider text-amber-300 font-bold">
                  <span className="flex items-center gap-1">
                    <span>📋</span>
                    <span>Declaraciones Oficiales</span>
                  </span>
                  <span className="text-[7.5px] sm:text-[8px] text-stone-400 font-normal">
                    {phase === 'pares_precheck' || phase === 'pares_bet'
                      ? '• en lance de pares'
                      : phase === 'juego_precheck' || phase === 'juego_bet'
                      ? '• en lance de juego'
                      : '• mesa completa'}
                  </span>
                </div>

                {/* PARES ROW */}
                <div
                  className={`mt-1 p-0.5 rounded transition-colors ${
                    phase === 'pares_precheck' || phase === 'pares_bet'
                      ? 'bg-amber-950/80 border border-amber-500/80 shadow-xs'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between text-[8px] font-bold text-stone-300 mb-0.5 px-0.5">
                    <span className="flex items-center gap-1">
                      <span className="text-amber-400">🃏</span>
                      <span>PARES:</span>
                    </span>
                    <span className="text-[7.5px] text-stone-400 font-mono">
                      {pSouth?.declaredPares === null && pNorth?.declaredPares === null
                        ? 'Esperando consulta'
                        : 'Certificado oficial'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[8.5px]">
                    {/* Tu Pareja */}
                    <div className="bg-stone-900/90 rounded px-1.5 py-0.5 border border-stone-800 flex items-center justify-between">
                      <span className="text-emerald-400 font-bold truncate max-w-[55px]">
                        Pareja
                      </span>
                      <span className="flex items-center gap-1 font-black">
                        <span
                          className={
                            pSouth?.declaredPares
                              ? 'text-emerald-300'
                              : pSouth?.declaredPares === false
                              ? 'text-stone-500'
                              : 'text-stone-600'
                          }
                        >
                          Tú:{pSouth?.declaredPares ? 'SÍ' : pSouth?.declaredPares === false ? 'NO' : '?'}
                        </span>
                        <span className="text-stone-600">|</span>
                        <span
                          className={
                            pNorth?.declaredPares
                              ? 'text-emerald-300'
                              : pNorth?.declaredPares === false
                              ? 'text-stone-500'
                              : 'text-stone-600'
                          }
                        >
                          Par:{pNorth?.declaredPares ? 'SÍ' : pNorth?.declaredPares === false ? 'NO' : '?'}
                        </span>
                      </span>
                    </div>
                    {/* Rivales */}
                    <div className="bg-stone-900/90 rounded px-1.5 py-0.5 border border-stone-800 flex items-center justify-between">
                      <span className="text-rose-400 font-bold truncate max-w-[50px]">
                        Rivales
                      </span>
                      <span className="flex items-center gap-1 font-black">
                        <span
                          className={
                            pEast?.declaredPares
                              ? 'text-rose-300'
                              : pEast?.declaredPares === false
                              ? 'text-stone-500'
                              : 'text-stone-600'
                          }
                        >
                          Est:{pEast?.declaredPares ? 'SÍ' : pEast?.declaredPares === false ? 'NO' : '?'}
                        </span>
                        <span className="text-stone-600">|</span>
                        <span
                          className={
                            pWest?.declaredPares
                              ? 'text-rose-300'
                              : pWest?.declaredPares === false
                              ? 'text-stone-500'
                              : 'text-stone-600'
                          }
                        >
                          Oes:{pWest?.declaredPares ? 'SÍ' : pWest?.declaredPares === false ? 'NO' : '?'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* JUEGO ROW */}
                <div
                  className={`mt-0.5 p-0.5 rounded transition-colors ${
                    phase === 'juego_precheck' || phase === 'juego_bet'
                      ? 'bg-amber-950/80 border border-amber-500/80 shadow-xs'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between text-[8px] font-bold text-stone-300 mb-0.5 px-0.5">
                    <span className="flex items-center gap-1">
                      <span className="text-amber-400">🔥</span>
                      <span>JUEGO (&ge;31):</span>
                    </span>
                    <span className="text-[7.5px] text-stone-400 font-mono">
                      {pSouth?.declaredJuego === null && pNorth?.declaredJuego === null
                        ? 'Esperando consulta'
                        : 'Certificado oficial'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[8.5px]">
                    {/* Tu Pareja */}
                    <div className="bg-stone-900/90 rounded px-1.5 py-0.5 border border-stone-800 flex items-center justify-between">
                      <span className="text-emerald-400 font-bold truncate max-w-[55px]">
                        Pareja
                      </span>
                      <span className="flex items-center gap-1 font-black">
                        <span
                          className={
                            pSouth?.declaredJuego
                              ? 'text-amber-300'
                              : pSouth?.declaredJuego === false
                              ? 'text-stone-500'
                              : 'text-stone-600'
                          }
                        >
                          Tú:{pSouth?.declaredJuego ? 'SÍ' : pSouth?.declaredJuego === false ? 'NO' : '?'}
                        </span>
                        <span className="text-stone-600">|</span>
                        <span
                          className={
                            pNorth?.declaredJuego
                              ? 'text-amber-300'
                              : pNorth?.declaredJuego === false
                              ? 'text-stone-500'
                              : 'text-stone-600'
                          }
                        >
                          Par:{pNorth?.declaredJuego ? 'SÍ' : pNorth?.declaredJuego === false ? 'NO' : '?'}
                        </span>
                      </span>
                    </div>
                    {/* Rivales */}
                    <div className="bg-stone-900/90 rounded px-1.5 py-0.5 border border-stone-800 flex items-center justify-between">
                      <span className="text-rose-400 font-bold truncate max-w-[50px]">
                        Rivales
                      </span>
                      <span className="flex items-center gap-1 font-black">
                        <span
                          className={
                            pEast?.declaredJuego
                              ? 'text-rose-300'
                              : pEast?.declaredJuego === false
                              ? 'text-stone-500'
                              : 'text-stone-600'
                          }
                        >
                          Est:{pEast?.declaredJuego ? 'SÍ' : pEast?.declaredJuego === false ? 'NO' : '?'}
                        </span>
                        <span className="text-stone-600">|</span>
                        <span
                          className={
                            pWest?.declaredJuego
                              ? 'text-rose-300'
                              : pWest?.declaredJuego === false
                              ? 'text-stone-500'
                              : 'text-stone-600'
                          }
                        >
                          Oes:{pWest?.declaredJuego ? 'SÍ' : pWest?.declaredJuego === false ? 'NO' : '?'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE OF TABLE: Platillo de Piedras de los Rivales */}
            <div className="flex items-center gap-1.5 shrink-0 justify-center">
              {renderPlatillo('Rivales', false, team1Piedras, target)}
            </div>
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

      {/* 4. SOUTH: HUMAN PLAYER ROW (Left: Controls module, Center: 4 Cards, Right: Player Badge) */}
      <div className="relative z-30 w-full px-2 sm:px-4 pb-2 pt-1 flex flex-col lg:flex-row items-center justify-between gap-2.5">
        {/* LEFT OF CARDS: Controls module (Selector 1: «ese módulo a la izq. de las cartas») */}
        <div className="w-full lg:w-[320px] xl:w-[350px] shrink-0 flex justify-center lg:justify-start order-2 lg:order-1">
          {controlsNode}
        </div>

        {/* CENTER: 4 Player Cards with authentic Spanish Figures (Selector 2: «las cartas») */}
        <div className="shrink-0 flex justify-center order-1 lg:order-2">
          {pSouth && (
            <CartoonPlayerHands
              cards={pSouth.cards}
              selectedIndices={pSouth.selectedToDiscard}
              isDiscardPhase={isDiscardPhase}
              onCardClick={onCardClick}
            />
          )}
        </div>

        {/* RIGHT OF CARDS: South Player Badge & Status (Selector 2's sibling: «el otro a la derecha») */}
        <div className="w-full lg:w-[320px] xl:w-[350px] shrink-0 flex justify-center lg:justify-end order-3">
          {pSouth && (
            <div className="relative flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-stone-950/95 border-2 border-stone-800 hover:border-amber-500/70 shadow-xl backdrop-blur-xs">
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
                  <span className="font-serif font-black text-sm sm:text-base text-amber-200 truncate max-w-[120px] sm:max-w-[150px]">
                    {activeUser?.name || pSouth.name}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-emerald-700 text-emerald-100 uppercase tracking-wider border border-emerald-500/50">
                    Tú (Sur)
                  </span>
                </div>
                <div className="text-[10px] text-stone-400 font-mono">
                  Pareja de {pNorth?.name || 'Norte'}
                </div>

                {/* Indicador de Pares y Juego de Tú (Sur) */}
                <div className="flex items-center gap-1 mt-1 font-mono text-[9px] font-black">
                  <span
                    className={`px-1.5 py-0.5 rounded border transition-colors ${
                      pSouth.hasPares
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-xs'
                        : 'bg-stone-900 text-stone-400 border-stone-800'
                    }`}
                    title={
                      pSouth.hasPares
                        ? 'Tu mano TIENE Pares (participas en el lance)'
                        : 'Tu mano NO tiene pares'
                    }
                  >
                    {pSouth.declaredPares !== null
                      ? `Pares: ${pSouth.declaredPares ? 'SÍ' : 'NO'}`
                      : `Pares: ${pSouth.hasPares ? 'SÍ' : 'NO'}`}
                  </span>

                  <span
                    className={`px-1.5 py-0.5 rounded border transition-colors ${
                      pSouth.hasJuego
                        ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-xs'
                        : 'bg-stone-900 text-stone-400 border-stone-800'
                    }`}
                    title={
                      pSouth.hasJuego
                        ? `Tu mano TIENE Juego (suma ${pSouth.juegoValue})`
                        : `Tu mano NO tiene juego (Punto: ${pSouth.juegoValue})`
                    }
                  >
                    {pSouth.declaredJuego !== null
                      ? `Juego: ${pSouth.declaredJuego ? `SÍ (${pSouth.juegoValue})` : 'NO'}`
                      : `Juego: ${pSouth.hasJuego ? `SÍ (${pSouth.juegoValue})` : `NO (${pSouth.juegoValue})`}`}
                  </span>
                </div>
              </div>

              {/* Speech bubble for South if speaking */}
              {pSouth.currentSpeech && (
                <div className="absolute bottom-full mb-2 right-0 z-40 bg-amber-100 text-stone-950 border-2 border-stone-950 px-3 py-1 rounded-xl shadow-xl font-sans text-xs font-bold whitespace-nowrap animate-bounce">
                  <span className="text-[10px] text-amber-800 font-mono block -mb-0.5 font-bold uppercase">
                    {activeUser?.name || pSouth.name}:
                  </span>
                  <span>«{pSouth.currentSpeech}»</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
