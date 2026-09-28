import { MultiplayerRoom, RoomSeat, ChatMessage, MultiplayerActionPayload } from '../types';
import { PC_MUS_CHARACTERS } from '../characters';

const STORAGE_KEY = 'pc_mus_rooms_v1';
const CHANNEL_NAME = 'pc_mus_multiplayer_sync';

// Default seed rooms for a rich lobby experience
const SEED_ROOMS: MultiplayerRoom[] = [
  {
    id: 'room-pub-1',
    name: 'Taberna El As de Oros',
    code: 'ORO-1001',
    isPrivate: false,
    targetPiedras: 40,
    status: 'waiting',
    hostPlayerId: 'bot-gil',
    createdAt: Date.now() - 120000,
    updatedAt: Date.now(),
    seats: [
      {
        seatIndex: 0,
        occupied: true,
        playerId: 'bot-gil',
        playerName: 'Tío Gil',
        characterId: 'tio_gil',
        avatarColor: 'from-amber-700 to-red-900',
        avatarIcon: '👑',
        isHost: true,
        isBot: true,
        isReady: true,
      },
      {
        seatIndex: 1,
        occupied: true,
        playerId: 'bot-marques',
        playerName: 'El Marqués',
        characterId: 'el_marques',
        avatarColor: 'from-blue-700 to-indigo-950',
        avatarIcon: '🎩',
        isHost: false,
        isBot: true,
        isReady: true,
      },
      {
        seatIndex: 2,
        occupied: false,
        playerId: '',
        playerName: '',
        characterId: '',
        avatarColor: '',
        avatarIcon: '',
        isHost: false,
        isBot: false,
        isReady: false,
      },
      {
        seatIndex: 3,
        occupied: false,
        playerId: '',
        playerName: '',
        characterId: '',
        avatarColor: '',
        avatarIcon: '',
        isHost: false,
        isBot: false,
        isReady: false,
      },
    ],
    chat: [
      {
        id: 'msg-seed-1',
        senderName: 'Tío Gil',
        seat: 0,
        text: '¡Vayan sentándose, que hoy nos llevamos el chico tal y tal!',
        timestamp: '15:45',
        isQuickPhrase: true,
      },
    ],
  },
  {
    id: 'room-pub-2',
    name: 'Peña Los Musolaris de Madrid',
    code: 'MAD-2026',
    isPrivate: false,
    targetPiedras: 30,
    status: 'waiting',
    hostPlayerId: 'bot-norma',
    createdAt: Date.now() - 300000,
    updatedAt: Date.now(),
    seats: [
      {
        seatIndex: 0,
        occupied: true,
        playerId: 'bot-norma',
        playerName: 'Doña Norma',
        characterId: 'dona_norma',
        avatarColor: 'from-fuchsia-700 to-purple-950',
        avatarIcon: '💃',
        isHost: true,
        isBot: true,
        isReady: true,
      },
      {
        seatIndex: 1,
        occupied: false,
        playerId: '',
        playerName: '',
        characterId: '',
        avatarColor: '',
        avatarIcon: '',
        isHost: false,
        isBot: false,
        isReady: false,
      },
      {
        seatIndex: 2,
        occupied: true,
        playerId: 'bot-rosa',
        playerName: 'Señorita Rosa',
        characterId: 'rosa',
        avatarColor: 'from-pink-700 to-rose-950',
        avatarIcon: '💄',
        isHost: false,
        isBot: true,
        isReady: true,
      },
      {
        seatIndex: 3,
        occupied: false,
        playerId: '',
        playerName: '',
        characterId: '',
        avatarColor: '',
        avatarIcon: '',
        isHost: false,
        isBot: false,
        isReady: false,
      },
    ],
    chat: [
      {
        id: 'msg-seed-2',
        senderName: 'Doña Norma',
        seat: 0,
        text: '¡Bienvenidos a la mesa! Buscamos pareja para jugar a 30 piedras.',
        timestamp: '15:50',
        isQuickPhrase: false,
      },
    ],
  },
];

