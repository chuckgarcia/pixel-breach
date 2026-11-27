# Changelog

Todos los cambios importantes de Pixel Breach se registran aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa
[versionado semántico](https://semver.org/lang/es/): **vMAYOR.MENOR.PARCHE**.

- **MAYOR**: cambios grandes que rompen lo anterior. `v1.0.0` será la primera versión final.
- **MENOR**: funciones nuevas. También sube cuando cambia el protocolo en línea:
  anfitrión e invitados deben tener la misma versión MAYOR.MENOR para jugar juntos.
- **PARCHE**: correcciones que no cambian cómo se juega en línea.

## [0.15.3] - 2026-11-27

### Cambiado
- Arcade, al estilo de Metal Slug:
  - **Reapareces donde caíste** con 2.5 s de invencibilidad; el nivel sigue como iba (los enemigos derrotados no vuelven). Vuelves con pistola y 1 granada.
  - Solo si la misión falla (el rehén cae o las bombas explotan) se pierde una vida y el nivel se reinicia.
  - Sin vidas aparece **CONTINUE? 9… 8… … 0**. CONTINUAR te devuelve donde caíste con 3 vidas y los puntos en 0. Al llegar a 0 es GAME OVER, con REINTENTAR NIVEL o MENÚ.
  - **Botiquines según la dificultad**: aparecen solos en el mapa (MUY FÁCIL cada 12 s, hasta 3; FÁCIL cada 18 s, hasta 2; NORMAL cada 25 s, hasta 2; DIFÍCIL cada 40 s, hasta 1) y los enemigos sueltan uno al caer con más o menos frecuencia. Solo tú puedes tomarlos.
  - El rehén, al liberarlo, te da un botiquín.

## [0.15.2] - 2026-11-27

### Cambiado
- IAs (en todos los modos): ya no se enciman ni se pegan a ti.
  - Cada IA busca una **posición de tiro**: una casilla en tu fila o columna, con línea libre y a su distancia preferida. Escopetero y asaltante: 2–3 casillas; recluta: 3–4; flanqueador: 3–5; con la última vida en Último en pie, más lejos.
  - **Una casilla por soldado**: una IA no entra a una casilla ocupada ni elige la que ya eligió otra; así se reparten por lados distintos. Tú sí puedes pasar entre ellas.
  - Si no hay hueco para disparar, esperan su turno a 3–5 casillas. Si quedan pegadas a ti, retroceden una casilla sin dejar de apuntarte.
  - Las oleadas del Arcade aparecen en casillas libres, no una encima de otra.

### Corregido
- Una partida normal iniciada justo después de una de Arcade ya no arrastra reglas del Arcade.

## [0.15.1] - 2026-11-27

### Cambiado
- Arcade: la tarjeta de misión ya no desaparece sola. Espera a que toques **¡LISTO!** (o ESPACIO / ENTER, o FUEGO en el celular), para que puedas leerla con calma. Una tecla que venía presionada del nivel anterior no la salta.

## [0.15.0] - 2026-11-27

### Añadido
- **Modo ARCADE** (un jugador): en MODO aparece ARCADE y la línea NIVEL reemplaza a ESCENARIO y PARTIDA. Cada nivel tiene un mapa hecho a mano y una misión; al cumplirla se abre la extracción amarilla.
  - Niveles disponibles: 1 · Primer día (Killhouse, elimina a 6 reclutas), 2 · Limpieza (Búnker, resiste 3 oleadas), 3 · Rescate (Jungla, el rehén te sigue a la extracción), 4 · Cargas (Ladrillo, desactiva 3 bombas en 90 s). Los niveles 5 a 10 llegan en las siguientes versiones.
  - Puntos por cada baja según el enemigo, combo por bajas seguidas (hasta ×4), bonos por tiempo, por cumplir la misión y por no perder vida; la dificultad multiplica los puntos.
  - 3 vidas, vida extra a los 10,000 puntos y luego cada 25,000. Al perder una vida el nivel se reinicia; sin vidas, CONTINUAR repite el nivel con 3 vidas y los puntos en 0.
  - Las armas pasan de un nivel al siguiente; al perder una vida vuelves con pistola y 1 granada.
  - Tarjeta con la misión antes de cada nivel, conteo con estrellas al terminar (misión, tiempo meta y sin perder vida) y avance guardado en el navegador.
- **El bando de la calavera**: enemigos con aspectos propios que el jugador no puede elegir. Recluta y asaltante (máscara de calavera), escopetero (capucha con ojos rojos). Todo el bando viste de vino y no se hace daño entre sí.

### Cambiado
- El escenario ARCADE se llama ahora **NEÓN**, para no confundirlo con el modo.
- La barra de vida sobre cada soldado se mide contra su vida máxima (los reclutas tienen 50).

## [0.14.0] - 2026-11-27

### Añadido
- Nueva línea **MODO** en el menú y en la sala (arriba de DIFICULTAD); PARTIDA ofrece opciones propias de cada modo y recuerda la última elegida en cada uno.
- **Captura la bandera**: una bandera neutral en el centro; quien la lleve a su base (su punto de aparición, en una esquina) anota. Si derriban al portador, la bandera cae en su casilla y cualquiera la puede tomar; si nadie la toca en 20 s vuelve al centro. Quien la lleva va un 15 % más lento y se ve a través de la niebla. A 1, 3 o 5 capturas; hasta 4 combatientes.
  - Bases marcadas con el color de cada jugador, ruta iluminada hacia tu base cuando la llevas y flecha amarilla en la orilla cuando la bandera no está a la vista.
  - Las IAs juegan según su estilo: el recolector va por la bandera, el asaltante persigue al portador, el flanqueador se adelanta a su ruta y el campero embosca cerca del centro.
- **Último en pie**: cada quien tiene 1, 3 o 5 vidas; sin vidas ya no reapareces y miras la partida. Gana el último con vidas (al acabar el tiempo, quien tenga más). Con la última vida, las IAs se cuidan más.
- Al empezar, un letrero explica la meta («LLEVA LA BANDERA A TU BASE · 3 CAPTURAS»). El marcador muestra BANDERA 1/3 o tus vidas en corazones, y el tablero suma la columna CAPTURAS o VIDAS.
- «¿Cómo se juega?» explica los tres modos.

### Cambiado
- Protocolo en línea nuevo: el modo, la bandera, las capturas y las vidas viajan en la sala y en cada foto de la partida. **Anfitrión e invitados deben recargar** para tener la v0.14.0.

## [0.13.4] - 2026-11-26

### Añadido
- En pausa hay dos botones: CONTINUAR y SALIR AL MENÚ (pide tocar dos veces para no salir por accidente).
- En Ajustes, durante una partida, también se puede salir: «SALIR AL MENÚ» contra IAs, «SALIR DE LA SALA» como invitado y «TERMINAR Y VOLVER A LA SALA» como anfitrión.

### Cambiado
- Tocar la pantalla en pausa ya no reanuda el juego (evita continuar sin querer); se usa CONTINUAR o, en computadora, P o ESC.

## [0.13.3] - 2026-11-26

### Cambiado
- La intro muestra una pequeña batalla: dos equipos de tres soldados se disparan de lado a lado en tres carriles; los disparos salen de la boca de cada arma, los impactos echan chispas y quien cae vuelve a entrar.
- Imagen nueva al compartir el enlace (WhatsApp y otras apps) con el logotipo y los soldados actuales. Se genera con `node tools/og.js`.

## [0.13.2] - 2026-11-26

### Cambiado
- En celular horizontal la pantalla del juego es más grande (en un iPhone, cerca de 30 % más ancha): la carcasa ahora llega a las orillas del teléfono, incluida la zona de la muesca, sin franjas negras, y la cruceta y los botones son un poco más compactos.
- Los controles y el contenido respetan las zonas seguras del teléfono (muesca, esquinas y barra de inicio) en vertical y horizontal.

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
