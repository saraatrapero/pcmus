import React, { useState } from 'react';
import { Card, Seña } from '../types';
import { SEÑAS } from '../musLogic';
import { sound } from '../sound';

interface SeñasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendSeña: (seña: Seña, isTruthful: boolean) => void;
  playerCards: Card[];
  isFirstHand?: boolean;
  isMusCut?: boolean;
}

export const SeñasModal: React.FC<SeñasModalProps> = ({
  isOpen,
  onClose,
  onSendSeña,
  playerCards,
  isFirstHand = false,
  isMusCut = true,
}) => {
  if (!isOpen) return null;

  const isBlockedFirstHand = isFirstHand && !isMusCut;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-stone-900 border-2 border-amber-600 rounded-2xl max-w-lg w-full p-5 shadow-2xl text-stone-100 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-stone-700 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤫</span>
            <div>
              <h3 className="font-serif font-black text-lg text-amber-400">
                SEÑAS OFICIALES (EUSKADI / BIZKAIA)
              </h3>
              <p className="text-xs text-stone-400">
                Reglamento del Torneo de Txapeldunes • «La boca hace ley, nunca se puede mentir»
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

        {isBlockedFirstHand && (
          <div className="bg-amber-950/70 border border-amber-500/70 p-3 rounded-xl mb-3 text-xs text-amber-200">
            ⚠️ <strong>Artículo II, Punto 2:</strong> En la primera mano de la partida arranca con{' '}
            <em>«Mus corrido y sin señas»</em>. No se pueden pasar señas hasta que un jugador corte el Mus.
          </div>
        )}

        <div className="overflow-y-auto space-y-2 pr-1 my-1">
          {SEÑAS.map((seña) => {
            const hasCondition = seña.ruleCheck(playerCards);

            return (
              <div
                key={seña.id}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  hasCondition
                    ? 'bg-amber-950/40 border-amber-500/60 hover:bg-amber-900/50'
                    : 'bg-stone-800/40 border-stone-800 opacity-60'
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
                      <span className="bg-stone-800 text-stone-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-stone-700">
                        SIN JUGADA
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-amber-300/90 mt-0.5 font-medium">
                    Gesto: {seña.gesture}
                  </div>
                  <div className="text-[11px] text-stone-400">Significa: {seña.meaning}</div>
                </div>

                {hasCondition && !isBlockedFirstHand ? (
                  <button
                    onClick={() => {
                      sound.playSeña();
                      onSendSeña(seña, true);
                      onClose();
                    }}
                    className="px-3.5 py-2 rounded-lg text-xs font-bold transition shadow bg-amber-500 hover:bg-amber-400 text-stone-950 shrink-0 cursor-pointer active:scale-95"
                  >
                    Pasar Seña
                  </button>
                ) : (
                  <span className="text-[10px] text-stone-500 font-mono italic text-right max-w-[110px] shrink-0">
                    {isBlockedFirstHand
                      ? 'Bloqueado (1ª mano)'
                      : 'Prohibida (La boca hace ley)'}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-stone-800 text-[11px] text-stone-300 bg-stone-950/90 p-2.5 rounded-lg space-y-1">
          <div>
            ⚖️ <strong className="text-amber-300">Artículo II, Punto 3:</strong> La seña es la expresión
            seria y veraz del Mus. Tendrá que ser siempre fidedigna de las cartas que se llevan (prohibido
            mentir o pasar señas parciales).
          </div>
          <div>
            👁️ <strong className="text-stone-400">Riesgo:</strong> Al igual que en la mesa, si un rival
            capta tu gesto, advertirá tu jugada y contraatacará.
          </div>
        </div>
      </div>
    </div>
  );
};
