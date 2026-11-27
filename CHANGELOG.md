# Changelog

Todos los cambios importantes de Pixel Breach se registran aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa
[versionado semántico](https://semver.org/lang/es/): **vMAYOR.MENOR.PARCHE**.

- **MAYOR**: cambios grandes que rompen lo anterior. `v1.0.0` será la primera versión final.
- **MENOR**: funciones nuevas. También sube cuando cambia el protocolo en línea:
  anfitrión e invitados deben tener la misma versión MAYOR.MENOR para jugar juntos.
- **PARCHE**: correcciones que no cambian cómo se juega en línea.

## [0.13.1] - 2026-11-26

### Cambiado
- La guía de las primeras partidas ya no tapa a tu soldado: en computadora aparece en una franja debajo del juego y en celular vertical en la carcasa, entre la pantalla y los controles. En celular horizontal se muestra dentro del mapa, siempre en la mitad contraria a donde estás, más compacta y semitransparente.
- Durante el primer paso de la guía, las IAs esperan a que te muevas.

### Añadido
- Saltar la guía: botón «ESC · SALTAR» o tecla ESC en computadora, ✕ en celular (o tocar el recuadro en horizontal). Se reactiva en Ajustes.

## [0.13.0] - 2026-11-26

### Añadido
- En la sala, cada invitado toca ESTOY LISTO; la lista muestra «✓ LISTO» junto a quien ya está preparado.
- El anfitrión solo puede EMPEZAR cuando todos los invitados están listos (el botón dice cuántos faltan, por ejemplo «ESPERANDO (1/2 LISTOS)»).
- Al empezar, todos ven una cuenta regresiva «EMPEZANDO EN 3… 2… 1… ¡YA!» con sonido. El anfitrión puede CANCELAR durante la cuenta, y si un invitado deja de estar listo, se cancela sola.
- La REVANCHA en línea también usa la cuenta regresiva.

### Cambiado
- Versión MENOR nueva: anfitrión e invitados deben recargar para jugar juntos.

## [0.12.7] - 2026-11-26

### Cambiado
- Logotipo nuevo en pixel art: «PIXEL» claro, «BREACH» grande en verde con sombra y punto naranja, y «DEATHMATCH CQB» espaciado. Aparece en la intro (letra por letra, con rebote) y en el menú.

## [0.12.6] - 2026-11-26

### Cambiado
- Nota de VIBRACIÓN más corta en iPhone: «No disponible en iPhone ni iPad».

## [0.12.5] - 2026-11-26

### Corregido
- Se quitó la vibración en iPhone de la v0.12.3: dependía de un truco de Safari que Apple bloqueó en iOS 26.5, así que no vibraba. En iPhone la opción vuelve a aparecer como «NO DISPONIBLE», con la explicación. En Android todo sigue igual.

## [0.12.4] - 2026-11-26

### Cambiado
- Los disparos salen del arma: de lado el cañón va justo en la línea de la bala; de frente el arma se sostiene al centro y la punta asoma bajo las botas; de espaldas el cañón asoma sobre el casco.
- El fogonazo aparece en la boca del cañón y la bala se dibuja desde ahí. Las balas siguen el mismo camino y los mismos choques: se juega igual.
- Las armas tienen más contraste para verse sobre el uniforme y el piso.

## [0.12.3] - 2026-11-26

### Añadido
- Vibración en iPhone: un toque corto en cada disparo (Safari 17.4 o más nuevo). Apple solo lo permite mientras tocas la pantalla, así que no vibra al recibir daño.
- En Android, además de vibrar al recibir daño, ahora da un toque muy corto en cada disparo.

## [0.12.2] - 2026-11-26

### Corregido
- «¿Cómo se juega?» ya no se sale de la pantalla ni corta el texto: se abre como un panel encima del menú, con su propio desplazamiento y un botón CERRAR.
- Los ajustes en computadora quedan alineados en columnas, igual que en el celular.
- En iPhone y iPad, la opción VIBRACIÓN aparece como «NO DISPONIBLE» con la explicación, en vez de desaparecer: el navegador de Apple no deja que las páginas vibren.

## [0.12.1] - 2026-11-26

### Cambiado
- La vista de lado de cada soldado ahora es su mismo diseño de frente girado unos 45°: se ven los dos ojos, el casco, la boina, los goggles o la máscara de siempre, y el arma hacia adelante.

### Corregido
- Todos los soldados miden lo mismo (18 píxeles del casco a las botas), de frente y de lado. El Comando de lado se veía más chico y el Operador y el Antigás, un poco más altos. Una prueba automática lo revisa.

## [0.12.0] - 2026-11-26

### Añadido
- Soldados nuevos de 16 × 20 en estilo chibi: cabeza grande, contorno oscuro y tres tonos por material.
- Cinco aspectos y siete soldados para elegir en ASPECTO (menú y sala): Recluta ♀ y ♂, Comando ♀ y ♂, Operador, Antigás y Ghillie. Son solo visuales: todos miden y resisten lo mismo.
- Cada arma tiene su propio dibujo (pistola, subfusil, escopeta y rifle) y se ve qué lleva cada rival.
- Las IAs usan un aspecto al azar en cada partida; en la sala se ve el aspecto de cada jugador.
- La primera vez, tu soldado es Recluta ♀ o ♂ al azar; después se recuerda lo que elijas.

### Cambiado
- Versión MENOR nueva: el aspecto viaja en el modo en línea, así que anfitrión e invitados deben recargar para jugar juntos.

## [0.11.2] - 2026-11-26

### Añadido
- En la sala se ven los nombres de las IAs (IA · RON, IA · ICE…) y son los mismos que tendrán en la partida.
- En celular, los ajustes se abren a pantalla completa (también desde la partida), con las opciones alineadas y LISTO abajo.
- En celular, REVANCHA y MENÚ al final de la partida son botones grandes.

### Corregido
- Una llave de más en los estilos podía hacer que el navegador ignorara la regla siguiente.

## [0.11.1] - 2026-11-26

### Corregido
- Las pruebas automáticas de la simulación vuelven a pasar con el nuevo selector de color (sin cambios para quien juega).

## [0.11.0] - 2026-11-26

### Añadido
- En celular, el menú y la sala ocupan toda la pantalla; la carcasa con cruceta y botones aparece solo al jugar. JUGAR CONTRA IAs, CREAR SALA, UNIRSE, EMPEZAR y SALIR siempre se ven sin desplazarse.
- En horizontal, el menú y la sala se dividen en dos columnas: quién eres a la izquierda y la partida a la derecha.
- El color se elige con ◀ ▶ como las demás opciones, con su nombre y el soldado cambiando al momento. En la sala, las flechas se saltan los colores ocupados. También se puede deslizar el dedo sobre el soldado.
- El soldado se ve más grande en el menú, junto a tu nombre.
- En celular, el código de sala se escribe tras tocar UNIRSE…, y la sala tiene un solo botón COMPARTIR ENLACE.

### Cambiado
- Versión MENOR nueva: anfitrión e invitados deben recargar para jugar juntos.

## [0.10.8] - 2026-11-26

### Corregido
- Tocar dos veces muy rápido CREAR SALA o UNIRSE ya no puede crear dos salas ni dos intentos de conexión.

## [0.10.7] - 2026-11-26

### Añadido
- En computadora, los costados ya no son negros: un reflejo desenfocado del juego toma los colores del escenario y de la acción, con textura de puntos de pantalla retro y marco tipo monitor de arcade.
- En celular, el juego se ve como una consola portátil: carcasa verde militar con textura, bisel delgado alrededor de la pantalla, leyenda "PIXEL BREACH · CQB", cruceta en forma de cruz y botones redondos con relieve que se hunden al presionarlos. Funciona en vertical y horizontal.

## [0.10.6] - 2026-11-26

### Añadido
- El juego ya usa el backend propio: si la conexión directa falla (por ejemplo, los dos en datos móviles), la partida pasa por el servidor de relevo.

### Corregido
- La alerta de presupuesto se crea en la moneda de la cuenta de facturación.

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
