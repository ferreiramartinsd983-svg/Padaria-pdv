import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleAssistantRequest } from './server/assistantApi.js';

const app = express();
const port = Number(process.env.PORT || 8080);
const apiOnly = process.argv.includes('--api-only');
const dirname = path.dirname(fileURLToPath(import.meta.url));
const allowedOrigins = new Set([
  'https://appassets.androidplatform.net',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ...(process.env.ASSISTANT_ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean),
]);
if (process.env.APP_URL) {
  try { allowedOrigins.add(new URL(process.env.APP_URL).origin); } catch { /* Ignore an invalid optional APP_URL. */ }
}

const requestBuckets = new Map();
app.use('/api', (req, res, next) => {
  const origin = req.get('Origin');
  const sameOrigin = origin && (() => { try { return new URL(origin).host === req.get('host'); } catch { return false; } })();
  if (origin && !allowedOrigins.has(origin) && !sameOrigin) return res.status(403).json({ error: 'Origem não autorizada para o assistente.' });
  if (origin) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const bucket = requestBuckets.get(key);
  if (!bucket || now - bucket.startedAt >= 15 * 60 * 1000) requestBuckets.set(key, { startedAt: now, count: 1 });
  else if (bucket.count >= 30) return res.status(429).json({ error: 'Muitas solicitações. Aguarde alguns minutos e tente novamente.' });
  else bucket.count += 1;
  next();
});
app.use(express.json({ limit: '48kb' }));
app.post('/api/assistant', handleAssistantRequest);
app.get('/api/health', (_req, res) => res.json({ ready: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) }));

if (!apiOnly) {
  const dist = path.join(dirname, 'dist');
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(port, '0.0.0.0', () => console.log(`Padaria Master ${apiOnly ? 'assistant API' : 'web/API'} listening on port ${port}`));
