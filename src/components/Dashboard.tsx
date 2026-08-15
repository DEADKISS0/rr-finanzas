'use client';

import { useState, useEffect } from 'react';

type EstadoProyecto = 'planificacion' | 'activo' | 'pausado' | 'completado' | 'cancelado';
type TipoMovimiento = 'ingreso' | 'egreso';
type EstadoPago = 'pendiente' | 'programado' | 'pagado' | 'vencido';
type VistaCalendario = 'grid' | 'lista';

interface Proyecto { id: string; nombre: string; cliente: string; estado: EstadoProyecto; valor_total: number; valor_pagado: number; fecha_inicio: string; fecha_fin: string; descripcion: string; servicios: string[]; }
interface Movimiento { id: string; tipo: TipoMovimiento; concepto: string; monto: number; fecha: string; categoria: string; proyecto_id: string; }
interface Pago { id: string; concepto: string; monto: number; fecha: string; estado: EstadoPago; tipo: 'ingreso' | 'egreso'; proyecto_id: string; }

// Helper: crear fecha sin problemas de timezone
const fecha = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

const PROYECTOS: Proyecto[] = [
  { id: 'wunder', nombre: 'Wunder', cliente: 'Wunder', estado: 'activo', valor_total: 9000000, valor_pagado: 0, fecha_inicio: fecha(2026,7,1), fecha_fin: fecha(2026,12,31), descripcion: 'Marketing digital completo. Onboarding terminado.', servicios: ['Video', 'Diseño', 'Branding', 'Redes', 'Web', 'Pauta', 'SEO'] },
  { id: 'boga', nombre: 'BOGA', cliente: 'BOGA', estado: 'activo', valor_total: 1200000, valor_pagado: 0, fecha_inicio: fecha(2026,7,15), fecha_fin: fecha(2026,9,30), descripcion: 'Setup completo. Pago completo $1.2M el 30 agosto.', servicios: ['Branding', 'Video', 'Diseño', 'Redes', 'Web', 'Pauta', 'SEO'] },
  { id: 'zapatos', nombre: 'ZAPATOS', cliente: 'ZAPATOS', estado: 'activo', valor_total: 900000, valor_pagado: 0, fecha_inicio: fecha(2026,8,1), fecha_fin: fecha(2026,10,31), descripcion: 'Mismo esquema que Wunder.', servicios: ['Video', 'Diseño', 'Branding', 'Redes', 'Web', 'Pauta', 'SEO'] },
  { id: 'amsterdam1', nombre: 'AMSTERDAM #1', cliente: 'AMSTERDAM', estado: 'activo', valor_total: 2000000, valor_pagado: 0, fecha_inicio: fecha(2026,8,1), fecha_fin: fecha(2026,11,30), descripcion: 'Producción video y contenido.', servicios: ['Video', 'Diseño'] },
  { id: 'amsterdam2', nombre: 'AMSTERDAM #2', cliente: 'AMSTERDAM', estado: 'activo', valor_total: 2000000, valor_pagado: 0, fecha_inicio: fecha(2026,8,1), fecha_fin: fecha(2026,11,30), descripcion: 'Producción video y contenido.', servicios: ['Video', 'Diseño'] },
  { id: 'amsterdam3', nombre: 'AMSTERDAM #3', cliente: 'AMSTERDAM', estado: 'activo', valor_total: 2000000, valor_pagado: 0, fecha_inicio: fecha(2026,8,1), fecha_fin: fecha(2026,11,30), descripcion: 'Producción video y contenido.', servicios: ['Video', 'Diseño'] },
  { id: 'globos', nombre: 'GLOBOS', cliente: 'GLOBOS', estado: 'activo', valor_total: 1200000, valor_pagado: 0, fecha_inicio: fecha(2026,8,1), fecha_fin: fecha(2026,10,31), descripcion: 'Servicios de marketing.', servicios: ['Video', 'Diseño', 'Redes'] },
  { id: 'satiro', nombre: 'Sátiro Sushi', cliente: 'Sátiro Sushi', estado: 'activo', valor_total: 6000000, valor_pagado: 0, fecha_inicio: fecha(2026,9,1), fecha_fin: fecha(2027,8,31), descripcion: 'App restaurante. 30 cuotas $400K c/15 y 30.', servicios: ['Web', 'App', 'Pagos'] },
  { id: 'plazoleta', nombre: 'Plazoleta', cliente: 'Plazoleta', estado: 'planificacion', valor_total: 0, valor_pagado: 0, fecha_inicio: fecha(2026,9,15), fecha_fin: fecha(2026,12,31), descripcion: 'En fase de prototipo.', servicios: [] },
  { id: 'prospecto2', nombre: 'Prospecto B', cliente: 'Por definir', estado: 'planificacion', valor_total: 0, valor_pagado: 0, fecha_inicio: fecha(2026,9,15), fecha_fin: fecha(2026,12,31), descripcion: 'En fase de prototipo.', servicios: [] },
  { id: 'rraliados', nombre: 'RR ALIADOS (Interno)', cliente: 'RR ALIADOS', estado: 'activo', valor_total: 0, valor_pagado: 0, fecha_inicio: fecha(2026,7,1), fecha_fin: fecha(2026,12,31), descripcion: 'Proyecto interno.', servicios: [] },
];

