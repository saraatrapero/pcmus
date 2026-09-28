import React, { useState, useEffect } from 'react';
import { getCharacterPortraitUrl } from '../characterPortraits';
import { voiceEngine } from '../voiceEngine';

interface CharacterAvatarProps {
  characterId: string;
  characterName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isSpeaking?: boolean;
  canTestVoice?: boolean;
  className?: string;
  showBadge?: boolean;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  characterId,
  characterName,
  size = 'md',
  isSpeaking: externalIsSpeaking,
  canTestVoice = false,
  className = '',
  showBadge = false,
}) => {
  const [internalSpeaking, setInternalSpeaking] = useState(false);
  const portraitUrl = getCharacterPortraitUrl(characterId);

  useEffect(() => {
    const unsub = voiceEngine.registerSpeakingListener((speaking, speakerId) => {
      if (speakerId === characterId && speaking) {
        setInternalSpeaking(true);
      } else if (!speaking || speakerId !== characterId) {
        setInternalSpeaking(false);
      }
    });
    return () => unsub();
  }, [characterId]);

  const isSpeaking = externalIsSpeaking || internalSpeaking;

  const sizeClasses = {
    sm: 'w-10 h-10 text-base',
    md: 'w-14 h-14 text-xl',
    lg: 'w-20 h-20 text-3xl',
    xl: 'w-28 h-28 sm:w-32 sm:h-32 text-4xl',
  }[size];

  const handleTestVoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    voiceEngine.testVoice(characterId);
  };

  // Dedicated cartoon caricature illustrations for characters without JPGs
  const renderSpecialCartoonArt = () => {
    if (characterId === 'senorita_rosa') {
      return (
        <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-teal-900 flex flex-col items-center justify-center p-1 relative overflow-hidden">
          <div className="text-3xl filter drop-shadow-md">🎨</div>
          <span className="text-[9px] font-bold text-emerald-200 tracking-tighter uppercase font-mono">
            Rosita
          </span>
          <div className="absolute -bottom-1 -right-1 text-xs">👠</div>
        </div>
      );
    }
    if (characterId === 'cabo_don_luis') {
      return (
        <div className="w-full h-full bg-gradient-to-br from-slate-700 to-green-950 flex flex-col items-center justify-center p-1 relative overflow-hidden">
          <div className="text-3xl filter drop-shadow-md">🧳</div>
          <span className="text-[9px] font-bold text-green-200 tracking-tighter uppercase font-mono">
            D. Luis
          </span>
          <div className="absolute -bottom-1 -right-1 text-xs">🚨</div>
        </div>
      );
    }
    if (characterId === 'chiquito') {
      return (
        <div className="w-full h-full bg-gradient-to-br from-purple-800 to-yellow-600 flex flex-col items-center justify-center p-1 relative overflow-hidden">
          <div className="text-3xl filter drop-shadow-md">🤠</div>
          <span className="text-[9px] font-bold text-yellow-300 tracking-tighter uppercase font-mono">
            Chiquito
          </span>
        </div>
      );
    }
    if (characterId === 'karlos') {
      return (
        <div className="w-full h-full bg-gradient-to-br from-amber-700 to-orange-950 flex flex-col items-center justify-center p-1 relative overflow-hidden">
          <div className="text-3xl filter drop-shadow-md">👨‍🍳</div>
          <span className="text-[9px] font-bold text-amber-200 tracking-tighter uppercase font-mono">
            Karlos
          </span>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-stone-800 flex items-center justify-center text-amber-400 font-serif font-black">
        {characterName.slice(0, 2).toUpperCase()}
      </div>
    );
  };

  return (
    <div className={`relative inline-block select-none ${className}`}>
      {/* Outer Cartoon Frame */}
      <div
        className={`relative ${sizeClasses} rounded-2xl overflow-hidden border-2 transition-all duration-200 shadow-md ${
          isSpeaking
            ? 'border-amber-400 ring-4 ring-amber-500/50 scale-105 shadow-amber-500/40 animate-pulse'
            : 'border-stone-700 hover:border-amber-500/70'
        }`}
      >
        {portraitUrl ? (
          <img
            src={portraitUrl}
            alt={`Caricatura de ${characterName}`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          />
        ) : (
          renderSpecialCartoonArt()
        )}

        {/* Speaking animation badge overlay */}
        {isSpeaking && (
          <div className="absolute bottom-0 inset-x-0 bg-amber-500/90 py-0.5 text-center text-[10px] font-mono font-black text-stone-950 flex items-center justify-center gap-1 shadow">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-950 animate-ping" />
            <span>HABLANDO</span>
          </div>
        )}
      </div>

      {/* Test voice action button */}
      {canTestVoice && (
        <button
          onClick={handleTestVoice}
          title={`Escuchar voz de ${characterName}`}
          className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 rounded-full border border-stone-900 flex items-center justify-center shadow-lg transition text-xs z-10"
        >
          🔊
        </button>
      )}

      {/* Character tag badge */}
      {showBadge && (
        <div className="mt-1 text-center">
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-stone-900/90 text-amber-300 border border-stone-700 truncate max-w-full">
            {characterName}
          </span>
        </div>
      )}
    </div>
  );
};
