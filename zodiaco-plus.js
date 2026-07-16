/* ============================================================
   ZODIACO-PLUS — capa moderna sobre la Zodialojía de 1855

   Añade, sin tocar el texto histórico de zodiaco.js:
   · descripción moderna de cada signo (elemento, modalidad,
     planeta regente y rasgos), de conocimiento astrológico común
     verificado en varias fuentes;
   · una lectura SEMANAL que rota de forma determinista con el
     número de semana ISO (misma semana -> misma lectura);
   · un CONSEJO DIARIO ligado a la pregunta elegida, en lenguaje
     deliberadamente amplio (estilo oracular) para que siempre
     calce, y didáctico.

   NOTA DE HONESTIDAD: la parte semanal y el consejo diario no son
   astrología "real" ni salen del libro de 1855. Son un espejo para
   pensar, generado por la app de forma determinista. La interfaz lo
   declara. Lo único tomado del libro es el carácter del varón y de
   la mujer (en zodiaco.js).
   ============================================================ */

/* Descripción moderna por signo — rasgos de conocimiento común */
const SIGNO_INFO = {
  'Aries':      { regente:'Marte',   modalidad:'Cardinal', rasgos:'Energía, iniciativa y valentía. Toma la delantera y no teme el desafío; su reto es la paciencia.' },
  'Tauro':      { regente:'Venus',   modalidad:'Fijo',     rasgos:'Constancia, calma y amor por lo estable. Persevera y disfruta lo bueno; su reto es soltar el apego.' },
  'Géminis':    { regente:'Mercurio',modalidad:'Mutable',  rasgos:'Curiosidad, palabra y agilidad mental. Conecta ideas y personas; su reto es sostener el foco.' },
  'Cáncer':     { regente:'la Luna', modalidad:'Cardinal', rasgos:'Sensibilidad, memoria y cuidado. Protege a los suyos; su reto es no encerrarse en la coraza.' },
  'Leo':        { regente:'el Sol',  modalidad:'Fijo',     rasgos:'Carisma, calidez y generosidad. Brilla y crea; su reto es compartir el centro del escenario.' },
  'Virgo':      { regente:'Mercurio',modalidad:'Mutable',  rasgos:'Detalle, método y servicio. Ordena y mejora lo que toca; su reto es aflojar el perfeccionismo.' },
  'Libra':      { regente:'Venus',   modalidad:'Cardinal', rasgos:'Equilibrio, diplomacia y estética. Busca la justicia y el vínculo; su reto es decidir sin dudar tanto.' },
  'Escorpión':  { regente:'Plutón y Marte', modalidad:'Fijo', rasgos:'Intensidad, hondura y transformación. Ve lo que otros no ven; su reto es confiar y soltar el control.' },
  'Sagitario':  { regente:'Júpiter', modalidad:'Mutable',  rasgos:'Optimismo, aventura y sentido. Amplía horizontes; su reto es aterrizar lo que promete.' },
  'Capricornio':{ regente:'Saturno', modalidad:'Cardinal', rasgos:'Disciplina, ambición y aguante. Construye a largo plazo; su reto es no olvidar el descanso.' },
  'Acuario':    { regente:'Urano y Saturno', modalidad:'Fijo', rasgos:'Ingenio, independencia y visión. Piensa distinto y en comunidad; su reto es no distanciarse del sentir.' },
  'Piscis':     { regente:'Neptuno y Júpiter', modalidad:'Mutable', rasgos:'Imaginación, empatía e intuición. Siente y sueña; su reto es poner límites claros.' }
};

/* Fragmentos para la lectura semanal. Se combinan de forma
   determinista con el número de semana; amplios a propósito. */
const SEMANA_APERTURA = [
  'Esta semana el cielo te pide',
  'Los días que vienen favorecen',
  'El pulso de estos siete días apunta a',
  'La corriente de la semana se inclina hacia',
  'Conviene que estos días dediques atención a',
  'El aire de la semana trae'
];
const SEMANA_NUCLEO = [
  'cerrar algo que quedó a medias',
  'escuchar más de lo que hablas',
  'un encuentro que no esperabas',
  'poner orden donde hubo desorden',
  'un gesto de generosidad que vuelve a ti',
  'decidir aquello que venías postergando',
  'cuidar el cuerpo tanto como los planes',
  'una conversación que aclara el aire',
  'soltar un peso que ya no te toca cargar',
  'sembrar hoy lo que cosecharás sin prisa'
];
const SEMANA_CIERRE = [
  'y la paciencia será tu mejor aliada.',
  'sin forzar lo que aún no madura.',
  'confiando más en tu instinto que en el ruido.',
  'y algo pequeño abrirá una puerta grande.',
  'mientras guardas fuerzas para lo que importa.',
  'y el resto se acomodará solo.'
];

