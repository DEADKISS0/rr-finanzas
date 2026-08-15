'use client';

import { useState, useEffect } from 'react';

type EstadoProyecto = 'planificacion' | 'activo' | 'pausado' | 'completado' | 'cancelado';
type TipoMovimiento = 'ingreso' | 'egreso';
type EstadoPago = 'pendiente' | 'programado' | 'pagado' | 'vencido';

interface Proyecto { id: string; nombre: string; cliente: string; estado: EstadoProyecto; valor_total: number; valor_pagado: number; fecha_inicio: string; fecha_fin: string; descripcion: string; servicios: string[]; }
interface Movimiento { id: string; tipo: TipoMovimiento; concepto: string; monto: number; fecha: string; categoria: string; proyecto_id: string; }
interface Pago { id: string; concepto: string; monto: number; fecha: string; estado: EstadoPago; tipo: 'ingreso' | 'egreso'; proyecto_id: string; }

// ============ DATOS REALES ============
const PROYECTOS: Proyecto[] = [
  { id: 'wunder', nombre: 'Wunder', cliente: 'Wunder', estado: 'activo', valor_total: 9000000, valor_pagado: 0, fecha_inicio: '2026-07-01', fecha_fin: '2026-12-31', descripcion: 'Marketing digital completo. Onboarding terminado.', servicios: ['Video', 'Diseño', 'Branding', 'Redes', 'Web', 'Pauta', 'SEO'] },
  { id: 'boga', nombre: 'BOGA', cliente: 'BOGA', estado: 'activo', valor_total: 1200000, valor_pagado: 0, fecha_inicio: '2026-07-15', fecha_fin: '2026-09-30', descripcion: 'Setup completo. Pago completo $1.2M el 30 agosto.', servicios: ['Branding', 'Video', 'Diseño', 'Redes', 'Web', 'Pauta', 'SEO'] },
  { id: 'zapatos', nombre: 'ZAPATOS', cliente: 'ZAPATOS', estado: 'activo', valor_total: 900000, valor_pagado: 0, fecha_inicio: '2026-08-01', fecha_fin: '2026-10-31', descripcion: 'Mismo esquema que Wunder.', servicios: ['Video', 'Diseño', 'Branding', 'Redes', 'Web', 'Pauta', 'SEO'] },
  { id: 'amsterdam1', nombre: 'AMSTERDAM #1', cliente: 'AMSTERDAM', estado: 'activo', valor_total: 2000000, valor_pagado: 0, fecha_inicio: '2026-08-01', fecha_fin: '2026-11-30', descripcion: 'Producción video y contenido.', servicios: ['Video', 'Diseño'] },
  { id: 'amsterdam2', nombre: 'AMSTERDAM #2', cliente: 'AMSTERDAM', estado: 'activo', valor_total: 2000000, valor_pagado: 0, fecha_inicio: '2026-08-01', fecha_fin: '2026-11-30', descripcion: 'Producción video y contenido.', servicios: ['Video', 'Diseño'] },
  { id: 'amsterdam3', nombre: 'AMSTERDAM #3', cliente: 'AMSTERDAM', estado: 'activo', valor_total: 2000000, valor_pagado: 0, fecha_inicio: '2026-08-01', fecha_fin: '2026-11-30', descripcion: 'Producción video y contenido.', servicios: ['Video', 'Diseño'] },
  { id: 'globos', nombre: 'GLOBOS', cliente: 'GLOBOS', estado: 'activo', valor_total: 1200000, valor_pagado: 0, fecha_inicio: '2026-08-01', fecha_fin: '2026-10-31', descripcion: 'Servicios de marketing.', servicios: ['Video', 'Diseño', 'Redes'] },
  { id: 'satiro', nombre: 'Sátiro Sushi', cliente: 'Sátiro Sushi', estado: 'activo', valor_total: 6000000, valor_pagado: 0, fecha_inicio: '2026-09-01', fecha_fin: '2027-08-31', descripcion: 'App restaurante. 30 cuotas $400K c/15 y 30.', servicios: ['Web', 'App', 'Pagos'] },
  { id: 'plazoleta', nombre: 'Plazoleta', cliente: 'Plazoleta', estado: 'planificacion', valor_total: 0, valor_pagado: 0, fecha_inicio: '2026-09-15', fecha_fin: '2026-12-31', descripcion: 'En fase de prototipo.', servicios: [] },
  { id: 'prospecto2', nombre: 'Prospecto B', cliente: 'Por definir', estado: 'planificacion', valor_total: 0, valor_pagado: 0, fecha_inicio: '2026-09-15', fecha_fin: '2026-12-31', descripcion: 'En fase de prototipo.', servicios: [] },
  { id: 'rraliados', nombre: 'RR ALIADOS (Interno)', cliente: 'RR ALIADOS', estado: 'activo', valor_total: 0, valor_pagado: 0, fecha_inicio: '2026-07-01', fecha_fin: '2026-12-31', descripcion: 'Proyecto interno.', servicios: [] },
];

const MOVIMIENTOS: Movimiento[] = [
  { id: 'mov001', tipo: 'ingreso', concepto: 'Saldo Bancolombia', monto: 3500000, fecha: '2026-08-15', categoria: 'saldo', proyecto_id: '' },
];

