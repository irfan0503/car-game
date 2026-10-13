import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import gameRoutes from './routes/games.js';

const app = express();
const frontendDirectory = fileURLToPath(new URL('../frontend/', import.meta.url));

app.disable('x-powered-by');
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '10kb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1_000, limit: 30 }), authRoutes);
app.use('/api', rateLimit({ windowMs: 60 * 1_000, limit: 120 }), gameRoutes);
app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));
app.use(express.static(frontendDirectory));
app.get('*path', (_request, response) => response.sendFile(path.join(frontendDirectory, 'index.html')));

app.use((error, _request, response, _next) => {
  if (error?.code === 11000) {
    const field = Object.keys(error.keyPattern ?? {})[0];
    return response.status(409).json({ error: field === 'username' ? 'That username is already taken.' : 'That email is already registered.' });
  }
  if (error?.type === 'entity.parse.failed') {
    return response.status(400).json({ error: 'Request body must contain valid JSON.' });
  }
  if (error?.message?.startsWith('Score ') || error?.message?.startsWith('Game duration ') || error?.message?.startsWith('Reported duration ')) {
    return response.status(400).json({ error: error.message });
  }
  console.error(error);
  return response.status(500).json({ error: 'Something went wrong. Please try again.' });
});

export default app;