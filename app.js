/* ============================================================
   ORACULUM — lógica de la aplicación
   El trazado: un solo inicio; cada toque detiene una fila y la
   siguiente arranca sola. Cuatro filas, sin más botones.
   ============================================================ */

(function () {
  'use strict';

  /* ---------- Almacenamiento tolerante a fallos ---------- */
  const almacen = (() => {
    const memoria = {};
    let disponible = false;
    try {
      window.localStorage.setItem('__test__', '1');
      window.localStorage.removeItem('__test__');
      disponible = true;
    } catch (e) { disponible = false; }
    return {
      leer(k) {
        try { return disponible ? window.localStorage.getItem(k) : (memoria[k] ?? null); }
        catch (e) { return memoria[k] ?? null; }
      },
      escribir(k, v) {
        try { if (disponible) window.localStorage.setItem(k, v); else memoria[k] = v; }
        catch (e) { memoria[k] = v; }
      }
    };
  })();

  const CLAVE_REGISTRO = 'oraculum.registro.v1';

  /* ---------- Parámetros del trazado ---------- */
  const FILAS = 4;            // el libro pide cuatro filas de rayas
  const MINIMO_RAYAS = 12;    // "al menos una docena" en cada fila
  const CADENCIA_MS = 78;     // ritmo medio de la pluma
  const CADENCIA_JITTER = 0.55; // la mano no es un metrónomo: ±55%
  const MINIMO_MS = 950;      // la fila no se puede cerrar antes de este tiempo
  const DENSIDAD_BASE = 20;   // rayas que caben antes de que la fila se comprima

  /* ---------- Estado ---------- */
  const estado = {
    pregunta: null,      // 1..16
    filas: [[], [], [], []],
    filaActual: -1,
    dibujando: false,
    resuelto: false,
    ultimoT: 0,
    acumulado: 0,
    proximo: CADENCIA_MS,
    inicioFila: 0,
    confirmadaRepeticion: false
  };

  /* La pluma no lleva un ritmo exacto: cada raya tarda un poco distinto.
     Esto es lo que hace que el conteo final sea genuinamente incierto. */
  function siguienteIntervalo() {
    return CADENCIA_MS * (1 + (Math.random() * 2 - 1) * CADENCIA_JITTER);
  }

  /* ---------- Referencias al DOM ---------- */
  const $ = id => document.getElementById(id);
  const elPreguntas = $('preguntas');
  const elLienzo = $('lienzo');
  const elTap = $('lienzoTap');
  const elTapTexto = $('lienzoTapTexto');
  const elLecturas = $('lecturas');
  const btnIniciar = $('btnIniciar');
  const btnReiniciar = $('btnReiniciar');
  const elSelloFila = $('selloFila');
  const elSelloGlifo = $('selloGlifo');
  const elSelloLetra = $('selloLetra');
  const elRespuesta = $('respuesta');
  const elRespuestaVacia = $('respuestaVacia');
  const elRespuestaPregunta = $('respuestaPregunta');
  const elRespuestaTexto = $('respuestaTexto');
  const elRespuestaOriginal = $('respuestaOriginal');
  const elRespuestaRef = $('respuestaRef');
  const elCabala = $('cabala');
  const elRegistro = $('registro');
  const elRegistroVacio = $('registroVacio');
  const btnBorrarRegistro = $('btnBorrarRegistro');
  const elAviso = $('aviso');
  const elCabalaEnvoltura = $('cabalaEnvoltura');
  const btnVerCabala = $('btnVerCabala');
  const elInterpretacion = $('interpretacion');
  const elLibroCuerpo = $('libroCuerpo');

  const ctx = elLienzo.getContext('2d');
  let W = 0, H = 0;

  /* ============================================================
     CABECERA: día fasto o nefasto
     ============================================================ */
  function pintarAugurio() {
    const hoy = new Date();
    const fmt = hoy.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
    $('augurioFecha').textContent = fmt;
    const sello = $('augurioSello');
    const nefasto = esDiaNefasto(hoy);
    sello.textContent = nefasto ? 'Día nefasto' : 'Día propicio';
    sello.classList.toggle('nefasto', nefasto);
    sello.title = 'Toca para saber qué dice el libro sobre esto';
    sello.onclick = () => mostrarAviso(DOCTRINA.diasNefastos, 'Entendido', ocultarAviso);
  }

  /* ============================================================
     I — LAS PREGUNTAS
     ============================================================ */
  function pintarPreguntas() {
    elPreguntas.innerHTML = '';
    let grupoActual = null;
    PREGUNTAS.forEach(p => {
      if (p.grupo !== grupoActual) {
        grupoActual = p.grupo;
        const rot = document.createElement('li');
        rot.className = 'grupo-rotulo';
        rot.textContent = grupoActual;
        rot.setAttribute('role', 'presentation');
        elPreguntas.appendChild(rot);
      }
      const li = document.createElement('li');
      li.setAttribute('role', 'presentation');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pregunta';
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', 'false');
      btn.dataset.q = String(p.n);
      btn.innerHTML =
        '<span class="num">' + String(p.n).padStart(2, '0') + '</span>' +
        '<span class="txt">' + p.es + '</span>';
      btn.addEventListener('click', () => elegirPregunta(p.n));
      li.appendChild(btn);
      elPreguntas.appendChild(li);
    });
    marcarRepetidasDeHoy();
  }

  function elegirPregunta(n) {
    if (estado.dibujando) return;
    estado.pregunta = n;
    estado.confirmadaRepeticion = false;
    ocultarAviso();
    document.querySelectorAll('.pregunta').forEach(b => {
      b.setAttribute('aria-selected', String(Number(b.dataset.q) === n));
    });
    btnIniciar.disabled = false;
    if (estado.resuelto) reiniciar(false);
    pintarCabala();
  }

  function marcarRepetidasDeHoy() {
    document.querySelectorAll('.pregunta').forEach(b => {
      b.classList.toggle('repetida', revisarReglas(Number(b.dataset.q)) !== null);
    });
  }

  /* ============================================================
     II — EL TRAZADO (canvas)
     ============================================================ */
  function dimensionar() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = elLienzo.getBoundingClientRect();
    W = rect.width;
    H = rect.width < 520 ? 250 : 300;
    elLienzo.style.height = H + 'px';
    elLienzo.width = Math.round(W * dpr);
    elLienzo.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dibujar();
  }

  function nuevaRaya() {
    return {
      inclinacion: (Math.random() - 0.5) * 0.34,   // radianes
      largo: 0.66 + Math.random() * 0.3,           // fracción de la banda
      grosor: 1.5 + Math.random() * 1.1,
      desvio: (Math.random() - 0.5) * 3
    };
  }

  function dibujar() {
    ctx.clearRect(0, 0, W, H);

    const padX = 26;
    const usable = W - padX * 2;
    const banda = H / FILAS;

    for (let f = 0; f < FILAS; f++) {
      const cy = banda * f + banda / 2;
      const rayas = estado.filas[f];
      const activa = f === estado.filaActual && estado.dibujando;
      const fijada = rayas.length > 0 && !activa;

      /* Guía de la fila */
      ctx.save();
      ctx.strokeStyle = activa ? 'rgba(122,92,196,.35)' : 'rgba(51,38,94,.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.moveTo(padX, cy);
      ctx.lineTo(W - padX, cy);
      ctx.stroke();
      ctx.restore();

      if (rayas.length === 0) continue;

      const capacidad = Math.max(DENSIDAD_BASE, rayas.length);
      const paso = usable / capacidad;
      const alturaBase = banda * 0.5;

      ctx.save();
      ctx.lineCap = 'round';
      rayas.forEach((r, i) => {
        const x = padX + (i + 0.5) * paso + r.desvio * 0.35;
        const mitad = (alturaBase * r.largo) / 2;
        const dx = Math.tan(r.inclinacion) * mitad;
        const nueva = activa && i === rayas.length - 1;

        if (activa) {
          ctx.strokeStyle = nueva ? '#F3DFA8' : '#D9B45B';
          ctx.shadowColor = 'rgba(217,180,91,.55)';
          ctx.shadowBlur = nueva ? 12 : 5;
        } else if (fijada) {
          ctx.strokeStyle = 'rgba(234,228,247,.72)';
          ctx.shadowBlur = 0;
        }
        ctx.lineWidth = r.grosor;
        ctx.beginPath();
        ctx.moveTo(x - dx, cy - mitad);
        ctx.lineTo(x + dx, cy + mitad);
        ctx.stroke();
      });
      ctx.restore();
    }
  }

  function bucle(t) {
    if (!estado.dibujando) return;
    if (!estado.ultimoT) estado.ultimoT = t;
    const dt = t - estado.ultimoT;
    estado.ultimoT = t;
    estado.acumulado += dt;

    while (estado.acumulado >= estado.proximo) {
      estado.acumulado -= estado.proximo;
      estado.proximo = siguienteIntervalo();
      estado.filas[estado.filaActual].push(nuevaRaya());
      actualizarLectura(estado.filaActual);
    }
    dibujar();
    actualizarTexto();
    requestAnimationFrame(bucle);
  }

  function puedeDetener() {
    return estado.dibujando &&
           estado.filas[estado.filaActual].length >= MINIMO_RAYAS &&
           (performance.now() - estado.inicioFila) >= MINIMO_MS;
  }

  function actualizarTexto() {
    if (!estado.dibujando) { elTapTexto.textContent = ''; elTap.classList.remove('activo'); return; }
    if (puedeDetener()) {
      elTapTexto.textContent = 'Toca para detener la fila ' + (estado.filaActual + 1);
      elTap.classList.add('activo');
    } else {
      elTapTexto.textContent = 'Trazando la fila ' + (estado.filaActual + 1) + '…';
      elTap.classList.remove('activo');
    }
  }

  /* ---------- Lecturas de cada fila ---------- */
  function pintarLecturas() {
    elLecturas.innerHTML = '';
    for (let f = 0; f < FILAS; f++) {
      const li = document.createElement('li');
      li.className = 'lectura';
      li.id = 'lectura-' + f;
      li.innerHTML =
        '<span class="fila-n">Fila ' + (f + 1) + '</span>' +
        '<span class="cuenta">—</span>' +
        '<span class="paridad">&nbsp;</span>';
      elLecturas.appendChild(li);
    }
  }

  function actualizarLectura(f, fijar) {
    const li = $('lectura-' + f);
    if (!li) return;
    const n = estado.filas[f].length;
    li.querySelector('.cuenta').textContent = n > 0 ? n : '—';
    li.classList.toggle('activa', f === estado.filaActual && estado.dibujando);
    if (fijar) {
      const red = reducir(n);
      const p = puntos(n);
      li.querySelector('.paridad').textContent =
        n + ' → ' + red + ' · ' + (red % 2 === 1 ? 'impar' : 'par') + ' · ' + (p === 1 ? '•' : '• •');
      li.classList.add('fijada');
      li.classList.remove('activa');
    }
  }

  /* ---------- Ritual ---------- */
  function iniciar() {
    if (estado.pregunta === null || estado.dibujando) return;

    /* Reglas del libro de 1855:
       "nadie debe hacer más de una pregunta en el mismo día, ni debe repetirse
        la misma pregunta por la misma persona a lo menos en un mes." */
    if (!estado.confirmadaRepeticion) {
      const infraccion = revisarReglas(estado.pregunta);
      if (infraccion) {
        mostrarAviso(infraccion, 'Consultar igual',
          () => { estado.confirmadaRepeticion = true; ocultarAviso(); iniciar(); });
        return;
      }
    }

    reiniciar(true);
    estado.dibujando = true;
    estado.filaActual = 0;
    estado.ultimoT = 0;
    estado.acumulado = 0;
    estado.proximo = siguienteIntervalo();
    estado.inicioFila = performance.now();
    btnIniciar.disabled = true;
    btnReiniciar.hidden = true;
    elTap.disabled = false;
    elTap.focus({ preventScroll: true });
    actualizarLectura(0);
    requestAnimationFrame(bucle);
  }

  function detenerFila() {
    if (!puedeDetener()) return;
    const f = estado.filaActual;
    estado.dibujando = false;
    actualizarLectura(f, true);
    dibujar();

    if (f < FILAS - 1) {
      /* Respiro breve y la siguiente fila arranca sola */
      window.setTimeout(() => {
        estado.filaActual = f + 1;
        estado.dibujando = true;
        estado.ultimoT = 0;
        estado.acumulado = 0;
        estado.proximo = siguienteIntervalo();
        estado.inicioFila = performance.now();
        actualizarLectura(estado.filaActual);
        requestAnimationFrame(bucle);
      }, 320);
    } else {
      elTap.disabled = true;
      elTapTexto.textContent = '';
      elTap.classList.remove('activo');
      window.setTimeout(resolver, 260);
    }
  }

  function resolver() {
    const cuatroPuntos = estado.filas.map(r => puntos(r.length));
    const s = indiceSimbolo(cuatroPuntos) + 1;           // 1..16
    const r = consultar(estado.pregunta, s);

    /* Sello: símbolo → letra */
    elSelloGlifo.innerHTML = cuatroPuntos.map(p =>
      '<span class="fila-puntos">' + '<i class="punto"></i>'.repeat(p) + '</span>'
    ).join('');
    elSelloLetra.textContent = r.letra;
    elSelloFila.hidden = false;

    /* Respuesta */
    elRespuestaPregunta.textContent =
      String(r.pregunta.n).padStart(2, '0') + ' · ' + r.pregunta.es;
    elRespuestaTexto.textContent = r.respuesta.es;
    elRespuestaOriginal.textContent = '«' + r.respuesta.en + '»';
    elRespuestaRef.textContent = 'Letra ' + r.letra + ' · símbolo ' + s + '/16';
    elRespuestaVacia.hidden = true;
    elRespuesta.hidden = false;

    /* Interpretación: el género de la respuesta según el traductor de 1855 */
    pintarInterpretacion(r.respuesta.es);

    estado.resuelto = true;
    btnReiniciar.hidden = false;
    pintarCabala(estado.pregunta, s, r.letra);
    guardarEnRegistro(r, s);
    marcarRepetidasDeHoy();
  }

  function reiniciar(silencioso) {
    estado.filas = [[], [], [], []];
    estado.filaActual = -1;
    estado.dibujando = false;
    estado.resuelto = false;
    estado.ultimoT = 0;
    estado.acumulado = 0;
    pintarLecturas();
    dibujar();
    elSelloFila.hidden = true;
    elRespuesta.hidden = true;
    elInterpretacion.hidden = true;
    elRespuestaVacia.hidden = false;
    elTap.disabled = true;
    elTapTexto.textContent = '';
    btnReiniciar.hidden = true;
    btnIniciar.disabled = estado.pregunta === null;
    pintarCabala(estado.pregunta);
    if (!silencioso) ocultarAviso();
  }

  /* ============================================================
     LA CÁBALA
     ============================================================ */
  function glifoSVG(simbolo) {
    const alto = 34, ancho = 18;
    let puntosSVG = '';
    simbolo.forEach((p, i) => {
      const y = 5 + i * 8;
      const xs = p === 1 ? [9] : [5.5, 12.5];
      xs.forEach(x => {
        puntosSVG += '<circle cx="' + x + '" cy="' + y + '" r="1.7" fill="currentColor"/>';
      });
    });
    return '<svg class="glifo-col" width="' + ancho + '" height="' + alto +
           '" viewBox="0 0 ' + ancho + ' ' + alto + '" aria-hidden="true">' + puntosSVG + '</svg>';
  }

  function pintarCabala(qViva, sViva, letraViva) {
    let html = '<thead><tr><th class="esq">Q\\S</th>';
    for (let s = 1; s <= 16; s++) {
      const viva = s === sViva ? ' col-viva' : '';
      html += '<th class="simbolo' + viva + '" scope="col" title="Símbolo ' + s + '">' +
              glifoSVG(SIMBOLOS[s - 1]) + '</th>';
    }
    html += '</tr></thead><tbody>';
    for (let q = 1; q <= 16; q++) {
      const viva = q === qViva ? ' class="fila-viva"' : '';
      html += '<tr' + viva + '><th class="fila-q" scope="row" title="' +
              PREGUNTAS[q - 1].es.replace(/"/g, '') + '">' + String(q).padStart(2, '0') + '</th>';
      for (let s = 1; s <= 16; s++) {
        const marcada = (q === qViva && s === sViva) ? ' class="marcada"' : '';
        html += '<td' + marcada + '>' + letraDe(q, s) + '</td>';
      }
      html += '</tr>';
    }
    html += '</tbody>';
    elCabala.innerHTML = html;

    if (letraViva) {
      elCabalaEnvoltura.hidden = false;
      btnVerCabala.textContent = 'Ocultar tabla';
      const celda = elCabala.querySelector('td.marcada');
      if (celda) celda.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }
  }


  /* ============================================================
     INTERPRETACIÓN — los cinco géneros del traductor de 1855
     ============================================================ */
  function pintarInterpretacion(textoEs) {
    const clave = clasificar(textoEs);
    const g = GENEROS[clave];

    const etiqueta = $('generoEtiqueta');
    etiqueta.textContent = g.nombre;
    etiqueta.dataset.color = g.color;

    $('generoDefinicion').textContent = g.definicion;
    $('generoExige').textContent = g.exige;
    $('ejemploPregunta').textContent = 'Pregunta ' + g.ejemplo.pregunta;
    $('ejemploJeroglifico').textContent = 'Jeroglífico: ' + g.ejemplo.jeroglifico;
    $('ejemploTexto').textContent = '«' + g.ejemplo.texto + '»';
    $('interpDoctrina').textContent = DOCTRINA.aceptacion;

    elInterpretacion.hidden = false;
  }

  /* ============================================================
     AYUDA CONTEXTUAL EN CADA PANEL
     ============================================================ */
  function pintarAyudas() {
    document.querySelectorAll('.ayuda-btn').forEach(btn => {
      const clave = btn.dataset.ayuda;
      const a = AYUDAS[clave];
      const caja = $('ayuda-' + clave);
      if (!a || !caja) return;

      let html = '<h3>' + a.titulo + '</h3>';
      if (a.pasos.length) {
        html += '<ol>' + a.pasos.map(p => '<li>' + p + '</li>').join('') + '</ol>';
      }
      if (a.cita) html += '<p class="ayuda-cita">' + a.cita + '</p>';
      caja.innerHTML = html;

      btn.addEventListener('click', () => {
        const abierta = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!abierta));
        caja.hidden = abierta;
      });
    });
  }

  /* ============================================================
     EL LIBRO — procedencia y método original
     ============================================================ */
  function pintarLibro() {
    elLibroCuerpo.innerHTML =
      bloque('El hallazgo', HISTORIA.relato) +
      bloqueAlerta('Pero conviene saber', HISTORIA.advertencia) +
      bloque('Esta edición', HISTORIA.edicion) +
      bloque('El método original (1855)', HISTORIA.metodo1855) +
      '<div class="libro-bloque"><h3>Las reglas de consulta</h3><ul class="libro-reglas">' +
        DOCTRINA.reglas.map(r => '<li>' + r + '</li>').join('') +
      '</ul></div>' +
      bloque('El rito, sin embelecos', DOCTRINA.ritual) +
      bloque('Sobre los días nefastos', DOCTRINA.diasNefastos) +
      '<div class="libro-bloque"><h3>Preguntas de 1855 que sí se recuperan</h3>' +
        '<p style="margin-bottom:10px">La lámina con las 32 preguntas no viene en el escaneo. ' +
        'Estas diez las cita el traductor en el prólogo, con su número de tabla:</p>' +
        '<ul class="preguntas-1855">' +
        PREGUNTAS_1855.map(p =>
          '<li><span class="qn">' + String(p.n).padStart(2, '0') + '</span>' + p.texto + '</li>'
        ).join('') +
      '</ul></div>';
  }
  function bloque(t, p) {
    return '<div class="libro-bloque"><h3>' + t + '</h3><p>' + p + '</p></div>';
  }
  function bloqueAlerta(t, p) {
    return '<div class="libro-bloque alerta"><h3>' + t + '</h3><p>' + p + '</p></div>';
  }

  /* ============================================================
     REGLAS DE CONSULTA (edición de 1855)
     ============================================================ */
  const DIA_MS = 24 * 60 * 60 * 1000;

  function revisarReglas(q) {
    const reg = leerRegistro();
    const ahora = Date.now();
    const hoy = new Date().toDateString();

    /* "ni debe repetirse la misma pregunta por la misma persona a lo menos en un mes" */
    const mismaEnUnMes = reg.find(x => x.q === q && (ahora - x.ts) < 30 * DIA_MS);
    if (mismaEnUnMes) {
      const dias = Math.ceil((30 * DIA_MS - (ahora - mismaEnUnMes.ts)) / DIA_MS);
      return 'El libro pide no repetir la misma pregunta antes de un mes. Faltan ' + dias +
             (dias === 1 ? ' día.' : ' días.');
    }

    /* "nadie debe hacer más de una pregunta en el mismo día" */
    if (reg.some(x => new Date(x.ts).toDateString() === hoy)) {
      return 'El libro pide no hacer más de una pregunta en el mismo día.';
    }
    return null;
  }

  /* ============================================================
     REGISTRO
     ============================================================ */
  function leerRegistro() {
    try {
      const raw = almacen.leer(CLAVE_REGISTRO);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function preguntasDeHoy() {
    const hoy = new Date().toDateString();
    return leerRegistro()
      .filter(x => new Date(x.ts).toDateString() === hoy)
      .map(x => x.q);
  }

  function guardarEnRegistro(r, s) {
    const reg = leerRegistro();
    reg.unshift({ ts: Date.now(), q: r.pregunta.n, s, letra: r.letra, es: r.respuesta.es });
    almacen.escribir(CLAVE_REGISTRO, JSON.stringify(reg.slice(0, 12)));
    pintarRegistro();
  }

  function pintarRegistro() {
    const reg = leerRegistro();
    elRegistro.innerHTML = '';
    elRegistroVacio.hidden = reg.length > 0;
    btnBorrarRegistro.hidden = reg.length === 0;
    reg.forEach(x => {
      const d = new Date(x.ts);
      const li = document.createElement('li');
      li.innerHTML =
        '<span class="r-fecha">' + d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' }) + '</span>' +
        '<span class="r-letra">' + x.letra + '</span>' +
        '<span class="r-txt">' + x.es + '</span>';
      elRegistro.appendChild(li);
    });
  }

  /* ============================================================
     AVISO
     ============================================================ */
  let accionAviso = null;
  function mostrarAviso(texto, etiquetaBoton, accion) {
    elAviso.innerHTML = '';
    const span = document.createElement('span');
    span.textContent = texto;
    elAviso.appendChild(span);
    if (etiquetaBoton) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = etiquetaBoton;
      b.addEventListener('click', () => { if (accionAviso) accionAviso(); });
      elAviso.appendChild(b);
    }
    accionAviso = accion;
    elAviso.hidden = false;
  }
  function ocultarAviso() { elAviso.hidden = true; accionAviso = null; }

  /* ============================================================
     ARRANQUE
     ============================================================ */
  function inicio() {
    pintarAugurio();
    pintarAyudas();
    pintarLibro();
    pintarPreguntas();
    pintarLecturas();
    pintarCabala();
    pintarRegistro();
    dimensionar();

    btnVerCabala.addEventListener('click', () => {
      const oculta = elCabalaEnvoltura.hidden;
      elCabalaEnvoltura.hidden = !oculta;
      btnVerCabala.textContent = oculta ? 'Ocultar tabla' : 'Ver tabla';
    });

    btnIniciar.addEventListener('click', iniciar);
    btnReiniciar.addEventListener('click', () => reiniciar(false));
    elTap.addEventListener('click', detenerFila);
    btnBorrarRegistro.addEventListener('click', () => {
      almacen.escribir(CLAVE_REGISTRO, '[]');
      pintarRegistro();
      marcarRepetidasDeHoy();
    });

    /* La barra espaciadora también detiene la fila */
    document.addEventListener('keydown', e => {
      if ((e.code === 'Space' || e.key === ' ') && estado.dibujando) {
        e.preventDefault();
        detenerFila();
      }
    });

    let temporizador;
    window.addEventListener('resize', () => {
      clearTimeout(temporizador);
      temporizador = window.setTimeout(dimensionar, 120);
    });

    /* Instalación en el dispositivo (Android / Chrome / Edge).
       En iOS no existe este evento: se instala con Compartir → Añadir a inicio. */
    const btnInstalar = $('btnInstalar');
    let promesaInstalar = null;
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      promesaInstalar = e;
      btnInstalar.hidden = false;
    });
    btnInstalar.addEventListener('click', async () => {
      if (!promesaInstalar) return;
      promesaInstalar.prompt();
      await promesaInstalar.userChoice;
      promesaInstalar = null;
      btnInstalar.hidden = true;
    });
    window.addEventListener('appinstalled', () => { btnInstalar.hidden = true; });

    /* Service worker: sin ruido si el entorno no lo permite */
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => { /* silencio */ });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicio);
  } else {
    inicio();
  }
})();
