// Receives products collected in the browser (Claude in Chrome) for stores that block
// scripts (e.g. Passa Sports behind Cloudflare) and writes data/imports/<store>.json.
// Listens on localhost only.  Usage: node scripts/import-server.mjs   (Ctrl+C to stop)

import { createServer } from 'node:http';
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DIR = fileURLToPath(new URL('../data/imports', import.meta.url));
const PORT = Number(process.env.PORT) || 8787;

const cors = (req) => ({
  'Access-Control-Allow-Origin': req.headers.origin ?? '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  // Chrome's Private Network Access: allow an https page to reach localhost.
  'Access-Control-Allow-Private-Network': 'true',
});

createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return res.writeHead(204, cors(req)).end();
  const m = req.url.match(/^\/import\/([a-z0-9-]+)$/);
  if (req.method !== 'POST' || !m) return res.writeHead(404, cors(req)).end('Not found');
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!Array.isArray(data.products) || !data.products.length) throw new Error('no products');
    await mkdir(DIR, { recursive: true });
    await writeFile(`${DIR}/${m[1]}.json`, JSON.stringify(data));
    console.log(`Saved ${data.products.length} products to data/imports/${m[1]}.json`);
    res.writeHead(200, { ...cors(req), 'Content-Type': 'application/json' }).end(JSON.stringify({ ok: true, count: data.products.length }));
  } catch (err) {
    console.error('Rejected upload:', err.message);
    res.writeHead(400, cors(req)).end(err.message);
  }
}).listen(PORT, '127.0.0.1', () => console.log(`Import receiver on http://localhost:${PORT}`));
