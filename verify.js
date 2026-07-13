/* Verificación independiente (Fase 4 / 4b del Protocolo Fable).
   Relee el archivo de datos desde disco y recomputa todo desde cero,
   sin reutilizar la lógica del constructor. */

const path = require('path');
const D = require(path.join(__dirname, 'oraculum-data.js'));

let fails = 0, warns = 0;
const ok = (cond, msg) => {
  if (cond) { console.log('  PASS  ' + msg); }
  else { console.log('  FAIL  ' + msg); fails++; }
};
const warn = (msg) => { console.log('  WARN  ' + msg); warns++; };

console.log('\n=== INV-1  Preguntas ===');
ok(D.PREGUNTAS.length === 16, '16 preguntas');
ok(D.PREGUNTAS.every((p, i) => p.n === i + 1), 'numeradas 1..16 en orden');
ok(new Set(D.PREGUNTAS.map(p => p.es)).size === 16, '16 textos ES únicos');

console.log('\n=== INV-2  Letras ===');
ok(D.LETRAS.length === 16, '16 letras');
ok(new Set(D.LETRAS).size === 16, 'sin repetidas');
ok(!D.LETRAS.includes('J'), 'omite la J (como el original)');

console.log('\n=== INV-3  Corpus de respuestas ===');
const todas = [];
let paginasOk = true;
for (const L of D.LETRAS) {
  const pag = D.RESPUESTAS[L];
  if (!pag || pag.length !== 16) { paginasOk = false; console.log('       pagina ' + L + ' tiene ' + (pag ? pag.length : 0)); }
  else pag.forEach(r => todas.push(r));
}
ok(paginasOk, '16 páginas x 16 respuestas');
ok(todas.length === 256, 'total = 256 respuestas (obtenido: ' + todas.length + ')');
ok(todas.every(r => r.es && r.es.trim().length > 0), 'ninguna respuesta ES vacía');
ok(todas.every(r => r.en && r.en.trim().length > 0), 'ninguna respuesta EN vacía');
const uniqEs = new Set(todas.map(r => r.es)).size;
const uniqEn = new Set(todas.map(r => r.en)).size;
if (uniqEs === 256) ok(true, '256 respuestas ES únicas');
else warn('respuestas ES únicas: ' + uniqEs + '/256 (el original repite algunas frases breves)');
if (uniqEn === 256) ok(true, '256 respuestas EN únicas');
else warn('respuestas EN únicas: ' + uniqEn + '/256 (el original repite algunas frases breves)');

console.log('\n=== INV-4  Tabla cabalística = cuadrado latino ===');
let filasOk = true, colsOk = true;
for (let q = 1; q <= 16; q++) {
  const fila = [];
  for (let s = 1; s <= 16; s++) fila.push(D.letraDe(q, s));
  if (new Set(fila).size !== 16) filasOk = false;
}
for (let s = 1; s <= 16; s++) {
  const col = [];
  for (let q = 1; q <= 16; q++) col.push(D.letraDe(q, s));
  if (new Set(col).size !== 16) colsOk = false;
}
ok(filasOk, 'cada fila (pregunta) contiene las 16 letras sin repetir');
ok(colsOk, 'cada columna (símbolo) contiene las 16 letras sin repetir');
ok(D.letraDe(1, 1) === 'A' && D.letraDe(1, 16) === 'Q' && D.letraDe(2, 1) === 'B',
   'fila 1 = A..Q y fila 2 arranca en B (coincide con el facsímil)');

console.log('\n=== INV-5  Caso documentado del libro ===');
/* Fuente: el ejemplo publicado indica que la pregunta 1 con el símbolo
   ilustrado da la letra P, y la respuesta "What you wish will be granted to you". */
const idxP0 = D.LETRAS.indexOf('P');                    // 14 (0-based)
const sEsperado = ((idxP0 - (1 - 1)) % 16 + 16) % 16 + 1; // s tal que letraDe(1,s)='P' -> 15
const caso = D.consultar(1, sEsperado);
ok(caso.letra === 'P', 'pregunta 1 + símbolo ' + sEsperado + ' -> letra P');
ok(/what you wish will be granted to you/i.test(caso.respuesta.en),
   'la respuesta es la documentada: "' + caso.respuesta.en + '"');

console.log('\n=== INV-6  Alineación pregunta<->respuesta (test estructural independiente) ===');
/* En el libro, TODAS las respuestas a la pregunta 16 ("¿qué significa mi sueño?")
   empiezan con "Signifies" / "That", y NINGUNA otra lo hace.
   TODAS las respuestas a la pregunta 12 (hijo o hija) mencionan son/daughter/boy,
   y ninguna otra lo hace. Si el orden de transcripción tuviera un solo
   desfase, estos dos tests fallarían. */
