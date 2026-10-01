import React from 'react';
import { LancePhase, LanceBetState } from '../types';
import { sound } from '../sound';

interface ControlsProps {
  isPlayerTurn: boolean;
  phase: LancePhase;
  currentLanceName: string;
  betState: LanceBetState;
  selectedCardCount: number;
  onAction: (action: 'mus' | 'no_mus' | 'discard' | 'paso' | 'envido' | 'mas' | 'ordago' | 'quiero' | 'no_quiero') => void;
  onOpenSeñas: () => void;
  waitingMessage?: string | null;
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
}) => {
  const isMusQuestion = phase === 'mus_dialog';
  const isDiscarding = phase === 'discarding';
  const isBetting =
    phase === 'grande' ||
    phase === 'chica' ||
    phase === 'pares_bet' ||
    phase === 'juego_bet' ||
    phase === 'punto_bet';

  return (
    <div className="relative bg-gradient-to-b from-[#2a1709] to-[#160c05] border border-brass-500/60 rounded-2xl p-2.5 sm:p-3 shadow-[0_10px_30px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(243,214,140,0.15)] text-stone-100 max-w-2xl w-full mx-auto my-1">
      {/* Turn indicator / status header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-1.5 mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full border border-black animate-pulse ${
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
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-brass-300 text-sm font-mono font-bold border border-brass-500/70 shadow-[0_2px_0_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] transition active:translate-y-0.5 hover:-translate-y-px"
          title="Enviar seña al compañero"
        >
          <span>🤫</span>
          <span>Echar Seña</span>
        </button>
      </div>

      {/* When waiting for AI players */}
      {!isPlayerTurn && (
        <div className="py-2.5 px-4 rounded-xl bg-black/30 border border-stone-800 text-center flex items-center justify-center gap-3">
          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-mono text-stone-300 font-semibold">
            {waitingMessage || 'Esperando las jugadas de los rivales y compañero...'}
          </span>
        </div>
      )}

      {/* Mus Question Phase */}
      {isPlayerTurn && isMusQuestion && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              sound.playCard();
              onAction('mus');
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white font-mono font-extrabold uppercase text-base tracking-wide shadow-[0_3px_0_rgba(0,0,0,0.55),0_6px_14px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)] transition active:translate-y-0.5 hover:-translate-y-px border border-black/50 flex items-center justify-center gap-2"
          >
            <span>🔄</span>
            <span>PEDIR MUS (Descartes)</span>
          </button>
          <button
            onClick={() => {
              sound.playEnvido();
              onAction('no_mus');
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-b from-rose-600 to-rose-800 hover:from-rose-500 hover:to-rose-700 text-white font-mono font-extrabold uppercase text-base tracking-wide shadow-[0_3px_0_rgba(0,0,0,0.55),0_6px_14px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)] transition active:translate-y-0.5 hover:-translate-y-px border border-black/50 flex items-center justify-center gap-2"
          >
            <span>⛔</span>
            <span>NO HAY MUS (Cortar)</span>
          </button>
        </div>
      )}

      {/* Discard Phase (Art. IV, Punto 2: mínimo 1 descarte obligatorio) */}
      {isPlayerTurn && isDiscarding && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="text-xs font-mono font-bold text-amber-200 flex-1 text-center sm:text-left">
            Selecciona las cartas a cambiar ({selectedCardCount} elegidas).{' '}
            <span className="text-amber-400 font-serif italic block sm:inline">
              (Reglamento Bizkaia: Mínimo 1 descarte obligatorio)
            </span>
          </div>
          <button
            disabled={selectedCardCount === 0}
            onClick={() => {
              if (selectedCardCount === 0) return;
              sound.playCard();
              onAction('discard');
            }}
            className={`w-full sm:w-auto py-2.5 px-6 rounded-xl font-mono font-extrabold uppercase text-base tracking-wide shadow-[0_3px_0_rgba(0,0,0,0.55),0_6px_14px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)] transition border border-black/50 flex items-center justify-center gap-2 ${
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

      {/* Betting Phase */}
      {isPlayerTurn && isBetting && (
        <div className="space-y-2.5">
          {/* Bet status notice */}
          {betState.currentBet > 0 && (
            <div className="bg-amber-950/90 border-2 border-amber-500 px-3 py-1.5 rounded-lg flex items-center justify-between text-xs font-mono font-bold text-amber-200">
              <span>
                {betState.isOrdago
                  ? '⚡ ¡HAN CANTADO ÓRDAGO! ¿Aceptas jugarte el juego entero?'
                  : `Apuesta sobre la mesa: ${betState.currentBet} piedras.`}
              </span>
              <span className="font-black text-white">Tu decisión:</span>
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
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-b from-stone-600 to-stone-800 hover:from-stone-500 hover:to-stone-700 text-stone-100 font-mono font-extrabold uppercase tracking-wide text-sm sm:text-base border border-black/50 transition active:translate-y-0.5 hover:-translate-y-px shadow-[0_3px_0_rgba(0,0,0,0.55),0_6px_14px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)]"
                >
                  Paso
                </button>
                <button
                  onClick={() => {
                    sound.playEnvido();
                    onAction('envido');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-b from-sky-600 to-blue-800 hover:from-sky-500 hover:to-blue-700 text-white font-mono font-extrabold uppercase tracking-wide text-sm sm:text-base border border-black/50 transition active:translate-y-0.5 hover:-translate-y-px shadow-[0_3px_0_rgba(0,0,0,0.55),0_6px_14px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)]"
                >
                  Envido (2)
                </button>
                <button
                  onClick={() => {
                    sound.playEnvido();
                    onAction('mas');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-b from-brass-400 to-brass-600 hover:from-brass-300 hover:to-brass-500 text-stone-950 font-mono font-extrabold uppercase tracking-wide text-sm sm:text-base border border-black/50 transition active:translate-y-0.5 hover:-translate-y-px shadow-[0_3px_0_rgba(0,0,0,0.55),0_6px_14px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)]"
                >
                  Envido (4)
                </button>
                <button
                  onClick={() => {
                    sound.playOrdago();
                    onAction('ordago');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-b from-red-500 to-red-800 hover:from-red-400 hover:to-red-700 text-white font-mono font-extrabold uppercase tracking-wide text-sm sm:text-base border border-black/50 transition active:translate-y-0.5 hover:-translate-y-px shadow-[0_3px_0_rgba(0,0,0,0.55),0_6px_14px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)] animate-pulse"
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
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white font-mono font-extrabold uppercase tracking-wide text-sm sm:text-base border border-black/50 transition active:translate-y-0.5 hover:-translate-y-px shadow-[0_3px_0_rgba(0,0,0,0.55),0_6px_14px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)]"
                >
                  ✓ Quiero ({betState.isOrdago ? 'Órdago' : betState.currentBet})
                </button>
                <button
                  onClick={() => {
                    sound.playCard();
                    onAction('no_quiero');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-b from-stone-600 to-stone-800 hover:from-stone-500 hover:to-stone-700 text-stone-100 font-mono font-extrabold uppercase tracking-wide text-sm sm:text-base border border-black/50 transition active:translate-y-0.5 hover:-translate-y-px shadow-[0_3px_0_rgba(0,0,0,0.55),0_6px_14px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)]"
                >
                  ✗ No Quiero
                </button>
                {!betState.isOrdago && (
                  <button
                    onClick={() => {
                      sound.playEnvido();
                      onAction('mas');
                    }}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-b from-brass-400 to-brass-600 hover:from-brass-300 hover:to-brass-500 text-stone-950 font-mono font-extrabold uppercase tracking-wide text-sm sm:text-base border border-black/50 transition active:translate-y-0.5 hover:-translate-y-px shadow-[0_3px_0_rgba(0,0,0,0.55),0_6px_14px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)]"
                  >
                    +2 Más ({betState.currentBet + 2})
                  </button>
                )}
                <button
                  onClick={() => {
                    sound.playOrdago();
                    onAction('ordago');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-b from-red-500 to-red-800 hover:from-red-400 hover:to-red-700 text-white font-mono font-extrabold uppercase tracking-wide text-sm sm:text-base border border-black/50 transition active:translate-y-0.5 hover:-translate-y-px shadow-[0_3px_0_rgba(0,0,0,0.55),0_6px_14px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.22)] animate-pulse"
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
