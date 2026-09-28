import React, { useState } from 'react';
import { MultiplayerRoom, ChatMessage } from '../types';
import { multiplayerService } from '../multiplayer/multiplayerService';
import { sound } from '../sound';

interface MultiplayerChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: MultiplayerRoom | null;
  localSeatIndex: number;
}

export const MultiplayerChatModal: React.FC<MultiplayerChatModalProps> = ({
  isOpen,
  onClose,
  room,
  localSeatIndex,
}) => {
  const [chatInput, setChatInput] = useState<string>('');

  if (!isOpen || !room) return null;

  const handleSend = (text: string, isQuickPhrase = false) => {
    if (!text.trim()) return;
    sound.playChip();
    multiplayerService.sendChatMessage(room.id, text, isQuickPhrase);
    setChatInput('');
  };

  const quickPhrases = [
    '¡Hay mus!',
    '¡No hay mus, corto!',
    '¡A la grande voy!',
    '¡A la chica llevo Ases!',
    '¡Llevo pares buenos!',
    '¡Tengo juego de 31!',
    '¡Envido dos más!',
    '¡Órdago la grande!',
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3">
      <div className="bg-stone-900 border-2 border-amber-600 rounded-3xl max-w-lg w-full shadow-2xl p-4 sm:p-5 flex flex-col max-h-[85vh] text-stone-100 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <div>
              <h3 className="font-serif font-bold text-amber-300 text-sm">
                Chat de la Mesa ({room.name})
              </h3>
              <span className="text-[10px] text-stone-400 font-mono">
                Código: {room.code} • Asiento {['Sur', 'Este', 'Norte', 'Oeste'][localSeatIndex]}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-sm font-bold transition"
          >
            ✕
          </button>
        </div>

        {/* Message feed */}
        <div className="flex-1 overflow-y-auto bg-stone-950/80 rounded-2xl p-3 border border-stone-800 space-y-2 mb-3 min-h-[220px]">
          {room.chat.map((msg) => {
            const isMe = msg.seat === localSeatIndex;
            return (
              <div
                key={msg.id}
                className={`p-2 rounded-xl text-xs ${
                  isMe
                    ? 'bg-amber-950/70 border border-amber-500/40 ml-6 text-right'
                    : 'bg-stone-900 border border-stone-800 mr-6 text-left'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[10px] text-stone-400 font-mono mb-0.5">
                  <span className="font-bold text-amber-300">{msg.senderName}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <div className={msg.isQuickPhrase ? 'italic text-emerald-300 font-serif' : 'text-stone-200'}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          {room.chat.length === 0 && (
            <div className="text-center text-xs text-stone-500 py-8">
              No hay mensajes aún. ¡Envía una frase o saludo a la mesa!
            </div>
          )}
        </div>

        {/* Quick phrases */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-3">
          {quickPhrases.map((phrase) => (
            <button
              key={phrase}
              onClick={() => handleSend(phrase, true)}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-medium border border-stone-700 transition truncate text-center"
            >
              {phrase}
            </button>
          ))}
        </div>

        {/* Input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(chatInput);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Escribe un mensaje a los jugadores..."
            className="flex-1 px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow transition"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
};
