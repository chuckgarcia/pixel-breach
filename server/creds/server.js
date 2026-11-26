'use strict';
// Pixel Breach — servicio de credenciales TURN temporales (Cloud Run).
// El secreto maestro llega como variable de entorno desde Secret Manager (--set-secrets) y nunca sale
// de aquí: el navegador solo recibe un usuario y una contraseña que caducan (método "REST API" de coturn).
const http = require('http');
const crypto = require('crypto');

const TTL = 24 * 3600; // segundos de validez de cada credencial
const ALLOWED = [/^https:\/\/chuckgarcia\.github\.io$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
const LIMIT = 30; // pedidos por minuto por dirección IP

function credentials(secret, now = Date.now(), ttl = TTL) {
  const username = `${Math.floor(now / 1000) + ttl}:pb`;
  const credential = crypto.createHmac('sha1', secret).update(username).digest('base64');
  return { username, credential };
}

function iceServers(host, secret, now) {
  const { username, credential } = credentials(secret, now);
  return [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: [`stun:${host}:3478`] },
    { urls: [`turn:${host}:3478?transport=udp`, `turn:${host}:3478?transport=tcp`], username, credential },
  ];
}

const hits = new Map();
function allowed(ip, now = Date.now()) {
  const m = Math.floor(now / 60000);
  const h = hits.get(ip);
  if (!h || h.m !== m) { hits.set(ip, { m, n: 1 }); if (hits.size > 5000) hits.clear(); return true; }
  return ++h.n <= LIMIT;
}

function handler(req, res, env = process.env) {
  const origin = req.headers.origin || '';
  const okOrigin = ALLOWED.some(r => r.test(origin));
  const url = (req.url || '').split('?')[0];
  const send = (code, body) => {
    const h = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin' };
    if (okOrigin) h['Access-Control-Allow-Origin'] = origin;
    res.writeHead(code, h);
    res.end(JSON.stringify(body));
  };
  if (url === '/healthz') return send(200, { ok: true });
  if (url !== '/turn') return send(404, { error: 'not found' });
  if (req.method === 'OPTIONS') return send(204, {});
  if (req.method !== 'GET') return send(405, { error: 'method' });
  if (!okOrigin) return send(403, { error: 'origin' });
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (!allowed(ip)) return send(429, { error: 'slow down' });
  if (!env.TURN_SECRET || !env.TURN_HOST) return send(503, { error: 'not configured' });
  send(200, { iceServers: iceServers(env.TURN_HOST, env.TURN_SECRET.trim()), ttl: TTL });
}

if (require.main === module) {
  const port = +process.env.PORT || 8080;
  http.createServer((q, r) => handler(q, r)).listen(port, () => console.log('creds listening on ' + port));
}
module.exports = { credentials, iceServers, handler, allowed, TTL };
