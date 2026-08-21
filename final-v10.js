// RR Aliados — Final Finance UI V10
// Single canonical router + self-contained Runway, P&L, Accounting and Audit.
(function () {
  'use strict';

  const BUILD = 'V10';
  const OPENING_CASH = 2620000;
  const AS_OF = '2026-08-21';
  const PROJECTS = [
    ['wundeer','Wundeer'],['boga','BOGA'],['satiro','Sátiro Sushi'],
    ['zapatos','Zapatos'],['harbin','Harbin'],['candilejas','Candilejas'],
    ['labanca','La Banca'],['carreta','La Carreta'],['marytierra','Mar y Tierra'],
    ['charles','Charles Brown'],['plazoleta','Plazoleta Jardín'],['amsterdam','Amsterdam ×3'],
    ['globos','Globos'],['junisama','Junisama / BOGA legado']
  ];
  const NAME = Object.fromEntries(PROJECTS);
  const TABS = [
    ['summary','Resumen'],['runway','Runway / Flujo'],['pnl','P&L'],['projects','Proyectos'],
    ['pipeline','Comercial'],['costs','Costos'],['accounting10','Contabilidad'],
    ['calendar','Calendario'],['audit10','Auditoría']
  ];

  const state = window.RR_V10_STATE || {
    tab: 'summary',
    projects: ['wundeer','boga','satiro'],
    includeOverhead: true,
    scenario: 'base',
    pnlMonth: '2026-09'
  };
  window.RR_V10_STATE = state;

  function money(n){
    const sign = n < 0 ? '-' : '';
    return sign + '$' + Math.abs(Math.round(n || 0)).toLocaleString('es-CO');
  }
  function dateLabel(s){
    return new Date(s + 'T12:00:00').toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'});
  }
  function monthLabel(s){
    const [y,m]=s.split('-').map(Number);
    return new Date(y,m-1,1).toLocaleDateString('es-CO',{month:'short',year:'numeric'}).replace('.','');
  }
  function addMonths(s,n){
    const d=new Date(s+'T12:00:00'); d.setMonth(d.getMonth()+n); return d.toISOString().slice(0,10);
  }
  function lastDay(y,m){ return String(new Date(y,m,0).getDate()).padStart(2,'0'); }
  function esc10(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function event(date,project,amount,kind,status,note){ return {date,project,amount,kind,status,note}; }

  function modelEvents(){
    const a=[];
    // Operación RR. 30/08 tiene saldo reducido para Manuel.
    a.push(event('2026-08-30','overhead',750000,'expense','committed','Manuel $350K + Samuel $250K + IA $100K + hosting $50K'));
    for(let i=0;i<8;i++){
      const d=new Date(2026,8+i,15,12), y=d.getFullYear(), m=d.getMonth()+1, mm=String(m).padStart(2,'0');
      a.push(event(`${y}-${mm}-15`,'overhead',900000,'expense','committed','Operación RR · quincena'));
      a.push(event(`${y}-${mm}-${lastDay(y,m)}`,'overhead',900000,'expense','committed','Operación RR · quincena'));
    }

    // Wundeer: bloque inicial comprometido; continuidad condicional.
    a.push(event('2026-08-30','wundeer',2166000,'expense','committed','Mes 1 · segunda mitad'));
    a.push(event('2026-09-15','wundeer',1071000,'expense','committed','Mes 2 · primera mitad'));
    a.push(event('2026-09-30','wundeer',1071000,'expense','committed','Mes 2 · segunda mitad'));
    a.push(event('2026-10-15','wundeer',9000000,'income','confirmed','Cobro retroactivo · 2 meses iniciales'));
    ['2026-10','2026-11','2026-12','2027-01'].forEach(mon=>{
      const [y,m]=mon.split('-').map(Number);
      a.push(event(mon+'-15','wundeer',1071000,'expense','conditional','Costo de continuidad'));
      a.push(event(mon+'-'+lastDay(y,m),'wundeer',1071000,'expense','conditional','Costo de continuidad'));
    });
    ['2026-11-15','2026-12-15','2027-01-15','2027-02-15'].forEach((d,i)=>a.push(event(d,'wundeer',4500000,'income','conditional',`Continuidad · cuota ${i+3}/6`)));

    // BOGA: solo desarrollo confirmado. Mantenimiento fuera hasta confirmación.
    a.push(event('2026-09-01','boga',1200000,'income','confirmed','Pago desarrollo'));

    // Sátiro: 30 x 400K; ejecución inicial 4M.
    for(let i=0;i<8;i++) a.push(event(addMonths('2026-09-01',i),'satiro',400000,'income','confirmed',`Cuota ${i+1}/30`));
    ['2026-09-15','2026-09-30','2026-10-15','2026-10-30'].forEach(d=>a.push(event(d,'satiro',1000000,'expense','committed','Ejecución primeros 2 meses')));

    // Zapatos: provisional hasta activación.
    ['2026-09-15','2026-09-30'].forEach(d=>a.push(event(d,'zapatos',2166000,'expense','provisional','Mes 1 provisional')));
    a.push(event('2026-11-15','zapatos',9000000,'income','provisional','Cobro retroactivo estimado'));

    // Prospectos Sep15. El escenario usa 30 cuotas para medir capital de trabajo.
    const prospects=[
      ['harbin',30000000,6000000],['candilejas',20000000,4000000],['labanca',20000000,4000000],
      ['carreta',12000000,4000000],['plazoleta',72000000,7500000]
    ];
    prospects.forEach(([id,base,early])=>{
      ['2026-09-15','2026-09-30','2026-10-15','2026-10-30'].forEach(d=>a.push(event(d,id,early/4,'expense','estimated','Costo de arranque')));
      const monthly=base/30;
      for(let i=0;i<8;i++) a.push(event(addMonths('2026-10-15',i),id,monthly,'income','estimated','Cuota mensual · escenario 30 cuotas'));
    });

    // Mar y Tierra / Charles: precio aún no confirmado, por eso solo exposición de costo.
    ['marytierra','charles'].forEach(id=>{
      ['2026-09-15','2026-09-30','2026-10-15','2026-10-30'].forEach(d=>a.push(event(d,id,1000000,'expense','estimated','Costo de arranque · precio pendiente')));
    });

    // Amsterdam.
    a.push(event('2026-10-30','amsterdam',15000000,'income','estimated','3 desarrollos × $5M contra entrega'));
    a.push(event('2026-11-30','amsterdam',1500000,'expense','conditional','Comisión máxima Aleja · falta definir inclusión en costo'));

    // Globos. Mantenimiento no se proyecta sin confirmación.
    ['2026-10-15','2026-10-30','2026-11-15','2026-11-30'].forEach(d=>a.push(event(d,'globos',200000,'expense','estimated','Costo inicial')));
    a.push(event('2026-11-15','globos',2000000,'income','estimated','Desarrollo contra entrega'));

    // Junisama.
    ['2026-11-15','2026-12-15','2027-01-15','2027-02-15'].forEach((d,i)=>{
      a.push(event(d,'junisama',5000000,'income','estimated',`Licitación ${i+1}/4 · bono 1,5% no cuantificado`));
      a.push(event(d,'junisama',2000000,'expense','estimated',`Pago ${i+1}/4 a David`));
    });
    return a.sort((x,y)=>x.date.localeCompare(y.date));
  }

  function includeStatus(s){
    if(state.scenario==='committed') return s==='confirmed'||s==='committed';
    if(state.scenario==='base') return s!=='conditional'&&s!=='provisional';
    return true;
  }
  function selectedEvents(){
    const set=new Set(state.projects);
    return modelEvents().filter(x=>includeStatus(x.status)&&(x.project==='overhead'?state.includeOverhead:set.has(x.project)));
  }
  function calculate(events=selectedEvents()){
    let balance=OPENING_CASH, min=OPENING_CASH, minDate=AS_OF, firstNegative=null, income=0, expense=0;
    const byDate={}; events.forEach(x=>(byDate[x.date]??=[]).push(x));
    const rows=Object.keys(byDate).sort().map(date=>{
      const items=byDate[date];
      const inc=items.filter(x=>x.kind==='income').reduce((a,x)=>a+x.amount,0);
      const exp=items.filter(x=>x.kind==='expense').reduce((a,x)=>a+x.amount,0);
      const net=inc-exp; income+=inc; expense+=exp; balance+=net;
      if(balance<0&&!firstNegative) firstNegative=date;
      if(balance<min){min=balance;minDate=date;}
      return {date,items,income:inc,expense:exp,net,balance};
    });
    return {rows,income,expense,ending:balance,min,minDate,firstNegative,need:Math.max(0,-min)};
  }
  function projectTotals(events=selectedEvents()){
    const map={};
    events.forEach(x=>{
      if(!map[x.project]) map[x.project]={project:x.project,income:0,expense:0};
      map[x.project][x.kind]+=x.amount;
    });
    return Object.values(map).map(x=>({...x,net:x.income-x.expense}));
  }

  function selector(){
    return `<section class="v10Controls"><div class="v10ControlTop"><div><b>Construye el escenario</b><small>Elige los proyectos que realmente quieres financiar y el nivel de certeza.</small></div><div><button onclick="RRV10.all(true)">Todos</button><button onclick="RRV10.all(false)">Ninguno</button></div></div><div class="v10Checks">${PROJECTS.map(([id,n])=>`<label class="${state.projects.includes(id)?'on':''}"><input type="checkbox" ${state.projects.includes(id)?'checked':''} onchange="RRV10.toggle('${id}')"><span>${esc10(n)}</span></label>`).join('')}</div><div class="v10Options"><label><input type="checkbox" ${state.includeOverhead?'checked':''} onchange="RRV10.overhead(this.checked)"> Incluir gastos fijos RR</label><label>Escenario <select onchange="RRV10.scenario(this.value)"><option value="committed" ${state.scenario==='committed'?'selected':''}>Solo confirmado / comprometido</option><option value="base" ${state.scenario==='base'?'selected':''}>Base: incluye estimados</option><option value="all" ${state.scenario==='all'?'selected':''}>Todo: incluye condicional / provisional</option></select></label></div></section>`;
  }

  function runwayView(){
    const c=calculate(), totals=projectTotals(), recommended=Math.ceil(c.need*1.15/100000)*100000;
    const drivers=totals.filter(x=>x.expense>0).sort((a,b)=>b.expense-a.expense).slice(0,5);
    return `<div class="sectionHead"><div><h2>Runway / Flujo</h2><p class="sectionIntro">Responde tres preguntas: <b>cuándo</b> falta caja, <b>cuánto</b> falta y <b>qué proyectos</b> generan esa necesidad.</p></div></div>${selector()}<section class="v10Hero"><div><span>CAJA HOY</span><b>${money(OPENING_CASH)}</b><small>21 ago 2026</small></div><div><span>INGRESOS DEL ESCENARIO</span><b>${money(c.income)}</b></div><div><span>GASTOS DEL ESCENARIO</span><b>${money(c.expense)}</b></div><div class="${c.need?'danger':''}"><span>BRECHA MÁXIMA DE LIQUIDEZ</span><b>${money(c.need)}</b><small>${c.need?`peor punto · ${dateLabel(c.minDate)}`:'sin déficit'}</small></div><div><span>APALANCAMIENTO RECOMENDADO</span><b>${money(recommended)}</b><small>brecha + 15% de margen</small></div></section><div class="v10Explain ${c.need?'bad':'good'}"><b>${c.need?'Hay una brecha temporal de caja.':'Este escenario no entra en negativo.'}</b><p>${c.need?`La caja cruza a negativo por primera vez el <strong>${dateLabel(c.firstNegative)}</strong>. El peor saldo ocurre el <strong>${dateLabel(c.minDate)}</strong>. En ese momento faltan <strong>${money(c.need)}</strong> para pagar todo lo seleccionado. Esto <strong>no es una pérdida</strong>: es capital de trabajo que sale antes de que entren los cobros. Para operar con margen, la línea sugerida es <strong>${money(recommended)}</strong>.`:'Con la selección actual, la caja alcanza para cubrir los movimientos cargados sin usar deuda.'}</p>${drivers.length?`<div class="v10Drivers">${drivers.map(x=>`<span><b>${x.project==='overhead'?'Operación RR':esc10(NAME[x.project]||x.project)}</b>${money(x.expense)} de salidas</span>`).join('')}</div>`:''}</div><div class="sectionHead"><div><h2>Runway detallado</h2><p class="sectionIntro">Cada fila muestra entradas, salidas, saldo acumulado y brecha exacta por fecha.</p></div></div><div class="desktopTableWrap"><table class="dataTable"><thead><tr><th>Fecha</th><th>Movimiento</th><th>Entradas</th><th>Salidas</th><th>Neto</th><th>Saldo acumulado</th><th>Brecha</th></tr></thead><tbody>${c.rows.map(r=>`<tr class="${r.balance<0?'dangerRow':''}"><td><b>${dateLabel(r.date)}</b></td><td>${r.items.map(x=>`${esc10(x.project==='overhead'?'Operación RR':NAME[x.project]||x.project)} · ${esc10(x.note)}`).join('<br>')}</td><td class="plus">${r.income?money(r.income):'—'}</td><td class="minus">${r.expense?money(r.expense):'—'}</td><td>${money(r.net)}</td><td><b>${money(r.balance)}</b></td><td class="${r.balance<0?'minus':''}">${r.balance<0?money(Math.abs(r.balance)):'—'}</td></tr>`).join('')}</tbody></table></div><div class="sectionHead"><div><h2>Ingresos y gastos por proyecto</h2></div></div><div class="desktopTableWrap"><table class="dataTable"><thead><tr><th>Proyecto</th><th>Ingresos</th><th>Gastos</th><th>Neto de caja</th><th>Lectura</th></tr></thead><tbody>${totals.map(x=>`<tr><td><b>${x.project==='overhead'?'Operación RR':esc10(NAME[x.project]||x.project)}</b></td><td class="plus">${money(x.income)}</td><td class="minus">${money(x.expense)}</td><td class="${x.net>=0?'plus':'minus'}">${money(x.net)}</td><td>${x.project==='overhead'?'Estructura fija de RR.':x.income===0&&x.expense>0?'Consume caja sin ingreso cargado en este escenario.':x.net>=0?'Aporta caja neta positiva en el horizonte.':'Exige capital de trabajo en el horizonte.'}</td></tr>`).join('')}</tbody></table></div>`;
  }

  const PNL_MONTHS=['2026-08','2026-09','2026-10','2026-11','2026-12','2027-01','2027-02','2027-03'];
  function pnlData(month){
    const events=selectedEvents().filter(x=>x.date.slice(0,7)===month);
    const revenue=events.filter(x=>x.kind==='income').reduce((a,x)=>a+x.amount,0);
    const direct=events.filter(x=>x.kind==='expense'&&x.project!=='overhead').reduce((a,x)=>a+x.amount,0);
    const overhead=events.filter(x=>x.kind==='expense'&&x.project==='overhead').reduce((a,x)=>a+x.amount,0);
    const gross=revenue-direct, operating=gross-overhead;
    return {month,events,revenue,direct,overhead,gross,operating,grossMargin:revenue?gross/revenue:null,operatingMargin:revenue?operating/revenue:null};
  }
  function pct(v){return Number.isFinite(v)?(v*100).toLocaleString('es-CO',{maximumFractionDigits:1})+'%':'—';}
  function pnlView(){
    const x=pnlData(state.pnlMonth);
    const byProject={}; x.events.filter(e=>e.project!=='overhead').forEach(e=>{if(!byProject[e.project])byProject[e.project]={project:e.project,revenue:0,direct:0};if(e.kind==='income')byProject[e.project].revenue+=e.amount;else byProject[e.project].direct+=e.amount;});
    const rows=Object.values(byProject);
    return `<div class="sectionHead"><div><h2>P&L gerencial</h2><p class="sectionIntro">Runway mide <b>liquidez</b>; P&L mide <b>rentabilidad</b>. Un proyecto puede ser rentable y aun así exigir caja antes de cobrar.</p></div></div><div class="v10Warning"><b>No es todavía utilidad contable oficial.</b><span>Faltan impuestos, fee del contador, transporte/reuniones y costeo de horas internas. Por ahora es una lectura gerencial.</span></div><div class="v10ExplainGrid"><article><b>Ingresos</b><p>Entradas reconocidas por el modelo en el mes.</p></article><article><b>Costo directo</b><p>Lo que cuesta ejecutar proyectos; no incluye overhead general.</p></article><article><b>Margen bruto</b><p>Ingresos − costo directo.</p></article><article><b>Resultado operativo</b><p>Margen bruto − gastos fijos RR.</p></article></div><div class="v10MonthPicker">${PNL_MONTHS.map(m=>`<button class="${state.pnlMonth===m?'on':''}" onclick="RRV10.month('${m}')">${monthLabel(m)}</button>`).join('')}</div><section class="v10Hero"><div><span>INGRESOS</span><b>${money(x.revenue)}</b></div><div><span>COSTO DIRECTO</span><b>${money(x.direct)}</b></div><div><span>MARGEN BRUTO</span><b>${money(x.gross)}</b><small>${pct(x.grossMargin)}</small></div><div><span>OVERHEAD RR</span><b>${money(x.overhead)}</b></div><div class="${x.operating<0?'danger':''}"><span>RESULTADO OPERATIVO</span><b>${money(x.operating)}</b><small>${pct(x.operatingMargin)}</small></div></section><div class="v10Explain ${x.operating<0?'bad':'good'}"><b>${x.operating<0?'Este mes no cubre la estructura conocida de RR.':'Este mes cubre la estructura conocida de RR.'}</b><p>${x.revenue?`Por cada $100 de ingreso, quedan <strong>${pct(x.grossMargin)}</strong> después del costo directo y <strong>${pct(x.operatingMargin)}</strong> después del overhead conocido.`:'No hay suficientes ingresos cargados para interpretar porcentajes de margen.'}${x.operating<0?` Faltan <strong>${money(Math.abs(x.operating))}</strong> de contribución para llegar al punto de equilibrio operativo.`:''}</p></div><div class="sectionHead"><div><h2>Detalle por proyecto · ${monthLabel(state.pnlMonth)}</h2></div></div><div class="desktopTableWrap"><table class="dataTable"><thead><tr><th>Proyecto</th><th>Ingresos</th><th>Costo directo</th><th>Contribución</th><th>Margen</th></tr></thead><tbody>${rows.map(r=>{const contribution=r.revenue-r.direct;return `<tr><td><b>${esc10(NAME[r.project]||r.project)}</b></td><td class="plus">${money(r.revenue)}</td><td class="minus">${money(r.direct)}</td><td class="${contribution>=0?'plus':'minus'}">${money(contribution)}</td><td>${r.revenue?pct(contribution/r.revenue):'—'}</td></tr>`}).join('')}</tbody></table></div><div class="sectionHead"><div><h2>Evolución mensual</h2></div></div><div class="desktopTableWrap"><table class="dataTable"><thead><tr><th>Mes</th><th>Ingresos</th><th>Costo directo</th><th>Margen bruto</th><th>Overhead</th><th>Resultado operativo</th></tr></thead><tbody>${PNL_MONTHS.map(m=>{const z=pnlData(m);return `<tr class="${z.operating<0?'dangerRow':''}"><td><b>${monthLabel(m)}</b></td><td>${money(z.revenue)}</td><td>${money(z.direct)}</td><td>${money(z.gross)}</td><td>${money(z.overhead)}</td><td class="${z.operating>=0?'plus':'minus'}"><b>${money(z.operating)}</b></td></tr>`}).join('')}</tbody></table></div>`;
  }

  function accountingView(){
    const reserve=2000000+2000000+3000000+3000000+2000000+2000000+4500000+400000+4500000;
    return `<div class="sectionHead"><div><h2>Contabilidad y control financiero</h2><p class="sectionIntro">Qué sabemos hoy, qué es caja real y qué todavía falta incorporar para llegar a utilidad neta contable.</p></div></div><section class="v10Hero"><div><span>CAJA DISPONIBLE</span><b>${money(OPENING_CASH)}</b><small>corte 21 ago</small></div><div><span>GASTO FIJO RR / MES</span><b>${money(1800000)}</b></div><div><span>CXC CONFIRMADA CERCANA</span><b>${money(1200000)}</b><small>BOGA · 1 sep</small></div><div><span>CXP CONOCIDA</span><b>${money(350000)}</b><small>Manuel · 30 ago</small></div><div><span>RESERVA TÉCNICA APROX.</span><b>${money(reserve)}</b><small>exposición, no gasto realizado</small></div></section><div class="v10ExplainGrid"><article><b>Gastos fijos conocidos</b><p>Manuel $500K/quincena, Samuel $250K/quincena, IA $100K/quincena y hosting $50K/quincena. El 30/08 Manuel solo tiene $350K pendientes.</p></article><article><b>Impuestos y contador</b><p>Pendiente fee, calendario tributario y provisión fiscal. Sin esto no existe utilidad neta contable confiable.</p></article><article><b>Costeo interno</b><p>Manuel/Santiago siguen como overhead. Hace falta imputar horas o una tarifa interna para conocer rentabilidad económica real por proyecto.</p></article><article><b>Conciliación bancaria</b><p>La caja debe reconciliarse semanalmente contra banco y no contra saldos históricos del Excel.</p></article><article><b>Comisiones</b><p>Amsterdam: falta definir si los hasta $1,5M de Aleja están incluidos o van por fuera del costo esperado.</p></article><article><b>Gastos variables</b><p>Transporte/reuniones aún no tienen presupuesto; deben medirse o provisionarse.</p></article></div>`;
  }

  function auditView(){
    const committedState={...state,scenario:'committed'};
    const saved=state.scenario; state.scenario='committed'; const committed=calculate(); state.scenario=saved;
    return `<div class="sectionHead"><div><h2>Auditoría financiera de RR</h2><p class="sectionIntro">No es una lista técnica. Es lo que falta resolver para confiar en liquidez, utilidad, proyección y capacidad de crecimiento.</p></div></div><section class="v10Hero"><div><span>CAJA BASE</span><b>${money(OPENING_CASH)}</b></div><div class="${committed.need?'danger':''}"><span>BRECHA COMPROMETIDA</span><b>${money(committed.need)}</b><small>${committed.need?dateLabel(committed.minDate):'sin déficit'}</small></div><div><span>BURN FIJO / MES</span><b>${money(1800000)}</b></div></section><div class="v10Audit"><article class="critical"><b>1 · Liquidez y capital de trabajo</b><p>Medir la brecha máxima con cartera comprometida y luego agregar cada cierre como escenario separado. No aprobar un proyecto solo por margen: debe soportarse también el capital necesario antes del primer cobro.</p><ul><li>Stress test Wundeer: 15 y 30 días de retraso.</li><li>Definir línea de crédito objetivo y fecha límite antes de cada arranque.</li><li>Mantener runway móvil mínimo de 13 semanas.</li></ul></article><article class="critical"><b>2 · Utilidad real</b><p>Separar margen bruto, contribución después de overhead y utilidad neta. Hoy faltan impuestos, contador, variables operativas y costeo de horas internas.</p><ul><li>Asignar horas/costo interno por proyecto.</li><li>Provisionar impuestos.</li><li>Medir gastos de reuniones y transporte.</li></ul></article><article><b>3 · Proyección comercial</b><p>No mezclar pipeline con caja comprometida. Cada prospecto debe tener probabilidad, fecha estimada de firma, fecha de primer cobro y costo de arranque.</p><ul><li>Confirmar precio de Mar y Tierra.</li><li>Confirmar precio de Charles Brown.</li><li>Definir descuentos Plazoleta de 1–7 restaurantes.</li><li>Resolver si el incentivo viejo de Candilejas/La Banca sigue vigente.</li></ul></article><article><b>4 · Calidad de datos</b><p>Conciliar banco semanalmente y retirar saldos históricos como fuente de verdad. Mantener una sola lógica de fechas y eliminar cronogramas viejos.</p><ul><li>Registrar CxC y CxP con fecha, responsable y estado.</li><li>Eliminar fechas imposibles del Excel.</li><li>Documentar cada cambio de supuesto.</li></ul></article><article><b>5 · Riesgo de cobro</b><p>El mayor riesgo inmediato no es el margen, sino pagar antes de cobrar. Medir días reales de cobro por cliente y el costo de cada retraso.</p><ul><li>Wundeer: confirmar fecha real del $9M.</li><li>Zapatos: definir cuándo empieza a consumir costo.</li><li>Junisama: capturar valor bruto de cada licitación para cuantificar el 1,5%.</li></ul></article><article><b>6 · Reservas y exposición</b><p>La reserva técnica debe seguir fuera de caja y del P&L oficial hasta activarse. Sí debe verse como exposición y en una utilidad conservadora.</p><ul><li>Activar reserva solo con decisión/compromiso real.</li><li>No asignar una fecha ficticia a reservas.</li><li>Comparar utilidad oficial vs utilidad conservadora.</li></ul></article><article><b>7 · Unit economics y retorno sobre capital</b><p>Para cada proyecto medir utilidad esperada, capital máximo inmovilizado y tiempo hasta recuperar la inversión. Dos proyectos con igual margen pueden ser muy distintos si uno inmoviliza caja seis meses.</p></article><article><b>8 · Decisiones prioritarias</b><p>Antes de aceptar nuevos cierres: saber cuánta caja adicional exigen, cuándo se recupera y qué pasa si el cobro se retrasa. El dashboard debe usarse como gate de aprobación financiera, no solo como reporte.</p></article></div>`;
  }

  const old = {
    summary: typeof summary==='function'?summary:null,
    projects: typeof projects==='function'?projects:null,
    pipeline: typeof pipeline==='function'?pipeline:null,
    costs: typeof costs==='function'?costs:null,
    calendar: typeof calendar==='function'?calendar:null
  };
  function safeLegacy(key){
    try { return old[key] ? old[key]() : `<div class="empty">Sección ${esc10(key)} no disponible.</div>`; }
    catch(err){ return `<div class="v10Error"><b>No se pudo renderizar ${esc10(key)}.</b><p>${esc10(err.message||err)}</p></div>`; }
  }
  function view(id){
    if(id==='runway') return runwayView();
    if(id==='pnl') return pnlView();
    if(id==='accounting10') return accountingView();
    if(id==='audit10') return auditView();
    if(id==='summary') return safeLegacy('summary');
    if(id==='projects') return safeLegacy('projects');
    if(id==='pipeline') return safeLegacy('pipeline');
    if(id==='costs') return safeLegacy('costs');
    if(id==='calendar') return safeLegacy('calendar');
    return '<div class="empty">Vista no disponible.</div>';
  }
  function nav10(){
    const el=document.getElementById('tabs'); if(!el) return;
    el.innerHTML=TABS.map(([id,label])=>`<button type="button" class="${state.tab===id?'on':''}" onclick="RRV10.tab('${id}')">${label}${id==='projects'&&window.P?` · ${P.length}`:''}</button>`).join('');
  }
  function render10(){
    nav10();
    const el=document.getElementById('view');
    if(el){
      try { el.innerHTML=view(state.tab); }
      catch(err){ el.innerHTML=`<div class="v10Error"><b>Error de render en ${esc10(state.tab)}</b><p>${esc10(err.stack||err.message||err)}</p></div>`; }
    }
    document.documentElement.dataset.rrBuild='v10';
    const footer=document.querySelector('footer');
    if(footer){footer.querySelectorAll('.buildMark').forEach(x=>x.remove());footer.insertAdjacentHTML('beforeend',' <span class="buildMark">· UI V10</span>');}
  }

  window.RRV10={
    tab(id){state.tab=id;render10();},
    toggle(id){const i=state.projects.indexOf(id); if(i>=0)state.projects.splice(i,1); else state.projects.push(id); render10();},
    all(on){state.projects=on?PROJECTS.map(x=>x[0]):[];render10();},
    overhead(on){state.includeOverhead=on;render10();},
    scenario(v){state.scenario=v;render10();},
    month(v){state.pnlMonth=v;render10();},
    render:render10
  };
  window.render=render10;
  window.nav=nav10;
  render10();
})();
