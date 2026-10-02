// In-memory store of online Mus rooms. The host's browser runs the game engine and
// publishes snapshots here; the other seated players read them and send actions.
import { randomBytes } from 'crypto';
import { PC_MUS_CHARACTERS } from '../src/characters';
import type { ChatMessage, MultiplayerRoom, NetAction, RoomSeat } from '../src/types';

interface ServerRoom extends Omit<MultiplayerRoom, 'hasPassword' | 'state' | 'stateVersion' | 'hostOnline'> {
  password?: string;
  state: unknown | null;
  stateVersion: number;
  actions: NetAction[];
  actionSeq: number;
  lastSeen: Record<string, number>;
  seed?: boolean;
}

export class RoomError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const SEAT_NAMES = ['Sur', 'Este', 'Norte', 'Oeste'];
const MAX_ROOMS = 500;
const IDLE_ROOM_MS = 30 * 60 * 1000; // rooms without any human for 30 min are removed
const HOST_ONLINE_MS = 15 * 1000;

const rooms = new Map<string, ServerRoom>();

const now = () => Date.now();
const clockTime = () => new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
const clean = (value: unknown, max: number) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

const emptySeat = (seatIndex: number): RoomSeat => ({
  seatIndex,
  occupied: false,
  playerId: '',
  playerName: '',
  characterId: '',
  avatarColor: '',
  avatarIcon: '',
  isHost: false,
  isBot: false,
  isReady: false,
});

const charFor = (characterId: unknown) =>
  PC_MUS_CHARACTERS.find((c) => c.id === characterId) || PC_MUS_CHARACTERS[0];

const humanSeat = (seatIndex: number, playerId: string, name: string, characterId: unknown, isHost: boolean): RoomSeat => {
  const char = charFor(characterId);
  return {
    seatIndex,
    occupied: true,
    playerId,
    playerName: clean(name, 30) || char.name,
    characterId: char.id,
    avatarColor: char.visual.bgColor,
    avatarIcon: char.visual.emoji,
    isHost,
    isBot: false,
    isReady: true,
  };
};

const botSeat = (seatIndex: number, characterId: string): RoomSeat => {
  const char = charFor(characterId);
  return {
    seatIndex,
    occupied: true,
    playerId: `bot-${char.id}-${randomBytes(2).toString('hex')}`,
    playerName: char.name,
    characterId: char.id,
    avatarColor: char.visual.bgColor,
    avatarIcon: char.visual.emoji,
    isHost: false,
    isBot: true,
    isReady: true,
  };
};

const systemMessage = (room: ServerRoom, text: string, seat = 0) => {
  room.chat.push({ id: `msg-${now()}-${randomBytes(2).toString('hex')}`, senderName: 'Sistema', seat, text, timestamp: clockTime() });
  if (room.chat.length > 60) room.chat.splice(0, room.chat.length - 60);
};

const touch = (room: ServerRoom) => {
  room.updatedAt = now();
};

const newCode = (isPrivate: boolean) => {
  for (let i = 0; i < 50; i++) {
    const code = `${isPrivate ? 'PRIV' : 'MUS'}-${Math.floor(1000 + Math.random() * 9000)}`;
    if (![...rooms.values()].some((r) => r.code === code)) return code;
  }
  return `${isPrivate ? 'PRIV' : 'MUS'}-${randomBytes(3).toString('hex').toUpperCase()}`;
};

// ───────── views sent to clients ─────────

function publicView(room: ServerRoom, viewerId?: string): MultiplayerRoom {
  const isMember = !!viewerId && room.seats.some((s) => s.playerId === viewerId);
  const host = room.hostPlayerId;
  return {
    id: room.id,
    name: room.name,
    code: room.code,
    isPrivate: room.isPrivate,
    hasPassword: !!room.password,
    targetPiedras: room.targetPiedras,
    status: room.status,
    hostPlayerId: room.hostPlayerId,
    seats: room.seats,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    chat: isMember ? room.chat : [],
    stateVersion: room.stateVersion,
    state: isMember ? room.state : undefined,
    hostOnline: !!host && now() - (room.lastSeen[host] || 0) < HOST_ONLINE_MS,
  };
}

const getRoom = (roomId: unknown): ServerRoom => {
  const room = rooms.get(clean(roomId, 80));
  if (!room) throw new RoomError(404, 'La sala no existe o ya ha terminado.');
  return room;
};

