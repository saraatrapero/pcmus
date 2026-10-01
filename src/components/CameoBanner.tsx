import React, { useEffect, useRef } from 'react';
import { Cameo } from '../characters';
import { sound } from '../sound';
import { voiceEngine } from '../voiceEngine';
import { CharacterAvatar } from './CharacterAvatar';

interface CameoBannerProps {
  cameo: Cameo | null;
  onDismiss: () => void;
}

export const CameoBanner: React.FC<CameoBannerProps> = ({ cameo, onDismiss }) => {
  const cameoCharId = cameo?.name.toLowerCase().includes('chiquito')
    ? 'chiquito'
    : 'karlos';

  // Keep the latest callback without restarting the timer (the parent re-renders often)
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (cameo) {
      sound.playCameo();
      voiceEngine.speakCharacter(cameoCharId, cameo.quote);
      const timer = setTimeout(() => {
        onDismissRef.current();
      }, 5500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameo]);

  if (!cameo) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-xl w-[92%] animate-bounce">
      <div
        className={`p-3 sm:p-4 rounded-2xl shadow-2xl border-4 ${cameo.color} text-white flex items-center gap-3 backdrop-blur-md relative overflow-hidden`}
      >
        <div className="shrink-0">
          <CharacterAvatar
            characterId={cameoCharId}
            characterName={cameo.name}
            size="lg"
            isSpeaking={true}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-yellow-300 font-serif">
              ★ {cameo.name} ★
            </span>
            <button
              onClick={onDismiss}
              className="text-stone-300 hover:text-white text-xs px-1.5 py-0.5 rounded bg-black/40"
            >
              ✕
            </button>
          </div>
          <div className="text-sm sm:text-base font-black font-serif text-yellow-200 mt-0.5 leading-snug">
            "{cameo.quote}"
          </div>
          <div className="text-xs text-stone-100 font-sans mt-0.5 opacity-90">
            {cameo.subquote}
          </div>
        </div>
      </div>
    </div>
  );
};
