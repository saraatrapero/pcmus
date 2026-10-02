import React, { useState, useEffect } from 'react';
import {
  userProfileEngine,
  UserProfile,
  TacticalAnalysis,
} from '../userProfileEngine';
import { CharacterAvatar } from './CharacterAvatar';
import { PC_MUS_CHARACTERS } from '../characters';

interface UserControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserChanged?: (user: UserProfile) => void;
}

export const UserControlModal: React.FC<UserControlModalProps> = ({
  isOpen,
  onClose,
  onUserChanged,
}) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeUser, setActiveUser] = useState<UserProfile>(userProfileEngine.getActiveUser());
  const [analysis, setAnalysis] = useState<TacticalAnalysis>(userProfileEngine.analyzeUser());
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('tio_gil');
  const [activeTab, setActiveTab] = useState<'profiles' | 'ai_analysis'>('ai_analysis');

  const refresh = () => {
    setProfiles(userProfileEngine.getProfiles());
    const current = userProfileEngine.getActiveUser();
    setActiveUser(current);
    setAnalysis(userProfileEngine.analyzeUser(current));
  };

  useEffect(() => {
    refresh();
    const unsub = userProfileEngine.subscribe(refresh);
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectUser = (id: string) => {
    userProfileEngine.setActiveUser(id);
    const updated = userProfileEngine.getActiveUser();
    setActiveUser(updated);
    setAnalysis(userProfileEngine.analyzeUser(updated));
    if (onUserChanged) onUserChanged(updated);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const created = userProfileEngine.createUser(newName.trim(), newAvatar);
    setIsCreating(false);
    setNewName('');
    setActiveUser(created);
    setAnalysis(userProfileEngine.analyzeUser(created));
    if (onUserChanged) onUserChanged(created);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('¿Eliminar este perfil de usuario? Se perderán sus estadísticas de juego.')) {
      userProfileEngine.deleteUser(id);
      refresh();
    }
  };

  const handleResetStats = (id: string) => {
    if (confirm('¿Reiniciar las estadísticas y el aprendizaje de la IA para este usuario?')) {
      userProfileEngine.resetUserStats(id);
      refresh();
    }
  };

  // Archetype Badge Color & Icon
  const archetypeInfo = {
    'Farolero Temerario': { icon: '🦁', color: 'bg-rose-900/80 border-rose-500 text-rose-200' },
    'Agresivo Dominante': { icon: '⚔️', color: 'bg-amber-900/80 border-amber-500 text-amber-200' },
    'Amarrategui (Muy Conservador)': { icon: '🐢', color: 'bg-blue-900/80 border-blue-500 text-blue-200' },
    'Prudente Calculador': { icon: '🛡️', color: 'bg-emerald-900/80 border-emerald-500 text-emerald-200' },
    'Equilibrado Clásico': { icon: '⚖️', color: 'bg-purple-900/80 border-purple-500 text-purple-200' },
  }[analysis.archetype];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 select-none animate-fade-in">
      <div className="bg-stone-950 border-4 border-amber-600 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-[8px_8px_0px_#000] overflow-hidden text-stone-100">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 px-5 py-3 border-b-2 border-amber-600 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🧠</span>
            <div>
              <h2 className="font-serif font-black text-amber-300 text-base sm:text-lg tracking-wide">
                LO QUE LA IA HA APRENDIDO DE TI
              </h2>
              <p className="text-[10px] sm:text-xs font-mono text-stone-400">
                La IA estudia tu forma de jugar y la usa para tomar mejores decisiones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-900 hover:bg-stone-800 border border-amber-500/50 text-amber-300 font-black text-sm flex items-center justify-center transition active:scale-95 cursor-pointer"
            title="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        {/* Active User Quick Bar */}
        <div className="px-5 py-2 bg-stone-900/60 border-b border-stone-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CharacterAvatar
              characterId={activeUser.avatarId}
              characterName={activeUser.name}
              size="sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-amber-200 text-sm">
                  {activeUser.name}
                </span>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/50">
                  ACTIVO
                </span>
              </div>
              <span className="text-[10px] font-mono text-stone-400">
                {activeUser.handsPlayed} manos jugadas • {activeUser.matchesWon} victorias / {activeUser.matchesLost} derrotas
              </span>
            </div>
          </div>

          <div className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${archetypeInfo.color}`}>
            <span className="text-sm">{archetypeInfo.icon}</span>
            <span className="text-[10px] font-mono font-black">{analysis.archetype}</span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'ai_analysis' && (
            <>
              {/* Tactical Overview Card */}
              <div className="bg-stone-900/80 border-2 border-stone-800 rounded-2xl p-4">
                <h3 className="font-serif font-black text-amber-300 text-sm mb-2 flex items-center gap-2">
                  <span>📊</span>
                  <span>Diagnóstico del Estilo de Juego</span>
                </h3>
                <p className="text-xs text-stone-300 mb-4 leading-relaxed font-mono">
                  {analysis.description}
                </p>

                {/* Metric Bars */}
                <div className="space-y-3">
                  {/* Aggressiveness */}
                  <div>
                    <div className="flex justify-between text-xs font-mono font-bold mb-1">
                      <span className="text-amber-200 flex items-center gap-1">
                        <span>🔥</span> Nivel de Agresividad:
                      </span>
                      <span className="text-amber-400">{analysis.aggressiveness}%</span>
                    </div>
                    <div className="w-full h-3 bg-stone-950 rounded-full border border-stone-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-500 via-amber-500 to-red-600 rounded-full transition-all duration-500"
                        style={{ width: `${analysis.aggressiveness}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-stone-500 mt-0.5">
                      <span>0% (Amarrategui puro)</span>
                      <span>50% (Equilibrado)</span>
                      <span>100% (Envidador sin freno)</span>
                    </div>
                  </div>

                  {/* Risk Tolerance */}
                  <div>
                    <div className="flex justify-between text-xs font-mono font-bold mb-1">
                      <span className="text-rose-200 flex items-center gap-1">
                        <span>🎲</span> Nivel de Riesgo (Audacia):
                      </span>
                      <span className="text-rose-400">{analysis.riskTolerance}%</span>
                    </div>
                    <div className="w-full h-3 bg-stone-950 rounded-full border border-stone-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-rose-600 rounded-full transition-all duration-500"
                        style={{ width: `${analysis.riskTolerance}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-stone-500 mt-0.5">
                      <span>Prudente (se retira ante órdagos)</span>
                      <span>Kamikaze (acepta órdagos al límite)</span>
                    </div>
                  </div>

                  {/* Bluff Frequency */}
                  <div>
                    <div className="flex justify-between text-xs font-mono font-bold mb-1">
                      <span className="text-indigo-200 flex items-center gap-1">
                        <span>🎭</span> Tasa de Farol Detectada:
                      </span>
                      <span className="text-indigo-400">{analysis.bluffRate}%</span>
                    </div>
                    <div className="w-full h-3 bg-stone-950 rounded-full border border-stone-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${analysis.bluffRate}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-stone-500 mt-0.5">
                      <span>Poco farol (juega cartas altas)</span>
                      <span>Farolero habitual</span>
                    </div>
                  </div>

                  {/* Mus Tendency */}
                  <div>
                    <div className="flex justify-between text-xs font-mono font-bold mb-1">
                      <span className="text-emerald-200 flex items-center gap-1">
                        <span>🔄</span> Tendencia a Pedir Mus:
                      </span>
                      <span className="text-emerald-400">{analysis.musTendency}%</span>
                    </div>
                    <div className="w-full h-3 bg-stone-950 rounded-full border border-stone-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-stone-500 via-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${analysis.musTendency}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-stone-500 mt-0.5">
                      <span>Corta el mus frecuentemente</span>
                      <span>Pide mus siempre para mejorar</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE AI COUNTER-STRATEGY CARD */}
              <div className="bg-gradient-to-br from-amber-950/40 via-stone-900 to-stone-950 border-2 border-amber-500 rounded-2xl p-4 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-stone-950 font-mono font-black text-[9px] rounded-bl-xl uppercase tracking-wider">
                  Contramedida Activa
                </div>
                <h3 className="font-serif font-black text-amber-300 text-sm mb-1 flex items-center gap-2">
                  <span>🤖</span>
                  <span>Estrategia de la Máquina para Ganarte</span>
                </h3>
                <h4 className="font-mono font-bold text-amber-400 text-xs mb-2">
                  {analysis.aiCounterStrategy.title}
                </h4>
                <p className="text-xs text-stone-200 font-mono leading-relaxed bg-black/50 p-2.5 rounded-xl border border-stone-800 mb-3">
                  {analysis.aiCounterStrategy.description}
                </p>

                {/* Specific active parameters */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-mono">
                  <div className="bg-stone-950/80 p-2 rounded-lg border border-stone-800">
                    <span className="text-stone-400 block">Cazafaroles:</span>
                    <span className="font-black text-amber-300">
                      {analysis.aiCounterStrategy.callThresholdShift < 0 ? 'Activo (Paga envites flojos)' : 'Normal'}
                    </span>
                  </div>
                  <div className="bg-stone-950/80 p-2 rounded-lg border border-stone-800">
                    <span className="text-stone-400 block">Tácticas de Emboscada:</span>
                    <span className="font-black text-amber-300">
                      {Math.round(analysis.aiCounterStrategy.trapTendency * 100)}% prob. de pasar con 31/Reyes
                    </span>
                  </div>
                  <div className="bg-stone-950/80 p-2 rounded-lg border border-stone-800 col-span-2 sm:col-span-1">
                    <span className="text-stone-400 block">Respeto a tus Apuestas:</span>
                    <span className="font-black text-amber-300">
                      {analysis.aiCounterStrategy.bluffRespectShift > 0 ? 'Alto (Sabe que no mientes)' : 'Bajo (Desconfía)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lances Breakdown */}
              <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-3">
                <h4 className="text-xs font-mono font-bold text-amber-300 mb-2">
                  Historial de Decisiones en la Mesa ({activeUser.name})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                  <div className="bg-stone-950 p-2 rounded-lg border border-stone-800">
                    <span className="text-stone-400 block text-[9px]">Pases vs Envidos</span>
                    <span className="text-amber-200 font-bold">
                      {activeUser.playstyle.pasoCount} pases / {activeUser.playstyle.envidoCount} envidos
                    </span>
                  </div>
                  <div className="bg-stone-950 p-2 rounded-lg border border-stone-800">
                    <span className="text-stone-400 block text-[9px]">Órdagos lanzados</span>
                    <span className="text-amber-200 font-bold">
                      {activeUser.playstyle.ordagoCount}
                    </span>
                  </div>
                  <div className="bg-stone-950 p-2 rounded-lg border border-stone-800">
                    <span className="text-stone-400 block text-[9px]">Órdagos aceptados</span>
                    <span className="text-amber-200 font-bold">
                      {activeUser.playstyle.ordagoAccepted} / {activeUser.playstyle.ordagoFaced}
                    </span>
                  </div>
                  <div className="bg-stone-950 p-2 rounded-lg border border-stone-800">
                    <span className="text-stone-400 block text-[9px]">Faroles vs Valor</span>
                    <span className="text-amber-200 font-bold">
                      {activeUser.playstyle.bluffBets} farol / {activeUser.playstyle.valueBets} valor
                    </span>
                  </div>
                </div>
              </div>
              {/* Learned per lance */}
              <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-3">
                <h4 className="text-xs font-mono font-bold text-amber-300 mb-2">Lo que sabe de ti en cada lance</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono">
                  {(['grande', 'chica', 'pares', 'juego', 'punto'] as const).map((l) => {
                    const v = analysis.lanceBluffRate?.[l];
                    return (
                      <div key={l} className="bg-stone-950 p-2 rounded-lg border border-stone-800">
                        <span className="text-stone-400 block text-[9px] uppercase">{l}</span>
                        <span className="text-amber-200 font-bold">
                          {v === null || v === undefined ? 'Aún aprendiendo' : `${v}% faroles`}
                        </span>
                        {v !== null && v !== undefined && (
                          <span className="block text-[9px] text-stone-500">
                            {v >= 40 ? 'Te pagará los envites' : v <= 10 ? 'Se cree tus envites' : 'Te lee con cuidado'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] text-stone-400">
                  {analysis.foldRate === null
                    ? 'Todavía está viendo cómo respondes cuando te envidan.'
                    : analysis.foldRate >= 60
                    ? `Te retiras en el ${analysis.foldRate}% de los envites: la IA te faroleará más.`
                    : `Aceptas a menudo los envites (te retiras en el ${analysis.foldRate}%): la IA solo apostará con buenas cartas.`}
                </p>
              </div>
            </>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-stone-900 px-5 py-2.5 border-t border-stone-800 flex items-center justify-between text-xs font-mono">
          <span className="text-stone-400 text-[10px]">
            Se guarda en tu cuenta: la IA te reconoce en cualquier dispositivo.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold border border-amber-600/50 transition active:scale-95 cursor-pointer"
          >
            Aceptar y Continuar
          </button>
        </div>
      </div>
    </div>
  );
};
