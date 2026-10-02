// User accounts, login sessions and the per-user AI learning profile.
// Stored as JSON files in DATA_DIR (default ./data). Passwords are hashed with scrypt.
import fs from 'fs';
import path from 'path';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { RoomError } from './rooms';

export type Role = 'admin' | 'player';
export type Difficulty = 'facil' | 'medio' | 'dificil';

interface StoredUser {
  id: string;
  username: string; // lowercase, unique
  displayName: string;
  role: Role;
  passwordHash: string;
  avatarId: string;
  difficulty: Difficulty;
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number;
  profile?: unknown; // AI learning data (stats + play style)
}

export interface PublicUser {
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

interface Session {
  userId: string;
  expiresAt: number;
}

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const DIFFICULTIES: Difficulty[] = ['facil', 'medio', 'dificil'];

// Default administrator (can be overridden with ADMIN_USER / ADMIN_PASSWORD)
const DEFAULT_ADMIN_USER = (process.env.ADMIN_USER || 'chevi').toLowerCase();
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456';

let users: StoredUser[] = [];
let sessions: Record<string, Session> = {};

// ───────── persistence ─────────

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, data: unknown) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 1));
  fs.renameSync(tmp, file); // atomic replace
}

let saveTimer: NodeJS.Timeout | null = null;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      writeJson(USERS_FILE, { users });
      writeJson(SESSIONS_FILE, { sessions });
    } catch (err) {
      console.error('No se pudieron guardar los usuarios', err);
    }
  }, 200);
}

// ───────── passwords ─────────

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split(':');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// ───────── validation ─────────

const clean = (v: unknown, max: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

function validUsername(v: unknown): string {
  const u = String(v ?? '').trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,24}$/.test(u)) {
    throw new RoomError(400, 'El usuario debe tener de 3 a 24 caracteres: letras, números, punto, guion o guion bajo.');
  }
  return u;
}

function validPassword(v: unknown): string {
  const p = String(v ?? '');
  if (p.length < 6 || p.length > 100) throw new RoomError(400, 'La contraseña debe tener al menos 6 caracteres.');
  return p;
}

const validRole = (v: unknown): Role => (v === 'admin' ? 'admin' : 'player');
const validDifficulty = (v: unknown): Difficulty => (DIFFICULTIES.includes(v as Difficulty) ? (v as Difficulty) : 'medio');

const toPublic = (u: StoredUser): PublicUser => ({
  id: u.id,
  username: u.username,
  displayName: u.displayName,
  role: u.role,
  avatarId: u.avatarId,
  difficulty: u.difficulty,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
  lastLoginAt: u.lastLoginAt,
});

// ───────── startup ─────────

