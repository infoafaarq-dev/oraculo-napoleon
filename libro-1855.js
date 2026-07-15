/* ============================================================
   LIBRO DE 1855 — capa doctrinal e interpretativa

   FUENTE: "El Oráculo, ó sea el Libro de los Destinos, el cual fué
   propiedad esclusiva del Emperador Napoleón". Traducido de la 22ª
   edición inglesa. Reimpreso en Bogotá, Imprenta de Nicolás Gómez,
   1855. 102 páginas. Dominio público.

   RÉGIMEN DE VERDAD
   - VERIFICADO: los cinco géneros de respuesta, sus cinco ejemplos, la
     doctrina de Balaspis, las reglas de consulta, las preguntas citadas
     en el prólogo, los jeroglíficos nombrados y la historia del hallazgo.
     Todo transcrito del PDF.
   - INFERIDO: la asignación de cada una de las 256 respuestas a uno de
     los cinco géneros. La taxonomía es del libro; el reparto lo hace
     esta app aplicando reglas gramaticales explícitas (ver clasificar()).
     Queda marcado como tal en la interfaz.
   - AUSENTE: la lámina con las 32 preguntas, los 32 signos y los 32
     jeroglíficos ("la tabla al principio del libro"). No viene en el
     escaneo. Por eso el motor sigue siendo el de la edición de 1884.
   ============================================================ */

/* ---------- Los cinco géneros de respuesta ----------
   "En segundo lugar, i respecto a la calidad de las respuestas, es de
    advertir que las hai de cinco jéneros, a saber: positivas,
    imperativas, presuntivas, monitorias i condicionales."
                                        — Prólogo del traductor, 1855   */

const GENEROS = {
  positiva: {
    nombre: 'Positiva',
    color: 'nilo',
    definicion: 'El Oráculo afirma. No pide nada de ti: enuncia lo que será.',
    exige: 'Recíbela y obra en consecuencia. No la negocies.',
    ejemplo: {
      pregunta: '17 · ¿Me será fiel mi querida en mi ausencia?',
      jeroglifico: 'el Arado',
      texto: 'El cariño de la persona que amas no será puesto más que en ti.'
    }
  },
  imperativa: {
    nombre: 'Imperativa',
    color: 'granate',
    definicion: 'El Oráculo manda. No describe el futuro: te ordena una conducta.',
    exige: 'Obedece. El libro es tajante: quien desobedece, que cargue con el mal.',
    ejemplo: {
      pregunta: '6 · ¿Seré yo afortunado o desgraciado en el juego?',
      jeroglifico: 'los Huesos Cruzados',
      texto: 'Guárdate de jugar dinero en adelante, ni cosa que lo valga.'
    }
  },
  presuntiva: {
    nombre: 'Presuntiva',
    color: 'oro',
    definicion: 'El Oráculo concede lo que pides, pero añade un consejo sobre cómo usarlo. La promesa y la advertencia vienen juntas.',
    exige: 'No te quedes solo con la buena noticia: el consejo es parte de la respuesta.',
    ejemplo: {
      pregunta: '28 · ¿Encontraré yo alguna vez un tesoro?',
      jeroglifico: 'el Cuerno de la Abundancia',
      texto: 'Cuando encuentres un tesoro, enseña a tu lengua a callar; y mira que hagas buen uso de tus riquezas.'
    }
  },
  monitoria: {
    nombre: 'Monitoria',
    color: 'amatista',
    definicion: 'El Oráculo no responde: te devuelve la pregunta. Advierte, o te manda a considerar antes de seguir.',
    exige: 'Detente. La respuesta es que aún no debes decidir.',
    ejemplo: {
      pregunta: '24 · Infórmame de todos los particulares de mi futuro marido.',
      jeroglifico: 'el Arco y Flecha',
      texto: 'Considera bien si debes al presente cambiar tu estado.'
    }
  },
  condicional: {
    nombre: 'Condicional',
    color: 'nacar',
    definicion: 'El Oráculo pone el desenlace en tus manos. Lo que ocurra depende de tu conducta, no del hado.',
    exige: 'Lee la condición, no el resultado. Ahí está lo que se te pide.',
    ejemplo: {
      pregunta: '19 · ¿Serán mis hijos virtuosos y felices después de mi muerte?',
      jeroglifico: 'la Doncella (Virgo)',
      texto: 'En la crianza de tus hijos, cuida que sea estricta la disciplina, pero no cruel: no pierdas ocasión de ilustrar su razón, y ellas te bendecirán en el colmo de su dicha.'
    }
  }
};

