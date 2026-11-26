# Changelog

Todos los cambios importantes de Pixel Breach se registran aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa
[versionado semántico](https://semver.org/lang/es/): **vMAYOR.MENOR.PARCHE**.

- **MAYOR**: cambios grandes que rompen lo anterior. `v1.0.0` será la primera versión final.
- **MENOR**: funciones nuevas. También sube cuando cambia el protocolo en línea:
  anfitrión e invitados deben tener la misma versión MAYOR.MENOR para jugar juntos.
- **PARCHE**: correcciones que no cambian cómo se juega en línea.

## [0.10.5] - 2026-11-26

### Añadido
- Backend propio en Google Cloud para jugar en línea cuando los dos jugadores están en datos móviles: un servidor de relevo (TURN) y un servicio que entrega credenciales temporales. El secreto maestro vive en Secret Manager y nunca está en el repositorio ni llega al navegador.
- Publicación automática del backend con cada commit que cambia `server/` (GitHub Actions, sin llaves guardadas).

### Corregido
- Si la sala existe pero la red no deja conectar con el anfitrión, el mensaje ya no dice que la sala no existe: explica que es un problema de conexión y sugiere reintentar o usar Wi-Fi.

## [0.10.4] - 2026-11-23

### Corregido
- Si el anfitrión cambiaba de app en el celular (por ejemplo, a WhatsApp para mandar el enlace), al volver nadie podía unirse: decía que la sala ya no existía. Ahora, al volver, la sala se vuelve a registrar con el mismo código y conserva a los jugadores que ya estaban.
- Al reconectarse, la sala ya no se reinicia ni pierde a sus jugadores.

### Añadido
- En la sala, el anfitrión ve si está activa ("● SALA ACTIVA") o reconectándose.
- Botón COMPARTIR en la sala (celular): abre el menú para compartir del teléfono directamente.

## [0.10.3] - 2026-11-23

### Corregido
- En el celular, la vista previa del soldado en la sala se veía enorme y tapaba los controles (se perdió su tamaño en la v0.9.0). Ahora hay una prueba automática que revisa su tamaño.

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
