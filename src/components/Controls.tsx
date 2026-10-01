import React from 'react';
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
    <div className="bg-stone-950/95 border-2 border-amber-600 rounded-2xl p-2 shadow-xl text-stone-100 w-full backdrop-blur-md">
      {/* Turn indicator / status header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-1 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-full border border-black animate-pulse ${
              isPlayerTurn ? 'bg-emerald-400' : 'bg-amber-500'
            }`}
          />
          <span className="text-[10px] sm:text-[11px] font-mono font-black uppercase tracking-wider text-amber-300">
            Fase: <span className="text-white font-mono">{currentLanceName}</span>
          </span>
        </div>

        {/* Señas trigger */}
        <button
          onClick={onOpenSeñas}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-300 text-[10px] sm:text-[11px] font-mono font-black border border-amber-500/80 shadow-xs transition active:translate-x-0.5 active:translate-y-0.5"
          title="Enviar seña al compañero"
        >
          <span>🤫</span>
          <span>Señas</span>
        </button>
      </div>

      {/* When waiting for AI players */}
      {!isPlayerTurn && (
        <div className="py-2 px-2.5 rounded-xl bg-stone-900 border border-stone-800 text-center flex items-center justify-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
          <span className="text-[11px] sm:text-xs font-mono text-stone-300 font-bold truncate">
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
            className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-black text-xs tracking-wide shadow-md transition active:translate-x-0.5 active:translate-y-0.5 border border-black flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>🔄</span>
            <span>PEDIR MUS</span>
          </button>
          <button
            onClick={() => {
              sound.playEnvido();
              onAction('no_mus');
            }}
            className="flex-1 py-2 px-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-mono font-black text-xs tracking-wide shadow-md transition active:translate-x-0.5 active:translate-y-0.5 border border-black flex items-center justify-center gap-1.5 cursor-pointer"
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
            className={`w-full py-2 px-3 rounded-xl font-mono font-black text-xs tracking-wide shadow-md transition border border-black flex items-center justify-center gap-1.5 ${
              selectedCardCount > 0
                ? 'bg-amber-400 hover:bg-amber-300 text-stone-950 cursor-pointer active:translate-x-0.5 active:translate-y-0.5'
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {betState.currentBet === 0 ? (
              <>
                <button
                  onClick={() => {
                    sound.playCard();
                    onAction('paso');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-mono font-black text-xs sm:text-sm border-2 border-black transition active:translate-x-0.5 active:translate-y-0.5 shadow-[3px_3px_0px_#000]"
                >
                  Paso
                </button>
                <button
                  onClick={() => {
                    sound.playEnvido();
                    onAction('envido');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-black text-xs sm:text-sm border-2 border-black transition active:translate-x-0.5 active:translate-y-0.5 shadow-[3px_3px_0px_#000]"
                >
                  Envido (2)
                </button>
                <button
                  onClick={() => {
                    sound.playEnvido();
                    onAction('mas');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono font-black text-xs sm:text-sm border-2 border-black transition active:translate-x-0.5 active:translate-y-0.5 shadow-[3px_3px_0px_#000]"
                >
                  Envido (4)
                </button>
                <button
                  onClick={() => {
                    sound.playOrdago();
                    onAction('ordago');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono font-black text-xs sm:text-sm border-2 border-black transition active:translate-x-0.5 active:translate-y-0.5 shadow-[3px_3px_0px_#000] animate-pulse"
                >
                  ¡ÓRDAGO!
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    sound.playChip();
                    onAction('quiero');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-black text-xs sm:text-sm border-2 border-black transition active:translate-x-0.5 active:translate-y-0.5 shadow-[3px_3px_0px_#000]"
                >
                  ✓ Quiero ({betState.isOrdago ? 'Órdago' : betState.currentBet})
                </button>
                <button
                  onClick={() => {
                    sound.playCard();
                    onAction('no_quiero');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono font-black text-xs sm:text-sm border-2 border-black transition active:translate-x-0.5 active:translate-y-0.5 shadow-[3px_3px_0px_#000]"
                >
                  ✗ No Quiero
                </button>
                {!betState.isOrdago && (
                  <button
                    onClick={() => {
                      sound.playEnvido();
                      onAction('mas');
                    }}
                    className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono font-black text-xs sm:text-sm border-2 border-black transition active:translate-x-0.5 active:translate-y-0.5 shadow-[3px_3px_0px_#000]"
                  >
                    +2 Más ({betState.currentBet + 2})
                  </button>
                )}
                <button
                  onClick={() => {
                    sound.playOrdago();
                    onAction('ordago');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono font-black text-xs sm:text-sm border-2 border-black transition active:translate-x-0.5 active:translate-y-0.5 shadow-[3px_3px_0px_#000] animate-pulse"
                >
                  ¡ÓRDAGO!
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
