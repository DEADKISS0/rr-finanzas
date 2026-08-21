// RR Aliados — Costos, Contabilidad y Flujo de Caja
// Modelo operativo confirmado en sesión del 21/08/2026.

const ACC_OPENING_DATE='2026-08-21';
const ACC_OPENING_CASH=2620000;
const ACC_TERMS=[4,6,12,18,24,30];
const ACC_STATE={
  terms:{harbin:30,candilejas:30,labanca:30,carreta:30,marytierra:30,charles:30,plazoleta:30},
  plazoletaRestaurants:8
};

const ACC_COSTS={
  wundeer:{label:'Wundeer',expected:15042000,initial:4332000,reserve:0,spent:2166000,type:'Operación + redes',status:'confirmado',note:'Mes 1 $4.332M; meses 2–6 $2.142M/mes.'},
  zapatos:{label:'Zapatos',expected:15042000,initial:4332000,reserve:0,spent:0,type:'Operación + redes',status:'provisional',note:'Misma estructura de Wundeer hasta cerrar discovery.'},
  boga:{label:'BOGA',expected:0,initial:0,reserve:0,spent:0,type:'Desarrollo tecnológico',status:'confirmado',note:'Desarrollo hecho por Manuel; sin costos directos ni colchón técnico.'},
  satiro:{label:'Sátiro Sushi',expected:6000000,initial:4000000,reserve:2000000,spent:0,type:'Desarrollo tecnológico',status:'estimado',note:'$4M en 4 quincenas; $2M como reserva técnica.'},
  harbin:{label:'Harbin',expected:8000000,initial:6000000,reserve:2000000,spent:0,type:'Desarrollo tecnológico',status:'estimado',note:'$6M en 4 quincenas; $2M de reserva técnica.'},
  candilejas:{label:'Candilejas',expected:7000000,initial:4000000,reserve:3000000,spent:0,type:'Desarrollo tecnológico',status:'estimado',note:'$4M en 4 quincenas; $3M de reserva técnica.'},
  labanca:{label:'La Banca',expected:7000000,initial:4000000,reserve:3000000,spent:0,type:'Desarrollo tecnológico',status:'estimado',note:'$4M en 4 quincenas; $3M de reserva técnica.'},
  carreta:{label:'La Carreta Zipaquirá',expected:6000000,initial:4000000,reserve:2000000,spent:0,type:'Desarrollo tecnológico',status:'estimado',note:'Misma estructura de Sátiro.'},
  marytierra:{label:'Mar y Tierra',expected:6000000,initial:4000000,reserve:2000000,spent:0,type:'Desarrollo tecnológico',status:'estimado',note:'Misma estructura de Sátiro.'},
  charles:{label:'Charles Brown',expected:6000000,initial:4000000,reserve:2000000,spent:0,type:'Desarrollo tecnológico',status:'estimado',note:'Misma estructura de Sátiro.'},
  plazoleta:{label:'Plazoleta Jardín',expected:12000000,initial:7500000,reserve:4500000,spent:0,type:'Desarrollo tecnológico compartido',status:'estimado',note:'Escala proporcionalmente con restaurantes cerrados.'},
  amsterdam:{label:'Amsterdam ×3',expected:6000000,initial:1500000,reserve:4500000,spent:1500000,type:'Desarrollo tecnológico',status:'estimado',note:'$2M por proyecto incluyendo prototipo de $500K ya pagado. Comisión comercial se controla aparte.'},
  globos:{label:'Globos',expected:1200000,initial:800000,reserve:400000,spent:0,type:'Desarrollo tecnológico',status:'estimado',note:'$800K en primeros 2 meses; $400K reserva técnica.'},
  junisama:{label:'Junisama / BOGA legado',expected:8000000,initial:8000000,reserve:0,spent:0,type:'Desarrollo tecnológico',status:'estimado',note:'David cobra $8M: $2M por cada bloque de $5M recibido.'}
};

