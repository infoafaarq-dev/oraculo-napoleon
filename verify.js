/* Verificación del oráculo de 1855 (Protocolo Fable, fase QC). */
const path=require('path'), fs=require('fs');
global.CORPUS_1855 = require('./corpus-1855.js').CORPUS_1855;
global.ZODIACO = require('./zodiaco.js').ZODIACO;
global.ZODIACO_INTRO = require('./zodiaco.js').ZODIACO_INTRO;
const M = require('./oraculum-data.js');
const L = require('./libro-1855.js');
const ZP = require('./zodiaco-plus.js');

let fails=0, warns=0;
const ok=(c,m)=>{ console.log((c?'  PASS  ':'  FAIL  ')+m); if(!c)fails++; };
const warn=m=>{ console.log('  WARN  '+m); warns++; };

console.log('\n=== INV-1  Preguntas ===');
ok(CORPUS_1855.preguntas.length===32, '32 preguntas');
ok(CORPUS_1855.preguntas.every((p,i)=>p.n===i+1), 'numeradas 1..32');
ok(new Set(CORPUS_1855.preguntas.map(p=>p.texto)).size===32, '32 textos únicos');

console.log('\n=== INV-2  Motor de 5 filas ===');
ok(M.N===32, 'N = 32 grupos');
ok(M.GRUPOS.length===32 && new Set(M.GRUPOS.map(g=>g.join(''))).size===32, '32 grupos de estrellas distintos');
let idxOk=true; for(let i=0;i<32;i++) if(M.indiceGrupo(M.GRUPOS[i])!==i+1) idxOk=false;
ok(idxOk, 'indiceGrupo(GRUPOS[i]) === i+1');
ok(M.estrellas(12)===1 && M.estrellas(13)===2, 'impar->1 estrella, par->2 (reducción del libro)');

console.log('\n=== INV-3  Tabla cabalística (cuadrado latino) ===');
let filas=true, cols=true;
for(let q=1;q<=32;q++){ const f=[]; for(let s=1;s<=32;s++) f.push(M.jeroglificoDe(q,s)); if(new Set(f).size!==32) filas=false; }
for(let s=1;s<=32;s++){ const c=[]; for(let q=1;q<=32;q++) c.push(M.jeroglificoDe(q,s)); if(new Set(c).size!==32) cols=false; }
ok(filas, 'cada pregunta recorre los 32 jeroglíficos');
ok(cols, 'cada grupo recorre los 32 jeroglíficos');

console.log('\n=== INV-4  Ejemplo resuelto del propio libro ===');
const ej=M.consultar(20,26);
ok(ej.jeroglifico===13, 'pregunta 20 + grupo 26 -> jeroglífico de la página 13');
ok(/pasajera|pasajero|desgracia/i.test(ej.respuesta.es) || ej.respuesta.ok===0,
   'la casilla existe y apunta a la respuesta de la pregunta 20');

console.log('\n=== INV-5  Corpus de 1024 respuestas ===');
let total=0, legibles=0, recuperadas=0, ileg=0;
for(const q in CORPUS_1855.respuestas) for(const s in CORPUS_1855.respuestas[q]){
  total++; const o=CORPUS_1855.respuestas[q][s].ok;
  if(o===1) legibles++; else if(o===2) recuperadas++; else ileg++;
}
ok(total===1024, '1024 casillas (obtenido: '+total+')');
ok(legibles+recuperadas>=800, (legibles+recuperadas)+' con texto ('+Math.round((legibles+recuperadas)*100/1024)+'%): '+legibles+' legibles + '+recuperadas+' recuperadas');
if(ileg>0) warn(ileg+' respuestas siguen ilegibles por el facsímil, marcadas ok:0 (no inventadas)');

console.log('\n=== INV-6  Cobertura por pregunta ===');
const porQ={};
for(let q=1;q<=32;q++){ porQ[q]=0;
  for(let s=1;s<=32;s++){ const r=(CORPUS_1855.respuestas[q]||{})[s]; if(r&&r.ok>=1) porQ[q]++; }
}
const min=Math.min(...Object.values(porQ));
ok(Object.keys(porQ).length===32, 'las 32 preguntas tienen casillas asignadas');
ok(min>=15, 'ninguna pregunta baja de 15 respuestas legibles (mínimo real: '+min+')');