const seatOf = (room: ServerRoom, playerId: string) => room.seats.find((s) => s.playerId === playerId);

const requireSeat = (room: ServerRoom, playerId: string) => {
  const seat = seatOf(room, playerId);
  if (!seat) throw new RoomError(403, 'No estás sentado en esta mesa.');
  return seat;
};

export function seen(room: { id: string }, playerId: string) {
  const r = rooms.get(room.id);
  if (r) r.lastSeen[playerId] = now();
}

// ───────── lobby ─────────

export function listPublicRooms(): MultiplayerRoom[] {
  return [...rooms.values()]
    .filter((r) => !r.isPrivate && r.status === 'waiting')
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 40)
    .map((r) => publicView(r));
}

export function createRoom(playerId: string, body: any): MultiplayerRoom {
  if (rooms.size >= MAX_ROOMS) cleanup(true);
  if (rooms.size >= MAX_ROOMS) throw new RoomError(503, 'Hay demasiadas mesas abiertas. Inténtalo en un rato.');
  const isPrivate = !!body?.isPrivate;
  const seatIndex = [0, 1, 2, 3].includes(body?.seatIndex) ? body.seatIndex : 0;
  const target = [30, 40].includes(Number(body?.targetPiedras)) ? Number(body.targetPiedras) : 40;
  const code = newCode(isPrivate);
  const room: ServerRoom = {
    id: `room-${now().toString(36)}-${randomBytes(3).toString('hex')}`,
    name: clean(body?.name, 40) || (isPrivate ? 'Mesa Privada de Mus' : 'Mesa de Mus Abierta'),
    code,
    isPrivate,
    password: clean(body?.password, 40) || undefined,
    targetPiedras: target,
    status: 'waiting',
    hostPlayerId: playerId,
    seats: [0, 1, 2, 3].map((i) =>
      i === seatIndex ? humanSeat(i, playerId, body?.playerName, body?.characterId, true) : emptySeat(i)
    ),
    createdAt: now(),
    updatedAt: now(),
    chat: [],
    state: null,
    stateVersion: 0,
    actions: [],
    actionSeq: 0,
    lastSeen: { [playerId]: now() },
  };
  systemMessage(room, `Sala creada. ¡Invita a tus compañeros con el código ${code}!`, seatIndex);
  rooms.set(room.id, room);
  return publicView(room, playerId);
}

export function joinRoom(playerId: string, body: any): MultiplayerRoom {
  let room: ServerRoom | undefined;
  if (body?.code) {
    const code = clean(body.code, 20).toUpperCase();
    room = [...rooms.values()].find((r) => r.code.toUpperCase() === code);
    if (!room) throw new RoomError(404, 'No se encontró ninguna partida con ese código.');
  } else {
    room = getRoom(body?.roomId);
    if (room.isPrivate) throw new RoomError(403, 'Esta mesa es privada: entra con su código.');
  }

  if (seatOf(room, playerId)) {
    seen(room, playerId);
    return publicView(room, playerId);
  }
  if (room.password && clean(body?.password, 40) !== room.password) {
    throw new RoomError(403, 'Contraseña incorrecta para esta partida privada.');
  }
  if (room.status !== 'waiting') throw new RoomError(409, 'La partida ya ha empezado en esta mesa.');

  const wanted = [0, 1, 2, 3].includes(body?.seatIndex) ? body.seatIndex : -1;
  const free = wanted >= 0 && !room.seats[wanted].occupied ? room.seats[wanted] : room.seats.find((s) => !s.occupied);
  if (!free) throw new RoomError(409, 'La sala está completa (4/4 jugadores).');

  // Public seed tables start without a host: the first person to sit down hosts the game
  const becomesHost = !room.hostPlayerId || !seatOf(room, room.hostPlayerId);
  room.seats[free.seatIndex] = humanSeat(free.seatIndex, playerId, body?.playerName, body?.characterId, becomesHost);
  if (becomesHost) room.hostPlayerId = playerId;
  room.lastSeen[playerId] = now();
  systemMessage(
    room,
    `${room.seats[free.seatIndex].playerName} se ha unido a la mesa en el asiento ${SEAT_NAMES[free.seatIndex]}.`,
    free.seatIndex
  );
  touch(room);
  return publicView(room, playerId);
}