class MultiplayerService {
  private channel: BroadcastChannel | null = null;
  private localPlayerId: string;
  private roomListeners: Map<string, Set<(room: MultiplayerRoom) => void>> = new Map();
  private lobbyListeners: Set<(rooms: MultiplayerRoom[]) => void> = new Set();

  constructor() {
    this.localPlayerId = this.initPlayerId();
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          const { type, payload } = event.data;
          if (type === 'ROOM_UPDATED' && payload) {
            this.notifyRoomListeners(payload);
            this.notifyLobbyListeners();
          } else if (type === 'ROOM_LIST_CHANGED') {
            this.notifyLobbyListeners();
          }
        };
      } catch {
        // Fallback for sandboxes that disable BroadcastChannel
      }

      // Also listen to window storage events across tabs
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          this.notifyLobbyListeners();
        }
      });
    }
  }

  public getPlayerId(): string {
    return this.localPlayerId;
  }

  private initPlayerId(): string {
    if (typeof window === 'undefined') return 'p-' + Math.random().toString(36).substring(2, 8);
    let id = localStorage.getItem('pc_mus_player_id');
    if (!id) {
      id = 'user-' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('pc_mus_player_id', id);
    }
    return id;
  }

  private loadRooms(): MultiplayerRoom[] {
    if (typeof window === 'undefined') return [...SEED_ROOMS];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ROOMS));
        return [...SEED_ROOMS];
      }
      const parsed: MultiplayerRoom[] = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...SEED_ROOMS];
    } catch {
      return [...SEED_ROOMS];
    }
  }

  private saveRooms(rooms: MultiplayerRoom[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
      this.broadcast('ROOM_LIST_CHANGED', null);
      this.notifyLobbyListeners();
    } catch (e) {
      console.error('Failed to save rooms', e);
    }
  }

  private broadcast(type: string, payload: any) {
    if (this.channel) {
      try {
        this.channel.postMessage({ type, payload });
      } catch {}
    }
  }

  public listPublicRooms(): MultiplayerRoom[] {
    const rooms = this.loadRooms();
    return rooms.filter((r) => !r.isPrivate);
  }

  public getAllRooms(): MultiplayerRoom[] {
    return this.loadRooms();
  }

  public getRoom(roomId: string): MultiplayerRoom | null {
    const rooms = this.loadRooms();
    return rooms.find((r) => r.id === roomId) || null;
  }

  public findRoomByCode(code: string): MultiplayerRoom | null {
    const cleanCode = code.trim().toUpperCase();
    const rooms = this.loadRooms();
    return rooms.find((r) => r.code.toUpperCase() === cleanCode) || null;
  }

  public createRoom(options: {
    name: string;
    isPrivate: boolean;
    password?: string;
    targetPiedras: number;
    playerName: string;
    characterId: string;
    seatIndex?: number;
  }): MultiplayerRoom {
    const rooms = this.loadRooms();
    const char = PC_MUS_CHARACTERS.find((c) => c.id === options.characterId) || PC_MUS_CHARACTERS[0];
    
    // Generate clean 4-char room code, e.g. MUS-4192
    const codeNumber = Math.floor(1000 + Math.random() * 9000);
    const code = `${options.isPrivate ? 'PRIV' : 'MUS'}-${codeNumber}`;
    const targetSeat = options.seatIndex ?? 0;

    const initialSeats: RoomSeat[] = [0, 1, 2, 3].map((idx) => {
      if (idx === targetSeat) {
        return {
          seatIndex: idx,
          occupied: true,
          playerId: this.localPlayerId,
          playerName: options.playerName || char.name,
          characterId: char.id,
          avatarColor: char.visual.bgColor,
          avatarIcon: char.visual.emoji,
          isHost: true,
          isBot: false,
          isReady: true,
        };
      }
      return {
        seatIndex: idx,
        occupied: false,
        playerId: '',
        playerName: '',
        characterId: '',
        avatarColor: '',
        avatarIcon: '',
        isHost: false,
        isBot: false,
        isReady: false,
      };
    });

    const newRoom: MultiplayerRoom = {
      id: 'room-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: options.name || (options.isPrivate ? 'Mesa Privada de Mus' : 'Mesa de Mus Abierta'),
      code,
      isPrivate: options.isPrivate,
      password: options.password,
      targetPiedras: options.targetPiedras || 40,
      status: 'waiting',
      hostPlayerId: this.localPlayerId,
      seats: initialSeats,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      chat: [
        {
          id: 'msg-' + Date.now(),
          senderName: 'Sistema',
          seat: targetSeat,
          text: `Sala creada. ¡Invita a tus compañeros con el código ${code}!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };

    rooms.unshift(newRoom);
    this.saveRooms(rooms);
    this.broadcast('ROOM_UPDATED', newRoom);
    return newRoom;
  }

  public joinRoom(
    roomId: string,
    player: { name: string; characterId: string; seatIndex?: number }
  ): { success: boolean; message: string; room?: MultiplayerRoom } {
    const rooms = this.loadRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return { success: false, message: 'La sala no existe.' };

    const char = PC_MUS_CHARACTERS.find((c) => c.id === player.characterId) || PC_MUS_CHARACTERS[0];
    
    // Check if player is already seated
    const existingSeat = room.seats.find((s) => s.playerId === this.localPlayerId);
    if (existingSeat) {
      return { success: true, message: 'Ya estás en esta mesa.', room };
    }

    // Determine target seat
    let seatToTake = player.seatIndex;
    if (seatToTake === undefined || room.seats[seatToTake]?.occupied) {
      // Find first empty seat
      const emptySeat = room.seats.find((s) => !s.occupied);
      if (!emptySeat) {
        return { success: false, message: 'La sala está completa (4/4 jugadores).' };
      }
      seatToTake = emptySeat.seatIndex;
    }

    room.seats[seatToTake] = {
      seatIndex: seatToTake,
      occupied: true,
      playerId: this.localPlayerId,
      playerName: player.name || char.name,
      characterId: char.id,
      avatarColor: char.visual.bgColor,
      avatarIcon: char.visual.emoji,
      isHost: false,
      isBot: false,
      isReady: true,
    };

    room.updatedAt = Date.now();
    room.chat.push({
      id: 'msg-' + Date.now(),
      senderName: 'Sistema',
      seat: seatToTake,
      text: `${player.name || char.name} se ha unido a la mesa en el asiento ${['Sur', 'Este', 'Norte', 'Oeste'][seatToTake]}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    this.saveRooms(rooms);
    this.broadcast('ROOM_UPDATED', room);
    this.notifyRoomListeners(room);
    return { success: true, message: 'Te has unido con éxito.', room };
  }

  public leaveRoom(roomId: string): boolean {
    const rooms = this.loadRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return false;

    const seat = room.seats.find((s) => s.playerId === this.localPlayerId);
    if (!seat) return false;

    const isHost = seat.isHost;
    seat.occupied = false;
    seat.playerId = '';
    seat.playerName = '';
    seat.characterId = '';
    seat.avatarColor = '';
    seat.avatarIcon = '';
    seat.isHost = false;
    seat.isBot = false;
    seat.isReady = false;

    // If host left, transfer host to next human player or delete room if empty
    const remainingHumans = room.seats.filter((s) => s.occupied && !s.isBot);
    if (remainingHumans.length === 0) {
      // If user-created room is empty, remove it from list unless it's a seed room
      if (!room.id.startsWith('room-pub-')) {
        const filtered = rooms.filter((r) => r.id !== roomId);
        this.saveRooms(filtered);
        return true;
      }
    } else if (isHost) {
      remainingHumans[0].isHost = true;
      room.hostPlayerId = remainingHumans[0].playerId;
    }

    room.updatedAt = Date.now();
    this.saveRooms(rooms);
    this.broadcast('ROOM_UPDATED', room);
    this.notifyRoomListeners(room);
    return true;
  }

  public changeSeat(roomId: string, targetSeatIndex: number): boolean {
    const rooms = this.loadRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return false;

    const currentSeat = room.seats.find((s) => s.playerId === this.localPlayerId);
    if (!currentSeat) return false;
    if (room.seats[targetSeatIndex]?.occupied) return false;

    const fromIndex = currentSeat.seatIndex;
    room.seats[targetSeatIndex] = {
      ...currentSeat,
      seatIndex: targetSeatIndex,
    };

    room.seats[fromIndex] = {
      seatIndex: fromIndex,
      occupied: false,
      playerId: '',
      playerName: '',
      characterId: '',
      avatarColor: '',
      avatarIcon: '',
      isHost: false,
      isBot: false,
      isReady: false,
    };

    room.updatedAt = Date.now();
    this.saveRooms(rooms);
    this.broadcast('ROOM_UPDATED', room);
    this.notifyRoomListeners(room);
    return true;
  }

  public fillWithBots(roomId: string): boolean {
    const rooms = this.loadRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return false;

    const usedCharIds = new Set(room.seats.filter((s) => s.occupied).map((s) => s.characterId));
    const availableBots = PC_MUS_CHARACTERS.filter((c) => !usedCharIds.has(c.id));
    let botIndex = 0;

    room.seats.forEach((seat) => {
      if (!seat.occupied) {
        const bot = availableBots[botIndex] || PC_MUS_CHARACTERS[botIndex % PC_MUS_CHARACTERS.length];
        botIndex++;
        seat.occupied = true;
        seat.playerId = 'bot-' + bot.id + '-' + Math.random().toString(36).substring(2, 5);
        seat.playerName = bot.name;
        seat.characterId = bot.id;
        seat.avatarColor = bot.visual.bgColor;
        seat.avatarIcon = bot.visual.emoji;
        seat.isHost = false;
        seat.isBot = true;
        seat.isReady = true;
      }
    });

    room.updatedAt = Date.now();
    room.chat.push({
      id: 'msg-' + Date.now(),
      senderName: 'Sistema',
      seat: 0,
      text: 'Se han completado los asientos vacíos con jugadores IA de PC Mus.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    this.saveRooms(rooms);
    this.broadcast('ROOM_UPDATED', room);
    this.notifyRoomListeners(room);
    return true;
  }

  public startRoomGame(roomId: string): boolean {
    const rooms = this.loadRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return false;

    // Check if all 4 seats are occupied
    const allOccupied = room.seats.every((s) => s.occupied);
    if (!allOccupied) return false;

    room.status = 'playing';
    room.updatedAt = Date.now();
    this.saveRooms(rooms);
    this.broadcast('ROOM_UPDATED', room);
    this.notifyRoomListeners(room);
    return true;
  }

  public sendChatMessage(roomId: string, text: string, isQuickPhrase = false): boolean {
    const rooms = this.loadRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return false;

    const seat = room.seats.find((s) => s.playerId === this.localPlayerId);
    if (!seat) return false;

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      senderName: seat.playerName,
      seat: seat.seatIndex,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isQuickPhrase,
    };

    room.chat.push(newMsg);
    if (room.chat.length > 50) room.chat.shift();
    room.updatedAt = Date.now();

    this.saveRooms(rooms);
    this.broadcast('ROOM_UPDATED', room);
    this.notifyRoomListeners(room);
    return true;
  }

  public dispatchGameAction(action: MultiplayerActionPayload) {
    this.broadcast('GAME_ACTION', action);
  }

  public subscribeToRoom(roomId: string, callback: (room: MultiplayerRoom) => void): () => void {
    if (!this.roomListeners.has(roomId)) {
      this.roomListeners.set(roomId, new Set());
    }
    this.roomListeners.get(roomId)!.add(callback);

    // Provide initial state
    const current = this.getRoom(roomId);
    if (current) callback(current);

    return () => {
      this.roomListeners.get(roomId)?.delete(callback);
    };
  }

  public subscribeToLobby(callback: (rooms: MultiplayerRoom[]) => void): () => void {
    this.lobbyListeners.add(callback);
    callback(this.listPublicRooms());

    return () => {
      this.lobbyListeners.delete(callback);
    };
  }

  private notifyRoomListeners(room: MultiplayerRoom) {
    const listeners = this.roomListeners.get(room.id);
    if (listeners) {
      listeners.forEach((cb) => cb(room));
    }
  }

  private notifyLobbyListeners() {
    const rooms = this.listPublicRooms();
    this.lobbyListeners.forEach((cb) => cb(rooms));
  }
}

export const multiplayerService = new MultiplayerService();