// ============ GENERADOR DE PAGOS ============
// Pagos se hacen los 15 y 30 de cada mes
const genPagos = (): Pago[] => {
  const pagos: Pago[] = [];
  let id = 1;
  const add = (concepto: string, monto: number, fecha: string, tipo: 'ingreso'|'egreso', proyecto: string, estado: EstadoPago = 'programado') => {
    pagos.push({ id: `p${id++}`, concepto, monto, fecha, tipo, proyecto_id: proyecto, estado });
  };

  // ============ AGOSTO 30 - PRÓXIMO PAGO ============
  add('BOGA - Pago completo', 1200000, '2026-08-30', 'ingreso', 'boga', 'pendiente');
  add('Wunder - Producción Q1 (grabación)', 746000, '2026-08-30', 'egreso', 'wunder', 'pendiente');
  add('Wunder - Desarrollo web 25%', 472500, '2026-08-30', 'egreso', 'wunder', 'pendiente');
  add('Wunder - Pauta 50%', 300000, '2026-08-30', 'egreso', 'wunder', 'pendiente');
  add('Wunder - SEO 50%', 150000, '2026-08-30', 'egreso', 'wunder', 'pendiente');
  add('Manuel - Quincena', 400000, '2026-08-30', 'egreso', '', 'pendiente');
  add('Samuel - Quincena', 200000, '2026-08-30', 'egreso', '', 'pendiente');

  // ============ SEP-DIC 2026 + ENE-FEB 2027 ============
  // Sátiro Sushi: 30 cuotas de $400K cada 15 y 30 desde Sep 15
  const satiroCuotas = [
    '2026-09-15','2026-09-30','2026-10-15','2026-10-30','2026-11-15','2026-11-30',
    '2026-12-15','2026-12-30','2027-01-15','2027-01-30','2027-02-15','2027-02-28',
    '2027-03-15','2027-03-30','2027-04-15','2027-04-30','2027-05-15','2027-05-30',
    '2027-06-15','2027-06-30','2027-07-15','2027-07-30','2027-08-15','2027-08-30',
    '2027-09-15','2027-09-30','2027-10-15','2027-10-30','2027-11-15','2027-11-30'
  ];
  satiroCuotas.forEach((f, i) => add(`Sátiro - Cuota ${i+1}/30`, 400000, f, 'ingreso', 'satiro'));

  // Fechas de quincenas Ago 2026 - Feb 2027
  const quincenas = [
    '2026-09-15','2026-09-30','2026-10-15','2026-10-30','2026-11-15','2026-11-30',
    '2026-12-15','2026-12-30','2027-01-15','2027-01-30','2027-02-15','2027-02-28'
  ];

  // Wunder: producción $746K + web $472.5K cada quincena (Sep-Dic)
  const wunderFechas = quincenas.filter(f => f.startsWith('2026'));
  wunderFechas.forEach(f => {
    add('Wunder - Producción', 746000, f, 'egreso', 'wunder');
    add('Wunder - Desarrollo web', 472500, f, 'egreso', 'wunder');
    add('Wunder - Pauta', 300000, f, 'egreso', 'wunder');
    add('Wunder - SEO', 150000, f, 'egreso', 'wunder');
  });

  // ZAPATOS: Sep 15 - Oct 30 (4 quincenas)
  const zapatosFechas = ['2026-09-15','2026-09-30','2026-10-15','2026-10-30'];
  zapatosFechas.forEach((f,i) => {
    if (i < 2) {
      add('ZAPATOS - Producción', 300000, f, 'egreso', 'zapatos');
      add('ZAPATOS - Web', 150000, f, 'egreso', 'zapatos');
      add('ZAPATOS - Pauta', 150000, f, 'egreso', 'zapatos');
    } else {
      add('ZAPATOS - Producción', 300000, f, 'egreso', 'zapatos');
    }
  });

  // AMSTERDAM #1-3: adelantos Sep 15, producción cada quincena Sep-Dic
  const amsterdamFechas = quincenas.filter(f => f.startsWith('2026'));
  ['amsterdam1','amsterdam2','amsterdam3'].forEach(proj => {
    const num = proj.replace('amsterdam','');
    add(`AMSTERDAM #${num} - Adelanto`, 1000000, '2026-09-15', 'ingreso', proj);
    amsterdamFechas.forEach(f => add(`AMSTERDAM #${num} - Producción`, 500000, f, 'egreso', proj));
  });

  // GLOBOS: adelanto Sep 15, producción cada quincena Sep-Oct
  add('GLOBOS - Adelanto', 600000, '2026-09-15', 'ingreso', 'globos');
  ['2026-09-15','2026-09-30','2026-10-15','2026-10-30'].forEach(f => add('GLOBOS - Producción', 300000, f, 'egreso', 'globos'));

  // Sátiro desarrollo: $500K cada quincena Sep-Feb
  quincenas.forEach(f => add('Sátiro - Desarrollo', 500000, f, 'egreso', 'satiro'));

  // Personal: cada quincena
  quincenas.forEach(f => {
    add('Manuel - Quincena', 400000, f, 'egreso', '');
    add('Samuel - Quincena', 200000, f, 'egreso', '');
  });

  return pagos;
};

