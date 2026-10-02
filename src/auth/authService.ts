// Client for the account API: login session, own profile and (for admins) user management.
export type Role = 'admin' | 'player';
export type Difficulty = 'facil' | 'medio' | 'dificil';

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  role: Role;
  avatarId: string;
  difficulty: Difficulty;
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number;
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  facil: 'Fácil',
  medio: 'Medio',
  dificil: 'Difícil',
};

const TOKEN_KEY = 'pc_mus_session_token';

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

class AuthService {
  private token: string | null = null;
  private listeners = new Set<() => void>();

  constructor() {
    try {
      this.token = localStorage.getItem(TOKEN_KEY);
    } catch {
      this.token = null;
    }
  }

  getToken() {
    return this.token;
  }

  private setToken(token: string | null) {
    this.token = token;
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* private mode */
    }
  }

  // Called when the server says the session is gone
  onSessionLost(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  authHeaders(): Record<string, string> {
    return this.token ? { authorization: `Bearer ${this.token}` } : {};
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`/api${path}`, {
        method,
        headers: { 'content-type': 'application/json', ...this.authHeaders() },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: 'no-store',
      });
    } catch {
      throw new AuthError(0, 'No hay conexión con el servidor del juego.');
    }
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      /* not JSON */
    }
    if (!res.ok) {
      if (res.status === 401 && this.token && path !== '/auth/login') {
        this.setToken(null);
        this.listeners.forEach((l) => l());
      }
      if (res.status === 404 && !data?.error) {
        throw new AuthError(404, 'El servidor del juego no está disponible. Arráncalo con «npm run dev».');
      }
      throw new AuthError(res.status, data?.error || `Error del servidor (${res.status}).`);
    }
    return data as T;
  }

  async login(username: string, password: string): Promise<AuthUser> {
    const { token, user } = await this.request<{ token: string; user: AuthUser }>('POST', '/auth/login', {
      username,
      password,
    });
    this.setToken(token);
    return user;
  }

  async logout() {
    try {
      await this.request('POST', '/auth/logout');
    } catch {
      /* ignore */
    }
    this.setToken(null);
  }

  async me(): Promise<AuthUser | null> {
    if (!this.token) return null;
    try {
      return await this.request<AuthUser>('GET', '/auth/me');
    } catch (err) {
      if (err instanceof AuthError && err.status === 401) return null;
      throw err;
    }
  }

  // Own data
  loadProfile() {
    return this.request<{ profile: unknown }>('GET', '/me/profile');
  }
  saveProfile(profile: unknown) {
    return this.request<{ ok: true }>('PUT', '/me/profile', { profile });
  }
  savePreferences(prefs: { difficulty?: Difficulty; avatarId?: string }) {
    return this.request<AuthUser>('PUT', '/me/preferences', prefs);
  }

  // Administration
  listUsers() {
    return this.request<AuthUser[]>('GET', '/users');
  }
  createUser(data: { username: string; password: string; displayName?: string; role?: Role; avatarId?: string; difficulty?: Difficulty }) {
    return this.request<AuthUser>('POST', '/users', data);
  }
  updateUser(
    id: string,
    data: Partial<{ username: string; password: string; displayName: string; role: Role; avatarId: string; difficulty: Difficulty; resetLearning: boolean }>
  ) {
    return this.request<AuthUser>('PUT', `/users/${encodeURIComponent(id)}`, data);
  }
  deleteUser(id: string) {
    return this.request<{ ok: true }>('DELETE', `/users/${encodeURIComponent(id)}`);
  }
}

export const authService = new AuthService();