const ACC_OVERHEAD=[
  {name:'Manuel',amount:500000,frequency:'quincenal',note:'30/08 solo faltan $350K por avance previo de $150K.'},
  {name:'Samuel',amount:250000,frequency:'quincenal',note:'Pago fijo.'},
  {name:'IA',amount:100000,frequency:'quincenal',note:'Presupuesto operativo.'},
  {name:'Hosting y servicios',amount:50000,frequency:'quincenal',note:'Hosting y asociados.'}
];

const ACC_RECEIVABLES=[
  {date:'2026-09-01',project:'BOGA',amount:1200000,status:'confirmado',note:'Pago completo del desarrollo.'}
];
const ACC_PAYABLES=[
  {date:'2026-08-30',project:'Operación RR',amount:350000,status:'confirmado',note:'Saldo de quincena de Manuel después de avance.'}
];

function accDiscount(term){return term===30?0:0.15*((30-term)/26)}
function accRound(n){return Math.round(n)}
function accPct(n){return (n*100).toLocaleString('es-CO',{maximumFractionDigits:1})+'%'}
function accDate(s){return new Date(s+'T12:00:00')}
function accISO(d){return d.toISOString().slice(0,10)}
function accAddMonths(s,n){const d=accDate(s);d.setMonth(d.getMonth()+n);return accISO(d)}
function accMonthKey(s){return s.slice(0,7)}
function accFmtDate(s){return accDate(s).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'})}
function accStatus(s){return `<span class="accStatus ${s}">${String(s).toUpperCase()}</span>`}

function accInstallmentPlan(base,term){const discount=accDiscount(term),total=accRound(base*(1-discount));return{base,term,discount,total,installment:accRound(total/term)}}
function accPlazoletaBase(restaurants){const paid=Math.max(0,restaurants-Math.floor(restaurants/4));return paid*12000000}
function accPlazoletaCost(restaurants){const total=restaurants*1500000;return{expected:total,initial:accRound(total*.625),reserve:accRound(total*.375)}}

function accProjectPlan(id){
  const bases={harbin:30000000,candilejas:20000000,labanca:20000000,carreta:12000000,marytierra:12000000,charles:12000000};
  if(id==='plazoleta')return accInstallmentPlan(accPlazoletaBase(ACC_STATE.plazoletaRestaurants),ACC_STATE.terms.plazoleta);
  return accInstallmentPlan(bases[id],ACC_STATE.terms[id]);
}

function accMove(date,project,amount,kind,status,note,group){return{date,project,amount:accRound(amount),kind,status:status||'estimado',note:note||'',group:group||project}}
function accMonthlyInstallments(id,label,base,signDate){
  const plan=id==='plazoleta'?accProjectPlan('plazoleta'):accInstallmentPlan(base,ACC_STATE.terms[id]);
  const out=[];
  for(let i=0;i<plan.term;i++)out.push(accMove(accAddMonths('2026-10-15',i),label,plan.installment,'income','estimado',`${plan.term} cuotas · descuento ${accPct(plan.discount)}`,id));
  return out;
}
function accSplitFour(label,total,startDates,status,group){return startDates.map(d=>accMove(d,label,total/4,'expense',status||'estimado','Ejecución primeros 2 meses',group))}

function accCashMovements(){
  let m=[];
  // Gastos fijos RR: excepción 30/08 y luego $900K por quincena.
  m.push(accMove('2026-08-30','Operación RR',750000,'expense','confirmado','Manuel $350K + Samuel $250K + IA $100K + hosting $50K','overhead'));
  for(let month=8;month<=17;month++){
    const d=new Date(2026,month,15,12); const y=d.getFullYear(),mo=String(d.getMonth()+1).padStart(2,'0');
    const last=new Date(y,d.getMonth()+1,0).getDate();
    m.push(accMove(`${y}-${mo}-15`,'Operación RR',900000,'expense','estimado','Manuel $500K + Samuel $250K + IA $100K + hosting $50K','overhead'));
    m.push(accMove(`${y}-${mo}-${String(last).padStart(2,'0')}`,'Operación RR',900000,'expense','estimado','Manuel $500K + Samuel $250K + IA $100K + hosting $50K','overhead'));
  }

  // Wundeer: costos confirmados del combo y recaudo especial.
  m.push(accMove('2026-08-15','Wundeer',2166000,'expense','confirmado','Mes 1 · primera mitad','wundeer'));
  m.push(accMove('2026-08-30','Wundeer',2166000,'expense','confirmado','Mes 1 · segunda mitad','wundeer'));
  ['2026-09','2026-10','2026-11','2026-12','2027-01'].forEach(mon=>{
    m.push(accMove(mon+'-15','Wundeer',1071000,'expense','estimado','Costo operativo recurrente','wundeer'));
    const d=accDate(mon+'-15'),last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
    m.push(accMove(mon+'-'+String(last).padStart(2,'0'),'Wundeer',1071000,'expense','estimado','Costo operativo recurrente','wundeer'));
  });
  m.push(accMove('2026-10-15','Wundeer',9000000,'income','confirmado','2 meses de prueba cobrados retroactivamente','wundeer'));
  ['2026-11-15','2026-12-15','2027-01-15','2027-02-15'].forEach(d=>m.push(accMove(d,'Wundeer',4500000,'income','condicional','Continuidad después del bloque inicial','wundeer')));

  // Zapatos: misma lógica de Wundeer, todavía provisional en costos.
  ['2026-09-15','2026-09-30'].forEach(d=>m.push(accMove(d,'Zapatos',2166000,'expense','provisional','Mes 1 provisional','zapatos')));
  ['2026-10','2026-11','2026-12','2027-01','2027-02'].forEach(mon=>{
    m.push(accMove(mon+'-15','Zapatos',1071000,'expense','provisional','Costo recurrente provisional','zapatos'));
    const d=accDate(mon+'-15'),last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
    m.push(accMove(mon+'-'+String(last).padStart(2,'0'),'Zapatos',1071000,'expense','provisional','Costo recurrente provisional','zapatos'));
  });
  m.push(accMove('2026-11-15','Zapatos',9000000,'income','estimado','Cobro retroactivo de 2 meses de prueba','zapatos'));
  ['2026-12-15','2027-01-15','2027-02-15','2027-03-15'].forEach(d=>m.push(accMove(d,'Zapatos',4500000,'income','condicional','Continuidad posterior a prueba','zapatos')));

  // BOGA.
  m.push(accMove('2026-09-01','BOGA',1200000,'income','confirmado','Pago completo desarrollo','boga'));
  ['2026-10-01','2026-11-01','2026-12-01','2027-01-01','2027-02-01','2027-03-01'].forEach(d=>m.push(accMove(d,'BOGA',300000,'income','confirmado','Mantenimiento mensual confirmado','boga')));

  // Sátiro.
  m.push(accMove('2026-09-01','Sátiro Sushi',400000,'income','confirmado','Cuota 1 de 30','satiro'));
  for(let i=1;i<30;i++)m.push(accMove(accAddMonths('2026-09-01',i),'Sátiro Sushi',400000,'income','confirmado',`Cuota ${i+1} de 30`,'satiro'));
  m=m.concat(accSplitFour('Sátiro Sushi',4000000,['2026-09-15','2026-09-30','2026-10-15','2026-10-30'],'estimado','satiro'));

  // Proyectos que estiman firma 15/09 y primera cuota 15/10.
  m=m.concat(accMonthlyInstallments('harbin','Harbin',30000000,'2026-09-15'));
  m=m.concat(accMonthlyInstallments('candilejas','Candilejas',20000000,'2026-09-15'));
  m=m.concat(accMonthlyInstallments('labanca','La Banca',20000000,'2026-09-15'));
  m=m.concat(accMonthlyInstallments('carreta','La Carreta Zipaquirá',12000000,'2026-09-15'));
  m=m.concat(accMonthlyInstallments('marytierra','Mar y Tierra',12000000,'2026-09-15'));
  m=m.concat(accMonthlyInstallments('charles','Charles Brown',12000000,'2026-09-15'));
  m=m.concat(accMonthlyInstallments('plazoleta','Plazoleta Jardín',accPlazoletaBase(ACC_STATE.plazoletaRestaurants),'2026-09-15'));
  m=m.concat(accSplitFour('Harbin',6000000,['2026-09-15','2026-09-30','2026-10-15','2026-10-30'],'estimado','harbin'));
  ['Candilejas','La Banca','La Carreta Zipaquirá','Mar y Tierra','Charles Brown'].forEach(label=>m=m.concat(accSplitFour(label,4000000,['2026-09-15','2026-09-30','2026-10-15','2026-10-30'],'estimado',label.toLowerCase().replaceAll(' ','').replace('zipaquirá',''))));
  const plc=accPlazoletaCost(ACC_STATE.plazoletaRestaurants);
  m=m.concat(accSplitFour('Plazoleta Jardín',plc.initial,['2026-09-15','2026-09-30','2026-10-15','2026-10-30'],'estimado','plazoleta'));

  // Amsterdam: desarrollo contra entrega. Comisión es condicional, producción pendiente queda como reserva sin fecha.
  m.push(accMove('2026-10-30','Amsterdam ×3',15000000,'income','estimado','3 desarrollos × $5M contra entrega','amsterdam'));
  m.push(accMove('2026-11-30','Amsterdam ×3',1500000,'expense','condicional','Comisión máxima Aleja Paternina: $500K por proyecto','amsterdam'));

  // Globos: firma 15/10, entrega/pago 15/11.
  ['2026-10-15','2026-10-30','2026-11-15','2026-11-30'].forEach(d=>m.push(accMove(d,'Globos',200000,'expense','estimado','Costo inicial de desarrollo','globos')));
  m.push(accMove('2026-11-15','Globos',2000000,'income','estimado','Desarrollo contra entrega','globos'));

  // Junisama: 4 licitaciones mensuales; costo David sincronizado con recaudo.
  ['2026-11-15','2026-12-15','2027-01-15','2027-02-15'].forEach((d,i)=>{
    m.push(accMove(d,'Junisama / BOGA legado',5000000,'income','estimado',`Licitación ${i+1}/4 · bono 1,5% adicional no cuantificado`,'junisama'));
    m.push(accMove(d,'Junisama / BOGA legado',2000000,'expense','estimado',`Pago ${i+1}/4 a David`,'junisama'));
  });

  return m.sort((a,b)=>a.date.localeCompare(b.date));
}

function accReserveTotal(){
  let total=0;
  Object.entries(ACC_COSTS).forEach(([id,c])=>{if(id==='plazoleta')total+=accPlazoletaCost(ACC_STATE.plazoletaRestaurants).reserve;else total+=c.reserve||0});
  return total;
}
function accExpectedCostTotal(){
  let total=0;
  Object.entries(ACC_COSTS).forEach(([id,c])=>{if(id==='plazoleta')total+=accPlazoletaCost(ACC_STATE.plazoletaRestaurants).expected;else total+=c.expected||0});
  return total;
}
function accIncluded(m){return m.status!=='condicional'&&m.status!=='provisional'||m.kind==='expense'&&m.status==='provisional'}
function accProjection(){
  const moves=accCashMovements().filter(m=>m.date>=ACC_OPENING_DATE);
  let balance=ACC_OPENING_CASH,min=balance,minDate=ACC_OPENING_DATE;
  const rows=[];
  moves.forEach(m=>{
    const include=accIncluded(m);
    if(include)balance+=m.kind==='income'?m.amount:-m.amount;
    if(balance<min){min=balance;minDate=m.date}
    rows.push({...m,include,balance});
  });
  return{moves:rows,balance,min,minDate,reserve:accReserveTotal(),afterReserve:balance-accReserveTotal()};
}
function accMonthly(){
  const proj=accProjection(),map={};
  proj.moves.forEach(m=>{if(!m.include)return;const k=accMonthKey(m.date);map[k]??={income:0,expense:0};map[k][m.kind]+=m.amount});
  let bal=ACC_OPENING_CASH;
  return Object.keys(map).sort().map(k=>{bal+=map[k].income-map[k].expense;return{month:k,...map[k],net:map[k].income-map[k].expense,balance:bal}});
}

function accApplyFinance(){
  const fixed={wundeer:27000000,zapatos:27000000,boga:3000000,satiro:12000000,amsterdam:15000000,globos:2000000,junisama:20000000};
  P.forEach(p=>{
    let total=fixed[p.id];
    if(['harbin','candilejas','labanca','carreta','marytierra','charles','plazoleta'].includes(p.id))total=accProjectPlan(p.id).total;
    if(total!=null){p.totalValue=total;if(p.fin)p.fin.total=total}
  });
  const now=accDate(ACC_OPENING_DATE),d2=new Date(now);d2.setMonth(d2.getMonth()+2);const d6=new Date(now);d6.setMonth(d6.getMonth()+6);
  const moves=accCashMovements();
  P.forEach(p=>{
    const aliases={wundeer:'wundeer',zapatos:'zapatos',boga:'boga',satiro:'satiro',harbin:'harbin',candilejas:'candilejas',labanca:'labanca',carreta:'carreta',marytierra:'marytierra',charles:'charles',plazoleta:'plazoleta',amsterdam:'amsterdam',globos:'globos',junisama:'junisama'};
    const group=aliases[p.id]; if(!group)return;
    const inc=moves.filter(x=>x.group===group&&x.kind==='income'&&x.status!=='condicional');
    p.cash2=inc.filter(x=>accDate(x.date)<=d2).reduce((a,x)=>a+x.amount,0)||null;
    p.cash6=inc.filter(x=>accDate(x.date)<=d6).reduce((a,x)=>a+x.amount,0)||null;
    if(p.fin){p.fin.cash2=p.cash2;p.fin.cash6=p.cash6}
  });
}

function accTermControl(id,label){const p=accProjectPlan(id);return `<div class="accControl"><b>${esc(label)}</b><label>Cuotas<select onchange="ACC_STATE.terms['${id}']=+this.value;render()">${ACC_TERMS.map(x=>`<option value="${x}" ${ACC_STATE.terms[id]===x?'selected':''}>${x}</option>`).join('')}</select></label><span>Descuento ${accPct(p.discount)}</span><strong>${COP(p.total)}</strong><small>${COP(p.installment)} / mes</small></div>`}

function costs(){
  const total=accExpectedCostTotal(),reserve=accReserveTotal(),spent=Object.values(ACC_COSTS).reduce((a,c)=>a+(c.spent||0),0);
  return `<div class="sectionHead"><div><div class="label">COSTOS POR PROYECTO</div><h2>GASTO REAL · PREVISTO · RESERVA</h2></div></div>
  <section class="metrics"><div class="metric"><span>COSTO DIRECTO ESPERADO</span><strong>${COP(total)}</strong><small>INCLUYE RESERVAS</small></div><div class="metric income"><span>YA PAGADO IDENTIFICADO</span><strong>${COP(spent)}</strong><small>NO INCLUYE NÓMINA INTERNA</small></div><div class="metric accent"><span>RESERVA TÉCNICA</span><strong>${COP(reserve)}</strong><small>NO SALE DE CAJA HASTA ACTIVARSE</small></div><div class="metric"><span>FIJO RR / MES</span><strong>${COP(1800000)}</strong><small>2 QUINCENAS NORMALES</small></div><div class="metric"><span>CAJA ACTUAL</span><strong>${COP(ACC_OPENING_CASH)}</strong><small>21 AGO 2026</small></div></section>
  <div class="note" style="margin-top:14px"><b>Regla:</b> la reserva técnica es gasto futuro visualizado. No se registra como gasto real, no reduce la caja oficial y no entra en la utilidad realizada hasta activarse. Sí aparece en la lectura conservadora.</div>
  <div class="accTable costsTable"><div class="accRow head"><span>PROYECTO</span><span>TIPO</span><span>COSTO TOTAL</span><span>PRIMEROS 2M / INICIAL</span><span>RESERVA</span><span>YA PAGADO</span><span>ESTADO / LECTURA</span></div>${Object.entries(ACC_COSTS).map(([id,c])=>{const x=id==='plazoleta'?{...c,...accPlazoletaCost(ACC_STATE.plazoletaRestaurants)}:c;return `<div class="accRow"><span><b>${esc(c.label)}</b></span><span>${esc(c.type)}</span><span>${COP(x.expected)}</span><span>${COP(x.initial)}</span><span>${COP(x.reserve)}</span><span>${COP(c.spent||0)}</span><span>${accStatus(c.status)}<small>${esc(c.note)}</small></span></div>`}).join('')}</div>`}

function accounting(){
  const fixedQ=900000,fixedM=1800000;
  return `<div class="sectionHead"><div><div class="label">CONTABILIDAD OPERATIVA</div><h2>CAJA · CXC · CXP · GASTOS FIJOS</h2></div></div>
  <section class="metrics"><div class="metric income"><span>CAJA DISPONIBLE</span><strong>${COP(ACC_OPENING_CASH)}</strong><small>CORTE 21 AGO</small></div><div class="metric"><span>CXC CONFIRMADA CERCANA</span><strong>${COP(1200000)}</strong><small>BOGA · 1 SEP</small></div><div class="metric accent"><span>CXP CONOCIDA</span><strong>${COP(350000)}</strong><small>MANUEL · 30 AGO</small></div><div class="metric"><span>GASTO FIJO / QUINCENA</span><strong>${COP(fixedQ)}</strong><small>DESDE SEP</small></div><div class="metric"><span>GASTO FIJO / MES</span><strong>${COP(fixedM)}</strong><small>SIN CONTADOR / TRANSPORTE</small></div></section>
  <div class="twoCols"><div><div class="sectionHead"><div><div class="label">GASTO GENERAL</div><h2>OPERACIÓN RR</h2></div></div><div class="accList">${ACC_OVERHEAD.map(x=>`<div><span><b>${esc(x.name)}</b><small>${esc(x.frequency)} · ${esc(x.note)}</small></span><strong>${COP(x.amount)}</strong></div>`).join('')}</div></div>
  <div><div class="sectionHead"><div><div class="label">PENDIENTES</div><h2>NO INVENTAR</h2></div></div><div class="note"><b>Contador / impuestos:</b> pendiente de reunión. <br><b>Transporte / reuniones:</b> sin presupuesto fijo aún. <br><b>Honorarios por proyecto:</b> no se imputan todavía; Manuel se controla como gasto fijo general hasta tener medición de dedicación.</div></div></div>
  <div class="sectionHead"><div><div class="label">CUENTAS</div><h2>PRÓXIMOS MOVIMIENTOS CONFIRMADOS</h2></div></div><div class="accTable mini"><div class="accRow head"><span>FECHA</span><span>TIPO</span><span>CONCEPTO</span><span>MONTO</span><span>ESTADO</span></div><div class="accRow"><span>30 AGO</span><span>CxP</span><span>Saldo Manuel</span><span>${COP(350000)}</span><span>${accStatus('confirmado')}</span></div><div class="accRow"><span>1 SEP</span><span>CxC</span><span>BOGA desarrollo</span><span>${COP(1200000)}</span><span>${accStatus('confirmado')}</span></div></div>`}

function cashflow(){
  const p=accProjection(),months=accMonthly();
  const controls=['harbin','candilejas','labanca','carreta','marytierra','charles','plazoleta'];
  return `<div class="sectionHead"><div><div class="label">FLUJO DE CAJA PROYECTADO</div><h2>ENTRADAS · SALIDAS · BRECHAS</h2></div></div>
  <section class="metrics"><div class="metric income"><span>CAJA INICIAL</span><strong>${COP(ACC_OPENING_CASH)}</strong><small>21 AGO</small></div><div class="metric ${p.min<0?'accent':''}"><span>MÍNIMO PROYECTADO</span><strong>${COP(p.min)}</strong><small>${accFmtDate(p.minDate)}</small></div><div class="metric"><span>SALDO FINAL MODELO</span><strong>${COP(p.balance)}</strong><small>INCLUYE ESTIMADOS; EXCLUYE CONDICIONALES</small></div><div class="metric accent"><span>RESERVA TÉCNICA</span><strong>${COP(p.reserve)}</strong><small>EXPOSICIÓN, NO SALIDA</small></div><div class="metric"><span>SALDO - RESERVAS</span><strong>${COP(p.afterReserve)}</strong><small>LECTURA CONSERVADORA, NO CAJA REAL</small></div></section>
  <div class="note" style="margin-top:14px">La proyección base incluye movimientos confirmados y estimados. Los ingresos de continuidad condicionada y mantenimientos no confirmados no se usan para maquillar la liquidez. Las reservas técnicas se muestran aparte y nunca se fuerzan a una fecha ficticia.</div>
  <div class="sectionHead"><div><div class="label">SIMULADOR COMERCIAL</div><h2>CUOTAS Y LIQUIDEZ</h2></div></div><div class="accControls">${controls.map(id=>accTermControl(id,P.find(x=>x.id===id)?.n||id)).join('')}<div class="accControl"><b>Plazoleta · restaurantes</b><label>Cantidad<select onchange="ACC_STATE.plazoletaRestaurants=+this.value;render()">${[1,2,3,4,5,6,7,8].map(x=>`<option value="${x}" ${ACC_STATE.plazoletaRestaurants===x?'selected':''}>${x}</option>`).join('')}</select></label><span>Descuento volumen: ${COP(ACC_STATE.plazoletaRestaurants*12000000-accPlazoletaBase(ACC_STATE.plazoletaRestaurants))}</span><strong>${COP(accPlazoletaBase(ACC_STATE.plazoletaRestaurants))}</strong><small>antes de pronto pago</small></div></div>
  <div class="sectionHead"><div><div class="label">LECTURA MENSUAL</div><h2>RUNWAY PROYECTADO</h2></div></div><div class="accTable monthly"><div class="accRow head"><span>MES</span><span>ENTRADAS</span><span>SALIDAS</span><span>NETO</span><span>SALDO</span></div>${months.map(x=>`<div class="accRow ${x.balance<0?'danger':''}"><span>${x.month}</span><span class="in">+${COP(x.income)}</span><span class="out">-${COP(x.expense)}</span><span>${COP(x.net)}</span><span><b>${COP(x.balance)}</b></span></div>`).join('')}</div>
  <div class="sectionHead"><div><div class="label">MOVIMIENTOS</div><h2>CALENDARIO DE CAJA</h2></div></div><div class="accTable ledger"><div class="accRow head"><span>FECHA</span><span>PROYECTO</span><span>TIPO</span><span>MONTO</span><span>ESTADO</span><span>LECTURA</span></div>${p.moves.filter(x=>x.date>='2026-08-21'&&x.date<='2027-03-31').map(x=>`<div class="accRow ${x.include?'':'mutedRow'}"><span>${accFmtDate(x.date)}</span><span>${esc(x.project)}</span><span>${x.kind==='income'?'ENTRADA':'SALIDA'}</span><span class="${x.kind==='income'?'in':'out'}">${x.kind==='income'?'+':'-'}${COP(x.amount)}</span><span>${accStatus(x.status)}</span><span><small>${esc(x.note)}${x.include?'':' · fuera de proyección base'}</small></span></div>`).join('')}</div>`}

const accOperationalCalendar=calendar;
calendar=function(){
  const start=(new Date(year,month,1).getDay()+6)%7,days=new Date(year,month+1,0).getDate(),cells=[...Array(start).fill(0),...Array.from({length:days},(_,i)=>i+1)];
  const cash=accCashMovements().filter(x=>{const d=accDate(x.date);return d.getFullYear()===year&&d.getMonth()===month});
  return `<div class="sectionHead"><div><div class="label">CALENDARIO OPERATIVO + FINANCIERO</div><h2>${new Date(year,month).toLocaleDateString('es-CO',{month:'long',year:'numeric'}).toUpperCase()}</h2></div><div><button class="chip" onclick="go(-1)">←</button> <button class="chip" onclick="go(1)">→</button></div></div><div class="calendar"><div class="week">${['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM'].map(x=>`<div>${x}</div>`).join('')}</div><div class="days">${cells.map(d=>{if(!d)return '<div class="day"></div>';const ops=E.filter(e=>{let z=accDate(e[0]);return z.getFullYear()===year&&z.getMonth()===month&&z.getDate()===d});const fin=cash.filter(x=>accDate(x.date).getDate()===d);return `<div class="day"><span>${d}</span>${ops.map(e=>`<div class="evt ${e[4]}"><b>${e[1]?e[1]+' · ':''}${esc(e[2])}</b><br>${esc(e[3])}</div>`).join('')}${fin.map(x=>`<div class="evt ${x.kind==='income'?'income':'expense'} ${x.status==='condicional'?'conditional':''}"><b>${x.kind==='income'?'+':'-'}${COP(x.amount)} · ${esc(x.project)}</b><br>${esc(x.note)}</div>`).join('')}</div>`}).join('')}</div></div><div class="legend"><span class="lg income">Entrada</span><span class="lg expense">Salida</span><span class="lg conditional">Condicional</span><span class="lg">Hito operativo</span></div>`}

function accAddTab(id,label,after){if(tabs.some(x=>x[0]===id))return;const i=tabs.findIndex(x=>x[0]===after);tabs.splice(i>=0?i+1:tabs.length,0,[id,label])}
accAddTab('pipeline','Finanzas','projects');
accAddTab('costs','Costos','pipeline');
accAddTab('accounting','Contabilidad','costs');
accAddTab('cashflow','Flujo de caja','accounting');

const accOldRender=render;
render=function(){
  accApplyFinance();
  nav();
  if(tab==='summary')view.innerHTML=summary();
  else if(tab==='projects')view.innerHTML=projects();
  else if(tab==='pipeline')view.innerHTML=pipeline();
  else if(tab==='costs')view.innerHTML=costs();
  else if(tab==='accounting')view.innerHTML=accounting();
  else if(tab==='cashflow')view.innerHTML=cashflow();
  else if(tab==='calendar')view.innerHTML=calendar();
  else view.innerHTML=audit();
};

// Añade lectura de costos al modal de proyecto.
const accOpenBase=openP;
openP=function(id){
  accOpenBase(id);
  const c=ACC_COSTS[id],grid=document.querySelector('#modal .modalgrid'); if(!c||!grid)return;
  const x=id==='plazoleta'?{...c,...accPlazoletaCost(ACC_STATE.plazoletaRestaurants)}:c;
  const panel=document.createElement('div'); panel.className='panel';
  panel.innerHTML=`<span>COSTOS Y RESERVA</span><div class="pipeStats"><div><small>COSTO ESPERADO</small><b>${COP(x.expected)}</b></div><div><small>INICIAL / 2M</small><b>${COP(x.initial)}</b></div><div><small>RESERVA</small><b>${COP(x.reserve)}</b></div><div><small>YA PAGADO</small><b>${COP(c.spent||0)}</b></div></div><p>${esc(c.note)}</p>`;
  grid.prepend(panel);
};

accApplyFinance();
render();
