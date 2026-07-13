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
    sello.title = nefasto
      ? 'El libro desaconseja consultar en esta fecha.'
      : 'Fecha no listada entre los días nefastos del libro.';
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
    const hechas = preguntasDeHoy();
    document.querySelectorAll('.pregunta').forEach(b => {
      b.classList.toggle('repetida', hechas.includes(Number(b.dataset.q)));
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

    /* Regla del libro: no repetir la misma pregunta el mismo día */
    if (!estado.confirmadaRepeticion && preguntasDeHoy().includes(estado.pregunta)) {
      mostrarAviso(
        'El libro prohíbe hacer la misma pregunta dos veces en un día.',
        'Consultar igual',
        () => { estado.confirmadaRepeticion = true; ocultarAviso(); iniciar(); }
      );
      return;
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
      const celda = elCabala.querySelector('td.marcada');
      if (celda && !document.getElementById('detallesCabala').open) {
        document.getElementById('detallesCabala').open = true;
      }
      if (celda) celda.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }
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
    pintarPreguntas();
    pintarLecturas();
    pintarCabala();
    pintarRegistro();
    dimensionar();

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
