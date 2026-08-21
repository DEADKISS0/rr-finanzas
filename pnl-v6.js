// RR Aliados — P&L Gerencial v6
// Management view: revenue, direct cost, gross margin, overhead and operating result.
(function(){
  const PNL_MONTHS=['2026-08','2026-09','2026-10','2026-11','2026-12','2027-01','2027-02','2027-03'];
  window.RR_PNL_MONTH=window.RR_PNL_MONTH||'2026-09';
  const PNL_NAMES={wundeer:'Wundeer',zapatos:'Zapatos',boga:'BOGA',satiro:'Sátiro Sushi',harbin:'Harbin',candilejas:'Candilejas',labanca:'La Banca',carreta:'La Carreta',marytierra:'Mar y Tierra',charles:'Charles Brown',plazoleta:'Plazoleta Jardín',amsterdam:'Amsterdam ×3',globos:'Globos',junisama:'Junisama / BOGA legado',overhead:'Operación RR'};

  function pnlKey(m){
    if(m.group==='overhead'||m.project==='Operación RR')return'overhead';
    if(m.group&&PNL_NAMES[m.group])return m.group;
    const s=(m.project||'').toLowerCase();
    if(s.includes('wundeer'))return'wundeer';if(s.includes('zapatos'))return'zapatos';if(s==='boga')return'boga';if(s.includes('sátiro'))return'satiro';if(s.includes('harbin'))return'harbin';if(s.includes('candilejas'))return'candilejas';if(s.includes('banca'))return'labanca';if(s.includes('carreta'))return'carreta';if(s.includes('mar y tierra'))return'marytierra';if(s.includes('charles'))return'charles';if(s.includes('plazoleta'))return'plazoleta';if(s.includes('amsterdam'))return'amsterdam';if(s.includes('globos'))return'globos';if(s.includes('junisama'))return'junisama';return'other';
  }

  function pnlMoves(){
    let rows=(typeof accCashMovements==='function'?accCashMovements():[]).filter(m=>m.date>='2026-08-21');
    // Remove values explicitly superseded by the current rules.
    rows=rows.filter(m=>!(pnlKey(m)==='boga'&&m.note&&m.note.includes('Mantenimiento')));
    rows=rows.filter(m=>!(['marytierra','charles'].includes(pnlKey(m))&&m.kind==='income'));
    // P&L base excludes conditional income/costs and provisional Zapatos costs until activated.
    rows=rows.filter(m=>m.status!=='condicional'&&m.status!=='provisional');
    return rows.map(m=>({...m,key:pnlKey(m)}));
  }

  function monthLabel(k){const [y,m]=k.split('-');return new Date(+y,+m-1,1).toLocaleDateString('es-CO',{month:'short',year:'numeric'}).replace('.','')}
  function pct(v){return Number.isFinite(v)?(v*100).toLocaleString('es-CO',{maximumFractionDigits:1})+'%':'—'}
  function reserveFor(id){
    if(typeof ACC_COSTS==='undefined')return 0;
    if(id==='plazoleta'&&typeof accPlazoletaCost==='function')return accPlazoletaCost(ACC_STATE.plazoletaRestaurants).reserve;
    return ACC_COSTS[id]?.reserve||0;
  }

  function monthData(month){
    const rows=pnlMoves().filter(m=>m.date.slice(0,7)===month);
    const revenue=rows.filter(m=>m.kind==='income').reduce((a,m)=>a+m.amount,0);
    const direct=rows.filter(m=>m.kind==='expense'&&m.key!=='overhead').reduce((a,m)=>a+m.amount,0);
    const overhead=rows.filter(m=>m.kind==='expense'&&m.key==='overhead').reduce((a,m)=>a+m.amount,0);
    const gross=revenue-direct;
    const operating=gross-overhead;
    return{month,rows,revenue,direct,gross,overhead,operating,grossMargin:revenue?gross/revenue:null,operatingMargin:revenue?operating/revenue:null};
  }

  function projectData(month){
    const rows=pnlMoves().filter(m=>m.date.slice(0,7)===month&&m.key!=='overhead');
    const map={};
    rows.forEach(m=>{if(!map[m.key])map[m.key]={id:m.key,name:PNL_NAMES[m.key]||m.project,revenue:0,direct:0};if(m.kind==='income')map[m.key].revenue+=m.amount;else map[m.key].direct+=m.amount});
    return Object.values(map).map(x=>({...x,contribution:x.revenue-x.direct,margin:x.revenue?(x.revenue-x.direct)/x.revenue:null,reserve:reserveFor(x.id)})).sort((a,b)=>b.revenue-a.revenue||b.direct-a.direct);
  }

  function pnlMeaning(){return `<div class="pnlExplain"><article><b>1 · Ingresos</b><p>Dinero del proyecto reconocido en este modelo durante el mes. No incluye mantenimientos no confirmados ni ingresos comerciales todavía condicionales.</p></article><article><b>2 · Costo directo</b><p>Lo que cuesta ejecutar los proyectos durante ese mes: proveedores, producción y ejecución modelada. No incluye nómina general de RR.</p></article><article><b>3 · Margen bruto</b><p><strong>Ingresos − costo directo.</strong> Dice si los proyectos, antes de sostener la empresa, dejan contribución positiva.</p></article><article><b>4 · Overhead RR</b><p>Manuel, Samuel, IA, hosting y otros gastos generales conocidos. No se reparte artificialmente entre proyectos todavía.</p></article><article><b>5 · Resultado operativo</b><p><strong>Margen bruto − overhead.</strong> Es la mejor lectura gerencial actual de si RR gana o pierde en el mes antes de impuestos y partidas todavía pendientes.</p></article><article><b>6 · Reserva técnica</b><p>Se muestra como exposición futura, pero <strong>no se resta del resultado mensual</strong> hasta que se active como gasto real o comprometido.</p></article></div>`}

  function monthSelector(){return `<div class="pnlMonthPicker" role="group" aria-label="Mes del P&L">${PNL_MONTHS.map(m=>`<button class="${RR_PNL_MONTH===m?'on':''}" onclick="RR_PNL_MONTH='${m}';render()">${monthLabel(m)}</button>`).join('')}</div>`}

  function pnlMonthlyTable(){return `<div class="desktopTableWrap"><table class="dataTable pnlTable"><thead><tr><th>Mes</th><th>Ingresos</th><th>Costo directo</th><th>Margen bruto</th><th>Margen bruto %</th><th>Overhead RR</th><th>Resultado operativo</th><th>Margen operativo %</th></tr></thead><tbody>${PNL_MONTHS.map(m=>{const x=monthData(m);return `<tr class="${x.operating<0?'dangerRow':''}"><td><b>${monthLabel(m)}</b></td><td class="plus">${COP(x.revenue)}</td><td class="minus">${COP(x.direct)}</td><td class="${x.gross>=0?'plus':'minus'}">${COP(x.gross)}</td><td>${pct(x.grossMargin)}</td><td class="minus">${COP(x.overhead)}</td><td class="${x.operating>=0?'plus':'minus'}"><b>${COP(x.operating)}</b></td><td>${pct(x.operatingMargin)}</td></tr>`}).join('')}</tbody></table></div>`}

  function projectTable(month){const rows=projectData(month);return rows.length?`<div class="desktopTableWrap"><table class="dataTable pnlProjectTable"><thead><tr><th>Proyecto</th><th>Ingresos mes</th><th>Costo directo mes</th><th>Contribución</th><th>Margen contribución</th><th>Reserva técnica total</th><th>Lectura</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x.name)}</b></td><td class="plus">${COP(x.revenue)}</td><td class="minus">${COP(x.direct)}</td><td class="${x.contribution>=0?'plus':'minus'}">${COP(x.contribution)}</td><td>${pct(x.margin)}</td><td>${COP(x.reserve)}</td><td>${x.revenue===0&&x.direct>0?'Consume recursos este mes sin ingreso reconocido.':x.contribution<0?'El mes está cargado de ejecución; revisar timing de cobro.':x.revenue>0&&x.direct===0?'Ingreso sin costo directo modelado en el mes; validar causación.':'Aporta contribución positiva antes de overhead.'}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No hay movimientos base reconocidos para este mes.</div>`}

  function pnl(){
    const x=monthData(RR_PNL_MONTH),reserve=typeof accReserveTotal==='function'?accReserveTotal():0;
    return `<div class="sectionHead"><div><h2>P&L gerencial mensual</h2><p class="sectionIntro">Una lectura de rentabilidad mensual separada del runway. El runway responde “¿tengo caja para pagar?”; este P&L responde “¿la operación genera margen?”.</p></div></div>
      <div class="pnlWarning"><b>No es todavía el estado de resultados contable oficial.</b><span>Faltan causación formal, impuestos, fee del contador, transporte/reuniones y costeo de horas internas. Por eso esta vista se llama <strong>P&L gerencial</strong>.</span></div>
      ${pnlMeaning()}
      ${monthSelector()}
      <section class="pnlHero"><div><span>INGRESOS · ${monthLabel(RR_PNL_MONTH)}</span><strong>${COP(x.revenue)}</strong></div><div><span>COSTO DIRECTO</span><strong>${COP(x.direct)}</strong></div><div><span>MARGEN BRUTO</span><strong class="${x.gross>=0?'plus':'minus'}">${COP(x.gross)}</strong><small>${pct(x.grossMargin)} de los ingresos</small></div><div><span>OVERHEAD RR</span><strong>${COP(x.overhead)}</strong></div><div class="${x.operating<0?'danger':''}"><span>RESULTADO OPERATIVO</span><strong>${COP(x.operating)}</strong><small>${pct(x.operatingMargin)} de los ingresos</small></div><div><span>RESERVA TÉCNICA</span><strong>${COP(reserve)}</strong><small>exposición futura · fuera del P&L hasta activarse</small></div></section>
      <div class="pnlInterpret ${x.operating<0?'bad':'good'}"><b>${x.operating<0?'Este mes no cubre todavía la estructura de RR.':'Este mes cubre la operación conocida de RR.'}</b><p>${x.revenue?`Por cada $100 facturados/reconocidos en el modelo, quedan aproximadamente <strong>${pct(x.grossMargin)}</strong> después del costo directo y <strong>${pct(x.operatingMargin)}</strong> después del overhead conocido.`:'No hay ingresos reconocidos suficientes en el mes para calcular márgenes porcentuales útiles.'} ${x.operating<0?`Faltan <strong>${COP(Math.abs(x.operating))}</strong> de contribución mensual para llegar a punto de equilibrio operativo con los datos hoy cargados.`:''}</p></div>
      <div class="sectionHead"><div><h2>Detalle por proyecto · ${monthLabel(RR_PNL_MONTH)}</h2><p class="sectionIntro">Aquí ves quién genera ingresos, quién consume costo directo y qué contribución deja cada proyecto antes de pagar la estructura general de RR.</p></div></div>${projectTable(RR_PNL_MONTH)}
      <div class="sectionHead"><div><h2>Evolución mensual</h2><p class="sectionIntro">Compara rentabilidad y estructura a través del tiempo. Un mes puede tener buen margen y aun así necesitar apalancamiento si los cobros llegan después de los pagos.</p></div></div>${pnlMonthlyTable()}`;
  }
  window.pnl=pnl;

  // Insert P&L after Runway / Liquidity.
  if(typeof tabs!=='undefined'&&!tabs.some(x=>x[0]==='pnl')){
    const i=tabs.findIndex(x=>x[0]==='liquidity');
    tabs.splice(i>=0?i+1:2,0,['pnl','P&L']);
  }
  const pnlRenderBase=render;
  render=function(){
    if(tab==='pnl'){
      if(typeof accApplyFinance==='function')accApplyFinance();
      nav();
      view.innerHTML=pnl();
      return;
    }
    pnlRenderBase();
  };
  render();
})();
