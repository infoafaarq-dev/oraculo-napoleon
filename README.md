# Oraculum — El Libro de los Destinos (Bogotá, 1855)

App web instalable (PWA) del **Oráculo de Napoleón**, reconstruida a partir del
facsímil de la edición de Bogotá, 1855, que aportaste. Funciona sin conexión y
se instala en el móvil como una app más.

## Qué hace

Reconstruye el método completo de 1855: eliges una de las **32 preguntas** (o escribes
la tuya), trazas **cinco hileras de rayas**, y el azar de las estrellas te lleva por
la tabla cabalística a uno de los **32 jeroglíficos** y su respuesta. **1024 respuestas**
en total, transcritas del libro.

## Lo que se te pidió, y dónde está

- **Fondo de papiro antiguo.** Toda la paleta se rehízo: papiro, tinta sepia, ocre y
  cinabrio, con fibras y motas. Ya no es el tema nocturno.
- **Las 32 preguntas.** Las que enviaste, agrupadas por tema, tal como las lista el libro.
- **Ranura para tu propia pregunta.** Debajo de las 32. El libro no la previó, así que
  se responde por el mismo azar — y la app lo declara: es un espejo para pensar, no la
  palabra del Oráculo.
- **Instrucción en cada punto.** Botón **?** en cada panel (pregunta, trazado, respuesta,
  cábala, registro, zodiaco), con el modo de uso redactado desde el propio método del
  libro y una cita textual de 1855.
- **Los signos del zodiaco.** La *Zodialojía* del PDF: los 12 signos con el carácter del
  varón y de la mujer nacidos bajo cada uno, transcrito del facsímil.
- **Interpretación.** Cada respuesta se etiqueta con su **género** (positiva, imperativa,
  presuntiva, monitoria o condicional) — los cinco que distingue el traductor de 1855.

## Cómo se reconstruyó (Protocolo Fable)

La lámina desplegable con la tabla no venía en el escaneo. Pero el libro trae un **ejemplo
resuelto**: la pregunta 20 con el grupo de estrellas 26 lleva al jeroglífico de la página 13,
«tus desgracias son no mas que pasajeras». Ese ejemplo confirma que la tabla es un **cuadrado
latino cíclico**:

    jeroglifico(pregunta, grupo) = ((pregunta + grupo − 2) mod 32) + 1

verificado en ambos sentidos contra el libro. Las 1024 respuestas se leyeron por **OCR**
del facsímil (tesseract en español, alta resolución). **843 quedaron legibles (82%)**;
las **181 restantes**, dañadas por el estado del papel, van marcadas y **nunca se inventan**:
si el azar te lleva a una, la app te invita a trazar de nuevo. Cada pregunta conserva entre
15 y 32 respuestas legibles.

## Régimen de verdad

- **VERIFICADO** (del PDF): las 32 preguntas, el método de 5 filas, la tabla (por el ejemplo
  del libro), los cinco géneros, la doctrina, la historia y la Zodialojía.
- **INFERIDO** (de la app): el género de cada respuesta — la taxonomía es del libro, el reparto
  lo hace un clasificador con reglas gramaticales explícitas, y así se declara en pantalla.
- **ILEGIBLE**: 181 respuestas marcadas, no reconstruidas.

## Instalar en el móvil

1. Sube la carpeta a un servidor con HTTPS (GitHub Pages sirve).
2. Ábrela en el móvil.
   - **Android/Chrome:** botón *Instalar*, o menu ⋮ → *Añadir a pantalla de inicio*.
   - **iOS/Safari:** *Compartir* → *Añadir a pantalla de inicio*.

### GitHub Pages, rápido
- Repo con estos archivos en la raíz (o en `/oraculum/`).
- *Settings → Pages → Deploy from branch → main → /root*.
- Queda en `https://TUUSUARIO.github.io/REPO/`. Debe ser HTTPS para instalarse.

## Archivos

    index.html            estructura y paneles
    styles.css            tema papiro, responsive
    app.js                lógica: 5 filas, 32 preguntas, propia, zodiaco
    oraculum-data.js      motor de 1855 (grupos, tabla cíclica, consulta)
    corpus-1855.js        las 1024 respuestas (843 legibles, 181 marcadas)
    zodiaco.js            los 12 signos de la Zodialojía
    libro-1855.js         géneros, clasificador, doctrina, historia, ayudas
    sw.js                 service worker (offline)
    manifest.webmanifest  instalación PWA
    verify.js             control de calidad (node verify.js)
    icons/                iconos en tono papiro

## Verificar

    node verify.js

Debe decir `status: success, total_errors: 0` (con 1 aviso: las 181 respuestas ilegibles).

---

Reconstrucción de una obra en dominio público. Objeto de curiosidad histórica:
no es consejo médico, legal ni financiero.
