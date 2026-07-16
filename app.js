/* ============================================================
   ORACULUM — lógica de la aplicación (edición de 1855)
   Cinco filas de rayas; un toque cierra cada una y la siguiente
   arranca sola. 32 preguntas fijas + pregunta propia. Zodialojía.
   ============================================================ */
(function () {
  'use strict';

  const almacen = (() => {
    const mem = {}; let ok = false;
    try { localStorage.setItem('__t__','1'); localStorage.removeItem('__t__'); ok = true; } catch (e) {}
    return {
      leer(k){ try { return ok ? localStorage.getItem(k) : (mem[k] ?? null); } catch(e){ return mem[k] ?? null; } },
      escribir(k,v){ try { if (ok) localStorage.setItem(k,v); else mem[k]=v; } catch(e){ mem[k]=v; } }
    };
  })();
  const CLAVE = 'oraculum.registro.v2';

  const FILAS = 5;
  const MINIMO_RAYAS = 12;
  const CADENCIA_MS = 78;
  const JITTER = 0.55;
  const MINIMO_MS = 850;
  const DENSIDAD_BASE = 22;

  const estado = {
    pregunta: null,        // 1..32, o 'propia'
    textoPropia: '',
    filas: [[],[],[],[],[]],
    filaActual: -1,
    dibujando: false,
    resuelto: false,
    ultimoT: 0, acumulado: 0, proximo: CADENCIA_MS, inicioFila: 0,
    confirmada: false
  };

  const $ = id => document.getElementById(id);
  const elPreguntas=$('preguntas'), elLienzo=$('lienzo'), elTap=$('lienzoTap'),
    elTapTexto=$('lienzoTapTexto'), elLecturas=$('lecturas'),
    btnIniciar=$('btnIniciar'), btnReiniciar=$('btnReiniciar'),
    elSelloFila=$('selloFila'), elSelloGlifo=$('selloGlifo'), elSelloJero=$('selloJero'),
    elRespuesta=$('respuesta'), elRespuestaVacia=$('respuestaVacia'),
    elRespuestaPregunta=$('respuestaPregunta'), elRespuestaTexto=$('respuestaTexto'),
    elRespuestaRef=$('respuestaRef'), elInterpretacion=$('interpretacion'),
    elCabala=$('cabala'), elCabalaEnvoltura=$('cabalaEnvoltura'), btnVerCabala=$('btnVerCabala'),
    elRegistro=$('registro'), elRegistroVacio=$('registroVacio'), btnBorrar=$('btnBorrarRegistro'),
    elLibroCuerpo=$('libroCuerpo'), elAviso=$('aviso'),
    elPropiaInput=$('propiaInput'), elPropiaOk=$('propiaOk'),
    elZodiacoRejilla=$('zodiacoRejilla'), elZodiacoIntro=$('zodiacoIntro'), elSignoDetalle=$('signoDetalle'),
    elConsejoDia=$('consejoDia'), elConsejoTexto=$('consejoTexto');

  const ctx = elLienzo.getContext('2d');
  let W=0, H=0;

  /* ---------- Augurio ---------- */
  function pintarAugurio(){
    const hoy=new Date();
    $('augurioFecha').textContent = hoy.toLocaleDateString('es-CL',{day:'numeric',month:'long'});
    const s=$('augurioSello');
    s.textContent='Día propicio';
    s.title='Toca para ver qué dice el libro sobre las fechas';
    s.onclick=()=>mostrarAviso(DOCTRINA.diasNefastos,'Entendido',ocultarAviso);
  }

  /* ---------- Preguntas ---------- */
  function pintarPreguntas(){
    elPreguntas.innerHTML='';
    let grupo=null;
    CORPUS_1855.preguntas.forEach(p=>{
      if (p.grupo!==grupo){
        grupo=p.grupo;
        const r=document.createElement('li'); r.className='grupo-rotulo';
        r.textContent=grupo; r.setAttribute('role','presentation');
        elPreguntas.appendChild(r);
      }
      const li=document.createElement('li'); li.setAttribute('role','presentation');
      const b=document.createElement('button');
      b.type='button'; b.className='pregunta'; b.setAttribute('role','option');
      b.setAttribute('aria-selected','false'); b.dataset.q=String(p.n);
      b.innerHTML='<span class="num">'+String(p.n).padStart(2,'0')+'</span><span class="txt">'+p.texto+'</span>';
      b.addEventListener('click',()=>elegir(p.n));
      li.appendChild(b); elPreguntas.appendChild(li);
    });
    marcarRepetidas();
  }

  function elegir(n){
    if (estado.dibujando) return;
    estado.pregunta=n; estado.textoPropia=''; estado.confirmada=false;
    elPropiaInput.value='';
    ocultarAviso();
    document.querySelectorAll('.pregunta').forEach(b=>b.setAttribute('aria-selected', String(Number(b.dataset.q)===n)));
    btnIniciar.disabled=false;
    if (estado.resuelto) reiniciar(false);
    pintarCabala(typeof n==='number'?n:null);
    mostrarConsejo(CORPUS_1855.preguntas[n-1].grupo);
  }

  function elegirPropia(){
    const t=elPropiaInput.value.trim();
    if (t.length<4){ mostrarAviso('Escribe una pregunta un poco más larga.','Vale',ocultarAviso); return; }
    if (estado.dibujando) return;
    estado.pregunta='propia'; estado.textoPropia=t; estado.confirmada=false;
    document.querySelectorAll('.pregunta').forEach(b=>b.setAttribute('aria-selected','false'));
    btnIniciar.disabled=false;
    if (estado.resuelto) reiniciar(false);
    pintarCabala(null);
    mostrarConsejo(null);
    mostrarAviso('Tu pregunta queda fijada. El Oráculo la responderá por el azar de las estrellas.','Entendido',ocultarAviso);
  }

  function mostrarConsejo(tema){
    elConsejoTexto.textContent = consejoDiario(tema);
    elConsejoDia.hidden = false;
  }

  function marcarRepetidas(){
    document.querySelectorAll('.pregunta').forEach(b=>{
      b.classList.toggle('repetida', revisarReglas(Number(b.dataset.q))!==null);
    });
  }

  /* ---------- Trazado ---------- */
  function dimensionar(){
    const dpr=Math.min(window.devicePixelRatio||1,2);
    const rect=elLienzo.getBoundingClientRect();
    W=rect.width; H=rect.width<520?280:330;
    elLienzo.style.height=H+'px';
    elLienzo.width=Math.round(W*dpr); elLienzo.height=Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    dibujar();
  }
  function nuevaRaya(){
    return { inc:(Math.random()-0.5)*0.34, largo:0.62+Math.random()*0.3,
             grosor:1.4+Math.random()*1.0, desvio:(Math.random()-0.5)*3 };
  }
  function intervalo(){ return CADENCIA_MS*(1+(Math.random()*2-1)*JITTER); }

  function dibujar(){
    ctx.clearRect(0,0,W,H);
    const padX=24, usable=W-padX*2, banda=H/FILAS;
    for (let f=0; f<FILAS; f++){
      const cy=banda*f+banda/2, rayas=estado.filas[f];
      const activa=f===estado.filaActual && estado.dibujando, fijada=rayas.length>0 && !activa;
      ctx.save();
      ctx.strokeStyle=activa?'rgba(166,54,43,.30)':'rgba(164,138,78,.4)';
      ctx.lineWidth=1; ctx.setLineDash([2,6]);
      ctx.beginPath(); ctx.moveTo(padX,cy); ctx.lineTo(W-padX,cy); ctx.stroke();
      ctx.restore();
      if (!rayas.length) continue;
      const cap=Math.max(DENSIDAD_BASE,rayas.length), paso=usable/cap, alt=banda*0.46;
      ctx.save(); ctx.lineCap='round';
      rayas.forEach((r,i)=>{
        const x=padX+(i+0.5)*paso+r.desvio*0.3, mitad=(alt*r.largo)/2, dx=Math.tan(r.inc)*mitad;
        const nueva=activa && i===rayas.length-1;
        if (activa){ ctx.strokeStyle=nueva?'#A6362B':'#8A4A2E'; ctx.shadowColor='rgba(166,54,43,.4)'; ctx.shadowBlur=nueva?10:4; }
        else if (fijada){ ctx.strokeStyle='rgba(74,54,32,.72)'; ctx.shadowBlur=0; }
        ctx.lineWidth=r.grosor;
        ctx.beginPath(); ctx.moveTo(x-dx,cy-mitad); ctx.lineTo(x+dx,cy+mitad); ctx.stroke();
      });
      ctx.restore();
    }
  }
  function bucle(t){
    if (!estado.dibujando) return;
    if (!estado.ultimoT) estado.ultimoT=t;
    estado.acumulado+=t-estado.ultimoT; estado.ultimoT=t;
    while (estado.acumulado>=estado.proximo){
      estado.acumulado-=estado.proximo; estado.proximo=intervalo();
      estado.filas[estado.filaActual].push(nuevaRaya());
      actualizarLectura(estado.filaActual);
    }
    dibujar(); actualizarTexto(); requestAnimationFrame(bucle);
  }
  function puedeDetener(){
    return estado.dibujando && estado.filas[estado.filaActual].length>=MINIMO_RAYAS
      && (performance.now()-estado.inicioFila)>=MINIMO_MS;
  }
  function actualizarTexto(){
    if (!estado.dibujando){ elTapTexto.textContent=''; elTap.classList.remove('activo'); return; }
    if (puedeDetener()){ elTapTexto.textContent='Toca para detener la fila '+(estado.filaActual+1); elTap.classList.add('activo'); }
    else { elTapTexto.textContent='Trazando la fila '+(estado.filaActual+1)+'…'; elTap.classList.remove('activo'); }
  }
  function pintarLecturas(){
    elLecturas.innerHTML='';
    for (let f=0; f<FILAS; f++){
      const li=document.createElement('li'); li.className='lectura'; li.id='lectura-'+f;
      li.innerHTML='<span class="fila-n">Fila '+(f+1)+'</span><span class="cuenta">—</span><span class="paridad">&nbsp;</span>';
      elLecturas.appendChild(li);
    }
  }
  function actualizarLectura(f,fijar){
    const li=$('lectura-'+f); if (!li) return;
    const n=estado.filas[f].length;
    li.querySelector('.cuenta').textContent=n>0?n:'—';
    li.classList.toggle('activa', f===estado.filaActual && estado.dibujando);
    if (fijar){
      const e=estrellas(n);
      li.querySelector('.paridad').textContent=(e===1?'★':'★ ★');
      li.classList.add('fijada'); li.classList.remove('activa');
    }
  }

  function iniciar(){
    if (estado.pregunta===null || estado.dibujando) return;
    if (!estado.confirmada && typeof estado.pregunta==='number'){
      const inf=revisarReglas(estado.pregunta);
      if (inf){ mostrarAviso(inf,'Consultar igual',()=>{ estado.confirmada=true; ocultarAviso(); iniciar(); }); return; }
    }
    reiniciar(true);
    estado.dibujando=true; estado.filaActual=0;
    estado.ultimoT=0; estado.acumulado=0; estado.proximo=intervalo(); estado.inicioFila=performance.now();
    btnIniciar.disabled=true; btnReiniciar.hidden=true;
    elTap.disabled=false; elTap.focus({preventScroll:true});
    actualizarLectura(0); requestAnimationFrame(bucle);
  }
  function detenerFila(){
    if (!puedeDetener()) return;
    const f=estado.filaActual;
    estado.dibujando=false; actualizarLectura(f,true); dibujar();
    if (f<FILAS-1){
      setTimeout(()=>{
        estado.filaActual=f+1; estado.dibujando=true;
        estado.ultimoT=0; estado.acumulado=0; estado.proximo=intervalo(); estado.inicioFila=performance.now();
        actualizarLectura(estado.filaActual); requestAnimationFrame(bucle);
      },300);
    } else {
      elTap.disabled=true; elTapTexto.textContent=''; elTap.classList.remove('activo');
      setTimeout(resolver,260);
    }
  }

  function resolver(){
    const cinco=estado.filas.map(r=>estrellas(r.length));
    const s=indiceGrupo(cinco);
    const q = typeof estado.pregunta==='number' ? estado.pregunta
            : 1 + Math.floor(Math.random()*32);   // pregunta propia: azar puro
    const r=consultar(q,s);

    elSelloGlifo.innerHTML=cinco.map(e=>'<span class="fila-puntos">'+'<i class="punto"></i>'.repeat(e)+'</span>').join('');
    elSelloJero.innerHTML=r.nombreJeroglifico+'<small>jeroglífico '+r.jeroglifico+'</small>';
    elSelloFila.hidden=false;

    if (estado.pregunta==='propia'){
      elRespuestaPregunta.textContent='Tu pregunta · '+estado.textoPropia;
    } else {
      elRespuestaPregunta.textContent=String(r.pregunta.n).padStart(2,'0')+' · '+r.pregunta.texto;
    }

    if (r.respuesta.ok===1){
      elRespuestaTexto.textContent=r.respuesta.es;
      elRespuestaTexto.classList.remove('ilegible','recuperada');
      pintarInterpretacion(r.respuesta.es);
    } else if (r.respuesta.ok===2){
      elRespuestaTexto.textContent=r.respuesta.es;
      elRespuestaTexto.classList.remove('ilegible');
      elRespuestaTexto.classList.add('recuperada');
      pintarInterpretacion(r.respuesta.es);
    } else {
      elRespuestaTexto.textContent='El azar te llevó a una respuesta que el facsímil de 1855 dejó ilegible. El libro la tiene; el escaneo, no. Traza de nuevo para recibir otra.';
      elRespuestaTexto.classList.add('ilegible');
      elRespuestaTexto.classList.remove('recuperada');
      elInterpretacion.hidden=true;
    }
    elRespuestaRef.textContent=r.nombreJeroglifico+' · grupo '+s+'/32'+(r.respuesta.ok===2?' · texto recuperado':'');
    elRespuestaVacia.hidden=true; elRespuesta.hidden=false;

    estado.resuelto=true; btnReiniciar.hidden=false;
    if (typeof estado.pregunta==='number') pintarCabala(q, s);
    guardar(r,s);
    marcarRepetidas();
  }

  function reiniciar(silencioso){
    estado.filas=[[],[],[],[],[]]; estado.filaActual=-1; estado.dibujando=false; estado.resuelto=false;
    estado.ultimoT=0; estado.acumulado=0;
    pintarLecturas(); dibujar();
    elSelloFila.hidden=true; elRespuesta.hidden=true; elInterpretacion.hidden=true; elRespuestaVacia.hidden=false;
    elTap.disabled=true; elTapTexto.textContent=''; btnReiniciar.hidden=true;
    btnIniciar.disabled=estado.pregunta===null;
    if (typeof estado.pregunta==='number') pintarCabala(estado.pregunta);
    if (!silencioso) ocultarAviso();
  }

  /* ---------- Interpretación ---------- */
  function pintarInterpretacion(txt){
    const g=GENEROS[clasificar(txt)];
    const et=$('generoEtiqueta'); et.textContent=g.nombre; et.dataset.color=g.color;
    $('generoDefinicion').textContent=g.definicion;
    $('generoExige').textContent=g.exige;
    $('ejemploPregunta').textContent='Pregunta '+g.ejemplo.pregunta;
    $('ejemploJeroglifico').textContent='Jeroglífico: '+g.ejemplo.jeroglifico;
    $('ejemploTexto').textContent='«'+g.ejemplo.texto+'»';
    $('interpDoctrina').textContent=DOCTRINA.aceptacion;
    elInterpretacion.hidden=false;
  }

  /* ---------- Ayudas ---------- */
  function pintarAyudas(){
    document.querySelectorAll('.ayuda-btn').forEach(btn=>{
      const k=btn.dataset.ayuda, a=AYUDAS[k], caja=$('ayuda-'+k);
      if (!a||!caja) return;
      let html='<h3>'+a.titulo+'</h3>';
      if (a.pasos.length) html+='<ol>'+a.pasos.map(p=>'<li>'+p+'</li>').join('')+'</ol>';
      if (a.cita) html+='<p class="ayuda-cita">'+a.cita+'</p>';
      caja.innerHTML=html;
      btn.addEventListener('click',()=>{
        const abierta=btn.getAttribute('aria-expanded')==='true';
        btn.setAttribute('aria-expanded',String(!abierta)); caja.hidden=abierta;
      });
    });
  }

  /* ---------- Cábala (32x32) ---------- */
  function glifo(grupo){
    const alto=44, ancho=16; let p='';
    grupo.forEach((e,i)=>{ const y=5+i*8; (e===1?[8]:[5,11]).forEach(x=>{ p+='<circle cx="'+x+'" cy="'+y+'" r="1.5" fill="currentColor"/>'; }); });
    return '<svg width="'+ancho+'" height="'+alto+'" viewBox="0 0 '+ancho+' '+alto+'" aria-hidden="true">'+p+'</svg>';
  }
  function pintarCabala(qViva, sViva){
    let html='<thead><tr><th class="esq">P\\E</th>';
    for (let s=1;s<=32;s++) html+='<th class="'+(s===sViva?'col-viva':'')+'" scope="col">'+s+'</th>';
    html+='</tr></thead><tbody>';
    for (let q=1;q<=32;q++){
      html+='<tr'+(q===qViva?' class="fila-viva"':'')+'><th class="fila-q" scope="row" title="'+CORPUS_1855.preguntas[q-1].texto.replace(/"/g,'')+'">'+String(q).padStart(2,'0')+'</th>';
      for (let s=1;s<=32;s++){
        const m=(q===qViva&&s===sViva)?' class="marcada"':'';
        html+='<td'+m+'>'+jeroglificoDe(q,s)+'</td>';
      }
      html+='</tr>';
    }
    elCabala.innerHTML=html+'</tbody>';
    if (qViva && sViva){
      elCabalaEnvoltura.hidden=false; btnVerCabala.textContent='Ocultar tabla';
      const c=elCabala.querySelector('td.marcada');
      if (c) c.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});
    }
  }

  /* ---------- Zodiaco ---------- */
  function pintarZodiaco(){
    elZodiacoIntro.textContent=ZODIACO_INTRO;
    elZodiacoRejilla.innerHTML='';
    ZODIACO.forEach((sg,i)=>{
      const b=document.createElement('button');
      b.type='button'; b.className='signo-btn'; b.setAttribute('role','option'); b.setAttribute('aria-pressed','false');
      b.innerHTML='<span class="signo-glifo">'+sg.simbolo+'</span><span class="signo-nombre">'+sg.nombre+'</span><span class="signo-rango">'+sg.rango+'</span>';
      b.addEventListener('click',()=>mostrarSigno(i,b));
      elZodiacoRejilla.appendChild(b);
    });
  }
  function mostrarSigno(i,btn){
    document.querySelectorAll('.signo-btn').forEach(x=>x.setAttribute('aria-pressed','false'));
    btn.setAttribute('aria-pressed','true');
    const sg=ZODIACO[i];
    const info=SIGNO_INFO[sg.nombre];
    const sem=lecturaSemanal(i);
    let html='<h3>'+sg.simbolo+' '+sg.nombre+'</h3>';
    html+='<p class="signo-meta">'+sg.rango+' · '+sg.elemento;
    if (info) html+=' · '+info.modalidad+' · regido por '+info.regente;
    html+='</p>';
    if (info) html+='<div class="signo-parte"><h4>El signo, en breve</h4><p>'+info.rasgos+'</p></div>';
    html+='<div class="signo-semana"><h4>Lectura de la semana '+sem.semana+'</h4><p>'+sem.texto+'</p>'+
          '<span class="signo-semana-nota">Rota cada semana. Es una guía amplia para pensar, no astrología literal ni texto del libro.</span></div>';
    html+='<details class="signo-1855"><summary>Lo que dice el libro de 1855</summary>';
    if (sg.varon) html+='<div class="signo-parte"><h4>El varón nacido bajo este signo</h4><p>'+sg.varon+'</p></div>';
    if (sg.mujer) html+='<div class="signo-parte"><h4>La mujer nacida bajo este signo</h4><p>'+sg.mujer+'</p></div>';
    if (!sg.varon && !sg.mujer) html+='<p class="signo-vacio">El facsímil dejó este pasaje ilegible.</p>';
    html+='</details>';
    elSignoDetalle.innerHTML=html; elSignoDetalle.hidden=false;
    elSignoDetalle.scrollIntoView({block:'nearest',behavior:'smooth'});
  }

  /* ---------- Libro ---------- */
  function pintarLibro(){
    const bl=(t,p)=>'<div class="libro-bloque"><h3>'+t+'</h3><p>'+p+'</p></div>';
    const al=(t,p)=>'<div class="libro-bloque alerta"><h3>'+t+'</h3><p>'+p+'</p></div>';
    elLibroCuerpo.innerHTML=
      bl('El hallazgo',HISTORIA.relato)+
      al('Pero conviene saber',HISTORIA.advertencia)+
      bl('Esta edición',HISTORIA.edicion)+
      bl('El método',HISTORIA.metodo1855)+
      bl('Cómo se reconstruyó esta app',HISTORIA.reconstruccion)+
      '<div class="libro-bloque"><h3>Las reglas de consulta</h3><ul class="libro-reglas">'+
        DOCTRINA.reglas.map(r=>'<li>'+r+'</li>').join('')+'</ul></div>'+
      bl('El rito, sin embelecos',DOCTRINA.ritual)+
      bl('Sobre los días nefastos',DOCTRINA.diasNefastos);
  }

  /* ---------- Reglas ---------- */
  const DIA=86400000;
  function revisarReglas(q){
    if (typeof q!=='number') return null;
    const reg=leer(), ahora=Date.now(), hoy=new Date().toDateString();
    const mes=reg.find(x=>x.q===q && (ahora-x.ts)<30*DIA);
    if (mes){ const d=Math.ceil((30*DIA-(ahora-mes.ts))/DIA); return 'El libro pide no repetir la misma pregunta antes de un mes. Faltan '+d+(d===1?' día.':' días.'); }
    if (reg.some(x=>new Date(x.ts).toDateString()===hoy)) return 'El libro pide no hacer más de una pregunta en el mismo día.';
    return null;
  }

  /* ---------- Registro ---------- */
  function leer(){ try{ const a=JSON.parse(almacen.leer(CLAVE)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
  function guardar(r,s){
    const reg=leer();
    reg.unshift({ ts:Date.now(), q:(typeof estado.pregunta==='number'?r.pregunta.n:0),
      propia: estado.pregunta==='propia'?estado.textoPropia:null,
      jero:r.nombreJeroglifico, es:(r.respuesta.ok?r.respuesta.es:'(ilegible en el facsímil)') });
    almacen.escribir(CLAVE, JSON.stringify(reg.slice(0,12)));
    pintarRegistro();
  }
  function pintarRegistro(){
    const reg=leer();
    elRegistro.innerHTML=''; elRegistroVacio.hidden=reg.length>0; btnBorrar.hidden=reg.length===0;
    reg.forEach(x=>{
      const d=new Date(x.ts), li=document.createElement('li');
      const et=x.propia ? ('«'+x.propia.slice(0,40)+'»') : x.jero;
      li.innerHTML='<span class="r-fecha">'+d.toLocaleDateString('es-CL',{day:'2-digit',month:'2-digit'})+'</span>'+
        '<span class="r-jero">'+et+'</span><span class="r-txt">'+x.es+'</span>';
      elRegistro.appendChild(li);
    });
  }

  /* ---------- Aviso ---------- */
  let accion=null;
  function mostrarAviso(txt,etq,acc){
    elAviso.innerHTML=''; const s=document.createElement('span'); s.textContent=txt; elAviso.appendChild(s);
    if (etq){ const b=document.createElement('button'); b.type='button'; b.textContent=etq; b.addEventListener('click',()=>{ if(accion)accion(); }); elAviso.appendChild(b); }
    accion=acc; elAviso.hidden=false;
  }
  function ocultarAviso(){ elAviso.hidden=true; accion=null; }

  /* ---------- Arranque ---------- */
  function inicio(){
    pintarAugurio(); pintarAyudas(); pintarLibro(); pintarPreguntas();
    pintarLecturas(); pintarCabala(); pintarRegistro(); pintarZodiaco(); dimensionar();

    btnIniciar.addEventListener('click',iniciar);
    btnReiniciar.addEventListener('click',()=>reiniciar(false));
    elTap.addEventListener('click',detenerFila);
    elPropiaOk.addEventListener('click',elegirPropia);
    elPropiaInput.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); elegirPropia(); } });
    btnVerCabala.addEventListener('click',()=>{
      const oc=elCabalaEnvoltura.hidden; elCabalaEnvoltura.hidden=!oc;
      btnVerCabala.textContent=oc?'Ocultar tabla':'Ver tabla';
    });
    btnBorrar.addEventListener('click',()=>{ almacen.escribir(CLAVE,'[]'); pintarRegistro(); marcarRepetidas(); });
    document.addEventListener('keydown',e=>{ if((e.code==='Space'||e.key===' ')&&estado.dibujando){ e.preventDefault(); detenerFila(); } });

    let tm; window.addEventListener('resize',()=>{ clearTimeout(tm); tm=setTimeout(dimensionar,120); });

    const btnInstalar=$('btnInstalar'); let promesa=null;
    window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); promesa=e; btnInstalar.hidden=false; });
    btnInstalar.addEventListener('click',async()=>{ if(!promesa)return; promesa.prompt(); await promesa.userChoice; promesa=null; btnInstalar.hidden=true; });
    window.addEventListener('appinstalled',()=>{ btnInstalar.hidden=true; });

    if ('serviceWorker' in navigator && location.protocol.startsWith('http'))
      window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',inicio);
  else inicio();
})();