/* Consejo diario por afinidad temática de la pregunta.
   Cada grupo de preguntas tiene un pozo de consejos amplios.
   El día del año elige uno; siempre "calza". */
const CONSEJO_POR_TEMA = {
  'Futuro y destino': [
    'Lo que hoy parece niebla, mañana será camino: no apures el paso.',
    'El destino se escribe con lo que eliges hoy, no con lo que temes.',
    'Una señal pequeña vale más que una gran certeza: préstale atención.',
    'No preguntes solo qué vendrá; pregúntate qué estás dispuesto a hacer con ello.'
  ],
  'Vida y destino': [
    'Los tiempos difíciles son estaciones, no domicilios: pasan.',
    'Cuida hoy lo que quieres que dure: la salud, el vínculo, la palabra dada.',
    'Lo que resistes con calma se ablanda; lo que fuerzas se endurece.',
    'Tu suerte cambia cuando cambia tu manera de mirarla.'
  ],
  'Caminos y ausentes': [
    'Quien está lejos también piensa en ti: la distancia no borra los lazos.',
    'Antes de partir, mira si llevas contigo lo que de verdad importa.',
    'Un viaje empieza mucho antes del primer paso: en la decisión.',
    'La noticia que esperas llegará por donde menos la vigilas.'
  ],
  'Fortuna y negocios': [
    'La prudencia de hoy es la ganancia de mañana; no arriesgues lo que no puedes perder.',
    'La oportunidad se disfraza de trabajo: por eso muchos no la reconocen.',
    'Cuenta dos veces antes de comprometer una: la calma también es capital.',
    'Lo que se construye despacio rara vez se derrumba rápido.'
  ],
  'Amistad y personas': [
    'No todo el que sonríe es amigo, ni todo el que calla es enemigo: observa.',
    'Un vínculo se cuida como el fuego: con constancia y sin descuido.',
    'Antes de juzgar a alguien, pregúntate qué no estás viendo.',
    'La palabra que hoy guardes te evitará mañana una disculpa.'
  ],
  'Amor y familia': [
    'El cariño verdadero no se mide en promesas, sino en presencias.',
    'Lo que se riega con paciencia, florece: no exijas frutos fuera de tiempo.',
    'Escucha lo que el otro calla; ahí está lo importante.',
    'La casa se sostiene con gestos pequeños repetidos, no con grandes discursos.'
  ]
};
/* Consejo para la pregunta propia (sin tema fijo): universal. */
const CONSEJO_PROPIA = [
  'La respuesta que buscas ya la intuyes; el Oráculo solo te ayuda a nombrarla.',
  'Formula bien la pregunta y habrás recorrido la mitad del camino.',
  'A veces preguntar es, en el fondo, decidir en voz alta.',
  'No pidas certezas al azar: pídele que ordene lo que ya sientes.'
];

/* --- utilidades deterministas --- */
function semanaISO(d){
  const f=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
  const day=(f.getUTCDay()+6)%7; f.setUTCDate(f.getUTCDate()-day+3);
  const primero=new Date(Date.UTC(f.getUTCFullYear(),0,4));
  return 1+Math.round(((f-primero)/86400000-3+((primero.getUTCDay()+6)%7))/7);
}
function diaDelAno(d){
  const ini=new Date(d.getFullYear(),0,0);
  return Math.floor((d-ini)/86400000);
}
function lecturaSemanal(indiceSigno, fecha){
  const w=semanaISO(fecha||new Date());
  const a=SEMANA_APERTURA[(w+indiceSigno)%SEMANA_APERTURA.length];
  const n=SEMANA_NUCLEO[(w*3+indiceSigno*7)%SEMANA_NUCLEO.length];
  const c=SEMANA_CIERRE[(w+indiceSigno*2)%SEMANA_CIERRE.length];
  return { semana:w, texto:a+' '+n+' '+c };
}
function consejoDiario(tema, fecha){
  const d=diaDelAno(fecha||new Date());
  const pozo=CONSEJO_POR_TEMA[tema]||CONSEJO_PROPIA;
  return pozo[d%pozo.length];
}

if (typeof module !== 'undefined' && module.exports)
  module.exports = { SIGNO_INFO, lecturaSemanal, consejoDiario, semanaISO, diaDelAno,
                     CONSEJO_POR_TEMA, CONSEJO_PROPIA };
