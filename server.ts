// PC Mus server: serves the game and the online rooms API.
// - Development: `npm run dev` (Vite runs as middleware, same port).
// - Production:  `npm run build && npm start` (serves the built `dist/`).
import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  RoomError,
  authenticate,
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

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const rootDir = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const app = express();
  app.disable('x-powered-by');
  app.use('/api', express.json({ limit: '600kb' }));

  // Every API call identifies the player with an id + secret token kept in their browser
  const player = (req: Request) => authenticate(req.header('x-player-id'), req.header('x-player-token'));
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
  app.get('/api/rooms', route(() => listPublicRooms()));
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
