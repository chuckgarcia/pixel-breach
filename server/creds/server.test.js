'use strict';
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { credentials, handler, allowed } = require('./server.js');

function call(origin, url = '/turn', env = { TURN_SECRET: 's3cret', TURN_HOST: '1.2.3.4' }, ip = '9.9.9.9') {
  const out = {};
  handler({ headers: origin ? { origin, 'x-forwarded-for': ip } : { 'x-forwarded-for': ip }, url, method: 'GET', socket: {} },
    { writeHead: (c, h) => { out.code = c; out.h = h; }, end: b => { out.body = JSON.parse(b); } }, env);
  return out;
}

test('la credencial es la que coturn espera (HMAC-SHA1 del usuario con el secreto)', () => {
  const { username, credential } = credentials('s3cret', 1_000_000_000_000, 60);
  assert.strictEqual(username, '1000000060:pb');
  assert.strictEqual(credential, crypto.createHmac('sha1', 's3cret').update(username).digest('base64'));
});

test('entrega servidores TURN a la página del juego sin revelar el secreto', () => {
  const r = call('https://chuckgarcia.github.io');
  assert.strictEqual(r.code, 200);
  assert.strictEqual(r.h['Access-Control-Allow-Origin'], 'https://chuckgarcia.github.io');
  const turn = r.body.iceServers.find(s => s.username);
  assert.ok(turn.urls.some(u => u.startsWith('turn:1.2.3.4:3478')));
  assert.ok(!JSON.stringify(r.body).includes('s3cret'));
});

test('rechaza otras páginas, rutas y falta de configuración', () => {
  assert.strictEqual(call('https://otro.sitio').code, 403);
  assert.strictEqual(call(null).code, 403);
  assert.strictEqual(call('https://chuckgarcia.github.io', '/x').code, 404);
  assert.strictEqual(call('https://chuckgarcia.github.io', '/turn', {}, '8.8.8.8').code, 503);
});

test('limita pedidos por minuto', () => {
  const t = 5_000_000;
  let ok = 0;
  for (let i = 0; i < 40; i++) if (allowed('7.7.7.7', t)) ok++;
  assert.strictEqual(ok, 30);
});
