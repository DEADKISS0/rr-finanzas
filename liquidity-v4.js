// RR Aliados — Liquidity intelligence v4
// Separates committed cash, conditional scenarios and future technical exposure.
(function(){
  const RR_OPENING=2620000;
  const RR_ASOF='2026-08-21';
  window.RR_LIQ_SCENARIO=window.RR_LIQ_SCENARIO||'base';

  function move(date,label,amount,type='cash',note=''){return{date,label,amount,type,note}}
  function monthDate(start,i){const d=new Date(start+'T12:00:00');d.setMonth(d.getMonth()+i);return d.toISOString().slice(0,10)}
  function lastDay(y,m){return new Date(y,m,0).getDate()}
  function baseEvents(){
    const e=[];
    // 30 Aug: only Manuel balance is invoice-like confirmed; the other recurring items are planned obligations.
    e.push(move('2026-08-30','Manuel · saldo quincena',-350000,'confirmed','$150K ya fueron adelantados'));
    e.push(move('2026-08-30','Samuel · quincena',-250000,'planned'));
    e.push(move('2026-08-30','IA · quincena',-100000,'planned'));
    e.push(move('2026-08-30','Hosting y servicios',-50000,'planned'));
    e.push(move('2026-08-30','Wundeer · mes 1 (50% restante)',-2166000,'committed','Costo inicial confirmado por estructura del proyecto'));
    e.push(move('2026-09-01','BOGA · desarrollo',1200000,'confirmed'));
    e.push(move('2026-09-01','Sátiro · cuota 1/30',400000,'confirmed'));

    // Fixed RR obligations Sep-Mar. 15 / last valid day of month.
    for(let i=0;i<7;i++){
      const d=new Date(2026,8+i,15,12); const y=d.getFullYear(),m=d.getMonth()+1; const mm=String(m).padStart(2,'0');
      e.push(move(`${y}-${mm}-15`,'Operación RR · quincena',-900000,'planned','Manuel $500K + Samuel $250K + IA $100K + hosting $50K'));
      const ld=lastDay(y,m); e.push(move(`${y}-${mm}-${String(ld).padStart(2,'0')}`,'Operación RR · quincena',-900000,'planned','Manuel $500K + Samuel $250K + IA $100K + hosting $50K'));
    }

    // Wundeer: only the initial 2-month block is committed in base.
    e.push(move('2026-09-15','Wundeer · mes 2 (50%)',-1071000,'committed'));
    e.push(move('2026-09-30','Wundeer · mes 2 (50%)',-1071000,'committed'));
    e.push(move('2026-10-15','Wundeer · 2 meses retroactivos',9000000,'confirmed','Ingreso clave para recuperar liquidez'));

    // Sátiro: contracted 30 x $400K and first-two-month execution budget.
    for(let i=0;i<7;i++)e.push(move(monthDate('2026-09-01',i),`Sátiro · cuota ${i+1}/30`,400000,'confirmed'));
    ['2026-09-15','2026-09-30','2026-10-15','2026-10-30'].forEach(d=>e.push(move(d,'Sátiro · ejecución',-1000000,'committed')));
    return e;
  }

  function addWundeerContinuation(e){
    ['2026-10','2026-11','2026-12','2027-01'].forEach(mon=>{
      const [y,m]=mon.split('-').map(Number); const ld=lastDay(y,m);
      e.push(move(`${mon}-15`,'Wundeer · operación continuidad',-1071000,'conditional'));
      e.push(move(`${mon}-${String(ld).padStart(2,'0')}`,'Wundeer · operación continuidad',-1071000,'conditional'));
    });
    ['2026-11-15','2026-12-15','2027-01-15','2027-02-15'].forEach((d,i)=>e.push(move(d,`Wundeer · cuota continuidad ${i+3}/6`,4500000,'conditional')));
  }

  function addKnownSeptemberClosures(e){
    // Only projects with base price confirmed in this session are included.
    const early=[['Harbin',1500000],['Candilejas',1000000],['La Banca',1000000],['La Carreta',1000000],['Plazoleta 8 restaurantes',1875000]];
    ['2026-09-15','2026-09-30','2026-10-15','2026-10-30'].forEach(d=>early.forEach(([n,a])=>e.push(move(d,`${n} · ejecución inicial`,-a,'conditional'))));
    const monthly=[['Harbin',1000000],['Candilejas',666667],['La Banca',666667],['La Carreta',400000],['Plazoleta 8 restaurantes',2400000]];
    for(let i=0;i<6;i++)monthly.forEach(([n,a])=>e.push(move(monthDate('2026-10-15',i),`${n} · cuota`,a,'conditional')));
  }

  function scenarioEvents(s){
    const e=baseEvents();
    if(s==='wundeer'||s==='growth')addWundeerContinuation(e);
    if(s==='growth')addKnownSeptemberClosures(e);
    return e.sort((a,b)=>a.date.localeCompare(b.date));
  }

  function projection(s){
    const byDate={}; scenarioEvents(s).forEach(x=>{(byDate[x.date]??=[]).push(x)});
    let bal=RR_OPENING,min=RR_OPENING,minDate=RR_ASOF; const days=[];
    Object.keys(byDate).sort().forEach(date=>{
      const items=byDate[date],net=items.reduce((a,x)=>a+x.amount,0);bal+=net;if(bal<min){min=bal;minDate=date}days.push({date,items,net,balance:bal});
    });
    return{days,min,minDate,need:Math.max(0,-min),ending:bal};
  }

  function bridgeBefore(s,cutoff){
    const p=projection(s),days=p.days.filter(x=>x.date<=cutoff);let min=RR_OPENING,minDate=RR_ASOF;days.forEach(x=>{if(x.balance<min){min=x.balance;minDate=x.date}});return{need:Math.max(0,-min),min,minDate};
  }
  function fmtDate(s){return new Date(s+'T12:00:00').toLocaleDateString('es-CO',{day:'numeric',month:'short'})}
  function scenarioName(s){return s==='base'?'Comprometido':s==='wundeer'?'Wundeer continúa':'Cierres Sep 15'}
  function rrSetScenario(s){RR_LIQ_SCENARIO=s;render()}
  window.rrSetScenario=rrSetScenario;

  function scenarioControls(){return `<div class="liqSwitch" role="group" aria-label="Escenario de liquidez">${[['base','Comprometido'],['wundeer','Wundeer continúa'],['growth','Cierres Sep 15']].map(([id,n])=>`<button class="${RR_LIQ_SCENARIO===id?'on':''}" onclick="rrSetScenario('${id}')">${n}</button>`).join('')}</div>`}

  function fundingSummary(){
    const base=projection('base');
    const sept=bridgeBefore('base','2026-09-30');
    const stressDelay=6138000;
    const growth=bridgeBefore('growth','2026-09-30');
    const recommended=Math.ceil(sept.need*1.15/100000)*100000;
    return `<section class="liqHero"><div><span>NECESIDAD DE CAJA INMEDIATA</span><strong>${COP(296000)}</strong><small>30 AGO · primera brecha</small></div><div class="danger"><span>LÍNEA PUENTE MÍNIMA</span><strong>${COP(sept.need)}</strong><small>máximo faltante antes del cobro Wundeer · 30 SEP</small></div><div><span>LÍNEA RECOMENDADA</span><strong>${COP(recommended)}</strong><small>mínimo + 15% de margen operativo</small></div><div><span>SI WUNDEER SE ATRASA 15 DÍAS</span><strong>${COP(stressDelay)}</strong><small>capacidad mínima de stress</small></div></section>
    <div class="liqCallout"><b>Lectura ejecutiva</b><p>Con lo hoy comprometido, RR entra en negativo por primera vez el <b>30 de agosto</b>. La brecha crece hasta <b>${COP(sept.need)}</b> el <b>30 de septiembre</b>. Si los <b>${COP(9000000)}</b> de Wundeer llegan el 15 de octubre, la línea puente puede repagarse ese mismo corte. Para no operar al centavo, recomiendo tener disponible una línea cercana a <b>${COP(recommended)}</b>. Si ese pago puede demorarse 15 días, el stress sube a <b>${COP(stressDelay)}</b>.</p></div>`}

  function breachCards(s){
    const p=projection(s); const negative=p.days.filter(x=>x.balance<0); if(!negative.length)return `<div class="empty">Este escenario no cae por debajo de cero en el horizonte mostrado.</div>`;
    const selected=[]; negative.forEach(x=>{const prev=selected[selected.length-1];if(!prev||x.date!==prev.date)selected.push(x)});
    return `<div class="breachGrid">${selected.slice(0,8).map(x=>`<article class="breach"><time>${fmtDate(x.date)}</time><b>${COP(Math.abs(x.balance))} faltantes</b><p>${x.net<0?`Ese día salen ${COP(Math.abs(x.net))} netos.`:`Aunque entran ${COP(x.net)}, el saldo sigue negativo.`}</p></article>`).join('')}</div>`;
  }

  function cashTimeline(s){
    const p=projection(s); return `<div class="liqTimeline">${p.days.filter(x=>x.date<='2027-03-31').map(x=>`<div class="liqDay ${x.balance<0?'negative':''}"><div class="liqDate"><b>${fmtDate(x.date)}</b><small>${x.balance<0?'BRECHA':'SALDO'}</small></div><div class="liqItems">${x.items.map(i=>`<span class="${i.amount>=0?'plus':'minus'}"><b>${i.amount>=0?'+':'-'}${COP(Math.abs(i.amount))}</b> ${esc(i.label)}${i.note?`<small>${esc(i.note)}</small>`:''}</span>`).join('')}</div><div class="liqBalance"><small>Saldo proyectado</small><b>${COP(x.balance)}</b></div></div>`).join('')}</div>`}
  }

  function liquidity(){
    const s=RR_LIQ_SCENARIO,p=projection(s),sept=bridgeBefore(s,'2026-09-30');
    const extraMarCharles=4000000,extraZapatos=4332000;
    return `<div class="sectionHead"><div><h2>Liquidez y apalancamiento</h2></div>${scenarioControls()}</div>
      ${fundingSummary()}
      <div class="sectionHead"><div><h2>Brechas de caja · ${scenarioName(s)}</h2></div><div class="liqScenarioKpi"><span>Necesidad máxima hasta 30 sep</span><b>${COP(sept.need)}</b></div></div>
      ${breachCards(s)}
      ${s==='growth'?`<div class="sensitivity"><b>Sensibilidades no metidas en este escenario</b><span>Mar y Tierra + Charles: <strong>+${COP(extraMarCharles)}</strong> de caja a financiar antes del 30 sep si arrancan sin precio confirmado.</span><span>Zapatos: <strong>+${COP(extraZapatos)}</strong> antes del 30 sep si onboarding activa costos.</span><span>Con ambos, la necesidad podría subir aproximadamente a <strong>${COP(sept.need+extraMarCharles+extraZapatos)}</strong>.</span></div>`:''}
      <div class="sectionHead"><div><h2>Movimiento por movimiento</h2></div><small class="mutedLabel">Caja inicial ${COP(RR_OPENING)} · corte 21 ago</small></div>
      ${cashTimeline(s)}`;
  }

  function upcomingConfirmed(){
    const e=baseEvents().filter(x=>x.date>RR_ASOF&&x.date<='2026-10-15');
    const dates={};e.forEach(x=>(dates[x.date]??=[]).push(x));
    return `<div class="nextMoves">${Object.keys(dates).sort().map(d=>{const items=dates[d],net=items.reduce((a,x)=>a+x.amount,0);return `<article><div class="nextDate"><time>${fmtDate(d)}</time><b class="${net>=0?'plus':'minus'}">${net>=0?'+':'-'}${COP(Math.abs(net))}</b></div><div class="nextList">${items.map(i=>`<span><b>${i.amount>=0?'+':'-'}${COP(Math.abs(i.amount))}</b>${esc(i.label)}<small>${i.type==='confirmed'?'Confirmado':i.type==='committed'?'Comprometido':'Planeado'}${i.note?' · '+esc(i.note):''}</small></span>`).join('')}</div></article>`}).join('')}</div>`}

  // Correct stale / unconfirmed commercial values used by the old financial layer.
  const oldApply=typeof accApplyFinance==='function'?accApplyFinance:null;
  if(oldApply){accApplyFinance=function(){oldApply();
    const boga=P.find(x=>x.id==='boga'); if(boga){boga.totalValue=1200000;if(boga.fin){boga.fin.total=1200000;boga.fin.cash6=1200000;boga.fin.n='$1.2M de desarrollo confirmado. El mantenimiento de $300K/mes queda fuera de valor y caja hasta confirmación del cliente.'}}
    ['marytierra','charles'].forEach(id=>{const p=P.find(x=>x.id===id);if(p){p.totalValue=null;p.cash2=null;p.cash6=null;if(p.fin){p.fin.total=null;p.fin.cash2=null;p.fin.cash6=null;p.fin.weighted=null;p.fin.n='Precio base pendiente de confirmación. No se usa en liquidez ni valor total hasta cerrarlo.'}}});
    const zap=P.find(x=>x.id==='zapatos');if(zap&&zap.fin){zap.fin.total=27000000;zap.totalValue=27000000;zap.fin.n='$4.5M/mes; 2 meses de prueba y $9M retroactivos. Costos siguen provisionales hasta discovery/onboarding.'}
    const glo=P.find(x=>x.id==='globos');if(glo&&glo.fin){glo.fin.total=2000000;glo.totalValue=2000000;glo.fin.n='$2M de desarrollo. Mantenimiento de $400K/mes no entra a caja hasta confirmación del cliente.'}
    const jun=P.find(x=>x.id==='junisama');if(jun&&jun.fin){jun.fin.total=20000000;jun.totalValue=20000000;jun.fin.n='4 bloques × $5M. David recibe $2M por cada bloque cobrado. Bono RR de 1,5% depende del valor bruto de cada licitación.'}
  }}

  const oldAccounting=accounting;
  accounting=function(){
    return `<div class="sectionHead"><div><h2>Contabilidad operativa</h2></div></div>
      <section class="metrics"><div class="metric income"><span>CAJA HOY</span><strong>${COP(RR_OPENING)}</strong><small>Corte 21 ago</small></div><div class="metric accent"><span>PRIMERA BRECHA</span><strong>${COP(296000)}</strong><small>30 ago</small></div><div class="metric"><span>FIJO RR / QUINCENA</span><strong>${COP(900000)}</strong><small>Desde sep</small></div><div class="metric"><span>FIJO RR / MES</span><strong>${COP(1800000)}</strong><small>Sin contador/transporte</small></div><div class="metric"><span>RESERVAS TÉCNICAS</span><strong>${COP(accReserveTotal())}</strong><small>No son caja todavía</small></div></section>
      <div class="sectionHead"><div><h2>Próximos movimientos</h2></div><small class="mutedLabel">Solo base comprometida / planeada</small></div>${upcomingConfirmed()}
      <div class="twoCols"><div><div class="sectionHead"><div><h2>Gasto fijo RR</h2></div></div><div class="accList">${ACC_OVERHEAD.map(x=>`<div><span><b>${esc(x.name)}</b><small>${esc(x.frequency)} · ${esc(x.note)}</small></span><strong>${COP(x.amount)}</strong></div>`).join('')}</div></div><div><div class="sectionHead"><div><h2>Fuera del modelo</h2></div></div><div class="note"><b>Contador / impuestos:</b> pendiente. <br><b>Transporte / reuniones:</b> sin presupuesto fijo. <br><b>BOGA mantenimiento:</b> fuera hasta confirmación. <br><b>Mar y Tierra / Charles:</b> precio pendiente, por eso no se proyectan ingresos.</div></div></div>`;
  }
  cashflow=liquidity;

  // Re-order and clarify navigation. Keep commercial finance but make Liquidity the main operating destination.
  const wanted=[['summary','Resumen'],['cashflow','Liquidez'],['projects','Proyectos'],['pipeline','Comercial'],['costs','Costos'],['accounting','Contabilidad'],['calendar','Calendario'],['audit','Auditoría']];
  tabs.splice(0,tabs.length,...wanted);

  // Summary becomes decision-first without discarding the project radar below.
  const oldSummary=summary;
  summary=function(){
    const original=oldSummary();
    return `${fundingSummary()}<div class="homeActions"><button class="primary" onclick="rrSetTab('cashflow')">Ver brechas y apalancamiento</button><button class="ghost" onclick="rrSetTab('accounting')">Ver próximos movimientos</button></div><div class="sectionHead"><div><h2>Panorama comercial</h2></div></div>${original}`;
  }

  // Financial data audit appended to existing audit surface.
  const oldAudit=audit;
  audit=function(){return `${oldAudit()}<div class="sectionHead"><div><h2>Auditoría numérica</h2></div></div><div class="dataAudit">
    <article class="ok"><b>CAJA ACTUAL</b><strong>${COP(2620000)}</strong><p>Es la verdad vigente. El $3.6M del Excel es histórico y no se usa.</p></article>
    <article class="ok"><b>WUNDEER</b><strong>${COP(15042000)} costo potencial 6M</strong><p>Base solo agenda los primeros 2 meses. Meses 3–6 pasan a escenario condicional.</p></article>
    <article class="warn"><b>BOGA MANTENIMIENTO</b><strong>FUERA DE CAJA</strong><p>$300K/mes no se proyecta hasta confirmación del cliente.</p></article>
    <article class="warn"><b>MAR Y TIERRA / CHARLES</b><strong>PRECIO PENDIENTE</strong><p>Se eliminó el supuesto duro de $12M. Sus ingresos quedan fuera hasta confirmar.</p></article>
    <article class="ok"><b>SÁTIRO</b><strong>30 × ${COP(400000)}</strong><p>Primer pago 1 sep. Costos iniciales $4M en cuatro quincenas; $2M reserva técnica.</p></article>
    <article class="ok"><b>RESERVAS</b><strong>${COP(accReserveTotal())}</strong><p>Exposición futura separada. No reduce caja ni utilidad oficial hasta activarse.</p></article>
    <article class="warn"><b>CONTADOR / IMPUESTOS</b><strong>PENDIENTE</strong><p>No se inventa ningún valor hasta la reunión con contador.</p></article>
    <article class="warn"><b>AMSTERDAM COMISIÓN</b><strong>Hasta ${COP(1500000)}</strong><p>Se mantiene contingente y separada del costo técnico de $2M por proyecto.</p></article>
  </div>`}

  render();
})();
