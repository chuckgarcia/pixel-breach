# Changelog

Todos los cambios importantes de Pixel Breach se registran aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa
[versionado semántico](https://semver.org/lang/es/): **vMAYOR.MENOR.PARCHE**.

- **MAYOR**: cambios grandes que rompen lo anterior. `v1.0.0` será la primera versión final.
- **MENOR**: funciones nuevas. También sube cuando cambia el protocolo en línea:
  anfitrión e invitados deben tener la misma versión MAYOR.MENOR para jugar juntos.
- **PARCHE**: correcciones que no cambian cómo se juega en línea.

## [0.10.2] - 2026-11-22

### Corregido
- Instrucciones para instalar en iPhone más claras: en iOS 26 el botón Compartir está dentro del menú ⋯ de Safari.

## [0.10.1] - 2026-11-22

### Corregido
- En Ajustes, la opción de instalar casi nunca aparecía: el botón solo salía cuando el navegador lo ofrecía. Ahora siempre hay una fila INSTALAR con el botón (si el navegador lo permite) o las instrucciones para tu dispositivo (iPhone, Android, computadora, o la dirección correcta si abriste otra versión).
- Ícono de 192×192 para la instalación en Android.

## [0.10.0] - 2026-11-22

### Añadido
- **Ajustes** (botón ⚙ en el menú, en la sala y durante la partida; tecla O): sonido y música con volumen, vibración, niebla (solo un jugador), pantalla completa y "ver guía otra vez". Se guardan en el navegador.
- **Música chiptune** generada en el navegador: una pista tranquila para menús y otra rápida para la partida.
- Efectos de sonido más completos (disparos, explosiones, botín, bajas, rachas).
- **Guía de la primera partida**: 5 avisos paso a paso; mientras dura, las IAs reaccionan más lento.
- **Instalable en el celular** (pantalla de inicio, pantalla completa) y modo un jugador **sin internet** en la versión publicada.
- Aviso de "gira tu teléfono" en vertical, con opción de seguir así.
- **Rachas** anunciadas para todos: primera sangre, doble, triple, imparable, leyenda.
- **Estadísticas** al final: precisión, arma favorita, mejor racha, granadas y botín.
- **Tipo de partida** elegible: rápida (2 min, 5 bajas), normal (3 min, 10), larga (5 min, 20) y maratón (10 min, 30); en línea lo elige el anfitrión.
- Créditos dentro de "¿Cómo se juega?".
- Código dividido en partes (`css/` y `js/`), pruebas automáticas (`npm test`) y verificación en GitHub en cada cambio.

### Corregido
- En la sala, la pantalla de los invitados no se actualizaba cuando el anfitrión cambiaba opciones o entraba otro jugador (error introducido en el modo espectador).
- En la pantalla de invitación, los avisos de conexión no se veían.

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