/* ---------- Clasificador ----------
   Reglas gramaticales en orden de prioridad. La taxonomía es del libro;
   este reparto es INFERIDO y así se declara en la interfaz.

   1. CONDICIONAL  — hay una condición explícita ("si…", gerundio condicional).
                     El desenlace depende de la conducta.
   2. PRESUNTIVA   — afirma un hecho futuro Y añade un consejo en la misma
                     respuesta (predicción + mandato encadenados).
   3. IMPERATIVA   — el verbo principal está en imperativo.
   4. MONITORIA    — advierte de un peligro o pide considerar, sin mandar.
   5. POSITIVA     — pura afirmación.                                        */

const RE_CONDICION = /(^|[\s,;:¡¿(])si\s|(^|\s)(perseverando|aventurándote|casándote|obrando)(?![\wáéíóúñ])/i;

/* OJO: en JavaScript \b no reconoce vocales acentuadas ("sé\b" nunca coincide).
   Se usa un cierre explícito de palabra que sí las contempla. */
const FIN = '(?![\\wáéíóúüñ])';

const IMPERATIVOS = [
  'guárdate', 'guarda', 'declina', 'cambia', 'prepárate', 'prepara', 'evita',
  'apresura', 'permanece', 'emprende', 'reconcíliate', 'conténtate', 'regocíjate',
  'levanta', 'alégrate', 'espera', 'confía', 'pon', 'sé', 'deja', 'acepta',
  'abandona', 'considera', 'medita', 'ten', 'obra', 'cuida', 'mira', 'reza',
  'pide', 'apártate', 'harás bien', 'debes', '(?:mejor\\s+)?quédate',
  'no\\s+(?:confíes|te\\s+fíes|demores|deposites|te\\s+aventures|esperes|te\\s+embriagues)'
];
const RE_IMPERATIVO = new RegExp('^\\s*(?:' + IMPERATIVOS.join('|') + ')' + FIN, 'i');

/* Preámbulos: cláusulas subordinadas que no afirman nada por sí solas */
const RE_PREAMBULO = /^\s*(sean cuales|cualquiera|estando|cuando|mientras|aunque|a pesar|en spite)/i;

/* Advertencia o peligro, sin mandato */
const RE_MONITORIA = /(anuncia que|hay\s+(?:enemigos|infortunios|bribones)|tienes enemigos|acechando|cuidado:|un enemigo|te rehúye|es dudosa|es dudoso|es improbable|es vana|es vano|son vanas|son vanos|en vano|no es un amigo|te odia|es falso|engañoso)/i;

function clasificar(textoEs) {
  const t = textoEs.trim();

  /* 1. CONDICIONAL — el desenlace depende de tu conducta */
  if (RE_CONDICION.test(t)) return 'condicional';

  /* Partir en cláusulas: el mandato del Oráculo suele ir tras coma o dos puntos */
  const partes = t.split(/[:;—]|,\s|\bpero\b/i).map(s => s.trim()).filter(Boolean);
  const idxMandato = partes.findIndex(p => RE_IMPERATIVO.test(p));

  if (idxMandato === 0) return 'imperativa';           /* 2. abre mandando */

  if (idxMandato > 0) {
    const antes = partes.slice(0, idxMandato);
    /* Si todo lo anterior es un preámbulo, el Oráculo sigue mandando */
    if (antes.every(p => RE_PREAMBULO.test(p))) return 'imperativa';
    /* 3. PRESUNTIVA — afirma un hecho y después añade un consejo */
    return 'presuntiva';
  }

  /* 4. MONITORIA — advierte sin mandar */
  if (RE_MONITORIA.test(t)) return 'monitoria';

  /* 5. POSITIVA — pura afirmación */
  return 'positiva';
}

/* ---------- Doctrina de Balaspis (transcrita del PDF) ---------- */

const DOCTRINA = {
  aceptacion: 'Es un deber del consultante contentarse con cualquier respuesta que le toque en suerte recibir, y seguir sin reserva los dictados del Oráculo. «¿Si no se han de obedecer las órdenes de Hermes, para qué es el preguntar?»',
  reglas: [
    'Nadie debe hacer más de una pregunta en el mismo día.',
    'La misma persona no debe repetir la misma pregunta, al menos en un mes.',
    'La pregunta se pronuncia tal como está escrita, sin quitar ni poner nada de ella.'
  ],
  diasNefastos: 'La edición inglesa lista días nefastos en que no debe consultarse. El traductor de 1855 los descarta de plano: «todos los días del año son santos y buenos para consultar el Libro de los Destinos, sin reparar en que sea de noche o de día, que haga claro u oscuro, que llueva o que nieve». Esta app muestra el día, pero no te lo impide.',
  ritual: 'El libro permite prescindir del círculo, los signos del Zodiaco y la caña mojada en sangre. Basta una pluma, un lápiz o un carbón — o el dedo en la arena. Sin invocaciones ni embelecos.'
};

/* ---------- Historia real del libro ---------- */

const HISTORIA = {
  relato: 'Tras la derrota de Leipzig en 1813, el manuscrito apareció en el equipaje de campaña de Napoleón. Cayó en manos de un oficial prusiano que, ignorando su valor, lo vendió por unos napoleones a un general francés prisionero en la fortaleza de Koningsburg. Este quiso devolverlo a las Tullerías, pero murió tras la amputación de su brazo derecho. El original habría sido un papiro egipcio hallado en 1801 por M. Sonnini en una tumba del Alto Egipto, cerca del monte Líbico.',
  advertencia: 'Nada de esto está documentado fuera del propio libro. El "manuscrito egipcio" no ha aparecido nunca y la atribución a Napoleón es, casi con certeza, un recurso comercial del siglo XIX. El libro se vendió muchísimo precisamente por ella.',
  edicion: 'Esta app reconstruye la traducción castellana de la 22ª edición inglesa, reimpresa en Bogotá en 1855: 32 preguntas, cinco hileras de rayas, 32 jeroglíficos y 1.024 respuestas, más la Zodialojía. El corpus se transcribió del facsímil que aportaste.',
  metodo1855: 'Cinco hileras de rayas. Se cuentan: si el número es impar, una estrella; si es par, dos. Las cinco filas forman uno de los 32 grupos de estrellas. El cruce del grupo con tu pregunta, en la tabla cabalística, da un jeroglífico — el Sol, el Arado, el Cuerno de la Abundancia, el Arco y Flecha, los Huesos Cruzados, la Doncella… Cada jeroglífico es una página con 32 respuestas.',
  reconstruccion: 'La lámina desplegable con la tabla no venía en el escaneo, pero el propio libro trae un ejemplo resuelto: la pregunta 20 con el grupo de estrellas 26 lleva al jeroglífico de la página 13, «tus desgracias son no mas que pasajeras». Ese ejemplo confirma que la tabla es un cuadrado latino cíclico, y así se reconstruyó, verificándola en ambos sentidos. Las 1.024 respuestas se leyeron por OCR del facsímil; unas 180 quedaron ilegibles por el estado del papel y van señaladas como tales — nunca se inventan. Si el azar te lleva a una de ellas, basta trazar de nuevo.'
};

/* ---------- Ayudas contextuales de cada panel ---------- */

const AYUDAS = {
  pregunta: {
    titulo: 'Cómo se elige la pregunta',
    pasos: [
      'El libro de 1855 trae <strong>32 preguntas</strong>. Escoge una sola: no la modifiques ni la mezcles, pues el rito pide pronunciarla «tal como está escrita».',
      'Si ninguna encaja, usa la <strong>ranura de pregunta propia</strong> al final de la lista y escribe la tuya. El Oráculo la encaminará al registro afín por su tema.',
      'Una pregunta al día. La misma, no antes de un mes: la app te avisa, pero puedes seguir.'
    ],
    cita: 'El Oráculo está dotado de toda la variedad de respuesta que estas preguntas requieren.'
  },
  trazado: {
    titulo: 'Cómo se trazan las rayas',
    pasos: [
      'Pulsa <em>Comenzar</em> una sola vez. La pluma traza rayas sola: no lo pienses, «deja que la pluma sea tu guía».',
      'Un toque detiene la fila. La siguiente arranca de inmediato. Cuatro filas, cuatro toques.',
      'Se cuentan las rayas de cada fila. Si pasan de nueve, cuenta solo el excedente. Si es <strong>impar</strong> vale un punto (•); si es <strong>par</strong>, dos (• •).',
      'Los cuatro puntos forman tu símbolo, uno de dieciséis.'
    ],
    cita: 'Basta marcar las hileras de rayas con caña, pluma, un palo o el dedo, con un carbón en la pared o con un bastón en la arena — sin invocaciones ni embelecos.'
  },
  respuesta: {
    titulo: 'Cómo se lee la respuesta',
    pasos: [
      'La respuesta no se negocia: el libro obliga a «contentarse con cualquiera que toque en suerte recibir».',
      'Fíjate en el <strong>género</strong>. El traductor de 1855 distingue cinco, y cada uno pide algo distinto: unos afirman, otros mandan, otros solo advierten.',
      'Debajo va el texto inglés original de 1884, por si quieres contrastarlo.'
    ],
    cita: '¿Si no se han de obedecer las órdenes de Hermes, para qué es el preguntar?'
  },
  zodiaco: {
    titulo: 'Cómo se lee tu signo',
    pasos: [
      'Elige tu signo en el menú, o pulsa <strong>Mi signo hoy</strong> para ver el del día.',
      'El libro da dos retratos por signo: el del <strong>varón</strong> y el de la <strong>mujer</strong> nacidos bajo él. Son de 1855: reflejan la moral de su época.',
      'El texto es de la sección «Zodialojía» del propio libro, transcrita del escaneo.'
    ],
    cita: 'Examina tu índole con estricta imparcialidad, sin atribuirte virtudes que no posees, ni vicios a que no eres aficionado.'
  },
  cabala: {
    titulo: 'Cómo el símbolo se vuelve letra',
    pasos: [
      'Busca tu símbolo en la fila de arriba (columnas) y tu pregunta en la columna de la izquierda (filas).',
      'Donde se cruzan hay una letra: una página del Libro de los Destinos.',
      'En esa página, la respuesta junto a tu símbolo es la que el Oráculo te da.',
      'En la edición de 1855 la letra era un jeroglífico — el Arado, el Puñal, el Arco y Flecha — y las respuestas, 1.024. El mecanismo es el mismo.'
    ],
    cita: 'Bajando un dedo desde las estrellas i corriendo otro desde la pregunta, se encontrarán ambos en el mismo punto.'
  },
  registro: {
    titulo: 'Para qué sirve el registro',
    pasos: [
      'Guarda tus últimas consultas para cumplir la regla: una pregunta al día, la misma no antes de un mes.',
      'Vive solo en este dispositivo. No hay servidor ni cuenta.',
      'Puedes borrarlo cuando quieras.'
    ],
    cita: null
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GENEROS, clasificar, DOCTRINA, HISTORIA, AYUDAS };
}
