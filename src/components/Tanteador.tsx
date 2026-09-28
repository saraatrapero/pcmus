import React from 'react';
import { TeamScore } from '../types';

interface TanteadorProps {
  scoreTeam0: TeamScore;
  scoreTeam1: TeamScore;
  targetPiedras: number;
  manoTeam: 0 | 1;
  playerNames: {
    team0: string;
    team1: string;
  };
}

export const Tanteador: React.FC<TanteadorProps> = ({
  scoreTeam0,
  scoreTeam1,
  targetPiedras,
  manoTeam,
  playerNames,
}) => {
  const renderTokens = (piedras: number) => {
    const amarracos = Math.floor(piedras / 5);
    const sueltas = piedras % 5;

    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Amarracos (5 piedras each) */}
        {amarracos > 0 && (
          <div className="flex items-center gap-1 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
            <span className="text-xs text-amber-300 font-bold">x{amarracos}</span>
            <div className="flex gap-0.5">
              {[...Array(Math.min(amarracos, 8))].map((_, i) => (
                <div
                  key={`am_${i}`}
                  className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-700 shadow border border-amber-200"
                  title="Amarraco (5 piedras)"
                />
              ))}
            </div>
            <span className="text-[10px] text-amber-200/70 hidden sm:inline">Amarracos</span>
          </div>
        )}

        {/* Piedras sueltas (1 piedra each) */}
        {sueltas > 0 && (
          <div className="flex items-center gap-1 bg-stone-900/60 px-2 py-0.5 rounded border border-stone-600/40">
            <span className="text-xs text-stone-300 font-bold">x{sueltas}</span>
            <div className="flex gap-0.5">
              {[...Array(sueltas)].map((_, i) => (
                <div
                  key={`su_${i}`}
                  className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-stone-200 to-stone-400 shadow border border-stone-300"
                  title="Piedra suelta (1)"
                />
              ))}
            </div>
            <span className="text-[10px] text-stone-400 hidden sm:inline">Piedras</span>
          </div>
        )}

        {piedras === 0 && (
          <span className="text-xs italic text-stone-400">Sin piedras todavía</span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-stone-900/90 backdrop-blur border-2 border-amber-700/60 rounded-xl p-2.5 sm:p-3 shadow-xl text-stone-100 max-w-2xl mx-auto font-sans">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-stone-700 pb-1.5 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black tracking-wider uppercase text-amber-400 font-serif">
            TANTEADOR DE MUS
          </span>
          <span className="bg-amber-950 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-600/40">
            Meta: {targetPiedras} piedras (Juego)
          </span>
        </div>
        <div className="text-[11px] text-stone-400 flex items-center gap-2">
          <span>1 Amarraco = 5 Piedras</span>
        </div>
      </div>

      {/* Two team columns */}
      <div className="grid grid-cols-2 gap-3 divide-x divide-stone-700/80">
        {/* Team 0 (Nosotros) */}
        <div className="pr-1.5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-emerald-400 flex items-center gap-1">
                🟢 {playerNames.team0}
              </span>
              {manoTeam === 0 && (
                <span className="text-[9px] bg-amber-500 text-stone-950 font-black px-1.5 py-0.2 rounded-full uppercase">
                  MANO
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-amber-300 font-mono">
                {scoreTeam0.piedras}
              </span>
              <span className="text-xs text-stone-400">/{targetPiedras}</span>
            </div>
          </div>

          <div className="mb-1">{renderTokens(scoreTeam0.piedras)}</div>

          <div className="flex items-center justify-between text-[11px] text-stone-400 border-t border-stone-800 pt-1">
            <span>Juegos ganados:</span>
            <span className="font-bold text-emerald-400">🏆 {scoreTeam0.juegosWon}</span>
          </div>
        </div>

        {/* Team 1 (Ellos) */}
        <div className="pl-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-rose-400 flex items-center gap-1">
                🔴 {playerNames.team1}
              </span>
              {manoTeam === 1 && (
                <span className="text-[9px] bg-amber-500 text-stone-950 font-black px-1.5 py-0.2 rounded-full uppercase">
                  MANO
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-amber-300 font-mono">
                {scoreTeam1.piedras}
              </span>
              <span className="text-xs text-stone-400">/{targetPiedras}</span>
            </div>
          </div>

          <div className="mb-1">{renderTokens(scoreTeam1.piedras)}</div>

          <div className="flex items-center justify-between text-[11px] text-stone-400 border-t border-stone-800 pt-1">
            <span>Juegos ganados:</span>
            <span className="font-bold text-rose-400">🏆 {scoreTeam1.juegosWon}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
