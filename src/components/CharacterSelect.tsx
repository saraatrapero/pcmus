import React, { useState } from 'react';
import { PC_MUS_CHARACTERS, CharacterInfo } from '../characters';
import { GameMode } from '../types';
import { sound } from '../sound';
import { voiceEngine } from '../voiceEngine';
import { CharacterAvatar } from './CharacterAvatar';
import { userProfileEngine } from '../userProfileEngine';

interface CharacterSelectProps {
  onStartGame: (
    playerChar: CharacterInfo,
    partnerChar: CharacterInfo,
    rivalChars: [CharacterInfo, CharacterInfo],
    mode: GameMode,
    targetPiedras: number
  ) => void;
  onOpenMultiplayer: () => void;
  onOpenTutorial: () => void;
  onOpenUserControl?: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  onStartGame,
  onOpenMultiplayer,
  onOpenTutorial,
  onOpenUserControl,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('tio_gil');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('el_marques');
  const [gameMode, setGameMode] = useState<GameMode>('torneo');
  const [targetPiedras, setTargetPiedras] = useState<number>(40);

  const activeUser = userProfileEngine.getActiveUser();
  const tactical = userProfileEngine.analyzeUser(activeUser);

  const playerChar = PC_MUS_CHARACTERS.find((c) => c.id === selectedPlayerId)!;
  const partnerChar = PC_MUS_CHARACTERS.find((c) => c.id === selectedPartnerId)!;

  const handleStart = () => {
    sound.playVictory();
    // Pick two other characters as initial rivals
    const remaining = PC_MUS_CHARACTERS.filter(
      (c) => c.id !== selectedPlayerId && c.id !== selectedPartnerId
    );
    // Shuffle remaining to pick 2 rivals
    const shuffled = [...remaining].sort(() => 0.5 - Math.random());
    const rival1 = shuffled[0] || PC_MUS_CHARACTERS[2];
    const rival2 = shuffled[1] || PC_MUS_CHARACTERS[3];

    onStartGame(playerChar, partnerChar, [rival1, rival2], gameMode, targetPiedras);
  };

  return (
    <div className="max-w-5xl mx-auto my-4 p-4 sm:p-6 bg-stone-900 border-2 border-amber-600 rounded-3xl shadow-2xl text-stone-100 font-sans">
      {/* MS-DOS 1996 Header */}
      <div className="text-center border-b border-stone-800 pb-5 mb-5">
        <div className="inline-block px-3 py-1 bg-amber-950 border border-amber-600 text-amber-300 font-mono text-xs font-bold rounded mb-2 tracking-widest">
          CÍRCULO ASM & LIT • MS-DOS 1996
        </div>
        <h1 className="text-4xl sm:text-6xl font-black font-display tracking-[0.12em] bg-gradient-to-b from-brass-300 via-brass-400 to-brass-600 bg-clip-text text-transparent drop-shadow-[0_3px_0_rgba(0,0,0,0.55)]">
          PC MUS
        </h1>
        <p className="text-sm sm:text-base text-stone-300/90 mt-1 max-w-xl mx-auto font-serif italic">
          El legendario simulador de mus español con los personajes de la farándula de los 90.
        </p>

        {/* User Profile & AI Intelligence Bar */}
        {onOpenUserControl && (
          <div className="mt-3.5 inline-flex flex-col sm:flex-row items-center gap-3 px-4 py-2 rounded-2xl bg-stone-950 border-2 border-amber-500/70 shadow-lg text-left">
            <div className="flex items-center gap-2.5">
              <CharacterAvatar characterId={activeUser.avatarId} characterName={activeUser.name} size="sm" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-stone-400">JUGADOR ACTIVO:</span>
                  <span className="font-serif font-black text-amber-300 text-sm">{activeUser.name}</span>
                  <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-amber-400 text-stone-950">
                    {tactical.archetype}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-stone-300">
                  La IA ha aprendido tu juego: Agresividad {tactical.aggressiveness}% • Riesgo {tactical.riskTolerance}%
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenUserControl}
              className="sm:ml-3 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono font-black text-xs shadow transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              👤 Control de Usuarios & IA
            </button>
          </div>
        )}

