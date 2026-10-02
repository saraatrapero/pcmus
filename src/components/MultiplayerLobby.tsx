import React, { useState, useEffect, useRef } from 'react';
import { MultiplayerRoom, RoomSeat } from '../types';
import { multiplayerService } from '../multiplayer/multiplayerService';
import { PC_MUS_CHARACTERS, CharacterInfo } from '../characters';
import { sound } from '../sound';
import { CharacterAvatar } from './CharacterAvatar';
import { voiceEngine } from '../voiceEngine';

interface MultiplayerLobbyProps {
  onBackToMenu: () => void;
  onStartGame: (room: MultiplayerRoom, localSeatIndex: number) => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  onBackToMenu,
  onStartGame,
}) => {
  const [activeTab, setActiveTab] = useState<'public' | 'create' | 'join_code'>('public');
  const [publicRooms, setPublicRooms] = useState<MultiplayerRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<MultiplayerRoom | null>(null);

  // Player preferences
  const [playerName, setPlayerName] = useState<string>('Musolari');
  const [selectedCharId, setSelectedCharId] = useState<string>('tio_gil');

  // Create room form state
  const [createRoomName, setCreateRoomName] = useState<string>('La Mesa de los Campeones');
  const [createIsPrivate, setCreateIsPrivate] = useState<boolean>(false);
  const [createPassword, setCreatePassword] = useState<string>('');
  const [createTargetPiedras, setCreateTargetPiedras] = useState<number>(40);
  const [createSeatIndex, setCreateSeatIndex] = useState<number>(0);

  // Join with code form state
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [joinPasswordInput, setJoinPasswordInput] = useState<string>('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  // Chat input
  const [chatInput, setChatInput] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const localPlayerId = multiplayerService.getPlayerId();
  const selectedChar = PC_MUS_CHARACTERS.find((c) => c.id === selectedCharId) || PC_MUS_CHARACTERS[0];

  // Latest callback without re-subscribing on every parent render
  const onStartGameRef = useRef(onStartGame);
  onStartGameRef.current = onStartGame;
  const startedRef = useRef<boolean>(false);

  // Subscribe to public rooms list (polls the server)
  useEffect(() => {
    const unsubscribe = multiplayerService.subscribeToLobby(
      (rooms) => {
        setPublicRooms(rooms);
        setServerError(null);
      },
      (err) => setServerError(err.message)
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to current room: everybody (host included) enters the game when it starts
  useEffect(() => {
    if (!currentRoom?.id) return;
    startedRef.current = false;
    const unsubscribe = multiplayerService.subscribeToRoom(
      currentRoom.id,
      (updatedRoom) => {
        setCurrentRoom(updatedRoom);
        setServerError(null);
        const mySeat = updatedRoom.seats.find((s) => s.playerId === localPlayerId);
        if (!mySeat) {
          // We were removed from the room
          setCurrentRoom(null);
          return;
        }
        if (updatedRoom.status === 'playing' && !startedRef.current) {
          startedRef.current = true;
          sound.playVictory();
          multiplayerService.setActiveRoomId(updatedRoom.id);
          onStartGameRef.current(updatedRoom, mySeat.seatIndex);
        }
      },
      (err) => {
        if (/no existe/.test(err.message)) setCurrentRoom(null);
        setServerError(err.message);
      }
    );
    return () => unsubscribe();
  }, [currentRoom?.id, localPlayerId]);

  const run = async (fn: () => Promise<void>, onError: (msg: string) => void = setServerError) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const playerInfo = () => ({ name: playerName || selectedChar.name, characterId: selectedChar.id });

  // Handle Create Room
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playCard();
    run(async () => {
      const newRoom = await multiplayerService.createRoom({
        name: createRoomName,
        isPrivate: createIsPrivate,
        password: createPassword || undefined,
        targetPiedras: createTargetPiedras,
        playerName: playerInfo().name,
        characterId: selectedChar.id,
        seatIndex: createSeatIndex,
      });
      setCurrentRoom(newRoom);
    });
  };

  // Handle Join Public Room
  const handleJoinPublic = (room: MultiplayerRoom) => {
    sound.playCard();
    setJoinError(null);
    run(async () => {
      setCurrentRoom(await multiplayerService.joinRoom(room.id, playerInfo()));
    }, setJoinError);
  };

  // Handle Join with Code
  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    if (!joinCodeInput.trim()) {
      setJoinError('Introduce un código de sala válido (ej: PRIV-1234)');
      return;
    }
    sound.playCard();
    run(async () => {
      setCurrentRoom(await multiplayerService.joinByCode(joinCodeInput, joinPasswordInput, playerInfo()));
    }, setJoinError);
  };

  // Handle Seat Switch
  const handleSeatClick = (seatIdx: number) => {
    if (!currentRoom) return;
    const targetSeat = currentRoom.seats[seatIdx];
    if (targetSeat.occupied) return;
    sound.playCard();
    run(async () => {
      setCurrentRoom(await multiplayerService.changeSeat(currentRoom.id, seatIdx));
    });
  };

  // Handle Fill with Bots
  const handleFillBots = () => {
    if (!currentRoom) return;
    sound.playVictory();
    run(async () => {
      setCurrentRoom(await multiplayerService.fillWithBots(currentRoom.id));
    });
  };

  // Handle Start Game: the room poll moves everybody (host included) into the game
  const handleStartGameClick = () => {
    if (!currentRoom) return;
    run(async () => {
      const room = await multiplayerService.startRoomGame(currentRoom.id);
      setCurrentRoom(room);
      const mySeat = room.seats.find((s) => s.playerId === localPlayerId);
      if (room.status === 'playing' && mySeat && !startedRef.current) {
        startedRef.current = true;
        sound.playVictory();
        multiplayerService.setActiveRoomId(room.id);
        onStartGameRef.current(room, mySeat.seatIndex);
      }
    });
  };

  // Handle Leave Room
  const handleLeaveRoom = () => {
    if (!currentRoom) return;
    sound.playCard();
    multiplayerService.leaveRoom(currentRoom.id);
    setCurrentRoom(null);
  };

  // Handle Chat Send
  const handleSendChat = (text: string, isQuickPhrase = false) => {
    if (!currentRoom || !text.trim()) return;
    sound.playChip();
    multiplayerService.sendChatMessage(currentRoom.id, text, isQuickPhrase);
    setChatInput('');
  };

  const copyRoomCode = () => {
    if (!currentRoom) return;
    navigator.clipboard?.writeText(currentRoom.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const quickPhrases = [
    '¡Hay mus!',
    '¡No hay mus, corto!',
    '¡A la grande voy!',
    '¡Envido dos más!',
    '¡Órdago la grande!',
    '¡Buenas cartas tengo!',
  ];

  // ----------------------------------------------------
  // SUB-VIEW: INSIDE WAITING ROOM
  // ----------------------------------------------------
  if (currentRoom) {
    const isHost = currentRoom.hostPlayerId === localPlayerId;
    const occupiedCount = currentRoom.seats.filter((s) => s.occupied).length;
    const canStart = occupiedCount === 4 && isHost;
    const seatNames = ['Sur', 'Este', 'Norte', 'Oeste'];

    return (
      <div className="max-w-5xl mx-auto my-3 p-4 sm:p-6 bg-stone-900 border-2 border-amber-600 rounded-3xl shadow-2xl text-stone-100 font-sans">
        {serverError && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-950/80 border border-rose-600/70 text-rose-200 text-xs font-bold text-center">
            ⚠️ {serverError}
          </div>
        )}
        {/* Room Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-stone-800 pb-4 mb-4 gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleLeaveRoom}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition flex items-center gap-1 border border-stone-700"
            >
              ← Salir de la Mesa
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-serif text-amber-300">
                  {currentRoom.name}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                    currentRoom.isPrivate
                      ? 'bg-rose-950 border border-rose-600 text-rose-300'
                      : 'bg-emerald-950 border border-emerald-600 text-emerald-300'
                  }`}
                >
                  {currentRoom.isPrivate ? 'Privada' : 'Pública'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-stone-950 text-amber-400 border border-stone-700">
                  {currentRoom.targetPiedras} Piedras
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Esperando a que se sienten los 4 jugadores para iniciar la mano.
              </p>
            </div>
          </div>

          {/* Room Code Badge */}
          <div className="flex items-center gap-2 bg-stone-950 px-3 py-1.5 rounded-2xl border border-stone-800">
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider text-stone-400 block font-mono">
                Código de Sala
              </span>
              <span className="font-mono font-black text-amber-400 text-sm">
                {currentRoom.code}
              </span>
            </div>
            <button
              onClick={copyRoomCode}
              title="Copiar código para compartir con amigos"
              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition"
            >
              {copiedCode ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* 4-SEAT TABLE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-4">
          {/* Left/Center: The Table & Seats */}
          <div className="lg:col-span-2 bg-emerald-950/80 p-5 rounded-3xl border-2 border-emerald-700/60 shadow-inner relative flex flex-col justify-between min-h-[380px]">
            {/* Table center label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center opacity-30">
                <div className="text-4xl font-display font-black text-brass-300">PC MUS</div>
                <div className="text-xs font-mono text-stone-300">MESA VERDE</div>
              </div>
            </div>

            {/* SEAT 2: NORTE (Pareja) */}
            <div className="flex justify-center z-10">
              <SeatCard
                seat={currentRoom.seats[2]}
                label="NORTE (pareja de Sur)"
                isLocalPlayer={currentRoom.seats[2]?.playerId === localPlayerId}
                onTakeSeat={() => handleSeatClick(2)}
              />
            </div>

            {/* MIDDLE ROW: OESTE & ESTE */}
            <div className="flex justify-between items-center z-10 px-2 sm:px-6">
              <SeatCard
                seat={currentRoom.seats[3]}
                label="OESTE (pareja de Este)"
                isLocalPlayer={currentRoom.seats[3]?.playerId === localPlayerId}
                onTakeSeat={() => handleSeatClick(3)}
              />
              <SeatCard
                seat={currentRoom.seats[1]}
                label="ESTE (pareja de Oeste)"
                isLocalPlayer={currentRoom.seats[1]?.playerId === localPlayerId}
                onTakeSeat={() => handleSeatClick(1)}
              />
            </div>

            {/* SEAT 0: SUR (Tú) */}
            <div className="flex justify-center z-10">
              <SeatCard
                seat={currentRoom.seats[0]}
                label="SUR (mano inicial)"
                isLocalPlayer={currentRoom.seats[0]?.playerId === localPlayerId}
                onTakeSeat={() => handleSeatClick(0)}
              />
            </div>
          </div>

          {/* Right: Room Controls & Live Chat */}
          <div className="flex flex-col justify-between bg-stone-950/80 p-4 rounded-3xl border border-stone-800">
            <div>
              <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-3">
                <span className="text-xs font-black uppercase text-amber-400 font-serif">
                  Estado de la Mesa ({occupiedCount}/4)
                </span>
                <span className="text-[11px] text-stone-400">
                  {occupiedCount === 4 ? '¡Mesa llena!' : `Faltan ${4 - occupiedCount} jugadores`}
                </span>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 mb-4">
                {isHost && occupiedCount < 4 && (
                  <button
                    onClick={handleFillBots}
                    className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs border border-amber-500/40 transition flex items-center justify-center gap-2"
                  >
                    <span>🤖</span>
                    <span>Rellenar huecos con IA (Tío Gil, etc.)</span>
                  </button>
                )}

                {canStart ? (
                  <button
                    onClick={handleStartGameClick}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl transition active:scale-95 animate-pulse"
                  >
                    🃏 ¡COMENZAR PARTIDA DE MUS!
                  </button>
                ) : (
                  <div className="p-2.5 bg-stone-900 rounded-xl border border-stone-800 text-center text-xs text-stone-400">
                    {occupiedCount < 4
                      ? 'Esperando a que se ocupen los 4 asientos...'
                      : !isHost
                      ? 'Esperando a que el anfitrión inicie la partida...'
                      : 'Todos listos.'}
                  </div>
                )}
              </div>

              {/* Chat Header */}
              <div className="text-xs font-bold text-stone-400 mb-1 flex items-center justify-between">
                <span>Chat de la Mesa:</span>
                <span className="text-[10px] text-stone-500 font-mono">Tiempo real</span>
              </div>

              {/* Chat Message Box */}
              <div className="h-40 overflow-y-auto bg-stone-900/90 rounded-xl p-2.5 border border-stone-800 space-y-1.5 text-xs">
                {currentRoom.chat.map((msg) => (
                  <div key={msg.id} className="leading-tight">
                    <span className="text-[10px] text-stone-500 mr-1.5 font-mono">
                      {msg.timestamp}
                    </span>
                    <span className="font-bold text-amber-300 mr-1">{msg.senderName}:</span>
                    <span className={msg.isQuickPhrase ? 'italic text-emerald-300' : 'text-stone-300'}>
                      {msg.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Quick phrases pills */}
              <div className="flex flex-wrap gap-1 my-2">
                {quickPhrases.slice(0, 4).map((phrase) => (
                  <button
                    key={phrase}
                    onClick={() => handleSendChat(phrase, true)}
                    className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-medium border border-stone-700 transition"
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat input form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat(chatInput);
              }}
              className="flex gap-2 mt-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Escribe un mensaje o frase de mus..."
                className="flex-1 px-3 py-1.5 bg-stone-900 border border-stone-700 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // SUB-VIEW: MAIN MULTIPLAYER LOBBY
  // ----------------------------------------------------
  return (
    <div className="max-w-5xl mx-auto my-3 p-4 sm:p-6 bg-stone-900 border-2 border-amber-600 rounded-3xl shadow-2xl text-stone-100 font-sans">
      {serverError && (
        <div className="mb-3 p-2.5 rounded-xl bg-rose-950/80 border border-rose-600/70 text-rose-200 text-xs font-bold text-center">
          ⚠️ {serverError}
        </div>
      )}
      {/* Lobby Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-stone-800 pb-4 mb-4 gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToMenu}
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition flex items-center gap-1 border border-stone-700"
          >
            ← Menú Principal
          </button>
          <div>
            <div className="inline-block px-2.5 py-0.5 bg-amber-950 border border-amber-600 text-amber-300 text-[10px] font-mono font-bold rounded mb-0.5 tracking-widest">
              SALAS ONLINE • CÍRCULO ASM
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-serif text-amber-300">
              Multijugador de Mus Español
            </h1>
          </div>
        </div>

        {/* Player Profile Setup Badge */}
        <div className="flex items-center gap-2 bg-stone-950 px-3 py-1.5 rounded-2xl border border-stone-800">
          <CharacterAvatar
            characterId={selectedChar.id}
            characterName={selectedChar.name}
            size="sm"
            canTestVoice
          />
          <div>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Tu nombre"
              className="bg-transparent text-xs font-bold text-amber-300 border-b border-stone-700 focus:outline-none focus:border-amber-400 w-28"
            />
            <span className="text-[10px] text-stone-400 block truncate">
              Avatar: {selectedChar.name}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-stone-950 p-1.5 rounded-2xl border border-stone-800 mb-6">
        <button
          onClick={() => {
            sound.playCard();
            setActiveTab('public');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'public'
              ? 'bg-amber-500 text-stone-950 shadow-md'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <span>🌐</span>
          <span>Salas Públicas ({publicRooms.length})</span>
        </button>

        <button
          onClick={() => {
            sound.playCard();
            setActiveTab('create');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'create'
              ? 'bg-amber-500 text-stone-950 shadow-md'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <span>➕</span>
          <span>Crear Partida (Pública / Privada)</span>
        </button>

        <button
          onClick={() => {
            sound.playCard();
            setActiveTab('join_code');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'join_code'
              ? 'bg-amber-500 text-stone-950 shadow-md'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <span>🔑</span>
          <span>Unirse con Código Privado</span>
        </button>
      </div>

      {/* TAB 1: SALAS PÚBLICAS */}
      {activeTab === 'public' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-stone-400 font-serif">
              Mesas Abiertas Disponibles para Jugar:
            </span>
            <span className="text-xs text-emerald-400 font-mono">
              ● Red Multijugador Activa
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {publicRooms.map((room) => {
              const occupiedCount = room.seats.filter((s) => s.occupied).length;
              const isFull = occupiedCount >= 4;

              return (
                <div
                  key={room.id}
                  className="bg-stone-950/70 p-4 rounded-2xl border border-stone-800 hover:border-amber-600/50 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="font-serif font-bold text-amber-300 text-sm">
                        {room.name}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-300">
                        {room.targetPiedras} Piedras
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-400 mb-3">
                      Código: <strong className="font-mono text-amber-400">{room.code}</strong> •
                      Creada hace poco
                    </p>

                    {/* Mini seats visual */}
                    <div className="grid grid-cols-4 gap-1.5 mb-4">
                      {room.seats.map((s, idx) => (
                        <div
                          key={idx}
                          className={`p-1.5 rounded-lg border text-center text-[10px] truncate ${
                            s.occupied
                              ? 'bg-amber-950/60 border-amber-500/50 text-amber-200'
                              : 'bg-stone-900/60 border-stone-800 text-stone-500'
                          }`}
                        >
                          {s.occupied ? (
                            <span className="font-medium truncate block">
                              {s.avatarIcon} {s.playerName}
                            </span>
                          ) : (
                            <span>Libre</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-800/60">
                    <span className="text-xs font-mono text-stone-300">
                      Jugadores: <strong className="text-amber-400">{occupiedCount}/4</strong>
                    </span>
                    <button
                      disabled={isFull}
                      onClick={() => handleJoinPublic(room)}
                      className={`px-4 py-1.5 rounded-xl font-bold text-xs transition ${
                        isFull
                          ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95'
                      }`}
                    >
                      {isFull ? 'Mesa Llena' : 'Sentarse a Jugar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {publicRooms.length === 0 && (
            <div className="p-8 text-center bg-stone-950/40 rounded-2xl border border-stone-800 text-stone-400 text-xs">
              No hay salas públicas abiertas en este momento. ¡Sé el primero en crear una mesa!
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CREAR SALA */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateRoom} className="space-y-4 max-w-2xl mx-auto">
          <div className="bg-stone-950/70 p-4 rounded-2xl border border-stone-800 space-y-4">
            <div>
              <label className="text-xs font-bold text-amber-300 block mb-1">
                Nombre de la Mesa / Partida:
              </label>
              <input
                type="text"
                required
                value={createRoomName}
                onChange={(e) => setCreateRoomName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                placeholder="Ej: Gran Partida de Mus de los Amigos"
              />
            </div>

            {/* Visibility toggle: Public vs Private */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-xs font-bold text-amber-300 block mb-1">
                  Tipo de Partida:
                </label>
                <div className="flex bg-stone-900 p-1 rounded-xl border border-stone-700">
                  <button
                    type="button"
                    onClick={() => setCreateIsPrivate(false)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                      !createIsPrivate
                        ? 'bg-amber-500 text-stone-950 shadow'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    🌐 Pública
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateIsPrivate(true)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                      createIsPrivate
                        ? 'bg-amber-500 text-stone-950 shadow'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    🔒 Privada (Con Código)
                  </button>
                </div>
              </div>

              <div className="flex-1">
                <label className="text-xs font-bold text-amber-300 block mb-1">
                  Meta de la Partida:
                </label>
                <div className="flex bg-stone-900 p-1 rounded-xl border border-stone-700">
                  <button
                    type="button"
                    onClick={() => setCreateTargetPiedras(40)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                      createTargetPiedras === 40
                        ? 'bg-amber-500 text-stone-950 shadow'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    40 Piedras
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateTargetPiedras(30)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                      createTargetPiedras === 30
                        ? 'bg-amber-500 text-stone-950 shadow'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    30 Piedras
                  </button>
                </div>
              </div>
            </div>

            {/* Optional Password */}
            {createIsPrivate && (
              <div>
                <label className="text-xs font-bold text-amber-300 block mb-1">
                  Contraseña de Acceso (Opcional):
                </label>
                <input
                  type="text"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="Dejar en blanco si solo requieres el código"
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {/* Character Selector */}
            <div>
              <label className="text-xs font-bold text-amber-300 block mb-1.5">
                Elige tu Personaje de los 90:
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {PC_MUS_CHARACTERS.map((char) => (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => {
                      setSelectedCharId(char.id);
                      voiceEngine.speakCharacter(char.id, char.presentation);
                    }}
                    className={`p-1.5 rounded-xl border text-center transition flex flex-col items-center ${
                      selectedCharId === char.id
                        ? 'bg-amber-950 border-amber-400 ring-2 ring-amber-400'
                        : 'bg-stone-900 border-stone-800 hover:border-amber-600/50'
                    }`}
                  >
                    <CharacterAvatar
                      characterId={char.id}
                      characterName={char.name}
                      size="xs"
                      className="mb-1"
                    />
                    <span className="text-[9px] font-serif font-bold truncate w-full text-stone-200">
                      {char.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="submit"
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-sm shadow-xl transition active:scale-95"
            >
              🚀 Crear Mesa y Esperar Jugadores
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: UNIRSE CON CÓDIGO */}
      {activeTab === 'join_code' && (
        <form onSubmit={handleJoinByCode} className="space-y-4 max-w-md mx-auto">
          <div className="bg-stone-950/70 p-5 rounded-2xl border border-stone-800 space-y-4">
            <div>
              <label className="text-xs font-bold text-amber-300 block mb-1">
                Código de la Sala Privada:
              </label>
              <input
                type="text"
                required
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="Ej: PRIV-4819 o MUS-1001"
                className="w-full px-4 py-2.5 bg-stone-900 border border-stone-700 rounded-xl text-sm font-mono tracking-wider font-bold text-amber-300 placeholder-stone-600 focus:outline-none focus:border-amber-500 uppercase"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-300 block mb-1">
                Contraseña (Si la sala la requiere):
              </label>
              <input
                type="password"
                value={joinPasswordInput}
                onChange={(e) => setJoinPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {joinError && (
              <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs font-bold text-center">
                {joinError}
              </div>
            )}
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="submit"
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl transition active:scale-95"
            >
              🔑 Acceder a la Partida Privada
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// Seat Card Sub-component
const SeatCard: React.FC<{
  seat: RoomSeat;
  label: string;
  isLocalPlayer: boolean;
  onTakeSeat: () => void;
}> = ({ seat, label, isLocalPlayer, onTakeSeat }) => {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] uppercase font-mono font-bold text-emerald-300/80 mb-1">
        {label}
      </span>
      {seat.occupied ? (
        <div
          className={`p-2.5 rounded-2xl border flex items-center gap-2 shadow-lg min-w-[150px] ${
            isLocalPlayer
              ? 'bg-amber-950/90 border-amber-400 ring-2 ring-amber-400'
              : 'bg-stone-900/90 border-stone-700'
          }`}
        >
          <CharacterAvatar
            characterId={seat.characterId}
            characterName={seat.playerName}
            size="sm"
          />
          <div className="text-left">
            <div className="font-serif font-bold text-xs text-stone-100 flex items-center gap-1">
              <span>{seat.playerName}</span>
              {seat.isHost && <span title="Anfitrión">👑</span>}
            </div>
            <div className="text-[9px] text-stone-400">
              {seat.isBot ? '🤖 Bot de Mus' : isLocalPlayer ? '🟢 Tú (Online)' : '🟢 Humano'}
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={onTakeSeat}
          className="px-4 py-2 rounded-2xl bg-stone-900/60 hover:bg-stone-800 border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 text-emerald-300 text-xs font-bold transition flex items-center gap-1.5 shadow"
        >
          <span>+</span>
          <span>Sentarse Aquí</span>
        </button>
      )}
    </div>
  );
};
