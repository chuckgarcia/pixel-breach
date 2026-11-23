# Pixel Breach

**Versión actual: v0.10.3** · [Historial de cambios](CHANGELOG.md)

Deathmatch CQB retro en un laberinto, inspirado en Bomberman y Pac-Man.

**Jugar:** https://chuckgarcia.github.io/pixel-breach/

- Un jugador contra 4 IAs con estilos distintos (asaltante, flanqueador, campero, recolector).
- En línea sin cuentas: crea una sala, comparte el enlace o el código de 4 letras y juega con hasta 5 combatientes (humanos + IAs).
- 7 escenarios: Búnker, Jungla, Ladrillo, Arcade (con túneles laterales como Pac-Man), Volcán (con lava), Desierto y Killhouse.
- Las cajas, arbustos, tambos y llantas se rompen y a veces sueltan armas, granadas o botiquines.
- Funciona en computadora (teclado) y en celular (controles táctiles).

## Controles

| Acción | Teclado | Celular |
|---|---|---|
| Moverte | WASD / flechas | Cruceta (desliza el dedo) |
| Disparar | Espacio / J | FUEGO |
| Granada | G / K | GRAN |
| Cambiar arma | Q / L | ARMA |
| Niebla de guerra | F | — |
| Pausa (solo un jugador) | P / Esc | II |

## Cómo funciona el modo en línea

Los navegadores se conectan directamente entre sí con WebRTC usando [PeerJS](https://peerjs.com/) y su servidor público gratuito para encontrarse.
Quien crea la sala es el anfitrión: su navegador simula la partida completa (IAs incluidas) y envía el estado a los demás 20 veces por segundo.
El anfitrión debe mantener la pestaña del juego abierta y visible mientras juegan.

## Estructura del código

- `index.html`: la página.
- `css/game.css`: estilos.
- `js/`: el juego, en el orden en que se carga: `data` (versión y datos), `map`, `entities`, `ai`, `combat`, `audio`, `loop`, `render`, `intro`, `input`, `menu`, `net` (modo en línea) y `ui` (ajustes y controles táctiles).
- `sw.js` y `manifest.json`: para instalarlo en el celular y jugar solo sin internet.

## Pruebas

```
npm install
npx playwright install chromium
npm test
```

- `tests/sim.test.js`: simula partidas completas en los 7 escenarios (sin navegador).
- `tests/online.test.js`: partidas en línea reales entre navegadores con un servidor de PeerJS local.

GitHub las ejecuta en cada cambio (pestaña Actions).

## Versiones

El proyecto usa versionado semántico (**vMAYOR.MENOR.PARCHE**). La versión está en la constante `VERSION` de `js/data.js` (y debe coincidir en `sw.js` y en el CHANGELOG; las pruebas lo revisan)
y cada versión publicada lleva una etiqueta en git (`v0.9.0`, …). Los cambios se describen en [CHANGELOG.md](CHANGELOG.md).

Para jugar en línea juntos, anfitrión e invitados deben coincidir en MAYOR.MENOR; si no, el juego avisa que hay que recargar la página.
