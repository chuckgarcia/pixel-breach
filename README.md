# Pixel Breach

Deathmatch CQB retro en un laberinto, inspirado en Bomberman y Pac-Man.

**Jugar:** https://chuckgarcia.github.io/pixel-breach/

- Un jugador contra 4 IAs con estilos distintos (asaltante, flanqueador, campero, recolector).
- En línea sin cuentas: crea una sala, comparte el enlace o el código de 4 letras y juega con hasta 5 combatientes (humanos + IAs).
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

Todo el juego está en un solo archivo: `index.html`.
