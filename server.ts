// PC Mus server: serves the game and the online rooms API.
// - Development: `npm run dev` (Vite runs as middleware, same port).
// - Production:  `npm run build && npm start` (serves the built `dist/`).
import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  RoomError,
  changeSeat,
  cleanup,
  createRoom,
  ensureSeedRooms,
  fillWithBots,
  getRoomView,
  joinRoom,
  leaveRoom,
  listPublicRooms,
  publishState,
  pullActions,
  pushAction,
  sendChat,
  startRoomGame,
} from './server/rooms';
import {
  createUser,
  deleteUser,
  getProfile,
  initAuth,
  listUsers,
  login,
  logout,
  me,
  requireAdmin,
  requireUser,
  savePreferences,
  saveProfile,
  tokenFrom,
  updateUser,
} from './server/auth';

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const rootDir = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', true); // real client IP behind Cloud Run / AI Studio (login rate limit)
  app.use('/api', express.json({ limit: '600kb' }));

  // Every game call needs a logged-in user (access control); rooms use the account id
  const player = (req: Request) => requireUser(req.header('authorization')).id;
  const user = (req: Request) => requireUser(req.header('authorization'));
  const admin = (req: Request) => requireAdmin(req.header('authorization'));
  const route =
    (fn: (req: Request) => unknown) =>
    (req: Request, res: Response, next: NextFunction) => {
      try {
        res.setHeader('Cache-Control', 'no-store');
        res.json(fn(req));
      } catch (err) {
        next(err);
      }
    };

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // Accounts
  app.post('/api/auth/login', route((req) => login(req.body, req.ip || '')));
  app.post('/api/auth/logout', route((req) => logout(tokenFrom(req.header('authorization')))));
  app.get('/api/auth/me', route((req) => me(user(req))));
  app.get('/api/me/profile', route((req) => getProfile(user(req))));
  app.put('/api/me/profile', route((req) => saveProfile(user(req), req.body)));
  app.put('/api/me/preferences', route((req) => savePreferences(user(req), req.body)));
  app.get('/api/users', route((req) => (admin(req), listUsers())));
  app.post('/api/users', route((req) => (admin(req), createUser(req.body))));
  app.put('/api/users/:id', route((req) => updateUser(admin(req), req.params.id, req.body)));
  app.delete('/api/users/:id', route((req) => deleteUser(admin(req), req.params.id)));

  app.get('/api/rooms', route((req) => (player(req), listPublicRooms())));
  app.post('/api/rooms', route((req) => createRoom(player(req), req.body)));
  app.post('/api/rooms/join', route((req) => joinRoom(player(req), req.body)));
  app.get('/api/rooms/:id', route((req) => getRoomView(player(req), req.params.id)));
  app.post('/api/rooms/:id/leave', route((req) => leaveRoom(player(req), req.params.id)));
  app.post('/api/rooms/:id/seat', route((req) => changeSeat(player(req), req.params.id, req.body?.seatIndex)));
  app.post('/api/rooms/:id/bots', route((req) => fillWithBots(player(req), req.params.id)));
  app.post('/api/rooms/:id/start', route((req) => startRoomGame(player(req), req.params.id)));
  app.post('/api/rooms/:id/chat', route((req) => sendChat(player(req), req.params.id, req.body)));
  app.post('/api/rooms/:id/state', route((req) => publishState(player(req), req.params.id, req.body?.state)));
  app.post('/api/rooms/:id/actions', route((req) => pushAction(player(req), req.params.id, req.body)));
  app.get('/api/rooms/:id/actions', route((req) => pullActions(player(req), req.params.id, req.query.after)));
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
  app.use('/api', (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof RoomError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  });

  initAuth();
  ensureSeedRooms();
  setInterval(() => cleanup(), 60 * 1000).unref();

  if (isProduction) {
    const dist = path.resolve(rootDir, 'dist');
    app.use(express.static(dist, { index: false, maxAge: '1h' }));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PC Mus escuchando en http://localhost:${PORT} (${isProduction ? 'producción' : 'desarrollo'})`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
