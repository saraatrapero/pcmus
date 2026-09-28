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
    <div className="bg-stone-950/95 border-4 border-amber-600 rounded-2xl p-3 sm:p-4 shadow-[6px_6px_0px_#000] text-stone-100 max-w-2xl mx-auto backdrop-blur-md">
      {/* Turn indicator / status header */}
      <div className="flex items-center justify-between border-b-2 border-stone-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full border border-black animate-pulse ${
              isPlayerTurn ? 'bg-emerald-400' : 'bg-amber-500'
            }`}
          />
          <span className="text-xs font-mono font-black uppercase tracking-wider text-amber-300">
            Fase: <span className="text-white font-mono">{currentLanceName}</span>
          </span>
        </div>

        {/* Señas trigger */}
        <button
          onClick={onOpenSeñas}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-mono font-black border-2 border-amber-500 shadow-[2px_2px_0px_#000] transition active:translate-x-0.5 active:translate-y-0.5"
          title="Enviar seña al compañero"
        >
          <span>🤫</span>
          <span>Echar Seña</span>
        </button>
      </div>

      {/* When waiting for AI players */}
      {!isPlayerTurn && (
        <div className="py-2.5 px-4 rounded-xl bg-stone-900 border-2 border-stone-800 text-center flex items-center justify-center gap-3">
          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs sm:text-sm font-mono text-stone-300 font-bold">
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
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-black text-sm tracking-wide shadow-[3px_3px_0px_#000] transition active:translate-x-0.5 active:translate-y-0.5 border-2 border-black flex items-center justify-center gap-2"
          >
            <span>🔄</span>
            <span>PEDIR MUS (Descartes)</span>
          </button>
          <button
            onClick={() => {
              sound.playEnvido();
              onAction('no_mus');
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-mono font-black text-sm tracking-wide shadow-[3px_3px_0px_#000] transition active:translate-x-0.5 active:translate-y-0.5 border-2 border-black flex items-center justify-center gap-2"
          >
            <span>⛔</span>
            <span>NO HAY MUS (Cortar)</span>
          </button>
        </div>
      )}

      {/* Discard Phase */}
      {isPlayerTurn && isDiscarding && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="text-xs font-mono font-bold text-amber-200 flex-1 text-center sm:text-left">
            Haz clic sobre las cartas de tu mano que quieras cambiar ({selectedCardCount} seleccionadas).
          </div>
          <button
            onClick={() => {
              sound.playCard();
              onAction('discard');
            }}
            className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono font-black text-sm tracking-wide shadow-[3px_3px_0px_#000] transition active:translate-x-0.5 active:translate-y-0.5 border-2 border-black flex items-center justify-center gap-2"
          >
            <span>🔀</span>
            <span>
              {selectedCardCount === 0
                ? 'No cambiar ninguna'
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