const MOVIMIENTOS: Movimiento[] = [
  { id: 'mov001', tipo: 'ingreso', concepto: 'Saldo Bancolombia', monto: 3500000, fecha: fecha(2026,8,15), categoria: 'saldo', proyecto_id: '' },
];

// Generador de pagos con fechas correctas
const genPagos = (): Pago[] => {
  const pagos: Pago[] = [];
  let id = 1;
  const add = (concepto: string, monto: number, f: string, tipo: 'ingreso'|'egreso', proyecto: string, estado: EstadoPago = 'programado') => {
    pagos.push({ id: `p${id++}`, concepto, monto, fecha: f, tipo, proyecto_id: proyecto, estado });
  };

  // AGO 30
  add('BOGA - Pago completo', 1200000, fecha(2026,8,30), 'ingreso', 'boga', 'pendiente');
  add('Wunder - Producción Q1', 746000, fecha(2026,8,30), 'egreso', 'wunder', 'pendiente');
  add('Wunder - Web 25%', 472500, fecha(2026,8,30), 'egreso', 'wunder', 'pendiente');
  add('Wunder - Pauta 50%', 300000, fecha(2026,8,30), 'egreso', 'wunder', 'pendiente');
  add('Wunder - SEO 50%', 150000, fecha(2026,8,30), 'egreso', 'wunder', 'pendiente');
  add('Manuel - Quincena', 400000, fecha(2026,8,30), 'egreso', '', 'pendiente');
  add('Samuel - Quincena', 200000, fecha(2026,8,30), 'egreso', '', 'pendiente');

  // Quincenas Sep 2026 - Mar 2027
  const quincenas: {y:number;m:number;d:number}[] = [];
  for (let y=2026;y<=2027;y++) {
    const mMax = y===2027 ? 3 : 12;
    const mStart = y===2026 ? 9 : 1;
    for (let m=mStart;m<=mMax;m++) {
      quincenas.push({y,m,d:15});
      const lastDay = new Date(y,m,0).getDate();
      quincenas.push({y,m,d:lastDay});
    }
  }

  // Sátiro Sushi: 30 cuotas
  quincenas.slice(0,30).forEach((q,i) => add(`Sátiro - Cuota ${i+1}/30`, 400000, fecha(q.y,q.m,q.d), 'ingreso', 'satiro'));

  // Sátiro desarrollo cada quincena Sep-Mar
  quincenas.forEach(q => add('Sátiro - Desarrollo', 500000, fecha(q.y,q.m,q.d), 'egreso', 'satiro'));

  // Wunder: Sep-Dic 2026
  quincenas.filter(q=>q.y===2026 && q.m>=9).forEach(q => {
    add('Wunder - Producción', 746000, fecha(q.y,q.m,q.d), 'egreso', 'wunder');
    add('Wunder - Web', 472500, fecha(q.y,q.m,q.d), 'egreso', 'wunder');
    add('Wunder - Pauta', 300000, fecha(q.y,q.m,q.d), 'egreso', 'wunder');
    add('Wunder - SEO', 150000, fecha(q.y,q.m,q.d), 'egreso', 'wunder');
  });

  // ZAPATOS: Sep-Oct 2026
  quincenas.filter(q=>q.y===2026 && q.m>=9 && q.m<=10).forEach((q,i) => {
    add('ZAPATOS - Producción', 300000, fecha(q.y,q.m,q.d), 'egreso', 'zapatos');
    if (i < 4) {
      add('ZAPATOS - Web', 150000, fecha(q.y,q.m,q.d), 'egreso', 'zapatos');
      add('ZAPATOS - Pauta', 150000, fecha(q.y,q.m,q.d), 'egreso', 'zapatos');
    }
  });

  // AMSTERDAM: adelantos + producción
  ['amsterdam1','amsterdam2','amsterdam3'].forEach(proj => {
    const num = proj.replace('amsterdam','');
    add(`AMSTERDAM #${num} - Adelanto`, 1000000, fecha(2026,9,15), 'ingreso', proj);
    quincenas.filter(q=>q.y===2026 && q.m>=9).forEach(q => add(`AMSTERDAM #${num} - Producción`, 500000, fecha(q.y,q.m,q.d), 'egreso', proj));
  });

  // GLOBOS
  add('GLOBOS - Adelanto', 600000, fecha(2026,9,15), 'ingreso', 'globos');
  quincenas.filter(q=>q.y===2026 && q.m>=9 && q.m<=10).forEach(q => add('GLOBOS - Producción', 300000, fecha(q.y,q.m,q.d), 'egreso', 'globos'));

  // Personal cada quincena
  quincenas.forEach(q => {
    add('Manuel - Quincena', 400000, fecha(q.y,q.m,q.d), 'egreso', '');
    add('Samuel - Quincena', 200000, fecha(q.y,q.m,q.d), 'egreso', '');
  });

  return pagos;
};

