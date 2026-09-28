import React from 'react';
import confetti from 'canvas-confetti';
import { TournamentMatch } from '../types';
import { sound } from '../sound';

interface TournamentBracketProps {
  currentRoundIndex: number; // 0: Cuartos, 1: Semis, 2: Final, 3: Won Tournament
  matches: TournamentMatch[];
  onContinueMatch: () => void;
  onResetTournament: () => void;
}

export const TournamentBracket: React.FC<TournamentBracketProps> = ({
  currentRoundIndex,
  matches,
  onContinueMatch,
  onResetTournament,
}) => {
  const isChampion = currentRoundIndex >= 3;

  React.useEffect(() => {
    if (isChampion) {
      sound.playVictory();
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
      });
    }
  }, [isChampion]);

  return (
    <div className="bg-stone-900 border-2 border-amber-600 rounded-3xl p-6 max-w-3xl mx-auto shadow-2xl text-stone-100 my-4">
      {/* Title */}
      <div className="text-center mb-6">
        <span className="text-xs uppercase tracking-widest font-black text-amber-400 font-serif">
          GRAN TORNEO NACIONAL DE MUS 1996
        </span>
        <h2 className="text-2xl sm:text-3xl font-black font-serif text-amber-200 mt-1">
          {isChampion ? '🏆 ¡¡CAMPEONES DEL TORNEO!! 🏆' : 'Cuadro de Eliminatorias (3 Rondas)'}
        </h2>
        <p className="text-xs text-stone-400 mt-1">
          Avanza derrotando a las parejas de la farándula española para ganar el trofeo Círculo ASM.
        </p>
      </div>

      {/* 3-Round Bracket Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {matches.map((match, idx) => {
          const isDone = idx < currentRoundIndex;
          const isCurrent = idx === currentRoundIndex;
          const isPending = idx > currentRoundIndex;

          return (
            <div
              key={match.roundName}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                isCurrent
                  ? 'bg-amber-950/60 border-amber-400 shadow-xl ring-2 ring-amber-400/40 scale-102'
                  : isDone
                  ? 'bg-emerald-950/40 border-emerald-600/70 opacity-90'
                  : 'bg-stone-950/40 border-stone-800 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase text-amber-300 font-serif">
                    Ronda {idx + 1}
                  </span>
                  {isDone && (
                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ✓ SUPERADA
                    </span>
                  )}
                  {isCurrent && (
                    <span className="bg-amber-500 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                      EN JUEGO
                    </span>
                  )}
                  {isPending && (
                    <span className="bg-stone-800 text-stone-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      BLOQUEADO
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base text-stone-100 font-serif">{match.roundName}</h3>

                <div className="mt-3 p-2.5 rounded-xl bg-black/40 border border-stone-800 text-xs space-y-1">
                  <div className="text-stone-400 font-medium">Rivales a batir:</div>
                  <div className="font-bold text-amber-200">
                    🔴 {match.rivals[0]} & {match.rivals[1]}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-800 text-[11px] text-stone-400">
                {isDone ? '¡Derrotados contundentemente!' : isCurrent ? 'Tu próxima partida eliminatoria.' : 'Esperando rival en la ronda.'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Button */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {isChampion ? (
          <button
            onClick={onResetTournament}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-sm tracking-wide shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
          >
            <span>🏆</span>
            <span>Jugar Otro Torneo</span>
          </button>
        ) : (
          <button
            onClick={onContinueMatch}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm tracking-wide shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
          >
            <span>⚔️</span>
            <span>Comenzar {matches[currentRoundIndex]?.roundName}</span>
          </button>
        )}
      </div>
    </div>
  );
};
