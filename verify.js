/* Verificación del oráculo de 1855 (Protocolo Fable, fase QC). */
const path=require('path'), fs=require('fs');
global.CORPUS_1855 = require('./corpus-1855.js').CORPUS_1855;
global.ZODIACO = require('./zodiaco.js').ZODIACO;
global.ZODIACO_INTRO = require('./zodiaco.js').ZODIACO_INTRO;
const M = require('./oraculum-data.js');
const L = require('./libro-1855.js');

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
let total=0, legibles=0;
for(const q in CORPUS_1855.respuestas) for(const s in CORPUS_1855.respuestas[q]){
  total++; if(CORPUS_1855.respuestas[q][s].ok) legibles++;
}
ok(total===1024, '1024 casillas (obtenido: '+total+')');
ok(legibles>=800, legibles+' respuestas legibles ('+Math.round(legibles*100/1024)+'%)');
if(legibles<1024) warn((1024-legibles)+' respuestas ilegibles por el facsímil, marcadas ok:0 (no inventadas)');

console.log('\n=== INV-6  Cobertura por pregunta ===');
const porQ={};
for(let q=1;q<=32;q++){ porQ[q]=0;
  for(let s=1;s<=32;s++){ const r=(CORPUS_1855.respuestas[q]||{})[s]; if(r&&r.ok) porQ[q]++; }
}
const min=Math.min(...Object.values(porQ));
ok(Object.keys(porQ).length===32, 'las 32 preguntas tienen casillas asignadas');
ok(min>=15, 'ninguna pregunta baja de 15 respuestas legibles (mínimo real: '+min+')');

console.log('\n=== INV-7  Clasificador de géneros ===');
const conteo={};
for(const q in CORPUS_1855.respuestas) for(const s in CORPUS_1855.respuestas[q]){
  const r=CORPUS_1855.respuestas[q][s]; if(!r.ok) continue;
  const g=L.clasificar(r.es); conteo[g]=(conteo[g]||0)+1;
}
ok(Object.keys(conteo).length===5, 'los cinco géneros aparecen en el corpus');
ok(Object.values(conteo).reduce((a,b)=>a+b,0)===legibles, 'todas las legibles quedan clasificadas');
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

console.log('\n=== INV-10  Ficheros de la app ===');
for(const f of ['index.html','styles.css','app.js','oraculum-data.js','corpus-1855.js','zodiaco.js','libro-1855.js','sw.js','manifest.webmanifest'])
  ok(fs.existsSync(path.join(__dirname,f)), 'existe '+f);

console.log('\n----------------------------------------');
console.log(fails===0 ? 'status: success, total_errors: 0' : 'status: FAILED, total_errors: '+fails);
console.log('warnings: '+warns);
console.log('----------------------------------------\n');
process.exit(fails?1:0);
