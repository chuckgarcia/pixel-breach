# Changelog

Todos los cambios importantes de Pixel Breach se registran aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa
[versionado semántico](https://semver.org/lang/es/): **vMAYOR.MENOR.PARCHE**.

- **MAYOR**: cambios grandes que rompen lo anterior. `v1.0.0` será la primera versión final.
- **MENOR**: funciones nuevas. También sube cuando cambia el protocolo en línea:
  anfitrión e invitados deben tener la misma versión MAYOR.MENOR para jugar juntos.
- **PARCHE**: correcciones que no cambian cómo se juega en línea.

## [0.9.0] - 2026-11-22

Primera versión numerada. Reúne todo el prototipo y las mejoras para estabilizar el modo en línea.

### Añadido
- Número de versión visible en el menú, en la intro y en la pantalla de invitación.
- Aviso claro cuando el invitado y el anfitrión tienen versiones incompatibles, con instrucciones para actualizar.
- Vista previa al compartir el enlace (imagen, título y descripción) e ícono para la pestaña y la pantalla de inicio.
- Los invitados mueven su soldado al instante, sin esperar la respuesta del anfitrión; el anfitrión valida y corrige solo si hace falta.
- La partida sigue corriendo aunque el anfitrión cambie de pestaña.
- La pantalla del celular no se apaga durante la partida (en navegadores compatibles).
- Si el anfitrión deja de responder, los invitados ven "ESPERANDO AL ANFITRIÓN…" y, tras 15 segundos, regresan al menú con una explicación.

### Ya incluido del prototipo
- Modo un jugador contra 4 IAs con estilos (asaltante, flanqueador, campero, recolector) y 4 dificultades.
- Salas en línea sin cuentas para hasta 5 combatientes, con enlace de invitación, color por jugador y modo espectador para quien llega a media partida.
- 7 escenarios: Búnker, Jungla, Ladrillo, Arcade (con túneles), Volcán (con lava), Desierto y Killhouse.
- Armas: pistola infinita, subfusil, escopeta, rifle, granadas y flashbangs; cajas que se rompen y sueltan botín.
- IA con vista, oído y memoria; fogonazos de disparos que se oyen fuera de la vista; niebla de guerra.
- Controles de teclado y táctiles (cruceta por deslizamiento), intro animada y vista previa del soldado.
