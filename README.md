# Oraculum — El Libro de los Destinos

Aplicación web instalable (PWA) del **Oráculo de Napoleón**: eliges una de las 16 preguntas
canónicas, trazas cuatro filas de rayas, y el libro responde.

Funciona online en cualquier navegador y se instala en el móvil como una app nativa,
con funcionamiento **sin conexión** una vez instalada.

---

## Procedencia del contenido

| Elemento | Origen | Estado |
|---|---|---|
| Método (4 filas de rayas, paridad, símbolo) | *Napoleon's Oraculum and Dream Book*, Frank Tousey, Nueva York, 1884 | VERIFICADO |
| 16 preguntas | misma edición | VERIFICADO |
| Tabla cabalística (cuadrado latino cíclico) | misma edición | VERIFICADO |
| 256 respuestas | misma edición | VERIFICADO |
| Días nefastos | misma edición | VERIFICADO |
| Traducción al castellano | propia | Se conserva el inglés original bajo cada respuesta |
| Reducción de conteos > 18 | el libro solo ejemplifica 10–18 | **SUPUESTO**: se resta 9 de forma iterada |

La obra de 1884 está en **dominio público**. Ninguna respuesta fue inventada ni generada:
las 256 son las del libro. La verificación automática está en `verify.js`.

> Nota histórica: la atribución a Napoleón es una leyenda comercial del siglo XIX.
> El "manuscrito egipcio hallado en 1801" nunca existió.

---

## Cómo se consulta

1. **La pregunta** — elige una de las 16. El libro prohíbe repetir la misma pregunta el
   mismo día; la app te avisa (puedes ignorarlo).
2. **El trazado** — pulsa *Comenzar el trazado* **una sola vez**. La pluma empieza a trazar
   rayas sola. Un toque (o clic, o barra espaciadora) detiene la fila y la siguiente arranca
   de inmediato. Cuatro filas, cuatro toques.
3. Cada fila se lee así: se cuentan las rayas; si pasan de 9 se resta 9; si el resultado es
   **impar** vale un punto (•), si es **par** vale dos (• •). Las cuatro filas forman uno de
   los 16 símbolos.
4. **La cábala** — el cruce de tu pregunta con tu símbolo da una letra (A–Q, sin la J).
5. **La respuesta** — en la página de esa letra, la fila de tu símbolo.

La cadencia de la pluma es irregular a propósito: el conteo final no es previsible ni
siquiera tocando lo más rápido posible.

---

## Publicar en la web (GitHub Pages)

```bash
git init
git add .
git commit -m "Oraculum"
git branch -M main
git remote add origin https://github.com/USUARIO/oraculum.git
git push -u origin main
```

Luego, en el repo: **Settings → Pages → Source: Deploy from a branch → main / (root) → Save**.

Queda publicada en `https://USUARIO.github.io/oraculum/` en un par de minutos.

> Requisito: el service worker y la instalación necesitan **HTTPS**. GitHub Pages lo da
> gratis. Abrir `index.html` con doble clic (`file://`) funciona para ver la app, pero no
> permite instalarla ni cachearla.

Cualquier hosting estático sirve igual: Netlify, Vercel, Cloudflare Pages, S3.

---

## Instalar en el dispositivo

- **Android / Chrome / Edge:** aparece el botón **Instalar** arriba a la derecha
  (o menú ⋮ → *Instalar aplicación*).
- **iPhone / iPad (Safari):** botón **Compartir** → *Añadir a pantalla de inicio*.
  iOS no muestra el botón automático; es un límite de Safari, no de la app.
- **Escritorio (Chrome/Edge):** icono de instalación en la barra de direcciones.

Una vez instalada abre a pantalla completa, sin barra del navegador, y funciona sin internet.

---

## Archivos

```
index.html              estructura del tablero
styles.css              paleta "templo nocturno" (índigo, amatista, pan de oro)
oraculum-data.js        preguntas, tabla cabalística, 256 respuestas, motor
app.js                  trazado en canvas, ritual, cábala, registro
sw.js                   service worker (uso sin conexión)
manifest.webmanifest    metadatos de instalación
icons/                  iconos 192 / 512 / maskable / apple-touch
verify.js               verificación de invariantes del corpus
```

## Verificar el corpus

```bash
node verify.js
```

Comprueba 16 preguntas, 16 letras, 256 respuestas, que la tabla sea un cuadrado latino,
la reproducción del caso documentado del libro (pregunta 1 → letra P → *"What you wish
will be granted to you"*) y dos tests estructurales que detectarían cualquier desfase de una
sola fila en la transcripción.

Resultado esperado: `status: success, total_errors: 0`.

---

## Privacidad

No hay servidor, ni cuentas, ni analítica, ni llamadas a ninguna API. El registro de
consultas se guarda solo en tu dispositivo (`localStorage`) y puedes borrarlo con un botón.

Objeto de curiosidad histórica. No es consejo médico, legal ni financiero.