const PAGOS = genPagos();

// Storage
const STORAGE_KEY = 'rr-v7';
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
  const parts = d.split('-');
  if (parts.length === 3) {
    const mes = new Date(parseInt(parts[0]), parseInt(parts[1])-1).toLocaleDateString('es-CO',{month:'short'});
    return `${parseInt(parts[2])} ${mes} ${parts[0].slice(2)}`;
  }
  return d;
};
const genId = () => Math.random().toString(36).substr(2,9);

// Parsear fecha sin timezone
const parseFecha = (f: string) => {
  const [y,m,d] = f.split('-').map(Number);
  return new Date(y, m-1, d);
};

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
  const [vistaCal, setVistaCal] = useState<VistaCalendario>('grid');
  const [diaSeleccionado, setDiaSeleccionado] = useState<string|null>(null);
  const [diaDetalle, setDiaDetalle] = useState<{y:number;m:number;d:number}|null>(null);

  useEffect(() => { setState(loadState()); setLoaded(true); }, []);
  const save = (n: Partial<AppState>) => { const u = {...state,...n}; setState(u); saveState(u); };
  
  const openModal = (t: string, item?: Proyecto|Movimiento|Pago, fechaDefault?: string) => {
    setModal(t);
    if (item) { 
      setEditId(item.id); 
      if (t==='proyecto') setFP(item as Proyecto); 
      if (t==='movimiento') setFM(item as Movimiento); 
      if (t==='pago') setFPago(item as Pago); 
    } else { 
      setEditId(null); 
      if (t==='proyecto') setFP({estado:'activo',servicios:[]}); 
      if (t==='movimiento') setFM({tipo:'egreso',fecha:fechaDefault||fecha(2026,8,15)}); 
      if (t==='pago') setFPago({tipo:'egreso',estado:'pendiente',fecha:fechaDefault||fecha(2026,8,30)}); 
    }
  };
  
  const closeModal = () => { 
    setModal(null); 
    setEditId(null); 
    // Si venimos del detalle del día, volver ahí
    if (diaSeleccionado) {
      setDiaSeleccionado(null);
    }
  };
  
  const saveItem = () => {
    if (modal==='proyecto') { const p={...fProyecto,id:editId||'p_'+genId()} as Proyecto; save({proyectos:editId?state.proyectos.map(x=>x.id===editId?p:x):[...state.proyectos,p]}); }
    if (modal==='movimiento') { const m={...fMov,id:editId||'m_'+genId()} as Movimiento; save({movimientos:editId?state.movimientos.map(x=>x.id===editId?m:x):[...state.movimientos,m]}); }
    if (modal==='pago') { const p={...fPago,id:editId||'pa_'+genId()} as Pago; save({pagos:editId?state.pagos.map(x=>x.id===editId?p:x):[...state.pagos,p]}); }
    setModal(null);
    setEditId(null);
    setDiaSeleccionado(null);
    // Mantener diaDetalle abierto si existe
  };
  
  const del = (t:'proyectos'|'movimientos'|'pagos',id:string) => { if (confirm('¿Eliminar?')) save({[t]:state[t].filter((x:Proyecto|Movimiento|Pago)=>x.id!==id)}); };
  const delPago = (id:string) => { if (confirm('¿Eliminar este pago?')) save({pagos:state.pagos.filter(p=>p.id!==id)}); };
  const markPagado = (id:string) => save({pagos:state.pagos.map(p=>p.id===id?{...p,estado:'pagado' as EstadoPago}:p)});

  const hoy = new Date();
  const hoyStr = fecha(hoy.getFullYear(), hoy.getMonth()+1, hoy.getDate());
  const disp = state.movimientos.filter(m=>m.tipo==='ingreso').reduce((s,m)=>s+m.monto,0);
  const burn = 500000;
  const runway = disp > 0 ? Math.round((disp/burn)*10)/10 : 0;

  // Proyección 6 meses
  const meses: {mes:string;ing:number;egr:number;saldo:number;brecha:boolean}[] = [];
  let sal = disp;
  for (let i=0;i<6;i++) {
    const y = hoy.getFullYear();
    const m = hoy.getMonth()+1+i;
    const realM = m > 12 ? m-12 : m;
    const realY = m > 12 ? y+1 : y;
    const f = fecha(realY, realM, 1);
    const lastDay = new Date(realY, realM, 0).getDate();
    const fm = fecha(realY, realM, lastDay);
    const pm = state.pagos.filter(p=>p.fecha>=f && p.fecha<=fm && p.estado!=='pagado');
    const ing = pm.filter(p=>p.tipo==='ingreso').reduce((s,p)=>s+p.monto,0);
    const egr = pm.filter(p=>p.tipo==='egreso').reduce((s,p)=>s+p.monto,0);
    sal += ing - egr;
    meses.push({mes: new Date(realY,realM-1).toLocaleDateString('es-CO',{month:'short',year:'2-digit'}),ing,egr,saldo:sal,brecha:sal<0});
  }

  // Próximos pagos
  const pagosProx = state.pagos.filter(p=>p.estado!=='pagado' && p.fecha>=hoyStr).sort((a,b)=>a.fecha.localeCompare(b.fecha)).slice(0,20);

  // Calendario: Ago 2026 - Mar 2027
  const calendarMonths: {y:number;m:number;nombre:string;lastDay:number}[] = [];
  for (let y=2026;y<=2027;y++) {
    const mMax = y===2027 ? 3 : 12;
    const mStart = y===2026 ? 8 : 1;
    for (let m=mStart;m<=mMax;m++) {
      calendarMonths.push({y,m,nombre:new Date(y,m-1).toLocaleDateString('es-CO',{month:'long'}),lastDay:new Date(y,m,0).getDate()});
    }
  }

  // Pagos de un día específico
  const getPagosDia = (y:number,m:number,d:number) => state.pagos.filter(p=>{
    const [py,pm,pd] = p.fecha.split('-').map(Number);
    return py===y && pm===m && pd===d && p.estado!=='pagado';
  });

  // Abrir detalle del día
  const clickDia = (y:number,m:number,d:number) => {
    setDiaDetalle({y,m,d});
  };

  // Cerrar detalle del día
  const closeDiaDetalle = () => {
    setDiaDetalle(null);
  };

  // Abrir modal para crear pago desde día seleccionado
  const addPagoDesdeDia = () => {
    if (diaDetalle) {
      const f = fecha(diaDetalle.y, diaDetalle.m, diaDetalle.d);
      openModal('pago', undefined, f);
    }
  };

  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(state.proyectos.map(p=>({Proyecto:p.nombre,Cliente:p.cliente,Estado:p.estado,'Valor Total':p.valor_total,Pagado:p.valor_pagado,Pendiente:p.valor_total-p.valor_pagado}))), 'Proyectos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(state.movimientos.map(m=>({Fecha:m.fecha,Tipo:m.tipo,Concepto:m.concepto,Monto:m.tipo==='ingreso'?m.monto:-m.monto}))), 'Movimientos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(state.pagos.map(p=>({Concepto:p.concepto,Tipo:p.tipo,Monto:p.monto,Fecha:p.fecha,Estado:p.estado,Proyecto:p.proyecto_id}))), 'Pagos');
    XLSX.writeFile(wb, `RR_Finanzas_${hoyStr}.xlsx`);
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
        {/* RESUMEN */}
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
                  const dias=Math.ceil((parseFecha(p.fecha).getTime()-Date.now())/86400000);
                  return(
                    <div key={p.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={()=>openModal('pago',p)}>
                      <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${dias<0?'bg-red-500/10':dias<=7?'bg-yellow-500/10':'bg-blue-500/10'}`}>
                        <span className={`text-sm font-bold ${dias<0?'text-red-400':dias<=7?'text-yellow-400':'text-blue-400'}`}>{parseInt(p.fecha.split('-')[2])}</span>
                        <span className={`text-[8px] ${t3}`}>{new Date(parseInt(p.fecha.split('-')[0]),parseInt(p.fecha.split('-')[1])-1).toLocaleDateString('es-CO',{month:'short'})}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${t} truncate`}>{p.concepto}</p>
                        <p className={`text-[10px] ${dias<0?'text-red-400':t3}`}>{dias<0?`Vencido ${-dias}d`:`En ${dias}d`}</p>
                      </div>
                      <span className={`text-xs font-bold flex-shrink-0 ${p.tipo==='ingreso'?'text-green-400':'text-red-400'}`}>{p.tipo==='ingreso'?'+':'-'}{fmt(p.monto)}</span>
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

        {/* PROYECTOS */}
        {tab==='proyectos' && <>
          <div className="flex justify-between items-center mb-6"><h2 className={`text-lg font-bold ${t}`}>Proyectos</h2><button onClick={()=>openModal('proyecto')} className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white btn-press shadow-lg shadow-red-500/20">+ Nuevo Proyecto</button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {state.proyectos.map(p=>(
              <div key={p.id} className={`${card} border ${bd} rounded-2xl p-6 card-hover`}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0"><h3 className={`text-sm font-semibold ${t} truncate`}>{p.nombre}</h3><p className={`text-xs ${t3} mt-0.5`}>{p.cliente}</p></div>
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
                <div className="flex gap-2 pt-3 border-t ${bd}">
                  <button onClick={()=>openModal('proyecto',p)} className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium btn-press ${dark?'bg-white/5 hover:bg-white/10':'bg-gray-100 hover:bg-gray-200'} ${t2}`}>Editar</button>
                  <button onClick={()=>del('proyectos',p.id)} className="px-3 py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 btn-press">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* MOVIMIENTOS */}
        {tab==='movimientos' && <>
          <div className="flex justify-between items-center mb-6"><h2 className={`text-lg font-bold ${t}`}>Movimientos</h2><button onClick={()=>openModal('movimiento')} className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white btn-press shadow-lg shadow-red-500/20">+ Nuevo</button></div>
          <div className={`${card} border ${bd} rounded-2xl overflow-hidden`}>
            <div className="overflow-x-auto"><table className="w-full"><thead><tr className={`border-b ${bd}`}>
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
                  <td className="px-5 py-3.5 text-right"><button onClick={()=>openModal('movimiento',m)} className={`text-xs ${t3} hover:${t}`}>Editar</button></td>
                </tr>
              ))}
            </tbody></table></div>
          </div>
        </>}

        {/* PAGOS */}
        {tab==='pagos' && <>
          <div className="flex justify-between items-center mb-6"><h2 className={`text-lg font-bold ${t}`}>Pagos Programados</h2><button onClick={()=>openModal('pago')} className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white btn-press shadow-lg shadow-red-500/20">+ Nuevo</button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.pagos.filter(p=>p.estado!=='pagado').sort((a,b)=>a.fecha.localeCompare(b.fecha)).map(p=>{
              const v = p.fecha < hoyStr;
              return(
                <div key={p.id} className={`${card} border ${v?'border-red-500/30':bd} rounded-2xl p-5 card-hover cursor-pointer`} onClick={()=>openModal('pago',p)}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className={`text-sm font-medium ${t} leading-tight`}>{p.concepto}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap flex-shrink-0 ${v?'bg-red-500/10 text-red-400':'bg-yellow-500/10 text-yellow-400'}`}>{v?'vencido':'pendiente'}</span>
                  </div>
                  <p className={`text-xl font-bold ${p.tipo==='ingreso'?'text-green-400':'text-red-400'} mb-1`}>{p.tipo==='ingreso'?'+':'-'}{fmt(p.monto)}</p>
                  <p className={`text-xs ${t3} mb-4`}>{fmtDate(p.fecha)}</p>
                  <div className="flex gap-2">
                    <button onClick={e=>{e.stopPropagation();markPagado(p.id)}} className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 btn-press">Marcar Pagado</button>
                    <button onClick={e=>{e.stopPropagation();openModal('pago',p)}} className={`px-3 py-2 rounded-lg text-xs font-medium btn-press ${dark?'bg-white/5':'bg-gray-100'} ${t2}`}>Editar</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>}

        {/* CALENDARIO */}
        {tab==='calendario' && <>
          <div className="flex items-center justify-between mb-6">
            <div><h2 className={`text-lg font-bold ${t}`}>Calendario de Pagos</h2><p className={`text-xs ${t3}`}>Ago 2026 - Mar 2027 · Click en un día para agregar pago</p></div>
            <div className={`flex gap-1 p-1 rounded-xl ${dark?'bg-white/5':'bg-gray-100'}`}>
              <button onClick={()=>setVistaCal('grid')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${vistaCal==='grid'?'bg-red-500 text-white':t2}`}>Cuadrícula</button>
              <button onClick={()=>setVistaCal('lista')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${vistaCal==='lista'?'bg-red-500 text-white':t2}`}>Lista</button>
            </div>
          </div>

          {/* VISTA GRID */}
          {vistaCal==='grid' && <div className="space-y-8">
            {calendarMonths.map(cm => {
              const primerDia = new Date(cm.y,cm.m-1,1).getDay();
              const offset = primerDia === 0 ? 6 : primerDia - 1;
              return(
                <div key={`${cm.y}-${cm.m}`} className={`${card} border ${bd} rounded-2xl overflow-hidden`}>
                  <div className={`p-5 border-b ${bd}`}>
                    <h3 className={`text-base font-semibold capitalize ${t}`}>{cm.nombre} {cm.y}</h3>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d=>(
                        <div key={d} className={`text-center text-[10px] font-semibold ${t3} py-1`}>{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({length: offset}, (_,i)=>(
                        <div key={`e-${i}`} className="min-h-[70px]"></div>
                      ))}
                      {Array.from({length: cm.lastDay}, (_,i)=>i+1).map(dia => {
                        const pagosDia = getPagosDia(cm.y,cm.m,dia);
                        const total = pagosDia.reduce((s,p)=>s+(p.tipo==='ingreso'?p.monto:-p.monto),0);
                        const esHoy = hoyStr===fecha(cm.y,cm.m,dia);
                        const es15o30 = dia===15 || dia===cm.lastDay;
                        return(
                          <div key={dia} className={`min-h-[70px] rounded-lg border p-1.5 transition-all cursor-pointer hover:border-red-500/50 ${esHoy?'border-red-500 bg-red-500/5':pagosDia.length>0?dark?'border-white/10 bg-white/[0.02]':'border-gray-200 bg-gray-50':dark?'border-white/[0.04]':'border-gray-100'} ${es15o30?'ring-1 ring-red-500/20':''}`} onClick={()=>clickDia(cm.y,cm.m,dia)}>
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-xs font-semibold ${esHoy?'text-red-400':es15o30?'text-red-400':t}`}>{dia}</span>
                              {pagosDia.length > 0 && <span className={`text-[9px] font-bold ${total>=0?'text-green-400':'text-red-400'}`}>{total>=0?'+':''}{fmt(total)}</span>}
                            </div>
                            <div className="space-y-0.5">
                              {pagosDia.slice(0,3).map(p=>(
                                <div key={p.id} className={`text-[8px] truncate px-1 py-0.5 rounded ${p.tipo==='ingreso'?'bg-green-500/10 text-green-400':'bg-red-500/10 text-red-400'}`} title={`${p.concepto}: ${fmt(p.monto)}`} onClick={e=>{e.stopPropagation();openModal('pago',p)}}>
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
              );
            })}
          </div>}

          {/* VISTA LISTA */}
          {vistaCal==='lista' && <div className="space-y-4">
            {calendarMonths.map(cm => {
              const pagosMes = state.pagos.filter(p=>{
                const [py,pm] = p.fecha.split('-').map(Number);
                return py===cm.y && pm===cm.m && p.estado!=='pagado';
              }).sort((a,b)=>a.fecha.localeCompare(b.fecha));
              const totalIng = pagosMes.filter(p=>p.tipo==='ingreso').reduce((s,p)=>s+p.monto,0);
              const totalEgr = pagosMes.filter(p=>p.tipo==='egreso').reduce((s,p)=>s+p.monto,0);
              if (pagosMes.length === 0) return null;
              return(
                <div key={`${cm.y}-${cm.m}`} className={`${card} border ${bd} rounded-2xl overflow-hidden`}>
                  <div className={`p-4 border-b ${bd} flex justify-between items-center`}>
                    <h3 className={`text-sm font-semibold capitalize ${t}`}>{cm.nombre} {cm.y}</h3>
                    <div className="flex gap-4 text-xs"><span className="text-green-400">+{fmt(totalIng)}</span><span className="text-red-400">-{fmt(totalEgr)}</span></div>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {pagosMes.map(p=>(
                      <div key={p.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={()=>openModal('pago',p)}>
                        <div className={`w-10 text-center flex-shrink-0`}>
                          <span className={`text-lg font-bold ${t}`}>{parseInt(p.fecha.split('-')[2])}</span>
                          <br/><span className={`text-[9px] ${t3}`}>{new Date(parseInt(p.fecha.split('-')[0]),parseInt(p.fecha.split('-')[1])-1,parseInt(p.fecha.split('-')[2])).toLocaleDateString('es-CO',{weekday:'short'})}</span>
                        </div>
                        <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] flex-shrink-0 ${p.tipo==='ingreso'?'bg-green-500/10 text-green-400':'bg-red-500/10 text-red-400'}`}>{p.tipo==='ingreso'?'↑':'↓'}</div>
                        <div className="flex-1 min-w-0"><p className={`text-xs font-medium ${t} truncate`}>{p.concepto}</p></div>
                        <span className={`text-xs font-bold flex-shrink-0 ${p.tipo==='ingreso'?'text-green-400':'text-red-400'}`}>{p.tipo==='ingreso'?'+':'-'}{fmt(p.monto)}</span>
                        <button onClick={e=>{e.stopPropagation();markPagado(p.id)}} className="px-2 py-1 rounded text-[9px] bg-green-500/10 text-green-400 btn-press flex-shrink-0">Pagado</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>}
        </>}

        {/* BRECHAS */}
        {tab==='brechas' && <>
          <h2 className={`text-lg font-bold ${t} mb-2`}>Proyección 6 Meses</h2>
          <p className={`text-xs ${t3} mb-6`}>Análisis de brechas de liquidez</p>
          <div className={`${card} border ${bd} rounded-2xl p-6 mb-6`}>
            <div className="flex items-center gap-6 mb-5">
              <div className={`text-5xl font-bold ${runway>=8?'text-green-400':runway>=4?'text-yellow-400':'text-red-400'}`}>{runway}</div>
              <div><p className={`text-base font-semibold ${t}`}>Meses de Runway</p><p className={`text-sm ${t3}`}>Disponible: {fmt(disp)} · Burn: {fmt(burn)}/mes</p></div>
            </div>
            <div className={`w-full h-5 rounded-full ${dark?'bg-white/5':'bg-gray-100'}`}><div className={`h-5 rounded-full transition-all duration-1000 ${runway>=8?'bg-green-500':runway>=4?'bg-yellow-500':'bg-red-500'}`} style={{width:`${Math.min(runway/12*100,100)}%`}}></div></div>
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

      {/* MODAL DETALLE DEL DÍA */}
      {diaDetalle && !modal && (() => {
        const pagosDelDia = getPagosDia(diaDetalle.y, diaDetalle.m, diaDetalle.d);
        const fechaStr = fecha(diaDetalle.y, diaDetalle.m, diaDetalle.d);
        const nombreDia = new Date(diaDetalle.y, diaDetalle.m-1, diaDetalle.d).toLocaleDateString('es-CO', {weekday:'long', day:'numeric', month:'long'});
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop" onClick={closeDiaDetalle}>
            <div className={`${card} border ${bd} rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto modal-content shadow-2xl`} onClick={e=>e.stopPropagation()}>
              <div className={`p-6 border-b ${bd} flex justify-between items-center`}>
                <div>
                  <h3 className={`text-base font-bold capitalize ${t}`}>{nombreDia}</h3>
                  <p className={`text-xs ${t3} mt-1`}>{pagosDelDia.length} pago{pagosDelDia.length!==1?'s':''} programado{pagosDelDia.length!==1?'s':''}</p>
                </div>
                <button onClick={closeDiaDetalle} className={`w-8 h-8 rounded-lg flex items-center justify-center ${dark?'bg-white/5 hover:bg-white/10':'bg-gray-100 hover:bg-gray-200'} ${t2} transition-colors`}>✕</button>
              </div>
              
              {pagosDelDia.length > 0 ? (
                <div className="divide-y divide-white/[0.04]">
                  {pagosDelDia.map(p => (
                    <div key={p.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer group" onClick={() => openModal('pago', p)}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${p.tipo==='ingreso'?'bg-green-500/10 text-green-400':'bg-red-500/10 text-red-400'}`}>
                        <span className="text-lg">{p.tipo==='ingreso'?'↑':'↓'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${t} truncate`}>{p.concepto}</p>
                        <p className={`text-xs ${t3}`}>
                          {p.proyecto_id ? state.proyectos.find(pr=>pr.id===p.proyecto_id)?.nombre || p.proyecto_id : 'Sin proyecto'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${p.tipo==='ingreso'?'text-green-400':'text-red-400'}`}>{p.tipo==='ingreso'?'+':'-'}{fmt(p.monto)}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.estado==='pagado'?'bg-green-500/10 text-green-400':p.fecha<hoyStr?'bg-red-500/10 text-red-400':'bg-yellow-500/10 text-yellow-400'}`}>{p.estado==='pagado'?'pagado':p.fecha<hoyStr?'vencido':p.estado}</span>
                          {p.estado!=='pagado' && <button onClick={e=>{e.stopPropagation();markPagado(p.id)}} className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors btn-press">✓</button>}
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${dark?'bg-white/5':'bg-gray-100'}`}>
                        <span className={`text-xs ${t3}`}>✏️</span>
                      </div>
                      <button onClick={e=>{e.stopPropagation();delPago(p.id)}} className={`w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/10 text-red-400 hover:bg-red-500/20`}>
                        <span className="text-xs">🗑</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-12 text-center">
                  <div className={`w-16 h-16 rounded-2xl ${dark?'bg-white/5':'bg-gray-100'} flex items-center justify-center mx-auto mb-4`}>
                    <span className="text-2xl">📅</span>
                  </div>
                  <p className={`text-sm ${t2} mb-1`}>Sin pagos este día</p>
                  <p className={`text-xs ${t3}`}>Crea un nuevo pago para esta fecha</p>
                </div>
              )}

              <div className={`p-6 border-t ${bd}`}>
                <button onClick={addPagoDesdeDia} className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white btn-press shadow-lg shadow-red-500/20 hover:from-red-600 hover:to-red-700 transition-all">
                  + Agregar Pago
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL EDITAR/CREAR */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className={`${card} border ${bd} rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto modal-content shadow-2xl`}>
            <div className={`p-6 border-b ${bd} flex justify-between items-center`}>
              <h3 className={`text-sm font-bold ${t}`}>{editId?'Editar':'Nuevo'} {modal==='proyecto'?'Proyecto':modal==='movimiento'?'Movimiento':'Pago'}{diaSeleccionado && !editId ? ` - ${fmtDate(diaSeleccionado)}`:''}</h3>
              <button onClick={closeModal} className={`w-8 h-8 rounded-lg flex items-center justify-center ${dark?'bg-white/5 hover:bg-white/10':'bg-gray-100 hover:bg-gray-200'} ${t2}`}>✕</button>
            </div>
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
                <button onClick={closeModal} className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium btn-press ${dark?'bg-white/5':'bg-gray-100'} ${t2}`}>Cancelar</button>
                <button onClick={saveItem} className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white btn-press shadow-lg shadow-red-500/20">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}