export function getRoomView(playerId: string, roomId: unknown): MultiplayerRoom {
  const room = getRoom(roomId);
  if (seatOf(room, playerId)) room.lastSeen[playerId] = now();
  return publicView(room, playerId);
}

export function leaveRoom(playerId: string, roomId: unknown): { ok: true } {
  const room = getRoom(roomId);
  const seat = seatOf(room, playerId);
  if (!seat) return { ok: true };
  const name = seat.playerName;
  const wasHost = room.hostPlayerId === playerId;
  room.seats[seat.seatIndex] = emptySeat(seat.seatIndex);
  delete room.lastSeen[playerId];

  const humans = room.seats.filter((s) => s.occupied && !s.isBot);
  if (humans.length === 0) {
    if (room.seed) {
      // Seed tables go back to the lobby, fresh
      rooms.delete(room.id);
      ensureSeedRooms();
    } else {
      rooms.delete(room.id);
    }
    return { ok: true };
  }
  if (room.status === 'playing') {
    // The game runs in the host's browser: without the host it cannot go on
    if (wasHost) {
      room.status = 'finished';
      systemMessage(room, `${name} (anfitrión) ha abandonado la mesa. La partida ha terminado.`);
    } else {
      room.seats[seat.seatIndex] = botSeat(seat.seatIndex, seat.characterId);
      systemMessage(room, `${name} ha abandonado la mesa. Un jugador IA ocupa su sitio.`);
    }
  } else {
    systemMessage(room, `${name} ha abandonado la mesa.`);
  }
  if (wasHost && humans.length > 0 && room.status !== 'finished') {
    humans[0].isHost = true;
    room.hostPlayerId = humans[0].playerId;
  }
  touch(room);
  return { ok: true };
}

export function changeSeat(playerId: string, roomId: unknown, target: unknown): MultiplayerRoom {
  const room = getRoom(roomId);
  if (room.status !== 'waiting') throw new RoomError(409, 'La partida ya ha empezado.');
  const seat = requireSeat(room, playerId);
  const to = Number(target);
  if (![0, 1, 2, 3].includes(to) || room.seats[to].occupied) throw new RoomError(409, 'Ese asiento está ocupado.');
  room.seats[to] = { ...seat, seatIndex: to };
  room.seats[seat.seatIndex] = emptySeat(seat.seatIndex);
  touch(room);
  return publicView(room, playerId);
}

export function fillWithBots(playerId: string, roomId: unknown): MultiplayerRoom {
  const room = getRoom(roomId);
  requireSeat(room, playerId);
  if (room.status !== 'waiting') throw new RoomError(409, 'La partida ya ha empezado.');
  const used = new Set(room.seats.filter((s) => s.occupied).map((s) => s.characterId));
  const pool = PC_MUS_CHARACTERS.filter((c) => !used.has(c.id));
  let i = 0;
  room.seats.forEach((s, idx) => {
    if (!s.occupied) {
      room.seats[idx] = botSeat(idx, (pool[i] || PC_MUS_CHARACTERS[i % PC_MUS_CHARACTERS.length]).id);
      i++;
    }
  });
  systemMessage(room, 'Se han completado los asientos vacíos con jugadores IA de PC Mus.');
  touch(room);
  return publicView(room, playerId);
}

export function startRoomGame(playerId: string, roomId: unknown): MultiplayerRoom {
  const room = getRoom(roomId);
  if (room.hostPlayerId !== playerId) throw new RoomError(403, 'Solo el anfitrión puede empezar la partida.');
  if (!room.seats.every((s) => s.occupied)) throw new RoomError(409, 'Faltan jugadores en la mesa.');
  if (room.status === 'waiting') {
    room.status = 'playing';
    room.state = null;
    room.stateVersion = 0;
    room.actions = [];
    systemMessage(room, '¡Comienza la partida! Que gane la mejor pareja.');
    touch(room);
  }
  return publicView(room, playerId);
}

export function sendChat(playerId: string, roomId: unknown, body: any): { ok: true } {
  const room = getRoom(roomId);
  const seat = requireSeat(room, playerId);
  const text = clean(body?.text, 200);
  if (!text) return { ok: true };
  const msg: ChatMessage = {
    id: `msg-${now()}-${randomBytes(2).toString('hex')}`,
    senderName: seat.playerName,
    seat: seat.seatIndex,
    text,
    timestamp: clockTime(),
    isQuickPhrase: !!body?.isQuickPhrase,
  };
  room.chat.push(msg);
  if (room.chat.length > 60) room.chat.splice(0, room.chat.length - 60);
  touch(room);
  return { ok: true };
}