const esOnirica = t => /^(signifies|that\b)/i.test(t.trim());
const esProle   = t => /\b(son|daughter|daughters|boy|girl)\b/i.test(t);

let n16 = 0, falso16 = 0, n12 = 0, falso12 = 0;
for (let Li = 1; Li <= 16; Li++) {
  const L = D.LETRAS[Li - 1];
  for (let s = 1; s <= 16; s++) {
    const q = ((Li - s) % 16 + 16) % 16 + 1;
    const en = D.RESPUESTAS[L][s - 1].en;
    if (q === 16) { if (esOnirica(en)) n16++; } else if (esOnirica(en)) falso16++;
    if (q === 12) { if (esProle(en)) n12++; } else if (esProle(en)) falso12++;
  }
}
ok(n16 === 16, 'las 16 respuestas de la pregunta 16 abren con Signifies/That (' + n16 + '/16)');
ok(falso16 === 0, 'ninguna otra respuesta abre así (falsos positivos: ' + falso16 + ')');
ok(n12 === 16, 'las 16 respuestas de la pregunta 12 hablan de hijo/hija (' + n12 + '/16)');
ok(falso12 === 0, 'ninguna otra lo hace (falsos positivos: ' + falso12 + ')');

console.log('\n=== INV-7  Coherencia del motor ===');
/* El libro de 1884 repite exactamente 2 frases, y ambas repeticiones caen
   dentro de la MISMA pregunta (12 y 13). Es fidelidad a la fuente, no un
   error de transcripción: se tolera y se documenta. */
const REPETICIONES_ESPERADAS = 2;
let colisiones = 0;
for (let q = 1; q <= 16; q++) {
  const set = new Set();
  for (let s = 1; s <= 16; s++) set.add(D.consultar(q, s).respuesta.es);
  colisiones += (16 - set.size);
}
ok(colisiones === REPETICIONES_ESPERADAS,
   'respuestas repetidas por pregunta = ' + colisiones + ' (las 2 del original de 1884; el resto, únicas)');
ok(D.consultar(7, 3).respuesta.es === D.consultar(7, 3).respuesta.es, 'determinista');

console.log('\n=== INV-8  Reducción y paridad (regla del libro: 12->3, 13->4, 14->5, 15->6) ===');
ok(D.reducir(12) === 3 && D.reducir(13) === 4 && D.reducir(14) === 5 && D.reducir(15) === 6,
   'excedente sobre 9 correcto');
ok(D.puntos(12) === 1 && D.puntos(13) === 2 && D.puntos(14) === 1 && D.puntos(15) === 2,
   'impar -> 1 punto, par -> 2 puntos (ejemplo del libro: * ** * **)');
ok(D.reducir(9) === 9 && D.puntos(9) === 1, 'n=9 no se reduce y es impar');
ok(D.reducir(27) === 9, 'reducción iterada para conteos altos (SUPUESTO declarado)');

console.log('\n=== INV-9  Símbolos ===');
ok(D.SIMBOLOS.length === 16, '16 símbolos');
ok(new Set(D.SIMBOLOS.map(x => x.join(''))).size === 16, 'los 16 son distintos');
let idxOk = true;
for (let i = 0; i < 16; i++) if (D.indiceSimbolo(D.SIMBOLOS[i]) !== i) idxOk = false;
ok(idxOk, 'indiceSimbolo(SIMBOLOS[i]) === i');
/* El ejemplo del libro: filas 12,13,14,15 rayas -> * ** * ** */
const ejemplo = [12, 13, 14, 15].map(D.puntos);
ok(JSON.stringify(ejemplo) === JSON.stringify([1, 2, 1, 2]), 'ejemplo del libro reproducido: 1,2,1,2');

console.log('\n=== INV-10  Días nefastos (ed. 1884) ===');
const totalDias = Object.values(D.DIAS_NEFASTOS).flat();
ok(Object.keys(D.DIAS_NEFASTOS).length === 12, 'los 12 meses');
ok(totalDias.every(d => d >= 1 && d <= 31), 'todos los días en rango 1..31');
ok(D.esDiaNefasto(new Date(2026, 0, 6)) === true, '6 de enero es nefasto');
ok(D.esDiaNefasto(new Date(2026, 6, 13)) === false, '13 de julio no es nefasto');

console.log('\n----------------------------------------');
console.log(fails === 0 ? 'status: success, total_errors: 0' : 'status: FAILED, total_errors: ' + fails);
console.log('warnings: ' + warns);
console.log('----------------------------------------\n');
process.exit(fails === 0 ? 0 : 1);