export function initAuth() {
  users = readJson<{ users: StoredUser[] }>(USERS_FILE, { users: [] }).users || [];
  sessions = readJson<{ sessions: Record<string, Session> }>(SESSIONS_FILE, { sessions: {} }).sessions || {};
  const now = Date.now();
  for (const [token, s] of Object.entries(sessions)) {
    if (s.expiresAt < now || !users.some((u) => u.id === s.userId)) delete sessions[token];
  }
  if (!users.some((u) => u.role === 'admin')) {
    const existing = users.find((u) => u.username === DEFAULT_ADMIN_USER);
    if (existing) {
      existing.role = 'admin';
    } else {
      users.push({
        id: `u-${randomBytes(6).toString('hex')}`,
        username: DEFAULT_ADMIN_USER,
        displayName: DEFAULT_ADMIN_USER.charAt(0).toUpperCase() + DEFAULT_ADMIN_USER.slice(1),
        role: 'admin',
        passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD),
        avatarId: 'tio_gil',
        difficulty: 'medio',
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(`Administrador por defecto disponible: «${DEFAULT_ADMIN_USER}»`);
  }
  scheduleSave();
}

// ───────── login / sessions ─────────

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function login(body: any, ip: string): { token: string; user: PublicUser } {
  const now = Date.now();
  const key = `${ip}|${String(body?.username ?? '').toLowerCase()}`;
  const attempt = loginAttempts.get(key);
  if (attempt && attempt.resetAt > now && attempt.count >= 8) {
    throw new RoomError(429, 'Demasiados intentos. Espera unos minutos y vuelve a probar.');
  }
  const username = String(body?.username ?? '').trim().toLowerCase();
  const user = users.find((u) => u.username === username);
  // Always run the hash so timing does not reveal whether the user exists
  const ok = verifyPassword(String(body?.password ?? ''), user?.passwordHash || hashPassword('x'.repeat(8))) && !!user;
  if (!ok || !user) {
    const next = attempt && attempt.resetAt > now ? attempt : { count: 0, resetAt: now + 5 * 60 * 1000 };
    next.count += 1;
    loginAttempts.set(key, next);
    throw new RoomError(401, 'Usuario o contraseña incorrectos.');
  }
  loginAttempts.delete(key);
  const token = randomBytes(32).toString('hex');
  sessions[token] = { userId: user.id, expiresAt: now + SESSION_MS };
  user.lastLoginAt = now;
  scheduleSave();
  return { token, user: toPublic(user) };
}

export function logout(token: string | undefined) {
  if (token && sessions[token]) {
    delete sessions[token];
    scheduleSave();
  }
  return { ok: true };
}

const bearer = (authHeader: string | undefined) => {
  const m = /^Bearer\s+([a-f0-9]{64})$/i.exec(authHeader || '');
  return m ? m[1] : undefined;
};

export function tokenFrom(authHeader: string | undefined) {
  return bearer(authHeader);
}

export function requireUser(authHeader: string | undefined): StoredUser {
  const token = bearer(authHeader);
  if (!token) throw new RoomError(401, 'Inicia sesión para jugar.');
  const s = sessions[token];
  if (!s || s.expiresAt < Date.now()) {
    if (token && s) {
      delete sessions[token];
      scheduleSave();
    }
    throw new RoomError(401, 'Tu sesión ha caducado. Vuelve a entrar.');
  }
  const user = users.find((u) => u.id === s.userId);
  if (!user) throw new RoomError(401, 'Tu sesión ha caducado. Vuelve a entrar.');
  return user;
}

export function requireAdmin(authHeader: string | undefined): StoredUser {
  const user = requireUser(authHeader);
  if (user.role !== 'admin') throw new RoomError(403, 'Solo el administrador puede gestionar usuarios.');
  return user;
}

export const me = (user: StoredUser) => toPublic(user);

// ───────── own profile & preferences ─────────

export function getProfile(user: StoredUser) {
  return { profile: user.profile ?? null };
}

export function saveProfile(user: StoredUser, body: any) {
  const profile = body?.profile;
  if (!profile || typeof profile !== 'object') throw new RoomError(400, 'Perfil no válido.');
  if (JSON.stringify(profile).length > 50_000) throw new RoomError(413, 'Perfil demasiado grande.');
  user.profile = profile;
  user.updatedAt = Date.now();
  scheduleSave();
  return { ok: true };
}

export function savePreferences(user: StoredUser, body: any) {
  if (body?.difficulty !== undefined) user.difficulty = validDifficulty(body.difficulty);
  if (body?.avatarId !== undefined) user.avatarId = clean(body.avatarId, 40) || user.avatarId;
  user.updatedAt = Date.now();
  scheduleSave();
  return toPublic(user);
}

// ───────── administration ─────────

export const listUsers = () => users.map(toPublic).sort((a, b) => a.username.localeCompare(b.username));

export function createUser(body: any): PublicUser {
  const username = validUsername(body?.username);
  if (users.some((u) => u.username === username)) throw new RoomError(409, 'Ya existe un usuario con ese nombre.');
  const now = Date.now();
  const user: StoredUser = {
    id: `u-${randomBytes(6).toString('hex')}`,
    username,
    displayName: clean(body?.displayName, 30) || username,
    role: validRole(body?.role),
    passwordHash: hashPassword(validPassword(body?.password)),
    avatarId: clean(body?.avatarId, 40) || 'tio_gil',
    difficulty: validDifficulty(body?.difficulty),
    createdAt: now,
    updatedAt: now,
  };
  users.push(user);
  scheduleSave();
  return toPublic(user);
}

const admins = () => users.filter((u) => u.role === 'admin');

export function updateUser(admin: StoredUser, id: string, body: any): PublicUser {
  const user = users.find((u) => u.id === id);
  if (!user) throw new RoomError(404, 'Ese usuario no existe.');
  if (body?.username !== undefined) {
    const username = validUsername(body.username);
    if (users.some((u) => u.username === username && u.id !== id)) throw new RoomError(409, 'Ya existe un usuario con ese nombre.');
    user.username = username;
  }
  if (body?.displayName !== undefined) user.displayName = clean(body.displayName, 30) || user.username;
  if (body?.role !== undefined) {
    const role = validRole(body.role);
    if (user.role === 'admin' && role !== 'admin' && admins().length <= 1) {
      throw new RoomError(409, 'Debe quedar al menos un administrador.');
    }
    if (user.id === admin.id && role !== 'admin') throw new RoomError(409, 'No puedes quitarte a ti mismo el rol de administrador.');
    user.role = role;
  }
  if (body?.avatarId !== undefined) user.avatarId = clean(body.avatarId, 40) || user.avatarId;
  if (body?.difficulty !== undefined) user.difficulty = validDifficulty(body.difficulty);
  if (body?.password) {
    user.passwordHash = hashPassword(validPassword(body.password));
    // A new password closes the user's other sessions
    for (const [token, s] of Object.entries(sessions)) if (s.userId === user.id && user.id !== admin.id) delete sessions[token];
  }
  if (body?.resetLearning) user.profile = undefined;
  user.updatedAt = Date.now();
  scheduleSave();
  return toPublic(user);
}

export function deleteUser(admin: StoredUser, id: string) {
  const user = users.find((u) => u.id === id);
  if (!user) throw new RoomError(404, 'Ese usuario no existe.');
  if (user.id === admin.id) throw new RoomError(409, 'No puedes borrar tu propio usuario.');
  if (user.role === 'admin' && admins().length <= 1) throw new RoomError(409, 'Debe quedar al menos un administrador.');
  users = users.filter((u) => u.id !== id);
  for (const [token, s] of Object.entries(sessions)) if (s.userId === id) delete sessions[token];
  scheduleSave();
  return { ok: true };
}