        {/* Quick Launch Action Cards for Multiplayer, Tutorial, and Mesa Tradicional */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 max-w-4xl mx-auto">
          <button
            onClick={() => {
              sound.playVictory();
              onOpenMultiplayer();
            }}
            className="p-3 bg-gradient-to-r from-blue-950/80 to-indigo-950/80 hover:from-blue-900 hover:to-indigo-900 border-2 border-blue-500/50 hover:border-blue-400 rounded-2xl text-left transition transform hover:-translate-y-0.5 shadow-lg group flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl p-1.5 bg-blue-900/50 rounded-xl border border-blue-500/40">
                🌐
              </span>
              <div>
                <div className="font-serif font-black text-xs sm:text-sm text-blue-300 group-hover:text-blue-200">
                  Multijugador Online
                </div>
                <div className="text-[10px] text-stone-300">
                  Salas públicas y privadas
                </div>
              </div>
            </div>
            <span className="text-blue-400 font-bold text-xs font-mono group-hover:translate-x-1 transition">
              →
            </span>
          </button>

          <button
            onClick={() => {
              sound.playBread();
              setSelectedPlayerId('don_julian');
              setSelectedPartnerId('camarero_navarra');
              voiceEngine.speakCharacter('don_julian', '¡Con pan y vino se anda el camino, y con cuatro reyes se gana el juego!');
            }}
            className="p-3 bg-gradient-to-r from-amber-950 to-orange-950 hover:from-amber-900 hover:to-orange-900 border-2 border-amber-400 rounded-2xl text-left transition transform hover:-translate-y-0.5 shadow-xl group flex items-center justify-between ring-1 ring-amber-400/50"
            title="Elegir a la gente tradicional: Don Julián y Patxi el Camarero de Navarra"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl p-1.5 bg-amber-900/60 rounded-xl border border-amber-500/60">
                🥖
              </span>
              <div>
                <div className="font-serif font-black text-xs sm:text-sm text-amber-300 group-hover:text-amber-200 flex items-center gap-1">
                  <span>Mesa Tradicional</span>
                  <span className="text-[9px] bg-amber-500 text-stone-950 font-mono px-1 rounded font-bold">
                    NOCHE
                  </span>
                </div>
                <div className="text-[10px] text-amber-200/90 font-mono">
                  Don Julián, Patxi, Números y Pan
                </div>
              </div>
            </div>
            <span className="text-amber-300 font-bold text-xs font-mono group-hover:translate-x-1 transition">
              Elegir
            </span>
          </button>

          <button
            onClick={() => {
              sound.playVictory();
              onOpenTutorial();
            }}
            className="p-3 bg-gradient-to-r from-stone-900 to-amber-950/60 hover:from-stone-850 hover:to-amber-900/80 border-2 border-stone-700 hover:border-amber-500/50 rounded-2xl text-left transition transform hover:-translate-y-0.5 shadow-lg group flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl p-1.5 bg-stone-800/80 rounded-xl border border-stone-600">
                🎓
              </span>
              <div>
                <div className="font-serif font-black text-xs sm:text-sm text-amber-300 group-hover:text-amber-200">
                  Tutorial Interactivo
                </div>
                <div className="text-[10px] text-stone-300">
                  Reglas, lances y señas
                </div>
              </div>
            </div>
            <span className="text-amber-400 font-bold text-xs font-mono group-hover:translate-x-1 transition">
              →
            </span>
          </button>
        </div>
      </div>

      {/* Mode selection toggle */}
      <div className="bg-stone-950/80 p-4 rounded-2xl border border-stone-800 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold uppercase text-stone-400 font-serif">
            Modo de Juego:
          </span>
          <div className="flex bg-stone-900 p-1 rounded-xl border border-stone-700 flex-1 sm:flex-initial">
            <button
              onClick={() => setGameMode('torneo')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                gameMode === 'torneo'
                  ? 'bg-amber-500 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              🏆 Torneo (3 Rondas)
            </button>
            <button
              onClick={() => setGameMode('partida')}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                gameMode === 'partida'
                  ? 'bg-amber-500 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              🃏 Partida Rápida
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-xs font-bold uppercase text-stone-400 font-serif">
            Meta del Juego:
          </span>
          <div className="flex bg-stone-900 p-1 rounded-xl border border-stone-700">
            <button
              onClick={() => setTargetPiedras(40)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                targetPiedras === 40
                  ? 'bg-amber-500 text-stone-950'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              40 Piedras (8 Amarracos)
            </button>
            <button
              onClick={() => setTargetPiedras(30)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                targetPiedras === 30
                  ? 'bg-amber-500 text-stone-950'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              30 Piedras (6 Amarracos)
            </button>
          </div>
        </div>
      </div>

      {/* Characters selection grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Step 1: Choose Your Character */}
        <div className="bg-stone-950/60 p-4 rounded-2xl border border-stone-800">
          <div className="flex items-center justify-between mb-3 border-b border-stone-800 pb-2">
            <span className="text-xs font-black uppercase text-amber-400 font-serif">
              1. Elige tu Personaje (Sur)
            </span>
            <span className="text-xs text-emerald-400 font-bold">
              Seleccionado: {playerChar.name}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {PC_MUS_CHARACTERS.map((char) => {
              const isSelected = char.id === selectedPlayerId;
              const isPartner = char.id === selectedPartnerId;

              return (
                <button
                  key={char.id}
                  disabled={isPartner}
                  onClick={() => {
                    sound.playCard();
                    setSelectedPlayerId(char.id);
                    voiceEngine.speakCharacter(char.id, char.presentation);
                  }}
                  className={`p-2 rounded-xl border text-left flex flex-col items-center transition relative ${
                    isSelected
                      ? 'bg-amber-950 border-amber-400 ring-2 ring-amber-400 shadow-lg'
                      : isPartner
                      ? 'opacity-30 cursor-not-allowed border-stone-800 bg-stone-900'
                      : 'bg-stone-900 border-stone-800 hover:border-amber-600/70 hover:bg-stone-850'
                  }`}
                >
                  <CharacterAvatar
                    characterId={char.id}
                    characterName={char.name}
                    size="sm"
                    className="mb-1"
                  />
                  <span className="font-bold text-xs text-stone-200 text-center truncate w-full font-serif">
                    {char.name}
                  </span>
                  <span className="text-[9px] text-amber-300 font-mono italic truncate w-full text-center">
                    "{char.visual.tag}"
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected character bio card */}
          <div className="p-3 rounded-xl bg-stone-900/80 border border-amber-500/30 text-xs flex gap-3 items-start">
            <CharacterAvatar
              characterId={playerChar.id}
              characterName={playerChar.name}
              size="md"
              canTestVoice
              className="shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between font-bold text-amber-300 mb-1">
                <span>{playerChar.name} ({playerChar.realName})</span>
                <span className="text-[10px] text-stone-400 font-normal">{playerChar.role}</span>
              </div>
              <div className="italic text-yellow-200/90 font-serif mb-1">
                "{playerChar.presentation}"
              </div>
              <p className="text-stone-300 leading-relaxed text-[11px] mb-2">{playerChar.description}</p>
              <button
                onClick={() => voiceEngine.testVoice(playerChar.id)}
                className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 transition"
              >
                <span>🔊</span>
                <span>Escuchar voz de {playerChar.name}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Step 2: Choose Your Partner */}
        <div className="bg-stone-950/60 p-4 rounded-2xl border border-stone-800">
          <div className="flex items-center justify-between mb-3 border-b border-stone-800 pb-2">
            <span className="text-xs font-black uppercase text-amber-400 font-serif">
              2. Elige tu Compañero de Equipo (Norte)
            </span>
            <span className="text-xs text-emerald-400 font-bold">
              Seleccionado: {partnerChar.name}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {PC_MUS_CHARACTERS.map((char) => {
              const isSelected = char.id === selectedPartnerId;
              const isPlayer = char.id === selectedPlayerId;

              return (
                <button
                  key={char.id}
                  disabled={isPlayer}
                  onClick={() => {
                    sound.playCard();
                    setSelectedPartnerId(char.id);
                    voiceEngine.speakCharacter(char.id, char.presentation);
                  }}
                  className={`p-2 rounded-xl border text-left flex flex-col items-center transition relative ${
                    isSelected
                      ? 'bg-amber-950 border-amber-400 ring-2 ring-amber-400 shadow-lg'
                      : isPlayer
                      ? 'opacity-30 cursor-not-allowed border-stone-800 bg-stone-900'
                      : 'bg-stone-900 border-stone-800 hover:border-amber-600/70 hover:bg-stone-850'
                  }`}
                >
                  <CharacterAvatar
                    characterId={char.id}
                    characterName={char.name}
                    size="sm"
                    className="mb-1"
                  />
                  <span className="font-bold text-xs text-stone-200 text-center truncate w-full font-serif">
                    {char.name}
                  </span>
                  <span className="text-[9px] text-amber-300 font-mono italic truncate w-full text-center">
                    "{char.visual.tag}"
                  </span>
                </button>
              );
            })}
          </div>

          {/* Partner bio card */}
          <div className="p-3 rounded-xl bg-stone-900/80 border border-amber-500/30 text-xs flex gap-3 items-start">
            <CharacterAvatar
              characterId={partnerChar.id}
              characterName={partnerChar.name}
              size="md"
              canTestVoice
              className="shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between font-bold text-amber-300 mb-1">
                <span>{partnerChar.name} ({partnerChar.realName})</span>
                <span className="text-[10px] text-stone-400 font-normal">{partnerChar.role}</span>
              </div>
              <div className="italic text-yellow-200/90 font-serif mb-1">
                "{partnerChar.presentation}"
              </div>
              <p className="text-stone-300 leading-relaxed text-[11px] mb-2">{partnerChar.description}</p>
              <button
                onClick={() => voiceEngine.testVoice(partnerChar.id)}
                className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 transition"
              >
                <span>🔊</span>
                <span>Escuchar voz de {partnerChar.name}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="flex items-center justify-center pt-2">
        <button
          onClick={handleStart}
          className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-lg tracking-wider shadow-2xl transition active:scale-95 flex items-center justify-center gap-3 border-2 border-amber-200"
        >
          <span>🃏</span>
          <span>
            {gameMode === 'torneo' ? 'ENTRAR AL TORNEO DE MUS' : 'COMENZAR PARTIDA DE MUS'}
          </span>
          <span>⚡</span>
        </button>
      </div>
    </div>
  );
};
