/* ============================================================
   ORACULUM — motor del oráculo (edición de 1855, 5 hileras)
   Reconstruye el método completo del Libro de los Destinos:
   32 preguntas, 5 filas de rayas, 32 grupos de estrellas,
   32 jeroglíficos, 1024 respuestas.

   TABLA CABALÍSTICA (verificada contra el libro):
     jeroglifico(q, s) = ((q + s - 2) mod 32) + 1
     respuesta a la pregunta q en el jeroglífico J, fila s, con
     q = ((J - s) mod 32) + 1.
   El ejemplo resuelto del propio libro (pregunta 20 + grupo 26
   -> jeroglífico de la página 13 -> "Tus desgracias son no mas
   que pasajeras") confirma la fórmula en ambos sentidos.
   ============================================================ */

const N = 32;

/* Reducción del libro: si las rayas pasan de 9, cuenta el excedente */
function reducir(n) { while (n > 9) n -= 9; return n; }

/* Paridad -> 1 estrella (impar) o 2 estrellas (par) */
function estrellas(n) { return reducir(n) % 2 === 1 ? 1 : 2; }

/* Las 5 filas de estrellas -> grupo 1..32.
   Fila 1 = bit más significativo. 1 estrella = 0, 2 estrellas = 1. */
function indiceGrupo(cincoFilas) {
  return cincoFilas.reduce((acc, e) => acc * 2 + (e - 1), 0) + 1;
}

/* Los 32 grupos de estrellas, en orden */
const GRUPOS = Array.from({ length: N }, (_, i) => [
  ((i >> 4) & 1) + 1, ((i >> 3) & 1) + 1, ((i >> 2) & 1) + 1,
  ((i >> 1) & 1) + 1, (i & 1) + 1
]);

/* Jeroglífico (página del Libro) para una pregunta y un grupo */
function jeroglificoDe(q, s) { return ((q + s - 2) % N) + 1; }

/* Consulta: q = pregunta 1..32, s = grupo de estrellas 1..32 */
function consultar(q, s) {
  const J = jeroglificoDe(q, s);
  const fila = CORPUS_1855.respuestas[q] || {};
  const r = fila[s] || { es: '', ok: 0 };
  return {
    pregunta: CORPUS_1855.preguntas[q - 1],
    jeroglifico: J,
    nombreJeroglifico: CORPUS_1855.jeroglificos[J] || ('jeroglífico ' + J),
    grupo: GRUPOS[s - 1],
    indiceGrupo: s,
    respuesta: r
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    N, reducir, estrellas, indiceGrupo, GRUPOS, jeroglificoDe, consultar
  };
}
