import React, { useState } from 'react';
import { Card, Seña } from '../types';
import { SEÑAS } from '../musLogic';
import { sound } from '../sound';

interface SeñasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendSeña: (seña: Seña, isTruthful: boolean) => void;
  playerCards: Card[];
}

export const SeñasModal: React.FC<SeñasModalProps> = ({
  isOpen,
  onClose,
  onSendSeña,
  playerCards,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 border-2 border-amber-600 rounded-2xl max-w-lg w-full p-5 shadow-2xl text-stone-100 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-stone-700 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤫</span>
            <div>
              <h3 className="font-serif font-black text-lg text-amber-400">
                ECHAR SEÑA AL COMPAÑERO
              </h3>
              <p className="text-xs text-stone-400">
                Código secreto tradicional del Mus. ¡Cuidado, los rivales pueden pillarte!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white text-lg font-bold px-2 py-1 rounded bg-stone-800"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto space-y-2 pr-1 my-1">
          {SEÑAS.map((seña) => {
            const hasCondition = seña.ruleCheck(playerCards);

            return (
              <div
                key={seña.id}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  hasCondition
                    ? 'bg-amber-950/40 border-amber-500/60 hover:bg-amber-900/50'
                    : 'bg-stone-800/60 border-stone-700 hover:bg-stone-800'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-100 text-sm">{seña.name}</span>
                    {hasCondition ? (
                      <span className="bg-emerald-600/90 text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                        ✓ TIENES LA JUGADA
                      </span>
                    ) : (
                      <span className="bg-amber-700/60 text-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        FAROL (NO LA TIENES)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-amber-300/90 mt-0.5 font-medium">
                    Gesto: {seña.gesture}
                  </div>
                  <div className="text-[11px] text-stone-400">Significa: {seña.meaning}</div>
                </div>

                <button
                  onClick={() => {
                    sound.playSeña();
                    onSendSeña(seña, hasCondition);
                    onClose();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow ${
                    hasCondition
                      ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                      : 'bg-stone-700 hover:bg-stone-600 text-stone-200'
                  }`}
                >
                  Hacer Gesto
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-stone-800 text-[11px] text-stone-400 bg-stone-950/60 p-2.5 rounded-lg">
          💡 <strong className="text-amber-400">Regla de PC Mus:</strong> En el mus las señas
          están permitidas por reglamento, pero si las haces muy obvias, el rival puede decir{' '}
          <em>«¡Te he pillado la seña!»</em> y adivinar tu jugada para contraatacar.
        </div>
      </div>
    </div>
  );
};
