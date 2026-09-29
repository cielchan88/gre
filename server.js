// Zero-dependency static file server. Default port 8888 (override with PORT).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { gradeWithClaude, validateInput } from './lib/essay-ai.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const PORT = Number(process.env.PORT) || 8888;
const HOST = process.env.HOST || '0.0.0.0';
const API_KEY = process.env.ANTHROPIC_API_KEY || '';
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
const RATE_LIMIT = Number(process.env.ESSAY_RATE_PER_HOUR) || 20;
const hits = new Map(); // ip -> timestamps (simple in-memory limiter to cap API spend)

const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
function rateLimited(ip) {
  const now = Date.now(), arr = (hits.get(ip) || []).filter((t) => now - t < 3600e3);
  arr.push(now); hits.set(ip, arr);
  return arr.length > RATE_LIMIT;
}
function readBody(req, limit = 40000) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
async function scoreEssay(req, res) {
  if (!API_KEY) return json(res, 503, { error: 'Penilaian AI belum dikonfigurasi (ANTHROPIC_API_KEY belum diset di server).' });
  if (rateLimited(req.socket.remoteAddress)) return json(res, 429, { error: 'Batas penilaian per jam tercapai. Coba lagi nanti.' });
  let body;
  try { body = JSON.parse(await readBody(req)); } catch { return json(res, 400, { error: 'Permintaan tidak valid' }); }
  const bad = validateInput(body);
  if (bad) return json(res, 400, { error: bad });
  try { json(res, 200, await gradeWithClaude(body, { apiKey: API_KEY, model: MODEL, baseUrl: BASE_URL })); }
  catch (e) { console.error('essay grading failed:', e.message); json(res, 502, { error: 'Layanan penilaian AI gagal. Coba lagi.' }); }
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt']);

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy':
    "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; script-src 'self'; frame-ancestors 'none'",
};

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/score-essay') return scoreEssay(req, res);
  if (req.method === 'GET' && req.url === '/api/config') return json(res, 200, { ai: !!API_KEY });
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end();
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    res.writeHead(400);
    return res.end('Bad request');
  }
  if (pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('ok');
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.normalize(path.join(ROOT, pathname));
  if (!file.startsWith(ROOT + path.sep)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    const ext = path.extname(file).toLowerCase();
    const headers = {
      ...SECURITY_HEADERS,
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      ETag: `"${st.size}-${Math.floor(st.mtimeMs)}"`,
      Vary: 'Accept-Encoding',
    };
    if (req.headers['if-none-match'] === headers.ETag) {
      res.writeHead(304, headers);
      return res.end();
    }
    const gz = COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '');
    if (gz) headers['Content-Encoding'] = 'gzip';
    res.writeHead(200, headers);
    if (req.method === 'HEAD') return res.end();
    const stream = fs.createReadStream(file);
    stream.on('error', () => res.destroy());
    (gz ? stream.pipe(zlib.createGzip()) : stream).pipe(res);
  });
});

server.listen(PORT, HOST, () => console.log(`GRE practice listening on http://${HOST}:${PORT}`));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => server.close(() => process.exit(0)));
