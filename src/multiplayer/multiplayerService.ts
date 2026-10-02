// Online rooms client: talks to the PC Mus server (server.ts) over plain HTTP.
// Polling is used instead of WebSockets so it works behind any proxy (AI Studio, Cloud Run).
import { MultiplayerRoom, NetAction } from '../types';
import { authService } from '../auth/authService';

const ACTIVE_ROOM_KEY = 'pc_mus_active_room';

const storage = {
  get(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string | null) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      /* private mode: identity lives only in memory */
    }
  },
};

export class MultiplayerError extends Error {}

export interface PlayerInfo {
  name: string;
  characterId: string;
  seatIndex?: number;
}

class MultiplayerService {
  // Online identity = the logged-in account (set by the app after login)
  private playerId = '';

  public setPlayerId(id: string) {
    this.playerId = id;
  }

  public getPlayerId(): string {
    return this.playerId;
  }

  // Remember the room we're playing in, to rejoin it after a page reload
  public getActiveRoomId(): string | null {
    return storage.get(ACTIVE_ROOM_KEY);
  }
  public setActiveRoomId(roomId: string | null) {
    storage.set(ACTIVE_ROOM_KEY, roomId);
  }

  private async request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`/api${path}`, {
        method,
        headers: { 'content-type': 'application/json', ...authService.authHeaders() },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: 'no-store',
      });
    } catch {
      throw new MultiplayerError('No hay conexión con el servidor de partidas online.');
    }
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      /* non-JSON answer */
    }
    if (!res.ok) {
      if (res.status === 404 && !data?.error) {
        throw new MultiplayerError(
          'El servidor online no está disponible. Arranca el juego con «npm run dev» (o «npm start» en producción).'
        );
      }
      throw new MultiplayerError(data?.error || `Error del servidor (${res.status}).`);
    }
    return data as T;
  }

  // ───────── lobby ─────────
  public listPublicRooms() {
    return this.request<MultiplayerRoom[]>('GET', '/rooms');
  }

  public createRoom(options: {
    name: string;
    isPrivate: boolean;
    password?: string;
    targetPiedras: number;
    playerName: string;
    characterId: string;
    seatIndex?: number;
  }) {
    return this.request<MultiplayerRoom>('POST', '/rooms', options);
  }

  public joinRoom(roomId: string, player: PlayerInfo) {
    return this.request<MultiplayerRoom>('POST', '/rooms/join', {
      roomId,
      playerName: player.name,
      characterId: player.characterId,
      seatIndex: player.seatIndex,
    });
  }

  public joinByCode(code: string, password: string, player: PlayerInfo) {
    return this.request<MultiplayerRoom>('POST', '/rooms/join', {
      code,
      password,
      playerName: player.name,
      characterId: player.characterId,
    });
  }

  public getRoom(roomId: string) {
    return this.request<MultiplayerRoom>('GET', `/rooms/${encodeURIComponent(roomId)}`);
  }

  public leaveRoom(roomId: string) {
    if (this.getActiveRoomId() === roomId) this.setActiveRoomId(null);
    return this.request<{ ok: true }>('POST', `/rooms/${encodeURIComponent(roomId)}/leave`).catch(() => ({ ok: true }));
  }

  public changeSeat(roomId: string, seatIndex: number) {
    return this.request<MultiplayerRoom>('POST', `/rooms/${encodeURIComponent(roomId)}/seat`, { seatIndex });
  }

  public fillWithBots(roomId: string) {
    return this.request<MultiplayerRoom>('POST', `/rooms/${encodeURIComponent(roomId)}/bots`);
  }

  public startRoomGame(roomId: string) {
    return this.request<MultiplayerRoom>('POST', `/rooms/${encodeURIComponent(roomId)}/start`);
  }

  public sendChatMessage(roomId: string, text: string, isQuickPhrase = false) {
    return this.request<{ ok: true }>('POST', `/rooms/${encodeURIComponent(roomId)}/chat`, { text, isQuickPhrase }).catch(
      () => ({ ok: true })
    );
  }

  // ───────── game sync ─────────
  public publishState(roomId: string, state: unknown) {
    return this.request<{ version: number }>('POST', `/rooms/${encodeURIComponent(roomId)}/state`, { state });
  }

  public sendAction(roomId: string, action: Omit<NetAction, 'seq' | 'seat'>) {
    return this.request<{ seq: number }>('POST', `/rooms/${encodeURIComponent(roomId)}/actions`, action);
  }

  public pullActions(roomId: string, after: number) {
    return this.request<{ actions: NetAction[] }>('GET', `/rooms/${encodeURIComponent(roomId)}/actions?after=${after}`);
  }

  // ───────── subscriptions (polling) ─────────
  private poll<T>(load: () => Promise<T>, onData: (data: T) => void, intervalMs: number, onError?: (err: Error) => void) {
    let stopped = false;
    let timer: number | undefined;
    const tick = async () => {
      if (stopped) return;
      try {
        const data = await load();
        if (!stopped) onData(data);
      } catch (err) {
        if (!stopped) onError?.(err as Error);
      }
      if (!stopped) timer = window.setTimeout(tick, document.hidden ? intervalMs * 3 : intervalMs);
    };
    tick();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }

  public subscribeToLobby(callback: (rooms: MultiplayerRoom[]) => void, onError?: (err: Error) => void): () => void {
    return this.poll(() => this.listPublicRooms(), callback, 3000, onError);
  }

  public subscribeToRoom(
    roomId: string,
    callback: (room: MultiplayerRoom) => void,
    onError?: (err: Error) => void,
    intervalMs = 700
  ): () => void {
    return this.poll(() => this.getRoom(roomId), callback, intervalMs, onError);
  }
}

export const multiplayerService = new MultiplayerService();
