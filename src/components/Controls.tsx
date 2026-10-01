import React, { useState } from 'react';
import { LancePhase, LanceBetState } from '../types';
import { sound } from '../sound';

interface ControlsProps {
  isPlayerTurn: boolean;
  phase: LancePhase;
  currentLanceName: string;
  betState: LanceBetState;
  selectedCardCount: number;
  onAction: (action: string) => void;
  onOpenSeñas: () => void;
  waitingMessage?: string | null;
  userHasPares?: boolean;
  userParesType?: string;
  userParesDetail?: string;
  userHasJuego?: boolean;
  userJuegoSum?: number;
  userJuegoDetail?: string;
}

export const Controls: React.FC<ControlsProps> = ({
  isPlayerTurn,
  phase,
  currentLanceName,
  betState,
  selectedCardCount,
  onAction,
  onOpenSeñas,
  waitingMessage,
  userHasPares = false,
  userParesType,
  userParesDetail,
  userHasJuego = false,
  userJuegoSum,
  userJuegoDetail,
}) => {
  // Desplegable de envido personalizado (del 3 al 29 según reglamento solicitado)
  const [customEnvido, setCustomEnvido] = useState<number>(3);

  const isMusQuestion = phase === 'mus_dialog';
  const isDiscarding = phase === 'discarding';
  const isParesCheck = phase === 'pares_precheck';
  const isJuegoCheck = phase === 'juego_precheck';
  const isBetting =
    phase === 'grande' ||
    phase === 'chica' ||
    phase === 'pares_bet' ||
    phase === 'juego_bet' ||
    phase === 'punto_bet';

  // In Pares or Juego, check if user can bet
  const isRestrictedFromBetting =
    (phase === 'pares_bet' && !userHasPares) ||
    (phase === 'juego_bet' && !userHasJuego);

  return (
    <div className="relative bg-gradient-to-b from-[#2a1709] to-[#160c05] border border-brass-500/60 rounded-2xl p-2.5 sm:p-3 shadow-[0_10px_30px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(243,214,140,0.15)] text-stone-100 max-w-2xl w-full mx-auto my-1">
      {/* Turn indicator / status header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-1 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-full border border-black animate-pulse ${
              isPlayerTurn ? 'bg-emerald-400' : 'bg-amber-500'
            }`}
          />
          <span className="text-sm font-mono font-bold uppercase tracking-wider text-brass-400">
            Fase: <span className="text-white font-mono">{currentLanceName}</span>
          </span>
        </div>

        {/* Señas trigger */}
        <button
          onClick={onOpenSeñas}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-brass-300 text-sm font-mono font-bold border border-brass-500/70 shadow-xs transition active:translate-y-0.5 hover:-translate-y-px"
          title="Enviar seña al compañero"
        >
          <span>🤫</span>
          <span>Señas</span>
        </button>
      </div>

      {/* When waiting for AI players */}
      {!isPlayerTurn && (
        <div className="py-2.5 px-3 rounded-xl bg-black/30 border border-stone-800 text-center flex items-center justify-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
          <span className="text-sm font-mono text-stone-300 font-semibold truncate">
            {waitingMessage || 'Esperando turno...'}
          </span>
        </div>
      )}

      {/* Mus Question Phase */}
      {isPlayerTurn && isMusQuestion && (
        <div className="flex flex-col sm:flex-row gap-1.5">
          <button
            onClick={() => {
              sound.playCard();
              onAction('mus');
            }}
            className="flex-1 py-2 px-2.5 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white font-mono font-extrabold uppercase text-sm sm:text-base tracking-wide shadow-md transition active:translate-y-0.5 hover:-translate-y-px border border-black flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>🔄</span>
            <span>PEDIR MUS</span>
          </button>
          <button
            onClick={() => {
              sound.playEnvido();
              onAction('no_mus');
            }}
            className="flex-1 py-2 px-2.5 rounded-xl bg-gradient-to-b from-rose-600 to-rose-800 hover:from-rose-500 hover:to-rose-700 text-white font-mono font-extrabold uppercase text-sm sm:text-base tracking-wide shadow-md transition active:translate-y-0.5 hover:-translate-y-px border border-black flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>⛔</span>
            <span>NO HAY MUS</span>
          </button>
        </div>
      )}

      {/* Discard Phase (Art. IV, Punto 2: mínimo 1 descarte obligatorio) */}
      {isPlayerTurn && isDiscarding && (
        <div className="flex flex-col gap-1.5">
          <div className="text-[10.5px] font-mono font-bold text-amber-200 text-center">
            Elige naipes ({selectedCardCount} seleccionadas)
          </div>
          <button
            disabled={selectedCardCount === 0}
            onClick={() => {
              if (selectedCardCount === 0) return;
              sound.playCard();
              onAction('discard');
            }}
            className={`w-full py-2 px-3 rounded-xl font-mono font-extrabold uppercase text-sm sm:text-base tracking-wide shadow-md transition border border-black flex items-center justify-center gap-1.5 ${
              selectedCardCount > 0
                ? 'bg-gradient-to-b from-brass-400 to-brass-600 hover:from-brass-300 hover:to-brass-500 text-stone-950 cursor-pointer active:translate-y-0.5 hover:-translate-y-px'
                : 'bg-stone-800 text-stone-500 border-stone-700 cursor-not-allowed opacity-75'
            }`}
          >
            <span>🔀</span>
            <span>
              {selectedCardCount === 0
                ? 'Elige al menos 1 carta'
                : `Descartar ${selectedCardCount} carta${selectedCardCount > 1 ? 's' : ''}`}
            </span>
          </button>
        </div>
      )}

      {/* Consulta de Pares (Reglamento: «La boca hace ley, la app certifica para evitar mentiras») */}
      {isParesCheck && (
        <div className="space-y-2 bg-stone-900/95 border-2 border-amber-500/80 p-3 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
            <span className="font-serif font-black text-amber-200 text-sm flex items-center gap-1.5">
              <span>🃏</span>
              <span>Comprobación Oficial de Pares (Decisión de la App)</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-600/50 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>Verificación Automática</span>
            </span>
          </div>

          {/* ASESOR Y CERTIFICADOR OFICIAL DE LA APP */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs font-mono shadow-inner ${
              userHasPares
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/40'
                : 'bg-stone-950 border-stone-700 text-stone-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{userHasPares ? '✅' : '❌'}</span>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wide">
                  Certificación de tus 4 naipes:
                </span>
                <span className="font-bold text-white text-xs sm:text-sm block">
                  {userHasPares
                    ? `TIENES PARES: ${userParesDetail || userParesType || 'Pareja'}`
                    : 'NO TIENES PARES (todas tus cartas son de valor distinto)'}
                </span>
                <span className="text-[11px] text-amber-300/90 font-mono mt-0.5 block">
                  📢 Canto oficial de la app:{' '}
                  <strong className="text-white underline">
                    {userHasPares ? '«¡Pares sí!»' : '«Pares no.»'}
                  </strong>
                  {userHasPares
                    ? ' (Participas en el lance de Pares)'
                    : ' (Excluido de apostar en Pares)'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-stone-950/80 rounded-xl p-2 border border-stone-800 text-[11px] text-stone-300 font-mono text-center flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>
              La app examina y anuncia con voz la jugada de cada jugador por turno. No se puede mentir.
            </span>
          </div>
        </div>
      )}

      {/* Consulta de Juego (>= 31) */}
      {isJuegoCheck && (
        <div className="space-y-2 bg-stone-900/95 border-2 border-amber-500/80 p-3 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
            <span className="font-serif font-black text-amber-200 text-sm flex items-center gap-1.5">
              <span>🔥</span>
              <span>Comprobación Oficial de Juego (Decisión de la App)</span>
            </span>
            <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-600/50 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block" />
              <span>Verificación Automática</span>
            </span>
          </div>

          {/* ASESOR Y CERTIFICADOR OFICIAL DE LA APP */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs font-mono shadow-inner ${
              userHasJuego
                ? 'bg-amber-950/90 border-amber-500 text-amber-200 ring-1 ring-amber-500/40'
                : 'bg-stone-950 border-stone-700 text-stone-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{userHasJuego ? '✅' : '❌'}</span>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wide">
                  Certificación de tus 4 naipes:
                </span>
                <span className="font-bold text-white text-xs sm:text-sm block">
                  {userHasJuego
                    ? `TIENES JUEGO: Suma ${userJuegoSum} (${userJuegoDetail || 'Treinta y una o más'})`
                    : `NO TIENES JUEGO: Suma ${userJuegoSum ?? '?'} (Al no llegar a 31, juegas al Punto si nadie tiene)`}
                </span>
                <span className="text-[11px] text-amber-300/90 font-mono mt-0.5 block">
                  📢 Canto oficial de la app:{' '}
                  <strong className="text-white underline">
                    {userHasJuego ? '«¡Juego sí!»' : '«Juego no.»'}
                  </strong>
                  {userHasJuego
                    ? ' (Participas en el lance de Juego)'
                    : ' (Excluido de apostar en Juego)'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-stone-950/80 rounded-xl p-2 border border-stone-800 text-[11px] text-stone-300 font-mono text-center flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>
              La app examina y anuncia con voz la jugada de cada jugador por turno. No se puede mentir.
            </span>
          </div>
        </div>
      )}

      {/* Betting Phase: Restricted banner if player doesn't have pairs/juego */}
      {isPlayerTurn && isBetting && isRestrictedFromBetting && (
        <div className="bg-stone-900/90 border-2 border-amber-600/80 rounded-xl p-3 text-center">
          <p className="text-amber-300 font-serif font-bold text-sm mb-1">
            🚫 No puedes intervenir en este lance
          </p>
          <p className="text-stone-300 text-xs font-mono">
            {phase === 'pares_bet'
              ? 'No tienes Pares. Tu compañero juega este lance en solitario por tu pareja.'
              : 'No tienes Juego (suma < 31). Tu compañero juega este lance en solitario por tu pareja.'}
          </p>
        </div>
      )}

      {/* Betting Phase: Normal betting controls when eligible */}
      {isPlayerTurn && isBetting && !isRestrictedFromBetting && (
        <div className="space-y-2.5">
          {/* Bet status notice with explicit user potestad */}
          {betState.currentBet > 0 && (
            <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 border-2 border-amber-400 p-2 sm:px-3 sm:py-2 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs font-mono font-bold text-amber-200 shadow-xl">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg animate-bounce">⚡</span>
                <span>
                  {betState.isOrdago
                    ? '¡LOS RIVALES HAN CANTADO ÓRDAGO! Tienes la potestad de decidir:'
                    : `¡Apuesta de los rivales: ${betState.currentBet} piedras! Tienes la potestad de decidir:`}
                </span>
              </div>
              <span className="font-black text-amber-300 bg-amber-900/80 px-2.5 py-0.5 rounded-full border border-amber-500 text-[10px] sm:text-xs uppercase tracking-wider shrink-0 shadow-xs">
                Tu Potestad: Quiero / No Quiero
              </span>
            </div>
          )}

          {betState.currentBet === 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {/* 1. PASO */}
              <button
                type="button"
                onClick={() => {
                  sound.playCard();
                  onAction('paso');
                }}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-b from-stone-600 to-stone-800 hover:from-stone-500 hover:to-stone-700 text-stone-100 font-mono font-extrabold uppercase tracking-wide text-sm sm:text-base border border-black/50 transition active:translate-y-0.5 hover:-translate-y-px shadow-[0_3px_0_rgba(0,0,0,0.55),0_6px_14px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)] flex items-center justify-center gap-1.5 cursor-pointer"
                title="Pasar el turno sin apostar"
              >
                <span>✋</span>
                <span>Paso</span>
              </button>

              {/* 2. ENVIDO (Envido reglamentario de 2 piedras) */}
              <button
                type="button"
                onClick={() => {
                  sound.playEnvido();
                  onAction('envido');
                }}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-b from-sky-600 to-blue-800 hover:from-sky-500 hover:to-blue-700 text-white font-mono font-extrabold uppercase tracking-wide text-sm sm:text-base border border-black/50 transition active:translate-y-0.5 hover:-translate-y-px shadow-[0_3px_0_rgba(0,0,0,0.55),0_6px_14px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)] flex items-center justify-center gap-1.5 cursor-pointer"
                title="Envido tradicional de 2 piedras"
              >
                <span>🪙</span>
                <span>Envido (2)</span>
              </button>

              {/* 3. ENVIDO CON DESPLEGABLE DEL 3 AL 29 */}
              <div
                className="flex items-stretch rounded-xl border border-black/50 shadow-[0_3px_0_rgba(0,0,0,0.55),0_6px_14px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)] bg-gradient-to-b from-brass-400 to-brass-600 overflow-hidden focus-within:ring-2 focus-within:ring-amber-300"
                title="Envido personalizado con desplegable del 3 al 29"
              >
                <button
                  type="button"
                  onClick={() => {
                    sound.playEnvido();
                    onAction(`envido:${customEnvido}`);
                  }}
                  className="flex-1 py-2 px-1.5 text-stone-950 font-mono font-extrabold uppercase tracking-wide text-sm sm:text-base flex items-center justify-center gap-1 cursor-pointer active:translate-y-0.5 hover:-translate-y-px transition hover:brightness-105 truncate"
                  title={`Envidar ${customEnvido} piedras`}
                >
                  <span>Envido</span>
                  <span className="bg-stone-950 text-amber-300 px-1.5 py-0.5 rounded text-[11px] font-mono font-black leading-none shadow-xs">
                    {customEnvido}
                  </span>
                </button>
                <div className="relative flex items-center bg-amber-600/95 border-l border-stone-950/40">
                  <select
                    value={customEnvido}
                    onChange={(e) => setCustomEnvido(Number(e.target.value))}
                    className="h-full py-1.5 pl-2 pr-5 bg-transparent text-stone-950 font-mono font-black text-xs cursor-pointer appearance-none focus:outline-hidden"
                    title="Desplegable del 3 al 29"
                    aria-label="Desplegable de envido del 3 al 29"
                  >
                    {Array.from({ length: 27 }, (_, i) => i + 3).map((n) => (
                      <option key={n} value={n} className="bg-stone-900 text-amber-200 font-mono font-bold">
                        {n}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-1 pointer-events-none text-[8.5px] text-stone-950 font-black">
                    ▼
                  </span>
                </div>
              </div>

              {/* 4. ÓRDAGO */}
              <button
                type="button"
                onClick={() => {
                  sound.playOrdago();
                  onAction('ordago');
                }}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-b from-red-500 to-red-800 hover:from-red-400 hover:to-red-700 text-white font-mono font-extrabold uppercase tracking-wide text-sm sm:text-base border border-black/50 transition active:translate-y-0.5 hover:-translate-y-px shadow-[0_3px_0_rgba(0,0,0,0.55),0_6px_14px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)] flex items-center justify-center gap-1.5 animate-pulse cursor-pointer"
                title="Lanzar Órdago"
              >
                <span>🔥</span>
                <span>¡ÓRDAGO!</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playChip();
                    onAction('quiero');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white font-mono font-extrabold uppercase tracking-wide text-sm sm:text-base border border-black/50 transition active:translate-y-0.5 hover:-translate-y-px shadow-[0_3px_0_rgba(0,0,0,0.55),0_6px_14px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>✓</span>
                  <span>Quiero ({betState.isOrdago ? 'Órdago' : betState.currentBet})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playCard();
                    onAction('no_quiero');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-b from-stone-600 to-stone-800 hover:from-stone-500 hover:to-stone-700 text-stone-100 font-mono font-extrabold uppercase tracking-wide text-sm sm:text-base border border-black/50 transition active:translate-y-0.5 hover:-translate-y-px shadow-[0_3px_0_rgba(0,0,0,0.55),0_6px_14px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>✗</span>
                  <span>No Quiero</span>
                </button>
              </div>

              {!betState.isOrdago && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playEnvido();
                      onAction('mas');
                    }}
                    className="py-2 px-2.5 rounded-xl bg-gradient-to-b from-brass-400 to-brass-600 hover:from-brass-300 hover:to-brass-500 text-stone-950 font-mono font-extrabold uppercase tracking-wide text-sm sm:text-base border border-black/50 transition active:translate-y-0.5 hover:-translate-y-px shadow-[0_3px_0_rgba(0,0,0,0.55),0_6px_14px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)] flex items-center justify-center gap-1 cursor-pointer truncate"
                  >
                    <span>+2 Más</span>
                    <span className="text-[10px] text-stone-900 bg-amber-300/80 px-1 py-0.2 rounded font-mono font-bold">
                      ({betState.currentBet + 2})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playOrdago();
                      onAction('ordago');
                    }}
                    className="py-2 px-2.5 rounded-xl bg-gradient-to-b from-red-500 to-red-800 hover:from-red-400 hover:to-red-700 text-white font-mono font-extrabold uppercase tracking-wide text-sm sm:text-base border border-black/50 transition active:translate-y-0.5 hover:-translate-y-px shadow-[0_3px_0_rgba(0,0,0,0.55),0_6px_14px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)] flex items-center justify-center gap-1.5 animate-pulse cursor-pointer"
                  >
                    <span>🔥</span>
                    <span>¡ÓRDAGO!</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