// ───────── game sync ─────────

export function publishState(playerId: string, roomId: unknown, state: unknown): { version: number } {
  const room = getRoom(roomId);
  if (room.hostPlayerId !== playerId) throw new RoomError(403, 'Solo el anfitrión publica el estado de la partida.');
  if (room.status !== 'playing') throw new RoomError(409, 'La partida no está en juego.');
  room.state = state;
  room.stateVersion += 1;
  room.lastSeen[playerId] = now();
  return { version: room.stateVersion };
}

export function pushAction(playerId: string, roomId: unknown, body: any): { seq: number } {
  const room = getRoom(roomId);
  const seat = requireSeat(room, playerId);
  if (room.status !== 'playing') throw new RoomError(409, 'La partida no está en juego.');
  const kind = ['action', 'discard', 'seña', 'gaze'].includes(body?.kind) ? body.kind : null;
  if (!kind) throw new RoomError(400, 'Acción no válida.');
  room.actionSeq += 1;
  const action: NetAction = {
    seq: room.actionSeq,
    seat: seat.seatIndex,
    kind,
    action: body?.action ? clean(body.action, 30) : undefined,
    indices: Array.isArray(body?.indices)
      ? body.indices.map(Number).filter((n: number) => [0, 1, 2, 3].includes(n)).slice(0, 4)
      : undefined,
    señaId: body?.señaId ? clean(body.señaId, 30) : undefined,
    target: Number.isInteger(body?.target) ? body.target : undefined,
  };
  room.actions.push(action);
  if (room.actions.length > 200) room.actions.splice(0, room.actions.length - 200);
  room.lastSeen[playerId] = now();
  return { seq: action.seq };
}

export function pullActions(playerId: string, roomId: unknown, after: unknown): { actions: NetAction[] } {
  const room = getRoom(roomId);
  if (room.hostPlayerId !== playerId) throw new RoomError(403, 'Solo el anfitrión recibe las acciones.');
  room.lastSeen[playerId] = now();
  const from = Number(after) || 0;
  return { actions: room.actions.filter((a) => a.seq > from) };
}

// ───────── seeds & cleanup ─────────

function seedRoom(id: string, name: string, code: string, target: number, bots: [number, string][]) {
  const room: ServerRoom = {
    id,
    name,
    code,
    isPrivate: false,
    targetPiedras: target,
    status: 'waiting',
    hostPlayerId: '',
    seats: [0, 1, 2, 3].map((i) => {
      const bot = bots.find(([seat]) => seat === i);
      return bot ? botSeat(i, bot[1]) : emptySeat(i);
    }),
    createdAt: now(),
    updatedAt: now(),
    chat: [],
    state: null,
    stateVersion: 0,
    actions: [],
    actionSeq: 0,
    lastSeen: {},
    seed: true,
  };
  systemMessage(room, '¡Vayan sentándose, que hoy nos llevamos el chico!');
  rooms.set(id, room);
}

export function ensureSeedRooms() {
  if (!rooms.has('room-pub-1')) seedRoom('room-pub-1', 'Taberna El As de Oros', 'ORO-1001', 40, [[1, 'el_marques'], [3, 'tio_mateo']]);
  if (!rooms.has('room-pub-2')) seedRoom('room-pub-2', 'Peña Los Musolaris de Madrid', 'MAD-2026', 30, [[1, 'el_isidoro'], [3, 'dona_norma']]);
}

export function cleanup(aggressive = false) {
  const limit = aggressive ? 5 * 60 * 1000 : IDLE_ROOM_MS;
  for (const room of rooms.values()) {
    const humans = room.seats.filter((s) => s.occupied && !s.isBot);
    const lastHuman = Math.max(0, ...humans.map((s) => room.lastSeen[s.playerId] || 0));
    const idle = now() - Math.max(lastHuman, room.updatedAt) > limit;
    if (room.seed) {
      if (idle && humans.length > 0) {
        rooms.delete(room.id);
      }
      continue;
    }
    if (idle || (room.status === 'finished' && now() - room.updatedAt > 10 * 60 * 1000)) rooms.delete(room.id);
  }
  ensureSeedRooms();
}
