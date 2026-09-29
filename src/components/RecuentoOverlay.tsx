import React, { useState, useEffect, useRef } from 'react';
import { Player, TeamScore } from '../types';
import { HandRecountPlan, LanceRecountDetail } from '../recuentoCalculator';
import { sound } from '../sound';
import { CharacterAvatar } from './CharacterAvatar';

interface RecuentoOverlayProps {
  recountPlan: HandRecountPlan;
  players: Player[];
  scoreTeam0: TeamScore;
  scoreTeam1: TeamScore;
  targetPiedras: number;
  gameSpeed: 'tranquilo' | 'normal' | 'rapido';
  onLancePointsAwarded?: (team: 0 | 1, pts: number, reason: string) => void;
  onFinishRecount: () => void;
}

export const RecuentoOverlay: React.FC<RecuentoOverlayProps> = ({
  recountPlan,
  players,
  scoreTeam0,
  scoreTeam1,
  targetPiedras,
  gameSpeed,
  onLancePointsAwarded,
  onFinishRecount,
}) => {
  // Current active step: 0 to recountPlan.steps.length (last step is Resumen)
  const totalLances = recountPlan.steps.length;
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Track which lances have already triggered point awards
  const awardedStepsRef = useRef<Set<number>>(new Set());

  // Step durations according to gameSpeed
  const stepDurationMs =
    gameSpeed === 'tranquilo' ? 4200 : gameSpeed === 'normal' ? 2900 : 1600;

  // Sound and point award whenever activeStep changes
  useEffect(() => {
    if (activeStep < totalLances) {
      const lance = recountPlan.steps[activeStep];
      if (lance.pointsAwarded > 0 && lance.winningTeam !== null) {
        sound.playChip();
        if (!awardedStepsRef.current.has(activeStep)) {
          awardedStepsRef.current.add(activeStep);
          onLancePointsAwarded?.(
            lance.winningTeam,
            lance.pointsAwarded,
            `${lance.lanceTitle}: ${lance.winnerName}`
          );
        }
      }
    } else {
      // Reached summary
      sound.playCard();
    }
  }, [activeStep, totalLances, recountPlan.steps, onLancePointsAwarded]);

  // Auto-advance ticker with smooth progress
  useEffect(() => {
    if (isPaused) {
      setProgressPercent(0);
      return;
    }

    if (activeStep >= totalLances) {
      // Stay on final summary until user clicks next hand
      setProgressPercent(100);
      return;
    }

    const intervalTime = 50;
    const increment = (intervalTime / stepDurationMs) * 100;
    let currentProgress = 0;

    const interval = setInterval(() => {
      currentProgress += increment;
      if (currentProgress >= 100) {
        setProgressPercent(100);
        clearInterval(interval);
        setActiveStep((prev) => Math.min(prev + 1, totalLances));
      } else {
        setProgressPercent(currentProgress);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [activeStep, isPaused, stepDurationMs, totalLances]);

  const handleNextStep = () => {
    setProgressPercent(0);
    setActiveStep((prev) => Math.min(prev + 1, totalLances));
  };

  const handlePrevStep = () => {
    setProgressPercent(0);
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const currentLance: LanceRecountDetail | undefined = recountPlan.steps[activeStep];
  const isSummaryStep = activeStep >= totalLances;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 border-4 border-amber-600 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* TOP BAR / HEADER */}
        <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 px-4 py-3 border-b-2 border-amber-500/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <div>
              <h2 className="font-serif font-black text-amber-200 text-base sm:text-lg tracking-wide uppercase leading-tight">
                Recuento Tradicional de Tantos
              </h2>
              <p className="text-[10px] text-amber-300/80 font-mono">
                Revisión reglamentaria lance por lance • 8 Reyes y 8 Ases (Normativa Bizkaia)
              </p>
            </div>
          </div>

          {/* Speed Indicator Badge */}
          <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full border border-amber-500/40 text-[10px] font-mono text-amber-300">
            <span>{gameSpeed === 'tranquilo' ? '🐢' : gameSpeed === 'normal' ? '⚖️' : '⚡'}</span>
            <span className="hidden sm:inline capitalize">Ritmo {gameSpeed}</span>
          </div>
        </div>

        {/* STEP TABS PROGRESSION */}
        <div className="bg-stone-950/90 border-b border-stone-800 px-3 py-2 flex items-center justify-between gap-1 overflow-x-auto text-[11px] font-mono">
          {recountPlan.steps.map((st, idx) => {
            const isActive = activeStep === idx;
            const isDone = activeStep > idx;
            return (
              <button
                key={st.lanceKey}
                onClick={() => {
                  setActiveStep(idx);
                  setIsPaused(true);
                }}
                className={`px-2.5 py-1 rounded-xl transition flex items-center gap-1 whitespace-nowrap border ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 font-black border-amber-300 shadow-md scale-105'
                    : isDone
                    ? 'bg-stone-800 text-emerald-300 border-emerald-600/50'
                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
              >
                <span>{st.icon}</span>
                <span>{st.lanceTitle.replace('A LA ', '').replace('A LOS ', '').replace('AL ', '')}</span>
                {isDone && <span className="text-emerald-400 font-bold">✓</span>}
              </button>
            );
          })}

          {/* Resumen tab */}
          <button
            onClick={() => {
              setActiveStep(totalLances);
              setIsPaused(true);
            }}
            className={`px-2.5 py-1 rounded-xl transition flex items-center gap-1 whitespace-nowrap border ${
              isSummaryStep
                ? 'bg-amber-500 text-stone-950 font-black border-amber-300 shadow-md scale-105'
                : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
          >
            <span>📊</span>
            <span>Resumen</span>
          </button>
        </div>

        {/* AUTO-ADVANCE PROGRESS BAR */}
        {!isSummaryStep && !isPaused && (
          <div className="w-full bg-stone-900 h-1 overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-75 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* MAIN BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col justify-between gap-4">
          {!isSummaryStep && currentLance ? (
            <div className="flex flex-col gap-4">
              {/* LANCE TITLE & ICON BANNER */}
              <div className="flex items-center justify-between bg-stone-900/90 border-2 border-amber-500/60 p-3 rounded-2xl shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-2xl shadow">
                    {currentLance.icon}
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-400">
                      Lance {activeStep + 1} de {totalLances}
                    </div>
                    <div className="font-serif font-black text-xl text-white">
                      {currentLance.lanceTitle}
                    </div>
                  </div>
                </div>

                {/* Stones Awarded Pill */}
                <div
                  className={`flex flex-col items-end px-3 py-1.5 rounded-xl border font-mono font-black ${
                    currentLance.pointsAwarded > 0
                      ? currentLance.winningTeam === 0
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : 'bg-rose-950/80 border-rose-500 text-rose-300'
                      : 'bg-stone-800 border-stone-700 text-stone-400'
                  }`}
                >
                  <span className="text-xs text-stone-300">Piedras en juego:</span>
                  <span className="text-lg">
                    {currentLance.pointsAwarded > 0
                      ? `+${currentLance.pointsAwarded} ${currentLance.pointsAwarded === 1 ? 'piedra' : 'piedras'}`
                      : '0 piedras'}
                  </span>
                </div>
              </div>

              {/* WINNER SPOTLIGHT */}
              {currentLance.winningTeam !== null && currentLance.winningPlayerIndex !== null ? (
                <div
                  className={`p-3.5 rounded-2xl border-2 shadow-lg flex items-center gap-3.5 ${
                    currentLance.winningTeam === 0
                      ? 'bg-emerald-950/40 border-emerald-500/70'
                      : 'bg-rose-950/40 border-rose-500/70'
                  }`}
                >
                  <div className="relative shrink-0">
                    <CharacterAvatar
                      characterId={players[currentLance.winningPlayerIndex].id}
                      characterName={currentLance.winnerName}
                      size="md"
                      className="ring-2 ring-amber-400 shadow-md"
                    />
                    <span className="absolute -top-2 -right-2 text-base" title="Ganador del lance">
                      👑
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-stone-950">
                        Vencedor
                      </span>
                      <span className="font-serif font-black text-base text-amber-200 truncate">
                        {currentLance.winnerName}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          currentLance.winningTeam === 0
                            ? 'bg-emerald-800 text-emerald-100'
                            : 'bg-rose-900 text-rose-100'
                        }`}
                      >
                        {currentLance.winningTeam === 0 ? 'Equipo Jugador' : 'Rivales'}
                      </span>
                    </div>

                    <p className="text-xs text-stone-200 mt-1 font-mono leading-relaxed">
                      {currentLance.explanation}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono">
                      <span className="bg-stone-900/90 text-amber-300 px-2 py-0.5 rounded border border-amber-600/40">
                        ⚖️ {currentLance.betSummary}
                      </span>
                      {currentLance.jugadaBonusSummary && (
                        <span className="bg-amber-950/80 text-amber-200 px-2 py-0.5 rounded border border-amber-500/50">
                          🪙 {currentLance.jugadaBonusSummary}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border-2 border-stone-800 bg-stone-900/50 text-center">
                  <span className="text-2xl mb-1 block">🤷‍♂️</span>
                  <div className="font-serif font-black text-amber-300 text-base">
                    Lance desierto
                  </div>
                  <p className="text-xs text-stone-400 font-mono mt-1">
                    {currentLance.explanation}
                  </p>
                </div>
              )}

              {/* HAND COMPARISON BREAKDOWN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                {/* Team 0 (Jugador) */}
                <div
                  className={`p-3 rounded-xl border ${
                    currentLance.winningTeam === 0
                      ? 'bg-emerald-950/30 border-emerald-500/60 shadow'
                      : 'bg-stone-900/70 border-stone-800'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-stone-700/60">
                    <span className="font-serif font-bold text-emerald-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Equipo Jugador
                    </span>
                    {currentLance.winningTeam === 0 && (
                      <span className="text-[10px] text-emerald-400 font-bold">GANADOR</span>
                    )}
                  </div>
                  <p className="text-stone-300 text-[11px] leading-relaxed">
                    {currentLance.cardsDescriptionTeam0}
                  </p>
                </div>

                {/* Team 1 (Rivales) */}
                <div
                  className={`p-3 rounded-xl border ${
                    currentLance.winningTeam === 1
                      ? 'bg-rose-950/30 border-rose-500/60 shadow'
                      : 'bg-stone-900/70 border-stone-800'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-stone-700/60">
                    <span className="font-serif font-bold text-rose-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      Rivales
                    </span>
                    {currentLance.winningTeam === 1 && (
                      <span className="text-[10px] text-rose-400 font-bold">GANADOR</span>
                    )}
                  </div>
                  <p className="text-stone-300 text-[11px] leading-relaxed">
                    {currentLance.cardsDescriptionTeam1}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* RESUMEN TOTAL DE LA MANO */
            <div className="flex flex-col gap-4">
              <div className="text-center py-2">
                <span className="text-3xl">🏆</span>
                <h3 className="font-serif font-black text-xl text-amber-300 mt-1">
                  Resumen de la Mano Concluida
                </h3>
                <p className="text-xs text-stone-400 font-mono">
                  Tanteo total sumado en los 4 lances de esta mano
                </p>
              </div>

              {/* SCORE COMPARISON CARDS */}
              <div className="grid grid-cols-2 gap-4 font-mono">
                {/* Team Jugador */}
                <div className="bg-emerald-950/50 border-2 border-emerald-500/70 p-4 rounded-2xl text-center shadow-lg">
                  <div className="text-xs font-serif font-bold text-emerald-300 uppercase">
                    Equipo Jugador
                  </div>
                  <div className="text-3xl font-black text-emerald-400 my-1 font-mono">
                    +{recountPlan.totalTeam0}
                  </div>
                  <div className="text-[11px] text-stone-300">
                    Marcador actual: <strong className="text-amber-300">{scoreTeam0.piedras}</strong>/{targetPiedras} piedras
                  </div>
                </div>

                {/* Team Rivales */}
                <div className="bg-rose-950/50 border-2 border-rose-500/70 p-4 rounded-2xl text-center shadow-lg">
                  <div className="text-xs font-serif font-bold text-rose-300 uppercase">
                    Rivales
                  </div>
                  <div className="text-3xl font-black text-rose-400 my-1 font-mono">
                    +{recountPlan.totalTeam1}
                  </div>
                  <div className="text-[11px] text-stone-300">
                    Marcador actual: <strong className="text-amber-300">{scoreTeam1.piedras}</strong>/{targetPiedras} piedras
                  </div>
                </div>
              </div>

              {/* LANCES SUMMARY LIST */}
              <div className="bg-stone-900/80 rounded-2xl p-3 border border-stone-800 space-y-2 text-xs font-mono">
                <div className="font-bold text-amber-300 pb-1 border-b border-stone-800">
                  Desglose de lances:
                </div>
                {recountPlan.steps.map((st) => (
                  <div key={st.lanceKey} className="flex items-center justify-between text-stone-300">
                    <span className="flex items-center gap-1.5">
                      <span>{st.icon}</span>
                      <span className="font-semibold text-white">{st.lanceTitle}:</span>
                      <span>{st.winnerName}</span>
                    </span>
                    <span
                      className={`font-black ${
                        st.pointsAwarded > 0
                          ? st.winningTeam === 0
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                          : 'text-stone-500'
                      }`}
                    >
                      {st.pointsAwarded > 0
                        ? `+${st.pointsAwarded} p. (${st.winningTeam === 0 ? 'Jugador' : 'Rivales'})`
                        : '0 p.'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM CONTROLS & NAVIGATION */}
        <div className="bg-stone-950 border-t border-stone-800 px-4 py-3 flex items-center justify-between gap-2">
          {/* Pause / Play button */}
          {!isSummaryStep && (
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition ${
                isPaused
                  ? 'bg-amber-500 text-stone-950 border-amber-400 animate-pulse'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border-stone-700'
              }`}
              title={isPaused ? 'Reanudar avance pausado' : 'Pausar para leer con calma'}
            >
              <span>{isPaused ? '▶ Reanudar' : '⏸ Pausar'}</span>
            </button>
          )}

          {/* Step Back button */}
          {activeStep > 0 && !isSummaryStep && (
            <button
              onClick={handlePrevStep}
              className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-mono font-bold transition flex items-center gap-1"
            >
              <span>◀</span>
              <span>Anterior</span>
            </button>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto">
            {!isSummaryStep ? (
              <button
                onClick={handleNextStep}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black text-xs sm:text-sm shadow-lg transition flex items-center gap-1.5 active:scale-95"
              >
                <span>Siguiente Lance</span>
                <span>▶</span>
              </button>
            ) : (
              <button
                onClick={onFinishRecount}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-serif font-black text-sm shadow-xl transition flex items-center gap-2 active:scale-95 animate-pulse"
              >
                <span>Repartir Siguiente Mano</span>
                <span>🎴</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
