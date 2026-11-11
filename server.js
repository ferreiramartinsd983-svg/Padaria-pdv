import express from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT || 8080);
const dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(dirname, 'dist');
const sharedDir = path.join(dirname, 'shared-data');
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: '10mb' }));

const collectionKeys = ['products', 'sales', 'recipes', 'finances', 'orders', 'productions', 'suppliers', 'audit', 'purchases', 'voiceNotes', 'tasks'];
function mergeBackups(existing, incoming) {
  const merged = { ...existing, ...incoming, version: incoming.version || existing.version, exportedAt: new Date().toISOString() };
  for (const key of collectionKeys) {
    const rows = new Map();
    for (const row of [...(existing[key] || []), ...(incoming[key] || [])]) {
      if (!row?.id) continue;
      const previous = rows.get(row.id);
      const time = value => Number(value?.updatedAt || value?.timestamp || value?.createdAt || value?.producedAt || value?.receivedAt || 0);
      if (!previous || time(row) >= time(previous)) rows.set(row.id, row);
    }
    merged[key] = [...rows.values()];
  }
  return merged;
}

app.get('/api/share/:code', async (req, res) => {
  const code = String(req.params.code || '').toUpperCase();
  if (!/^[A-Z0-9-]{4,32}$/.test(code)) return res.status(400).json({ error: 'Código inválido.' });
  try {
    res.json(JSON.parse(await fs.readFile(path.join(sharedDir, `${code}.json`), 'utf8')));
  } catch (error) {
    if (error.code === 'ENOENT') return res.status(404).json({ error: 'Grupo ainda sem dados.' });
    res.status(500).json({ error: 'Não foi possível ler os dados compartilhados.' });
  }
});

app.put('/api/share/:code', async (req, res) => {
  const code = String(req.params.code || '').toUpperCase();
  if (!/^[A-Z0-9-]{4,32}$/.test(code)) return res.status(400).json({ error: 'Código inválido.' });
  if (!req.body || !Array.isArray(req.body.products)) return res.status(400).json({ error: 'Backup inválido.' });
  try {
    await fs.mkdir(sharedDir, { recursive: true });
    const file = path.join(sharedDir, `${code}.json`);
    let existing = {};
    try { existing = JSON.parse(await fs.readFile(file, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const merged = mergeBackups(existing, req.body);
    await fs.writeFile(file, JSON.stringify(merged), 'utf8');
    res.json(merged);
  } catch {
    res.status(500).json({ error: 'Não foi possível salvar os dados compartilhados.' });
  }
});

app.use(express.static(dist));
app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
app.listen(port, '0.0.0.0', () => console.log(`Padaria Master listening on port ${port}`));
