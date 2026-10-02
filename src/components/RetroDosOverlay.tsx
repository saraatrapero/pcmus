import React from 'react';
import { sound } from '../sound';
import { voiceEngine } from '../voiceEngine';

interface RetroDosOverlayProps {
  crtEnabled: boolean;
  onToggleCrt: () => void;
  onOpenRules: () => void;
  onExitGame: () => void;
  onOpenMultiplayer?: () => void;
  onOpenTutorial?: () => void;
  onOpenUserControl?: () => void;
  gameMode: string;
  gameSpeed?: 'tranquilo' | 'normal' | 'rapido';
  onChangeGameSpeed?: () => void;
}

export const RetroDosOverlay: React.FC<RetroDosOverlayProps> = ({
  crtEnabled,
  onToggleCrt,
  onOpenRules,
  onExitGame,
  onOpenMultiplayer,
  onOpenTutorial,
  onOpenUserControl,
  gameMode,
  gameSpeed = 'tranquilo',
  onChangeGameSpeed,
}) => {
  const [soundMuted, setSoundMuted] = React.useState(!sound.enabled);
  const [voiceEnabled, setVoiceEnabled] = React.useState(voiceEngine.enabled);

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setSoundMuted(!sound.enabled);
  };

  const toggleVoice = () => {
    voiceEngine.enabled = !voiceEngine.enabled;
    setVoiceEnabled(voiceEngine.enabled);
    if (voiceEngine.enabled) {
      voiceEngine.testVoice('tio_gil');
    } else {
      voiceEngine.stop();
    }
  };

  return (
    <>
      {/* CRT Scanline and Vignette Layer */}
      {crtEnabled && (
        <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
          {/* Scanlines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
          {/* Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.5)_100%)]" />
        </div>
      )}

      {/* Top Bar Navigation & Utility Controls */}
      <header className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-brass-500/30 bg-gradient-to-b from-[#1f1108] to-[#130a04] rounded-b-2xl mb-2 select-none shadow-[0_8px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-display whitespace-nowrap font-black text-brass-400 text-lg tracking-wider drop-shadow-[0_2px_0_rgba(0,0,0,0.6)]">
            PC MUS
          </span>
          <span className="bg-amber-950 text-amber-300 text-[10px] px-2 py-0.5 rounded border border-amber-600/40 uppercase font-mono hidden sm:inline">
            {gameMode === 'torneo'
              ? 'MODO TORNEO'
              : gameMode === 'multijugador'
              ? '🌐 MULTIJUGADOR ONLINE'
              : 'PARTIDA RÁPIDA'}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 min-w-0">
          {/* User Control & AI Learning shortcut button */}
          {onOpenUserControl && (
            <button
              onClick={onOpenUserControl}
              className="px-2.5 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-500/70 text-xs font-bold text-amber-300 transition flex items-center gap-1.5 shadow"
              title="Control de usuarios y aprendizaje adaptativo de la IA"
            >
              <span>🧠</span>
              <span className="hidden sm:inline">IA & Usuarios</span>
            </button>
          )}

          {/* Tutorial shortcut button */}
          {onOpenTutorial && (
            <button
              onClick={onOpenTutorial}
              className="px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/50 text-xs font-bold text-amber-300 transition flex items-center gap-1"
              title="Tutorial interactivo paso a paso"
            >
              <span>🎓</span>
              <span className="hidden md:inline">Tutorial</span>
            </button>
          )}

          {/* Multiplayer shortcut button */}
          {onOpenMultiplayer && (
            <button
              onClick={onOpenMultiplayer}
              className="px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 border border-blue-500/50 text-xs font-bold text-blue-300 transition flex items-center gap-1"
              title="Multijugador online (salas públicas y privadas)"
            >
              <span>🌐</span>
              <span className="hidden md:inline">Multijugador</span>
            </button>
          )}

          {/* Game Speed (Ritmo de juego) button */}
          {onChangeGameSpeed && (
            <button
              onClick={onChangeGameSpeed}
              className="px-2 py-1 sm:px-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-amber-600/60 text-xs font-mono font-bold text-amber-300 transition flex items-center gap-1.5 shadow"
              title="Cambiar ritmo de juego y recuento: Pausado (recomendado) / Normal / Rápido"
            >
              <span>{gameSpeed === 'tranquilo' ? '🐢' : gameSpeed === 'normal' ? '⚖️' : '⚡'}</span>
              <span className="hidden sm:inline capitalize">{gameSpeed === 'tranquilo' ? 'Pausado' : gameSpeed}</span>
            </button>
          )}

          {/* Voice toggle */}
          <button
            onClick={toggleVoice}
            className={`px-2 py-1 sm:px-2.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
              voiceEnabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 hover:bg-amber-500/30'
                : 'bg-stone-900 text-stone-500 border-stone-800'
            }`}
            title={voiceEnabled ? 'Voces de personajes activadas (Clic para silenciar)' : 'Activar voces de personajes'}
          >
            <span>🎙️</span>
            <span className="hidden sm:inline">{voiceEnabled ? 'Voces ON' : 'Voces OFF'}</span>
          </button>

          {/* Sound toggle */}
          <button
            onClick={toggleSound}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs text-stone-200 transition"
            title={soundMuted ? 'Activar sonido' : 'Silenciar sonido'}
          >
            {soundMuted ? '🔇' : '🔊'}
          </button>

          {/* CRT Scanlines toggle */}
          <button
            onClick={onToggleCrt}
            className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
              crtEnabled
                ? 'bg-amber-500 text-stone-950 border-amber-400'
                : 'bg-stone-900 hover:bg-stone-800 border-stone-700 text-stone-300'
            }`}
            title="Efecto monitor de tubo CRT"
          >
            <span>📺</span>
            <span className="hidden sm:inline">Modo CRT</span>
          </button>

          {/* Rules button */}
          <button
            onClick={onOpenRules}
            className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs font-bold text-amber-300 transition flex items-center gap-1"
          >
            <span>📜</span>
            <span className="hidden sm:inline">Reglas</span>
          </button>

          {/* Exit / Menu */}
          <button
            onClick={onExitGame}
            className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-700/60 text-xs font-bold text-red-200 transition flex items-center gap-1"
          >
            <span>🚪</span>
            <span className="hidden sm:inline">Menú</span>
          </button>
        </div>
      </header>
    </>
  );
};