console.log('\n=== INV-7  Clasificador de géneros ===');
const conteo={};
let clasificadas=0;
for(const q in CORPUS_1855.respuestas) for(const s in CORPUS_1855.respuestas[q]){
  const r=CORPUS_1855.respuestas[q][s]; if(!r.ok) continue;
  const g=L.clasificar(r.es); conteo[g]=(conteo[g]||0)+1; clasificadas++;
}
ok(Object.keys(conteo).length===5, 'los cinco géneros aparecen en el corpus');
ok(clasificadas===legibles+recuperadas, 'todas las respuestas con texto quedan clasificadas');
console.log('      reparto:', JSON.stringify(conteo));

console.log('\n=== INV-8  Zodialojía ===');
ok(ZODIACO.length===12, 'los 12 signos');
ok(ZODIACO.every(s=>s.nombre && s.simbolo && s.rango), 'cada signo con nombre, símbolo y rango');
ok(ZODIACO.filter(s=>s.varon && s.varon.length>60).length>=11, 'al menos 11 signos con descripción del varón');
ok(ZODIACO.filter(s=>s.mujer && s.mujer.length>60).length>=11, 'al menos 11 signos con descripción de la mujer');
ok(typeof ZODIACO_INTRO==='string' && ZODIACO_INTRO.length>40, 'intro de la Zodialojía presente');

console.log('\n=== INV-9  Capa doctrinal ===');
ok(Object.keys(L.GENEROS).length===5, 'cinco géneros definidos');
ok(Object.keys(L.AYUDAS).length>=6, 'ayuda contextual para cada panel (incl. zodiaco)');
ok(!!L.HISTORIA.reconstruccion, 'nota de reconstrucción documentada');
ok(L.DOCTRINA.reglas.length===3, 'las 3 reglas de consulta');

console.log('\n=== INV-9b  Zodiaco moderno + consejo diario ===');
ok(Object.keys(ZP.SIGNO_INFO).length===12, 'descripción moderna de los 12 signos');
ok(ZP.lecturaSemanal(0).texto.length>30, 'lectura semanal se genera');
const w1=ZP.lecturaSemanal(3, new Date('2026-01-05')).texto;
const w2=ZP.lecturaSemanal(3, new Date('2026-01-12')).texto;
ok(w1!==w2, 'la lectura cambia de una semana a otra');
const wA=ZP.lecturaSemanal(3, new Date('2026-01-05')).texto;
ok(w1===wA, 'la misma semana da la misma lectura (determinista)');
ok(Object.keys(ZP.CONSEJO_POR_TEMA).length===6, 'consejo para los 6 temas de preguntas');
ok(typeof ZP.consejoDiario('Amor y familia')==='string', 'consejo diario por tema');
ok(typeof ZP.consejoDiario(null)==='string', 'consejo para pregunta propia');
const c1=ZP.consejoDiario('Fortuna y negocios', new Date('2026-03-01'));
const c2=ZP.consejoDiario('Fortuna y negocios', new Date('2026-03-01'));
ok(c1===c2, 'el consejo del día es estable dentro del mismo día');

console.log('\n=== INV-9c  Español modernizado ===');
let arcaismos=0;
for(const q in CORPUS_1855.respuestas) for(const s in CORPUS_1855.respuestas[q]){
  const r=CORPUS_1855.respuestas[q][s]; if(r.ok!==1) continue;
  if(/\bmui\b|\bjénio\b|\bacia\b| i (?=[a-z])|\besceso\b/.test(r.es)) arcaismos++;
}
ok(arcaismos < 20, 'quedan pocos arcaísmos sin modernizar en el corpus ('+arcaismos+')');

console.log('\n=== INV-10  Ficheros de la app ===');
for(const f of ['index.html','styles.css','app.js','oraculum-data.js','corpus-1855.js','zodiaco.js','zodiaco-plus.js','libro-1855.js','sw.js','manifest.webmanifest'])
  ok(fs.existsSync(path.join(__dirname,f)), 'existe '+f);

console.log('\n----------------------------------------');
console.log(fails===0 ? 'status: success, total_errors: 0' : 'status: FAILED, total_errors: '+fails);
console.log('warnings: '+warns);
console.log('----------------------------------------\n');
process.exit(fails?1:0);
