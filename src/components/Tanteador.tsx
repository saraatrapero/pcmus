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
      <div className="flex items-center gap-1.5 flex-nowrap">
        {/* Amarracos (5 piedras each) */}
        {amarracos > 0 && (
          <div className="flex items-center gap-1 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/50">
            <span className="text-xs text-amber-300 font-bold font-mono">x{amarracos}</span>
            <div className="flex gap-0.5">
              {[...Array(Math.min(amarracos, 8))].map((_, i) => (
                <div
                  key={`am_${i}`}
                  className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-700 shadow border border-amber-200"
                  title="Amarraco (5 piedras)"
                />
              ))}
            </div>
            <span className="text-[9px] text-amber-200/80 font-mono hidden md:inline">Am.</span>
          </div>
        )}

        {/* Piedras sueltas (1 piedra each) */}
        {sueltas > 0 && (
          <div className="flex items-center gap-1 bg-stone-900/80 px-2 py-0.5 rounded border border-stone-600/50">
            <span className="text-xs text-stone-300 font-bold font-mono">x{sueltas}</span>
            <div className="flex gap-0.5">
              {[...Array(sueltas)].map((_, i) => (
                <div
                  key={`su_${i}`}
                  className="w-3 h-3 rounded-full bg-gradient-to-br from-stone-200 to-stone-400 shadow border border-stone-300"
                  title="Piedra suelta (1)"
                />
              ))}
            </div>
          </div>
        )}

        {piedras === 0 && (
          <span className="text-[10px] text-stone-500 font-mono italic">0 piedras</span>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-stone-950 border-2 border-amber-700/60 rounded-2xl px-3 py-1.5 shadow-xl text-stone-100 font-sans mb-1 flex flex-col sm:flex-row items-center justify-between gap-2">
      {/* Team 0 (Nosotros) */}
      <div className="flex items-center gap-2.5 flex-1 justify-start">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm" />
          <span className="font-serif font-black text-xs sm:text-sm text-emerald-300 truncate max-w-[130px] sm:max-w-[180px]">
            {playerNames.team0}
          </span>
          {manoTeam === 0 && (
            <span className="text-[8px] bg-amber-400 text-stone-950 font-mono font-black px-1.5 py-0.2 rounded-full uppercase shadow-xs">
              MANO
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-1 bg-stone-900 px-2 py-0.5 rounded-lg border border-emerald-500/40">
          <span className="text-base sm:text-lg font-black text-amber-300 font-mono">
            {scoreTeam0.piedras}
          </span>
          <span className="text-[10px] text-stone-400 font-mono">/{targetPiedras}</span>
        </div>

        {renderTokens(scoreTeam0.piedras)}

        <span className="text-[10px] text-emerald-400 font-mono font-bold hidden lg:inline">
          🏆 {scoreTeam0.juegosWon}
        </span>
      </div>

      {/* Center Target Pill */}
      <div className="shrink-0 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-600/50 text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1.5 shadow">
        <span>TANTEADOR</span>
        <span className="text-stone-400">•</span>
        <span>Meta: {targetPiedras} p.</span>
      </div>

      {/* Team 1 (Ellos) */}
      <div className="flex items-center gap-2.5 flex-1 justify-end">
        <span className="text-[10px] text-rose-400 font-mono font-bold hidden lg:inline">
          🏆 {scoreTeam1.juegosWon}
        </span>

        {renderTokens(scoreTeam1.piedras)}

        <div className="flex items-baseline gap-1 bg-stone-900 px-2 py-0.5 rounded-lg border border-rose-500/40">
          <span className="text-base sm:text-lg font-black text-amber-300 font-mono">
            {scoreTeam1.piedras}
          </span>
          <span className="text-[10px] text-stone-400 font-mono">/{targetPiedras}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {manoTeam === 1 && (
            <span className="text-[8px] bg-amber-400 text-stone-950 font-mono font-black px-1.5 py-0.2 rounded-full uppercase shadow-xs">
              MANO
            </span>
          )}
          <span className="font-serif font-black text-xs sm:text-sm text-rose-300 truncate max-w-[130px] sm:max-w-[180px]">
            {playerNames.team1}
          </span>
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
        </div>
      </div>
    </div>
  );
};