const PAGOS = genPagos();

// ============ STORAGE ============
const STORAGE_KEY = 'rr-v6';
interface AppState { proyectos: Proyecto[]; movimientos: Movimiento[]; pagos: Pago[]; }
const loadState = (): AppState => {
  if (typeof window === 'undefined') return { proyectos: PROYECTOS, movimientos: MOVIMIENTOS, pagos: PAGOS };
  const s = localStorage.getItem(STORAGE_KEY);
  if (s) try { return JSON.parse(s); } catch {}
  return { proyectos: PROYECTOS, movimientos: MOVIMIENTOS, pagos: PAGOS };
};
const saveState = (s: AppState) => { if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); };

const fmt = (v: number) => '$' + Number(v||0).toLocaleString('es-CO', {maximumFractionDigits:0});
const fmtDate = (d: string) => {
  if (!d) return '--';
  try { return new Date(d+'T00:00:00').toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'2-digit'}); } catch { return d; }
};
const fmtShort = (d: string) => {
  if (!d) return '';
  try { return new Date(d+'T00:00:00').toLocaleDateString('es-CO',{day:'numeric',month:'short'}); } catch { return ''; }
};
const genId = () => Math.random().toString(36).substr(2,9);

export default function Dashboard() {
  const [state, setState] = useState<AppState>({proyectos:[],movimientos:[],pagos:[]});
  const [tab, setTab] = useState<'resumen'|'proyectos'|'movimientos'|'pagos'|'calendario'|'brechas'>('resumen');
  const [modal, setModal] = useState<string|null>(null);
  const [editId, setEditId] = useState<string|null>(null);
  const [dark, setDark] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [fProyecto, setFP] = useState<Partial<Proyecto>>({});
  const [fMov, setFM] = useState<Partial<Movimiento>>({});
  const [fPago, setFPago] = useState<Partial<Pago>>({});

  useEffect(() => { setState(loadState()); setLoaded(true); }, []);
  const save = (n: Partial<AppState>) => { const u = {...state,...n}; setState(u); saveState(u); };
  const openModal = (t: string, item?: Proyecto|Movimiento|Pago) => {
    setModal(t);
    if (item) { setEditId(item.id); if (t==='proyecto') setFP(item as Proyecto); if (t==='movimiento') setFM(item as Movimiento); if (t==='pago') setFPago(item as Pago); }
    else { setEditId(null); if (t==='proyecto') setFP({estado:'activo',servicios:[]}); if (t==='movimiento') setFM({tipo:'egreso',fecha:new Date().toISOString().split('T')[0]}); if (t==='pago') setFPago({tipo:'egreso',estado:'pendiente',fecha:new Date().toISOString().split('T')[0]}); }
  };
  const closeModal = () => { setModal(null); setEditId(null); };
  const saveItem = () => {
    if (modal==='proyecto') { const p={...fProyecto,id:editId||'p_'+genId()} as Proyecto; save({proyectos:editId?state.proyectos.map(x=>x.id===editId?p:x):[...state.proyectos,p]}); }
    if (modal==='movimiento') { const m={...fMov,id:editId||'m_'+genId()} as Movimiento; save({movimientos:editId?state.movimientos.map(x=>x.id===editId?m:x):[...state.movimientos,m]}); }
    if (modal==='pago') { const p={...fPago,id:editId||'pa_'+genId()} as Pago; save({pagos:editId?state.pagos.map(x=>x.id===editId?p:x):[...state.pagos,p]}); }
    closeModal();
  };
  const del = (t:'proyectos'|'movimientos'|'pagos',id:string) => { if (confirm('¿Eliminar?')) save({[t]:state[t].filter((x:Proyecto|Movimiento|Pago)=>x.id!==id)}); };
  const markPagado = (id:string) => save({pagos:state.pagos.map(p=>p.id===id?{...p,estado:'pagado' as EstadoPago}:p)});

  const hoy = new Date();
  const disp = state.movimientos.filter(m=>m.tipo==='ingreso').reduce((s,m)=>s+m.monto,0);
  const burn = 500000;
  const runway = disp > 0 ? Math.round((disp/burn)*10)/10 : 0;

  // Proyección 6 meses
  const meses: {mes:string;ing:number;egr:number;saldo:number;brecha:boolean}[] = [];
  let sal = disp;
  for (let i=0;i<6;i++) {
    const f = new Date(hoy.getFullYear(),hoy.getMonth()+i,1);
    const fm = new Date(hoy.getFullYear(),hoy.getMonth()+i+1,0);
    const pm = state.pagos.filter(p=>{const d=new Date(p.fecha);return d>=f&&d<=fm&&p.estado!=='pagado';});
    const ing = pm.filter(p=>p.tipo==='ingreso').reduce((s,p)=>s+p.monto,0);
    const egr = pm.filter(p=>p.tipo==='egreso').reduce((s,p)=>s+p.monto,0);
    sal += ing - egr;
    meses.push({mes:f.toLocaleDateString('es-CO',{month:'short',year:'2-digit'}),ing,egr,saldo:sal,brecha:sal<0});
  }

  // Próximos pagos (ordenados por fecha)
  const pagosProx = state.pagos.filter(p=>p.estado!=='pagado').sort((a,b)=>new Date(a.fecha).getTime()-new Date(b.fecha).getTime()).slice(0,20);

  // Calendario: generar grid de Ago-Dic 2026
  const calendarData = [8,9,10,11,12].map(mes => {
    const nombre = new Date(2026,mes-1).toLocaleDateString('es-CO',{month:'long'});
    const diasDelMes = new Date(2026,mes,0).getDate();
    const dias: {dia:number;pagos:Pago[]}[] = [];
    for (let d=1;d<=diasDelMes;d++) {
      const pagosDia = state.pagos.filter(p=>{
        const fecha = new Date(p.fecha);
        return fecha.getDate()===d && fecha.getMonth()+1===mes && fecha.getFullYear()===2026 && p.estado!=='pagado';
      });
      if (pagosDia.length > 0) dias.push({dia:d,pagos:pagosDia});
    }
    const totalIng = dias.reduce((s,d)=>s+d.pagos.filter(p=>p.tipo==='ingreso').reduce((s,p)=>s+p.monto,0),0);
    const totalEgr = dias.reduce((s,d)=>s+d.pagos.filter(p=>p.tipo==='egreso').reduce((s,p)=>s+p.monto,0),0);
    return {mes,nombre,dias,totalIng,totalEgr};
  });

  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(state.proyectos.map(p=>({Proyecto:p.nombre,Cliente:p.cliente,Estado:p.estado,'Valor Total':p.valor_total,Pagado:p.valor_pagado,Pendiente:p.valor_total-p.valor_pagado}))), 'Proyectos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(state.movimientos.map(m=>({Fecha:m.fecha,Tipo:m.tipo,Concepto:m.concepto,Monto:m.tipo==='ingreso'?m.monto:-m.monto}))), 'Movimientos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(state.pagos.map(p=>({Concepto:p.concepto,Tipo:p.tipo,Monto:p.monto,Fecha:p.fecha,Estado:p.estado,Proyecto:p.proyecto_id}))), 'Pagos');
    XLSX.writeFile(wb, `RR_Finanzas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (!loaded) return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const bg = dark?'bg-[#0a0a0f]':'bg-gray-50';
  const card = dark?'bg-[#12121a]':'bg-white';
  const bd = dark?'border-white/[0.06]':'border-gray-200';
  const t = dark?'text-white':'text-gray-900';
  const t2 = dark?'text-gray-400':'text-gray-500';
  const t3 = dark?'text-gray-600':'text-gray-400';
  const inp = dark?'bg-white/5 border-white/10 text-white':'bg-gray-50 border-gray-200 text-gray-900';

  const Input = ({l,v,on,tp='text'}:{l:string;v:string|number;on:(v:string)=>void;tp?:string}) => (
    <div><label className={`text-xs font-medium ${t2} mb-1.5 block`}>{l}</label><input type={tp} value={v||''} onChange={e=>on(e.target.value)} className={`w-full px-3 py-2.5 rounded-lg text-sm ${inp} border focus:border-red-500 focus:ring-1 focus:ring-red-500/20 outline-none`}/></div>
  );
  const Select = ({l,v,on,opts}:{l:string;v:string;on:(v:string)=>void;opts:{v:string;l:string}[]}) => (
    <div><label className={`text-xs font-medium ${t2} mb-1.5 block`}>{l}</label><select value={v} onChange={e=>on(e.target.value)} className={`w-full px-3 py-2.5 rounded-lg text-sm ${inp} border focus:border-red-500 outline-none`}>{opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
  );

  return (
    <div className={`min-h-screen ${bg}`}>
      {/* HEADER */}
      <header className={`border-b ${bd} ${dark?'bg-[#0a0a0f]/90':'bg-white/90'} backdrop-blur-xl sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="RR" className="w-9 h-9 rounded-lg"/>
            <div><h1 className={`text-sm font-bold ${t}`}>RR ALIADOS</h1><p className={`text-[10px] ${t3}`}>Control Financiero</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportExcel} className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white btn-press shadow-lg shadow-green-500/20">Exportar Excel</button>
            <button onClick={()=>setDark(!dark)} className={`p-2.5 rounded-xl btn-press ${dark?'bg-white/5':'bg-gray-100'}`}>{dark?'☀️':'🌙'}</button>
          </div>
        </div>
      </header>

      {/* TABS */}
      <div className={`border-b ${bd} sticky top-[53px] z-30 glass ${dark?'bg-[#0a0a0f]/80':'bg-white/80'}`}>
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {([['resumen','Resumen'],['proyectos','Proyectos'],['movimientos','Movimientos'],['pagos','Pagos'],['calendario','Calendario'],['brechas','Brechas']] as [string,string][]).map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k as typeof tab)} className={`px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap tab-indicator ${tab===k?'active text-red-400':`border-transparent ${t2} hover:${t}`}`}>{l}</button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* ============ RESUMEN ============ */}
        {tab==='resumen' && <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className={`${card} border ${bd} rounded-2xl p-5 card-hover animate-fadeInUp stagger-1`}><p className={`text-[10px] uppercase tracking-widest ${t3} mb-2`}>Disponible</p><p className={`text-2xl font-bold ${t}`}>{fmt(disp)}</p><p className={`text-xs ${t3}`}>Bancolombia</p></div>
            <div className={`${card} border ${bd} rounded-2xl p-5 card-hover animate-fadeInUp stagger-2`}><p className={`text-[10px] uppercase tracking-widest ${t3} mb-2`}>Runway</p><p className={`text-2xl font-bold ${runway>=8?'text-green-400':runway>=4?'text-yellow-400':'text-red-400'}`}>{runway} meses</p><p className={`text-xs ${t3}`}>Burn {fmt(burn)}/mes</p></div>
            <div className={`${card} border ${bd} rounded-2xl p-5 card-hover animate-fadeInUp stagger-3`}><p className={`text-[10px] uppercase tracking-widest ${t3} mb-2`}>Proyectos Activos</p><p className={`text-2xl font-bold ${t}`}>{state.proyectos.filter(p=>p.estado==='activo').length}</p></div>
            <div className={`${card} border ${bd} rounded-2xl p-5 card-hover animate-fadeInUp stagger-4`}><p className={`text-[10px] uppercase tracking-widest ${t3} mb-2`}>Pagos Pendientes</p><p className={`text-2xl font-bold ${t}`}>{state.pagos.filter(p=>p.estado!=='pagado').length}</p></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={`${card} border ${bd} rounded-2xl overflow-hidden`}>
              <div className={`p-4 border-b ${bd}`}><h3 className={`text-sm font-semibold ${t}`}>Próximos Pagos</h3></div>
              <div className="max-h-96 overflow-y-auto divide-y divide-white/[0.04]">
                {pagosProx.map(p=>{
                  const dias=Math.ceil((new Date(p.fecha).getTime()-Date.now())/86400000);
                  return(
                    <div key={p.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                      <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${dias<0?'bg-red-500/10':dias<=7?'bg-yellow-500/10':'bg-blue-500/10'}`}>
                        <span className={`text-sm font-bold ${dias<0?'text-red-400':dias<=7?'text-yellow-400':'text-blue-400'}`}>{new Date(p.fecha).getDate()}</span>
                        <span className={`text-[8px] ${t3}`}>{new Date(p.fecha).toLocaleDateString('es-CO',{month:'short'})}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${t} truncate`}>{p.concepto}</p>
                        <p className={`text-[10px] ${dias<0?'text-red-400':t3}`}>{dias<0?`Vencido ${-dias} días`:`En ${dias} días`}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-xs font-bold ${p.tipo==='ingreso'?'text-green-400':'text-red-400'}`}>{p.tipo==='ingreso'?'+':'-'}{fmt(p.monto)}</p>
                        <p className={`text-[9px] ${t3}`}>{fmtShort(p.fecha)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={`${card} border ${bd} rounded-2xl overflow-hidden`}>
              <div className={`p-4 border-b ${bd}`}><h3 className={`text-sm font-semibold ${t}`}>Últimos Movimientos</h3></div>
              <div className="max-h-96 overflow-y-auto divide-y divide-white/[0.04]">
                {state.movimientos.slice(-10).reverse().map(m=>(
                  <div key={m.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${m.tipo==='ingreso'?'bg-green-500/10 text-green-400':'bg-red-500/10 text-red-400'}`}>{m.tipo==='ingreso'?'↑':'↓'}</div>
                    <div className="flex-1"><p className={`text-xs font-medium ${t}`}>{m.concepto}</p><p className={`text-[10px] ${t3}`}>{fmtDate(m.fecha)}</p></div>
                    <span className={`text-xs font-bold ${m.tipo==='ingreso'?'text-green-400':'text-red-400'}`}>{m.tipo==='ingreso'?'+':'-'}{fmt(m.monto)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>}

        {/* ============ PROYECTOS ============ */}
        {tab==='proyectos' && <>
          <div className="flex justify-between items-center mb-6"><h2 className={`text-lg font-bold ${t}`}>Proyectos</h2><button onClick={()=>openModal('proyecto')} className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white btn-press shadow-lg shadow-red-500/20">+ Nuevo Proyecto</button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {state.proyectos.map(p=>(
              <div key={p.id} className={`${card} border ${bd} rounded-2xl p-6 card-hover`}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h3 className={`text-sm font-semibold ${t} truncate`}>{p.nombre}</h3>
                    <p className={`text-xs ${t3} mt-0.5`}>{p.cliente}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap flex-shrink-0 ${p.estado==='activo'?'bg-green-500/10 text-green-400 border border-green-500/20':p.estado==='planificacion'?'bg-blue-500/10 text-blue-400 border border-blue-500/20':'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>{p.estado}</span>
                </div>
                <p className={`text-xs ${t2} mb-4 leading-relaxed`}>{p.descripcion}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs"><span className={t3}>Valor Total</span><span className={`font-medium ${t}`}>{fmt(p.valor_total)}</span></div>
                  <div className="flex justify-between text-xs"><span className={t3}>Pagado</span><span className="font-medium text-green-400">{fmt(p.valor_pagado)}</span></div>
                  <div className="flex justify-between text-xs"><span className={t3}>Pendiente</span><span className="font-medium text-yellow-400">{fmt(p.valor_total-p.valor_pagado)}</span></div>
                </div>
                {p.valor_total > 0 && <div className="w-full bg-white/5 rounded-full h-2 mb-4"><div className="bg-green-500 h-2 rounded-full progress-bar" style={{width:`${(p.valor_pagado/p.valor_total)*100}%`}}></div></div>}
                {p.servicios.length > 0 && <div className="flex flex-wrap gap-1.5 mb-4">{p.servicios.map(s=><span key={s} className={`px-2 py-0.5 rounded-md text-[9px] font-medium ${dark?'bg-white/5 text-gray-400':'bg-gray-100 text-gray-600'}`}>{s}</span>)}</div>}
                <div className="flex gap-2 pt-2 border-t ${bd}">
                  <button onClick={()=>openModal('proyecto',p)} className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium btn-press ${dark?'bg-white/5 hover:bg-white/10':'bg-gray-100 hover:bg-gray-200'} ${t2}`}>Editar</button>
                  <button onClick={()=>del('proyectos',p.id)} className="px-3 py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 btn-press">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* ============ MOVIMIENTOS ============ */}
        {tab==='movimientos' && <>
          <div className="flex justify-between items-center mb-6"><h2 className={`text-lg font-bold ${t}`}>Movimientos</h2><button onClick={()=>openModal('movimiento')} className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white btn-press shadow-lg shadow-red-500/20">+ Nuevo Movimiento</button></div>
          <div className={`${card} border ${bd} rounded-2xl overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full"><thead><tr className={`border-b ${bd}`}>
                <th className={`text-left px-5 py-3.5 text-[10px] uppercase tracking-wider font-semibold ${t3}`}>Fecha</th>
                <th className={`text-left px-5 py-3.5 text-[10px] uppercase tracking-wider font-semibold ${t3}`}>Tipo</th>
                <th className={`text-left px-5 py-3.5 text-[10px] uppercase tracking-wider font-semibold ${t3}`}>Concepto</th>
                <th className={`text-right px-5 py-3.5 text-[10px] uppercase tracking-wider font-semibold ${t3}`}>Monto</th>
                <th className={`text-right px-5 py-3.5 text-[10px] uppercase tracking-wider font-semibold ${t3}`}>Acciones</th>
              </tr></thead><tbody className="divide-y divide-white/[0.04]">
                {state.movimientos.slice().reverse().map(m=>(
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className={`px-5 py-3.5 text-xs ${t2}`}>{fmtDate(m.fecha)}</td>
                    <td className="px-5 py-3.5"><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${m.tipo==='ingreso'?'bg-green-500/10 text-green-400':'bg-red-500/10 text-red-400'}`}>{m.tipo}</span></td>
                    <td className={`px-5 py-3.5 text-xs font-medium ${t}`}>{m.concepto}</td>
                    <td className={`px-5 py-3.5 text-xs font-bold text-right ${m.tipo==='ingreso'?'text-green-400':'text-red-400'}`}>{m.tipo==='ingreso'?'+':'-'}{fmt(m.monto)}</td>
                    <td className="px-5 py-3.5 text-right"><button onClick={()=>openModal('movimiento',m)} className={`text-xs ${t3} hover:${t} transition-colors`}>Editar</button></td>
                  </tr>
                ))}
              </tbody></table>
            </div>
          </div>
        </>}

        {/* ============ PAGOS ============ */}
        {tab==='pagos' && <>
          <div className="flex justify-between items-center mb-6"><h2 className={`text-lg font-bold ${t}`}>Pagos Programados</h2><button onClick={()=>openModal('pago')} className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white btn-press shadow-lg shadow-red-500/20">+ Nuevo Pago</button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.pagos.sort((a,b)=>new Date(a.fecha).getTime()-new Date(b.fecha).getTime()).map(p=>{
              const v = p.estado!=='pagado' && new Date(p.fecha)<hoy;
              return(
                <div key={p.id} className={`${card} border ${v?'border-red-500/30':bd} rounded-2xl p-5 card-hover`}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className={`text-sm font-medium ${t} leading-tight`}>{p.concepto}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap flex-shrink-0 ${p.estado==='pagado'?'bg-green-500/10 text-green-400':v?'bg-red-500/10 text-red-400':'bg-yellow-500/10 text-yellow-400'}`}>{v?'vencido':p.estado}</span>
                  </div>
                  <p className={`text-xl font-bold ${p.tipo==='ingreso'?'text-green-400':'text-red-400'} mb-1`}>{p.tipo==='ingreso'?'+':'-'}{fmt(p.monto)}</p>
                  <p className={`text-xs ${t3} mb-4`}>{fmtDate(p.fecha)}</p>
                  <div className="flex gap-2">
                    {p.estado!=='pagado' && <button onClick={()=>markPagado(p.id)} className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 btn-press">Marcar Pagado</button>}
                    <button onClick={()=>openModal('pago',p)} className={`px-3 py-2 rounded-lg text-xs font-medium btn-press ${dark?'bg-white/5':'bg-gray-100'} ${t2}`}>Editar</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>}

        {/* ============ CALENDARIO ============ */}
        {tab==='calendario' && <>
          <h2 className={`text-lg font-bold ${t} mb-2`}>Calendario de Pagos</h2>
          <p className={`text-xs ${t3} mb-6`}>Todos los pagos programados · Ago-Dic 2026</p>
          <div className="space-y-8">
            {calendarData.map(cm => (
              <div key={cm.mes} className={`${card} border ${bd} rounded-2xl overflow-hidden`}>
                <div className={`p-5 border-b ${bd} flex justify-between items-center`}>
                  <h3 className={`text-base font-semibold capitalize ${t}`}>{cm.nombre} 2026</h3>
                  <div className="flex gap-6 text-xs">
                    <span className="text-green-400 font-medium">+{fmt(cm.totalIng)}</span>
                    <span className="text-red-400 font-medium">-{fmt(cm.totalEgr)}</span>
                    <span className={`font-bold ${cm.totalIng-cm.totalEgr>=0?'text-green-400':'text-red-400'}`}>Neto {fmt(cm.totalIng-cm.totalEgr)}</span>
                  </div>
                </div>
                {/* Grid calendario */}
                <div className="p-4">
                  {/* Encabezados días semana */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d=>(
                      <div key={d} className={`text-center text-[10px] font-semibold ${t3} py-1`}>{d}</div>
                    ))}
                  </div>
                  {/* Días del mes */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Espacios vacíos para alinear primer día */}
                    {Array.from({length: new Date(2026,cm.mes-1,1).getDay() === 0 ? 6 : new Date(2026,cm.mes-1,1).getDay()-1}, (_,i)=>(
                      <div key={`empty-${i}`} className="min-h-[80px]"></div>
                    ))}
                    {/* Días del mes */}
                    {Array.from({length: new Date(2026,cm.mes,0).getDate()}, (_,i)=>i+1).map(dia => {
                      const pagosDia = state.pagos.filter(p=>{
                        const f = new Date(p.fecha);
                        return f.getDate()===dia && f.getMonth()+1===cm.mes && f.getFullYear()===2026 && p.estado!=='pagado';
                      });
                      const totalDia = pagosDia.reduce((s,p)=>s+(p.tipo==='ingreso'?p.monto:-p.monto),0);
                      const esHoy = hoy.getDate()===dia && hoy.getMonth()+1===cm.mes;
                      const es15o30 = dia===15 || dia===30 || dia===new Date(2026,cm.mes,0).getDate();
                      return(
                        <div key={dia} className={`min-h-[80px] rounded-lg border p-1.5 transition-all ${esHoy?'border-red-500 bg-red-500/5':pagosDia.length>0?dark?'border-white/10 bg-white/[0.02]':'border-gray-200 bg-gray-50':dark?'border-white/[0.04]':'border-gray-100'} ${es15o30?'ring-1 ring-red-500/20':''}`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-xs font-semibold ${esHoy?'text-red-400':t} ${es15o30?'text-red-400':''}`}>{dia}</span>
                            {pagosDia.length > 0 && <span className={`text-[9px] font-bold ${totalDia>=0?'text-green-400':'text-red-400'}`}>{totalDia>=0?'+':''}{fmt(totalDia)}</span>}
                          </div>
                          <div className="space-y-0.5">
                            {pagosDia.slice(0,3).map(p=>(
                              <div key={p.id} className={`text-[8px] truncate px-1 py-0.5 rounded ${p.tipo==='ingreso'?'bg-green-500/10 text-green-400':'bg-red-500/10 text-red-400'}`} title={`${p.concepto}: ${fmt(p.monto)}`}>
                                {p.concepto.split(' - ')[0]}
                              </div>
                            ))}
                            {pagosDia.length > 3 && <div className={`text-[8px] ${t3} text-center`}>+{pagosDia.length-3} más</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* ============ BRECHAS ============ */}
        {tab==='brechas' && <>
          <h2 className={`text-lg font-bold ${t} mb-2`}>Proyección 6 Meses</h2>
          <p className={`text-xs ${t3} mb-6`}>Análisis de brechas de liquidez</p>
          <div className={`${card} border ${bd} rounded-2xl p-6 mb-6`}>
            <div className="flex items-center gap-6 mb-5">
              <div className={`text-5xl font-bold ${runway>=8?'text-green-400':runway>=4?'text-yellow-400':'text-red-400'}`}>{runway}</div>
              <div><p className={`text-base font-semibold ${t}`}>Meses de Runway</p><p className={`text-sm ${t3}`}>Disponible: {fmt(disp)} · Burn: {fmt(burn)}/mes</p></div>
            </div>
            <div className={`w-full h-5 rounded-full ${dark?'bg-white/5':'bg-gray-100'}`}><div className={`h-5 rounded-full transition-all duration-1000 ${runway>=8?'bg-green-500':runway>=4?'bg-yellow-500':'bg-red-500'}`} style={{width:`${Math.min(runway/12*100,100)}%`}}></div></div>
            <div className="flex justify-between mt-2 text-[10px]"><span className={t3}>0</span><span className={t3}>3</span><span className={t3}>6</span><span className={t3}>9</span><span className={t3}>12</span></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {meses.map((m,i)=>(
              <div key={i} className={`${card} border ${m.brecha?'border-red-500/30':bd} rounded-2xl p-6 card-hover`}>
                <div className="flex justify-between items-start mb-4"><h3 className={`text-sm font-semibold capitalize ${t}`}>{m.mes}</h3>{m.brecha && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">BRECHA</span>}</div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs"><span className={t3}>Ingresos</span><span className="text-green-400 font-medium">+{fmt(m.ing)}</span></div>
                  <div className="flex justify-between text-xs"><span className={t3}>Egresos</span><span className="text-red-400 font-medium">-{fmt(m.egr)}</span></div>
                  <div className={`flex justify-between text-xs pt-3 border-t ${bd}`}><span className={`font-semibold ${t}`}>Neto</span><span className={`font-bold ${m.ing-m.egr>=0?'text-green-400':'text-red-400'}`}>{fmt(m.ing-m.egr)}</span></div>
                  <div className={`flex justify-between text-sm pt-3 border-t ${bd}`}><span className={`font-bold ${t}`}>Saldo</span><span className={`font-bold ${m.saldo>=0?'text-green-400':'text-red-400'}`}>{fmt(m.saldo)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </>}
      </main>

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className={`${card} border ${bd} rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto modal-content shadow-2xl`}>
            <div className={`p-6 border-b ${bd} flex justify-between items-center`}><h3 className={`text-sm font-bold ${t}`}>{editId?'Editar':'Nuevo'} {modal==='proyecto'?'Proyecto':modal==='movimiento'?'Movimiento':'Pago'}</h3><button onClick={closeModal} className={`w-8 h-8 rounded-lg flex items-center justify-center ${dark?'bg-white/5 hover:bg-white/10':'bg-gray-100 hover:bg-gray-200'} ${t2} transition-colors`}>✕</button></div>
            <div className="p-6 space-y-5">
              {modal==='proyecto' && <>
                <Input l="Nombre" v={fProyecto.nombre||''} on={v=>setFP({...fProyecto,nombre:v})}/>
                <Input l="Cliente" v={fProyecto.cliente||''} on={v=>setFP({...fProyecto,cliente:v})}/>
                <div className="grid grid-cols-2 gap-4">
                  <Select l="Estado" v={fProyecto.estado||'activo'} on={v=>setFP({...fProyecto,estado:v as EstadoProyecto})} opts={[{v:'planificacion',l:'Planificación'},{v:'activo',l:'Activo'},{v:'pausado',l:'Pausado'},{v:'completado',l:'Completado'}]}/>
                  <Input l="Valor Total" v={fProyecto.valor_total||''} on={v=>setFP({...fProyecto,valor_total:Number(v)})} tp="number"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input l="Fecha Inicio" v={fProyecto.fecha_inicio||''} on={v=>setFP({...fProyecto,fecha_inicio:v})} tp="date"/>
                  <Input l="Fecha Fin" v={fProyecto.fecha_fin||''} on={v=>setFP({...fProyecto,fecha_fin:v})} tp="date"/>
                </div>
                <Input l="Descripción" v={fProyecto.descripcion||''} on={v=>setFP({...fProyecto,descripcion:v})}/>
              </>}
              {modal==='movimiento' && <>
                <div className="grid grid-cols-2 gap-4">
                  <Select l="Tipo" v={fMov.tipo||'egreso'} on={v=>setFM({...fMov,tipo:v as TipoMovimiento})} opts={[{v:'ingreso',l:'Ingreso'},{v:'egreso',l:'Egreso'}]}/>
                  <Input l="Monto" v={fMov.monto||''} on={v=>setFM({...fMov,monto:Number(v)})} tp="number"/>
                </div>
                <Input l="Concepto" v={fMov.concepto||''} on={v=>setFM({...fMov,concepto:v})}/>
                <Input l="Fecha" v={fMov.fecha||''} on={v=>setFM({...fMov,fecha:v})} tp="date"/>
              </>}
              {modal==='pago' && <>
                <Input l="Concepto" v={fPago.concepto||''} on={v=>setFPago({...fPago,concepto:v})}/>
                <div className="grid grid-cols-2 gap-4">
                  <Select l="Tipo" v={fPago.tipo||'egreso'} on={v=>setFPago({...fPago,tipo:v as 'ingreso'|'egreso'})} opts={[{v:'ingreso',l:'Ingreso'},{v:'egreso',l:'Egreso'}]}/>
                  <Input l="Monto" v={fPago.monto||''} on={v=>setFPago({...fPago,monto:Number(v)})} tp="number"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input l="Fecha" v={fPago.fecha||''} on={v=>setFPago({...fPago,fecha:v})} tp="date"/>
                  <Select l="Estado" v={fPago.estado||'pendiente'} on={v=>setFPago({...fPago,estado:v as EstadoPago})} opts={[{v:'pendiente',l:'Pendiente'},{v:'programado',l:'Programado'},{v:'pagado',l:'Pagado'}]}/>
                </div>
                <Select l="Proyecto" v={fPago.proyecto_id||''} on={v=>setFPago({...fPago,proyecto_id:v})} opts={[{v:'',l:'Sin proyecto'},...state.proyectos.map(p=>({v:p.id,l:p.nombre}))]}/>
              </>}
              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium btn-press ${dark?'bg-white/5 hover:bg-white/10':'bg-gray-100 hover:bg-gray-200'} ${t2} transition-colors`}>Cancelar</button>
                <button onClick={saveItem} className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white btn-press shadow-lg shadow-red-500/20 hover:from-red-600 hover:to-red-700 transition-all">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}