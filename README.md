# Pixel Breach

**Versión actual: v0.17.0** · [Historial de cambios](CHANGELOG.md)

Deathmatch CQB retro en un laberinto, inspirado en Bomberman y Pac-Man.

**Jugar:** https://chuckgarcia.github.io/pixel-breach/

- Un jugador contra 4 IAs con estilos distintos (asaltante, flanqueador, campero, recolector).
- En línea sin cuentas: crea una sala, comparte el enlace o el código de 4 letras y juega con hasta 5 combatientes (humanos + IAs).
- 3 modos: **Deathmatch** (gana quien llegue a las bajas), **Captura la bandera** (lleva la bandera del centro a tu base; hasta 4 combatientes) y **Último en pie** (1, 3 o 5 vidas; gana el último con vidas).
- Modo **Arcade** para un jugador: 10 misiones contra el bando de la calavera (eliminar, oleadas, rescate, bombas, mini jefe, laberinto con fichas, huida de la lava, apagón, asalto y el jefe final), con puntos, combos, prisioneros, vidas, CONTINUE?, estrellas, récords con iniciales y premios.
- 7 escenarios: Búnker, Jungla, Ladrillo, Neón (con túneles laterales como Pac-Man), Volcán (con lava), Desierto y Killhouse.
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

## Backend (Google Cloud)

Cuando los dos jugadores están detrás de redes que no permiten conexión directa (por ejemplo, datos
móviles), la partida pasa por un servidor de relevo propio. Todo vive en `server/`:

- `server/turn/setup.sh`: instala y configura coturn en una máquina e2-micro (nivel gratuito).
- `server/creds/`: servicio en Cloud Run que entrega credenciales TURN temporales (24 h). El secreto
  maestro está en Secret Manager; el juego solo recibe credenciales que caducan.
- `server/bootstrap.sh`: preparación única desde Cloud Shell (máquina, IP fija, firewall, secreto,
  Cloud Run, federación de identidad para GitHub y alerta de presupuesto).
- `.github/workflows/deploy-backend.yml`: cada commit que cambia `server/` publica el servicio y
  actualiza la configuración del TURN; la máquina la aplica sola en segundos.

Ningún secreto se guarda en el repositorio ni en GitHub. Si `TURN_API` está vacío en `js/net.js`,
el juego funciona igual que antes, solo con conexión directa.

## Estructura del código

- `index.html`: la página.
- `css/game.css`: estilos.
- `js/`: el juego, en el orden en que se carga: `data` (versión y datos), `map`, `entities`, `ai`, `combat`, `modes` (captura la bandera y último en pie), `levels` y `arcade` (modo Arcade), `audio`, `loop`, `render`, `intro`, `input`, `menu`, `net` (modo en línea) y `ui` (ajustes y controles táctiles).
- `sw.js` y `manifest.json`: para instalarlo en el celular y jugar solo sin internet.

## Soldados y aspectos

`js/skins.js` guarda los soldados como texto (16 × 20, una letra por píxel), sus paletas, la mano que sostiene el arma y el dibujo de cada arma. El contorno y los tonos del color del jugador se calculan al dibujar. Para agregar un aspecto: su frente (`down`) y lado (`right`), su paleta, la mano y qué letras cambian de espaldas (`SKIN_BACK`); las pruebas revisan que todo cuadre.

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
