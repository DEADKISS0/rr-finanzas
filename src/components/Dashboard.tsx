'use client';

import { useState, useEffect } from 'react';

// ============ TYPES ============
type EstadoProyecto = 'planificacion' | 'activo' | 'pausado' | 'completado' | 'cancelado';
type TipoMovimiento = 'ingreso' | 'egreso';
type EstadoPago = 'pendiente' | 'programado' | 'pagado' | 'vencido';

interface Proyecto { id: string; nombre: string; cliente: string; estado: EstadoProyecto; valor_total: number; valor_pagado: number; fecha_inicio: string; fecha_fin: string; descripcion: string; servicios: string[]; }
interface Movimiento { id: string; tipo: TipoMovimiento; concepto: string; monto: number; fecha: string; categoria: string; proyecto_id: string; }
interface Pago { id: string; concepto: string; monto: number; fecha: string; estado: EstadoPago; tipo: 'ingreso' | 'egreso'; proyecto_id: string; }

const PROYECTOS: Proyecto[] = [
  { id: 'wunder', nombre: 'Wunder', cliente: 'Wunder', estado: 'activo', valor_total: 9000000, valor_pagado: 0, fecha_inicio: '2026-07-01', fecha_fin: '2026-12-31', descripcion: 'Marketing digital completo. Onboarding terminado.', servicios: ['Video', 'Diseño', 'Branding', 'Redes', 'Web', 'Pauta', 'SEO'] },
  { id: 'boga', nombre: 'BOGA', cliente: 'BOGA', estado: 'activo', valor_total: 1200000, valor_pagado: 0, fecha_inicio: '2026-07-15', fecha_fin: '2026-09-30', descripcion: 'Setup completo. Pago completo $1.2M el 30 agosto.', servicios: ['Branding', 'Video', 'Diseño', 'Redes', 'Web', 'Pauta', 'SEO'] },
  { id: 'zapatos', nombre: 'ZAPATOS', cliente: 'ZAPATOS', estado: 'activo', valor_total: 900000, valor_pagado: 0, fecha_inicio: '2026-08-01', fecha_fin: '2026-10-31', descripcion: 'Mismo esquema que Wunder.', servicios: ['Video', 'Diseño', 'Branding', 'Redes', 'Web', 'Pauta', 'SEO'] },
  { id: 'amsterdam1', nombre: 'AMSTERDAM #1', cliente: 'AMSTERDAM', estado: 'activo', valor_total: 2000000, valor_pagado: 0, fecha_inicio: '2026-08-01', fecha_fin: '2026-11-30', descripcion: 'Producción video y contenido.', servicios: ['Video', 'Diseño'] },
  { id: 'amsterdam2', nombre: 'AMSTERDAM #2', cliente: 'AMSTERDAM', estado: 'activo', valor_total: 2000000, valor_pagado: 0, fecha_inicio: '2026-08-01', fecha_fin: '2026-11-30', descripcion: 'Producción video y contenido.', servicios: ['Video', 'Diseño'] },
  { id: 'amsterdam3', nombre: 'AMSTERDAM #3', cliente: 'AMSTERDAM', estado: 'activo', valor_total: 2000000, valor_pagado: 0, fecha_inicio: '2026-08-01', fecha_fin: '2026-11-30', descripcion: 'Producción video y contenido.', servicios: ['Video', 'Diseño'] },
  { id: 'globos', nombre: 'GLOBOS', cliente: 'GLOBOS', estado: 'activo', valor_total: 1200000, valor_pagado: 0, fecha_inicio: '2026-08-01', fecha_fin: '2026-10-31', descripcion: 'Servicios de marketing.', servicios: ['Video', 'Diseño', 'Redes'] },
  { id: 'satiro', nombre: 'Sátiro Sushi', cliente: 'Sátiro Sushi', estado: 'activo', valor_total: 6000000, valor_pagado: 0, fecha_inicio: '2026-09-01', fecha_fin: '2027-02-28', descripcion: 'App restaurante. 30 cuotas $400K c/15 y 30.', servicios: ['Web', 'App', 'Pagos'] },
  { id: 'plazoleta', nombre: 'Plazoleta', cliente: 'Plazoleta', estado: 'planificacion', valor_total: 0, valor_pagado: 0, fecha_inicio: '2026-09-15', fecha_fin: '2026-12-31', descripcion: 'En fase de prototipo.', servicios: [] },
  { id: 'prospecto2', nombre: 'Prospecto B', cliente: 'Por definir', estado: 'planificacion', valor_total: 0, valor_pagado: 0, fecha_inicio: '2026-09-15', fecha_fin: '2026-12-31', descripcion: 'En fase de prototipo.', servicios: [] },
  { id: 'rraliados', nombre: 'RR ALIADOS (Interno)', cliente: 'RR ALIADOS', estado: 'activo', valor_total: 0, valor_pagado: 0, fecha_inicio: '2026-07-01', fecha_fin: '2026-12-31', descripcion: 'Proyecto interno.', servicios: [] },
];

const MOVIMIENTOS: Movimiento[] = [
  { id: 'mov001', tipo: 'ingreso', concepto: 'Saldo Bancolombia', monto: 3500000, fecha: '2026-08-15', categoria: 'saldo', proyecto_id: '' },
];

// Pagos: solo 15 y 30 de cada mes, Ago 2026 - Feb 2027
const PAGOS: Pago[] = [
  // AGO 30 - PRÓXIMO PAGO
  { id: 'p1', concepto: 'BOGA - Pago completo', monto: 1200000, fecha: '2026-08-30', estado: 'pendiente', tipo: 'ingreso', proyecto_id: 'boga' },
  { id: 'p2', concepto: 'Wunder - Producción Q1', monto: 746000, fecha: '2026-08-30', estado: 'pendiente', tipo: 'egreso', proyecto_id: 'wunder' },
  { id: 'p3', concepto: 'Wunder - Web 25%', monto: 472500, fecha: '2026-08-30', estado: 'pendiente', tipo: 'egreso', proyecto_id: 'wunder' },
  { id: 'p4', concepto: 'Wunder - Pauta 50%', monto: 300000, fecha: '2026-08-30', estado: 'pendiente', tipo: 'egreso', proyecto_id: 'wunder' },
  { id: 'p5', concepto: 'Wunder - SEO 50%', monto: 150000, fecha: '2026-08-30', estado: 'pendiente', tipo: 'egreso', proyecto_id: 'wunder' },
  { id: 'p6', concepto: 'Manuel - Quincena', monto: 400000, fecha: '2026-08-30', estado: 'pendiente', tipo: 'egreso', proyecto_id: '' },
  { id: 'p7', concepto: 'Samuel - Quincena', monto: 200000, fecha: '2026-08-30', estado: 'pendiente', tipo: 'egreso', proyecto_id: '' },
  
  // SEP 15
  { id: 'p10', concepto: 'Sátiro - Cuota 1/30', monto: 400000, fecha: '2026-09-15', estado: 'programado', tipo: 'ingreso', proyecto_id: 'satiro' },
  { id: 'p11', concepto: 'AMSTERDAM #1 - Adelanto', monto: 1000000, fecha: '2026-09-15', estado: 'programado', tipo: 'ingreso', proyecto_id: 'amsterdam1' },
  { id: 'p12', concepto: 'AMSTERDAM #2 - Adelanto', monto: 1000000, fecha: '2026-09-15', estado: 'programado', tipo: 'ingreso', proyecto_id: 'amsterdam2' },
  { id: 'p13', concepto: 'AMSTERDAM #3 - Adelanto', monto: 1000000, fecha: '2026-09-15', estado: 'programado', tipo: 'ingreso', proyecto_id: 'amsterdam3' },
  { id: 'p14', concepto: 'GLOBOS - Adelanto', monto: 600000, fecha: '2026-09-15', estado: 'programado', tipo: 'ingreso', proyecto_id: 'globos' },
  { id: 'p15', concepto: 'Wunder - Producción Q2', monto: 746000, fecha: '2026-09-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'wunder' },
  { id: 'p16', concepto: 'Wunder - Web 25%', monto: 472500, fecha: '2026-09-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'wunder' },
  { id: 'p17', concepto: 'Wunder - Pauta 50%', monto: 300000, fecha: '2026-09-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'wunder' },
  { id: 'p18', concepto: 'Wunder - SEO 50%', monto: 150000, fecha: '2026-09-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'wunder' },
  { id: 'p19', concepto: 'AMSTERDAM #1 - Producción', monto: 500000, fecha: '2026-09-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'amsterdam1' },
  { id: 'p20', concepto: 'AMSTERDAM #2 - Producción', monto: 500000, fecha: '2026-09-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'amsterdam2' },
  { id: 'p21', concepto: 'AMSTERDAM #3 - Producción', monto: 500000, fecha: '2026-09-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'amsterdam3' },
  { id: 'p22', concepto: 'GLOBOS - Producción', monto: 300000, fecha: '2026-09-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'globos' },
  { id: 'p23', concepto: 'Sátiro - Desarrollo', monto: 500000, fecha: '2026-09-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'satiro' },
  { id: 'p24', concepto: 'ZAPATOS - Producción Q1', monto: 300000, fecha: '2026-09-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'zapatos' },
  { id: 'p25', concepto: 'Manuel - Quincena', monto: 400000, fecha: '2026-09-15', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  { id: 'p26', concepto: 'Samuel - Quincena', monto: 200000, fecha: '2026-09-15', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  
  // SEP 30
  { id: 'p30', concepto: 'Sátiro - Cuota 2/30', monto: 400000, fecha: '2026-09-30', estado: 'programado', tipo: 'ingreso', proyecto_id: 'satiro' },
  { id: 'p31', concepto: 'Wunder - Producción Q3', monto: 746000, fecha: '2026-09-30', estado: 'programado', tipo: 'egreso', proyecto_id: 'wunder' },
  { id: 'p32', concepto: 'Wunder - Web 25%', monto: 472500, fecha: '2026-09-30', estado: 'programado', tipo: 'egreso', proyecto_id: 'wunder' },
  { id: 'p33', concepto: 'Sátiro - Desarrollo', monto: 500000, fecha: '2026-09-30', estado: 'programado', tipo: 'egreso', proyecto_id: 'satiro' },
  { id: 'p34', concepto: 'ZAPATOS - Web 25%', monto: 150000, fecha: '2026-09-30', estado: 'programado', tipo: 'egreso', proyecto_id: 'zapatos' },
  { id: 'p35', concepto: 'ZAPATOS - Pauta 50%', monto: 150000, fecha: '2026-09-30', estado: 'programado', tipo: 'egreso', proyecto_id: 'zapatos' },
  { id: 'p36', concepto: 'Manuel - Quincena', monto: 400000, fecha: '2026-09-30', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  { id: 'p37', concepto: 'Samuel - Quincena', monto: 200000, fecha: '2026-09-30', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  
  // OCT 15
  { id: 'p40', concepto: 'Sátiro - Cuota 3/30', monto: 400000, fecha: '2026-10-15', estado: 'programado', tipo: 'ingreso', proyecto_id: 'satiro' },
  { id: 'p41', concepto: 'Wunder - Producción Q4', monto: 746000, fecha: '2026-10-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'wunder' },
  { id: 'p42', concepto: 'Sátiro - Desarrollo', monto: 500000, fecha: '2026-10-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'satiro' },
  { id: 'p43', concepto: 'ZAPATOS - Producción Q2', monto: 300000, fecha: '2026-10-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'zapatos' },
  { id: 'p44', concepto: 'Manuel - Quincena', monto: 400000, fecha: '2026-10-15', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  { id: 'p45', concepto: 'Samuel - Quincena', monto: 200000, fecha: '2026-10-15', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  
  // OCT 30
  { id: 'p50', concepto: 'Sátiro - Cuota 4/30', monto: 400000, fecha: '2026-10-30', estado: 'programado', tipo: 'ingreso', proyecto_id: 'satiro' },
  { id: 'p51', concepto: 'Wunder - Producción Q5', monto: 746000, fecha: '2026-10-30', estado: 'programado', tipo: 'egreso', proyecto_id: 'wunder' },
  { id: 'p52', concepto: 'Sátiro - Desarrollo', monto: 500000, fecha: '2026-10-30', estado: 'programado', tipo: 'egreso', proyecto_id: 'satiro' },
  { id: 'p53', concepto: 'ZAPATOS - Web 25%', monto: 150000, fecha: '2026-10-30', estado: 'programado', tipo: 'egreso', proyecto_id: 'zapatos' },
  { id: 'p54', concepto: 'Manuel - Quincena', monto: 400000, fecha: '2026-10-30', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  { id: 'p55', concepto: 'Samuel - Quincena', monto: 200000, fecha: '2026-10-30', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  
  // NOV 15
  { id: 'p60', concepto: 'Sátiro - Cuota 5/30', monto: 400000, fecha: '2026-11-15', estado: 'programado', tipo: 'ingreso', proyecto_id: 'satiro' },
  { id: 'p61', concepto: 'Wunder - Producción Q6', monto: 746000, fecha: '2026-11-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'wunder' },
  { id: 'p62', concepto: 'Sátiro - Desarrollo', monto: 500000, fecha: '2026-11-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'satiro' },
  { id: 'p63', concepto: 'Manuel - Quincena', monto: 400000, fecha: '2026-11-15', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  { id: 'p64', concepto: 'Samuel - Quincena', monto: 200000, fecha: '2026-11-15', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  
  // NOV 30
  { id: 'p70', concepto: 'Sátiro - Cuota 6/30', monto: 400000, fecha: '2026-11-30', estado: 'programado', tipo: 'ingreso', proyecto_id: 'satiro' },
  { id: 'p71', concepto: 'Sátiro - Desarrollo', monto: 500000, fecha: '2026-11-30', estado: 'programado', tipo: 'egreso', proyecto_id: 'satiro' },
  { id: 'p72', concepto: 'Manuel - Quincena', monto: 400000, fecha: '2026-11-30', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  { id: 'p73', concepto: 'Samuel - Quincena', monto: 200000, fecha: '2026-11-30', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  
  // DIC 15
  { id: 'p80', concepto: 'Sátiro - Cuota 7/30', monto: 400000, fecha: '2026-12-15', estado: 'programado', tipo: 'ingreso', proyecto_id: 'satiro' },
  { id: 'p81', concepto: 'Sátiro - Desarrollo', monto: 500000, fecha: '2026-12-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'satiro' },
  { id: 'p82', concepto: 'Manuel - Quincena', monto: 400000, fecha: '2026-12-15', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  { id: 'p83', concepto: 'Samuel - Quincena', monto: 200000, fecha: '2026-12-15', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  
  // DIC 30
  { id: 'p90', concepto: 'Sátiro - Cuota 8/30', monto: 400000, fecha: '2026-12-30', estado: 'programado', tipo: 'ingreso', proyecto_id: 'satiro' },
  { id: 'p91', concepto: 'Sátiro - Desarrollo', monto: 500000, fecha: '2026-12-30', estado: 'programado', tipo: 'egreso', proyecto_id: 'satiro' },
  { id: 'p92', concepto: 'Manuel - Quincena', monto: 400000, fecha: '2026-12-30', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  { id: 'p93', concepto: 'Samuel - Quincena', monto: 200000, fecha: '2026-12-30', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  
  // ENE 15
  { id: 'p100', concepto: 'Sátiro - Cuota 9/30', monto: 400000, fecha: '2027-01-15', estado: 'programado', tipo: 'ingreso', proyecto_id: 'satiro' },
  { id: 'p101', concepto: 'Sátiro - Desarrollo', monto: 500000, fecha: '2027-01-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'satiro' },
  { id: 'p102', concepto: 'Manuel - Quincena', monto: 400000, fecha: '2027-01-15', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  { id: 'p103', concepto: 'Samuel - Quincena', monto: 200000, fecha: '2027-01-15', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  
  // ENE 30
  { id: 'p110', concepto: 'Sátiro - Cuota 10/30', monto: 400000, fecha: '2027-01-30', estado: 'programado', tipo: 'ingreso', proyecto_id: 'satiro' },
  { id: 'p111', concepto: 'Sátiro - Desarrollo', monto: 500000, fecha: '2027-01-30', estado: 'programado', tipo: 'egreso', proyecto_id: 'satiro' },
  { id: 'p112', concepto: 'Manuel - Quincena', monto: 400000, fecha: '2027-01-30', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  { id: 'p113', concepto: 'Samuel - Quincena', monto: 200000, fecha: '2027-01-30', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  
  // FEB 15
  { id: 'p120', concepto: 'Sátiro - Cuota 11/30', monto: 400000, fecha: '2027-02-15', estado: 'programado', tipo: 'ingreso', proyecto_id: 'satiro' },
  { id: 'p121', concepto: 'Sátiro - Desarrollo', monto: 500000, fecha: '2027-02-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'satiro' },
  { id: 'p122', concepto: 'Manuel - Quincena', monto: 400000, fecha: '2027-02-15', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  { id: 'p123', concepto: 'Samuel - Quincena', monto: 200000, fecha: '2027-02-15', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  
  // FEB 28
  { id: 'p130', concepto: 'Sátiro - Cuota 12/30', monto: 400000, fecha: '2027-02-28', estado: 'programado', tipo: 'ingreso', proyecto_id: 'satiro' },
  { id: 'p131', concepto: 'Sátiro - Desarrollo', monto: 500000, fecha: '2027-02-28', estado: 'programado', tipo: 'egreso', proyecto_id: 'satiro' },
  { id: 'p132', concepto: 'Manuel - Quincena', monto: 400000, fecha: '2027-02-28', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  { id: 'p133', concepto: 'Samuel - Quincena', monto: 200000, fecha: '2027-02-28', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
];

// ============ STORAGE ============
const STORAGE_KEY = 'rr-v5';
interface AppState { proyectos: Proyecto[]; movimientos: Movimiento[]; pagos: Pago[]; }
const loadState = (): AppState => {
  if (typeof window === 'undefined') return { proyectos: PROYECTOS, movimientos: MOVIMIENTOS, pagos: PAGOS };
  const s = localStorage.getItem(STORAGE_KEY);
  if (s) try { return JSON.parse(s); } catch {}
  return { proyectos: PROYECTOS, movimientos: MOVIMIENTOS, pagos: PAGOS };
};
const saveState = (s: AppState) => { if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); };

const fmt = (v: number) => '$' + Number(v||0).toLocaleString('es-CO', {maximumFractionDigits:0});
const fmtDate = (d: string) => { if (!d) return '--'; try { return new Date(d+'T00:00:00').toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'2-digit'}); } catch { return d; } };
const genId = () => Math.random().toString(36).substr(2,9);

// ============ COMPONENT ============
export default function Dashboard() {
  const [state, setState] = useState<AppState>({proyectos:[],movimientos:[],pagos:[]});
  const [tab, setTab] = useState<'resumen'|'proyectos'|'movimientos'|'pagos'|'cronograma'|'brechas'>('resumen');
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

  // Proyección
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

  const pagosProx = state.pagos.filter(p=>p.estado!=='pagado').sort((a,b)=>new Date(a.fecha).getTime()-new Date(b.fecha).getTime()).slice(0,20);

  // Calendar data
  const calendarMonths = [8,9,10,11,12].map(m => {
    const pagosMes = state.pagos.filter(p=>{const d=new Date(p.fecha);return d.getMonth()+1===m&&d.getFullYear()===2026&&p.estado!=='pagado';}).sort((a,b)=>new Date(a.fecha).getTime()-new Date(b.fecha).getTime());
    return { mes: m, nombre: new Date(2026,m-1).toLocaleDateString('es-CO',{month:'long'}), pagos: pagosMes, totalIng: pagosMes.filter(p=>p.tipo==='ingreso').reduce((s,p)=>s+p.monto,0), totalEgr: pagosMes.filter(p=>p.tipo==='egreso').reduce((s,p)=>s+p.monto,0) };
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
    <div><label className={`text-xs font-medium ${t2} mb-1 block`}>{l}</label><input type={tp} value={v||''} onChange={e=>on(e.target.value)} className={`w-full px-3 py-2 rounded-lg text-sm ${inp} border focus:border-red-500 focus:ring-1 focus:ring-red-500/20 outline-none`}/></div>
  );
  const Select = ({l,v,on,opts}:{l:string;v:string;on:(v:string)=>void;opts:{v:string;l:string}[]}) => (
    <div><label className={`text-xs font-medium ${t2} mb-1 block`}>{l}</label><select value={v} onChange={e=>on(e.target.value)} className={`w-full px-3 py-2 rounded-lg text-sm ${inp} border focus:border-red-500 outline-none`}>{opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
  );

  return (
    <div className={`min-h-screen ${bg}`}>
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

      <div className={`border-b ${bd} sticky top-[53px] z-30 glass ${dark?'bg-[#0a0a0f]/80':'bg-white/80'}`}>
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {([['resumen','Resumen'],['proyectos','Proyectos'],['movimientos','Movimientos'],['pagos','Pagos'],['cronograma','Calendario'],['brechas','Brechas 6M']] as [string,string][]).map(([k,l])=>(
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
            <div className={`${card} border ${bd} rounded-2xl p-5 card-hover animate-fadeInUp stagger-3`}><p className={`text-[10px] uppercase tracking-widest ${t3} mb-2`}>Proyectos</p><p className={`text-2xl font-bold ${t}`}>{state.proyectos.filter(p=>p.estado==='activo').length}</p><p className={`text-xs ${t3}`}>activos</p></div>
            <div className={`${card} border ${bd} rounded-2xl p-5 card-hover animate-fadeInUp stagger-4`}><p className={`text-[10px] uppercase tracking-widest ${t3} mb-2`}>Pagos Pendientes</p><p className={`text-2xl font-bold ${t}`}>{state.pagos.filter(p=>p.estado!=='pagado').length}</p><p className={`text-xs ${t3}`}>{fmt(state.pagos.filter(p=>p.estado!=='pagado'&&p.tipo==='egreso').reduce((s,p)=>s+p.monto,0))} por pagar</p></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={`${card} border ${bd} rounded-2xl overflow-hidden`}>
              <div className={`p-4 border-b ${bd}`}><h3 className={`text-sm font-semibold ${t}`}>Próximos Pagos</h3></div>
              <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.04]">
                {pagosProx.map(p=>{const dias=Math.ceil((new Date(p.fecha).getTime()-Date.now())/86400000);return(
                  <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center ${dias<0?'bg-red-500/10':dias<=7?'bg-yellow-500/10':'bg-blue-500/10'}`}>
                      <span className={`text-sm font-bold ${dias<0?'text-red-400':dias<=7?'text-yellow-400':'text-blue-400'}`}>{new Date(p.fecha).getDate()}</span>
                      <span className={`text-[8px] ${t3}`}>{new Date(p.fecha).toLocaleDateString('es-CO',{month:'short'})}</span>
                    </div>
                    <div className="flex-1"><p className={`text-xs font-medium ${t} truncate`}>{p.concepto}</p><p className={`text-[10px] ${dias<0?'text-red-400':t3}`}>{dias<0?`Vencido ${-dias}d`:`En ${dias}d`}</p></div>
                    <span className={`text-xs font-bold ${p.tipo==='ingreso'?'text-green-400':'text-red-400'}`}>{p.tipo==='ingreso'?'+':'-'}{fmt(p.monto)}</span>
                  </div>
                );})}
              </div>
            </div>
            <div className={`${card} border ${bd} rounded-2xl overflow-hidden`}>
              <div className={`p-4 border-b ${bd}`}><h3 className={`text-sm font-semibold ${t}`}>Últimos Movimientos</h3></div>
              <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.04]">
                {state.movimientos.slice(-10).reverse().map(m=>(
                  <div key={m.id} className="px-4 py-3 flex items-center gap-3">
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
          <div className="flex justify-between mb-4"><h2 className={`text-lg font-bold ${t}`}>Proyectos</h2><button onClick={()=>openModal('proyecto')} className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white btn-press shadow-lg shadow-red-500/20">+ Nuevo</button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.proyectos.map(p=>(
              <div key={p.id} className={`${card} border ${bd} rounded-2xl p-5 card-hover`}>
                <div className="flex justify-between mb-3"><div><h3 className={`text-sm font-semibold ${t}`}>{p.nombre}</h3><p className={`text-xs ${t3}`}>{p.cliente}</p></div><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.estado==='activo'?'bg-green-500/10 text-green-400':p.estado==='planificacion'?'bg-blue-500/10 text-blue-400':'bg-gray-500/10 text-gray-400'}`}>{p.estado}</span></div>
                <p className={`text-xs ${t2} mb-3`}>{p.descripcion}</p>
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs"><span className={t3}>Valor</span><span className={t}>{fmt(p.valor_total)}</span></div>
                  <div className="flex justify-between text-xs"><span className={t3}>Pagado</span><span className="text-green-400">{fmt(p.valor_pagado)}</span></div>
                  <div className="flex justify-between text-xs"><span className={t3}>Pendiente</span><span className="text-yellow-400">{fmt(p.valor_total-p.valor_pagado)}</span></div>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 mb-3"><div className="bg-green-500 h-1.5 rounded-full progress-bar" style={{width:`${p.valor_total>0?(p.valor_pagado/p.valor_total)*100:0}%`}}></div></div>
                {p.servicios.length>0 && <div className="flex flex-wrap gap-1 mb-3">{p.servicios.map(s=><span key={s} className={`px-2 py-0.5 rounded text-[9px] ${dark?'bg-white/5 text-gray-400':'bg-gray-100 text-gray-600'}`}>{s}</span>)}</div>}
                <div className="flex gap-2"><button onClick={()=>openModal('proyecto',p)} className={`flex-1 px-3 py-1.5 rounded-lg text-xs btn-press ${dark?'bg-white/5':'bg-gray-100'} ${t2}`}>Editar</button><button onClick={()=>del('proyectos',p.id)} className="px-3 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-400 btn-press">Eliminar</button></div>
              </div>
            ))}
          </div>
        </>}

        {/* MOVIMIENTOS */}
        {tab==='movimientos' && <>
          <div className="flex justify-between mb-4"><h2 className={`text-lg font-bold ${t}`}>Movimientos</h2><button onClick={()=>openModal('movimiento')} className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white btn-press shadow-lg shadow-red-500/20">+ Nuevo</button></div>
          <div className={`${card} border ${bd} rounded-2xl overflow-hidden`}>
            <table className="w-full"><thead><tr className={`border-b ${bd}`}>
              <th className={`text-left px-4 py-3 text-[10px] uppercase ${t3}`}>Fecha</th><th className={`text-left px-4 py-3 text-[10px] uppercase ${t3}`}>Tipo</th><th className={`text-left px-4 py-3 text-[10px] uppercase ${t3}`}>Concepto</th><th className={`text-right px-4 py-3 text-[10px] uppercase ${t3}`}>Monto</th><th className={`text-right px-4 py-3 text-[10px] uppercase ${t3}`}>Acciones</th>
            </tr></thead><tbody className="divide-y divide-white/[0.04]">
              {state.movimientos.slice().reverse().map(m=>(
                <tr key={m.id}><td className={`px-4 py-3 text-xs ${t2}`}>{fmtDate(m.fecha)}</td><td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${m.tipo==='ingreso'?'bg-green-500/10 text-green-400':'bg-red-500/10 text-red-400'}`}>{m.tipo}</span></td><td className={`px-4 py-3 text-xs font-medium ${t}`}>{m.concepto}</td><td className={`px-4 py-3 text-xs font-bold text-right ${m.tipo==='ingreso'?'text-green-400':'text-red-400'}`}>{m.tipo==='ingreso'?'+':'-'}{fmt(m.monto)}</td><td className="px-4 py-3 text-right"><button onClick={()=>openModal('movimiento',m)} className={`text-xs ${t3} hover:${t}`}>Editar</button></td></tr>
              ))}
            </tbody></table>
          </div>
        </>}

        {/* PAGOS */}
        {tab==='pagos' && <>
          <div className="flex justify-between mb-4"><h2 className={`text-lg font-bold ${t}`}>Pagos</h2><button onClick={()=>openModal('pago')} className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white btn-press shadow-lg shadow-red-500/20">+ Nuevo</button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.pagos.sort((a,b)=>new Date(a.fecha).getTime()-new Date(b.fecha).getTime()).map(p=>{
              const v = p.estado!=='pagado' && new Date(p.fecha)<hoy;
              return(
                <div key={p.id} className={`${card} border ${v?'border-red-500/30':bd} rounded-2xl p-5 card-hover`}>
                  <div className="flex justify-between mb-2"><h3 className={`text-sm font-medium ${t}`}>{p.concepto}</h3><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.estado==='pagado'?'bg-green-500/10 text-green-400':v?'bg-red-500/10 text-red-400':'bg-yellow-500/10 text-yellow-400'}`}>{v?'vencido':p.estado}</span></div>
                  <p className={`text-xl font-bold ${p.tipo==='ingreso'?'text-green-400':'text-red-400'} mb-2`}>{p.tipo==='ingreso'?'+':'-'}{fmt(p.monto)}</p>
                  <p className={`text-xs ${t3} mb-3`}>{fmtDate(p.fecha)}</p>
                  <div className="flex gap-2">
                    {p.estado!=='pagado' && <button onClick={()=>markPagado(p.id)} className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 btn-press">Marcar Pagado</button>}
                    <button onClick={()=>openModal('pago',p)} className={`px-3 py-1.5 rounded-lg text-xs btn-press ${dark?'bg-white/5':'bg-gray-100'} ${t2}`}>Editar</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>}

        {/* CALENDARIO */}
        {tab==='cronograma' && <>
          <h2 className={`text-lg font-bold ${t} mb-2`}>Calendario de Pagos</h2>
          <p className={`text-xs ${t3} mb-6`}>Pagos los 15 y 30 de cada mes · Ago 2026 - Feb 2027</p>
          <div className="space-y-6">
            {calendarMonths.map(cm=>(
              <div key={cm.mes} className={`${card} border ${bd} rounded-2xl overflow-hidden`}>
                <div className={`p-4 border-b ${bd} flex justify-between items-center`}>
                  <h3 className={`text-sm font-semibold capitalize ${t}`}>{cm.nombre} 2026</h3>
                  <div className="flex gap-4 text-xs"><span className="text-green-400">+{fmt(cm.totalIng)}</span><span className="text-red-400">-{fmt(cm.totalEgr)}</span><span className={`font-bold ${cm.totalIng-cm.totalEgr>=0?'text-green-400':'text-red-400'}`}>Neto: {fmt(cm.totalIng-cm.totalEgr)}</span></div>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {[15,30].map(dia=>{
                    const pagosDia = cm.pagos.filter(p=>new Date(p.fecha).getDate()===dia);
                    const totalIng = pagosDia.filter(p=>p.tipo==='ingreso').reduce((s,p)=>s+p.monto,0);
                    const totalEgr = pagosDia.filter(p=>p.tipo==='egreso').reduce((s,p)=>s+p.monto,0);
                    return(
                      <div key={dia} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${dark?'bg-white/5':'bg-gray-100'}`}>
                              <span className={`text-xl font-bold ${t}`}>{dia}</span>
                              <span className={`text-[9px] ${t3}`}>{new Date(2026,cm.mes-1,dia).toLocaleDateString('es-CO',{weekday:'short'})}</span>
                            </div>
                            <div><p className={`text-xs font-semibold ${t}`}>Pagos del {dia}</p><p className={`text-[10px] ${t3}`}>{pagosDia.length} items</p></div>
                          </div>
                          <div className="text-right"><span className="text-xs text-green-400">+{fmt(totalIng)}</span><br/><span className="text-xs text-red-400">-{fmt(totalEgr)}</span></div>
                        </div>
                        <div className="space-y-2 ml-15">
                          {pagosDia.map(p=>(
                            <div key={p.id} className={`flex items-center gap-3 p-2 rounded-lg ${dark?'bg-white/[0.02]':'bg-gray-50'}`}>
                              <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] ${p.tipo==='ingreso'?'bg-green-500/10 text-green-400':'bg-red-500/10 text-red-400'}`}>{p.tipo==='ingreso'?'↑':'↓'}</div>
                              <span className={`text-xs flex-1 ${t}`}>{p.concepto}</span>
                              <span className={`text-xs font-bold ${p.tipo==='ingreso'?'text-green-400':'text-red-400'}`}>{p.tipo==='ingreso'?'+':'-'}{fmt(p.monto)}</span>
                              {p.estado!=='pagado' && <button onClick={()=>markPagado(p.id)} className="px-2 py-0.5 rounded text-[9px] bg-green-500/10 text-green-400 btn-press">Pagado</button>}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* BRECHAS */}
        {tab==='brechas' && <>
          <h2 className={`text-lg font-bold ${t} mb-2`}>Proyección 6 Meses</h2>
          <p className={`text-xs ${t3} mb-6`}>Análisis de brechas de liquidez</p>
          <div className={`${card} border ${bd} rounded-2xl p-5 mb-6`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`text-4xl font-bold ${runway>=8?'text-green-400':runway>=4?'text-yellow-400':'text-red-400'}`}>{runway}</div>
              <div><p className={`text-sm font-semibold ${t}`}>Meses de Runway</p><p className={`text-xs ${t3}`}>Disponible: {fmt(disp)} · Burn: {fmt(burn)}/mes</p></div>
            </div>
            <div className={`w-full h-4 rounded-full ${dark?'bg-white/5':'bg-gray-100'}`}><div className={`h-4 rounded-full ${runway>=8?'bg-green-500':runway>=4?'bg-yellow-500':'bg-red-500'}`} style={{width:`${Math.min(runway/12*100,100)}%`}}></div></div>
            <div className="flex justify-between mt-2 text-[10px]"><span className={t3}>0</span><span className={t3}>3</span><span className={t3}>6</span><span className={t3}>9</span><span className={t3}>12</span></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meses.map((m,i)=>(
              <div key={i} className={`${card} border ${m.brecha?'border-red-500/30':bd} rounded-2xl p-5 card-hover`}>
                <div className="flex justify-between items-start mb-3"><h3 className={`text-sm font-semibold capitalize ${t}`}>{m.mes}</h3>{m.brecha && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400">BRECHA</span>}</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs"><span className={t3}>Ingresos</span><span className="text-green-400">+{fmt(m.ing)}</span></div>
                  <div className="flex justify-between text-xs"><span className={t3}>Egresos</span><span className="text-red-400">-{fmt(m.egr)}</span></div>
                  <div className={`flex justify-between text-xs pt-2 border-t ${bd}`}><span className="font-semibold">Neto</span><span className={`font-bold ${m.ing-m.egr>=0?'text-green-400':'text-red-400'}`}>{fmt(m.ing-m.egr)}</span></div>
                  <div className={`flex justify-between text-sm pt-2 border-t ${bd}`}><span className="font-bold">Saldo</span><span className={`font-bold ${m.saldo>=0?'text-green-400':'text-red-400'}`}>{fmt(m.saldo)}</span></div>
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
            <div className={`p-5 border-b ${bd} flex justify-between`}><h3 className={`text-sm font-bold ${t}`}>{editId?'Editar':'Nuevo'} {modal==='proyecto'?'Proyecto':modal==='movimiento'?'Movimiento':'Pago'}</h3><button onClick={closeModal} className={t2}>✕</button></div>
            <div className="p-5 space-y-4">
              {modal==='proyecto' && <>
                <Input l="Nombre" v={fProyecto.nombre||''} on={v=>setFP({...fProyecto,nombre:v})}/>
                <Input l="Cliente" v={fProyecto.cliente||''} on={v=>setFP({...fProyecto,cliente:v})}/>
                <div className="grid grid-cols-2 gap-3">
                  <Select l="Estado" v={fProyecto.estado||'activo'} on={v=>setFP({...fProyecto,estado:v as EstadoProyecto})} opts={[{v:'planificacion',l:'Planificación'},{v:'activo',l:'Activo'},{v:'pausado',l:'Pausado'},{v:'completado',l:'Completado'}]}/>
                  <Input l="Valor Total" v={fProyecto.valor_total||''} on={v=>setFP({...fProyecto,valor_total:Number(v)})} tp="number"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input l="Fecha Inicio" v={fProyecto.fecha_inicio||''} on={v=>setFP({...fProyecto,fecha_inicio:v})} tp="date"/>
                  <Input l="Fecha Fin" v={fProyecto.fecha_fin||''} on={v=>setFP({...fProyecto,fecha_fin:v})} tp="date"/>
                </div>
                <Input l="Descripción" v={fProyecto.descripcion||''} on={v=>setFP({...fProyecto,descripcion:v})}/>
              </>}
              {modal==='movimiento' && <>
                <div className="grid grid-cols-2 gap-3">
                  <Select l="Tipo" v={fMov.tipo||'egreso'} on={v=>setFM({...fMov,tipo:v as TipoMovimiento})} opts={[{v:'ingreso',l:'Ingreso'},{v:'egreso',l:'Egreso'}]}/>
                  <Input l="Monto" v={fMov.monto||''} on={v=>setFM({...fMov,monto:Number(v)})} tp="number"/>
                </div>
                <Input l="Concepto" v={fMov.concepto||''} on={v=>setFM({...fMov,concepto:v})}/>
                <Input l="Fecha" v={fMov.fecha||''} on={v=>setFM({...fMov,fecha:v})} tp="date"/>
              </>}
              {modal==='pago' && <>
                <Input l="Concepto" v={fPago.concepto||''} on={v=>setFPago({...fPago,concepto:v})}/>
                <div className="grid grid-cols-2 gap-3">
                  <Select l="Tipo" v={fPago.tipo||'egreso'} on={v=>setFPago({...fPago,tipo:v as 'ingreso'|'egreso'})} opts={[{v:'ingreso',l:'Ingreso'},{v:'egreso',l:'Egreso'}]}/>
                  <Input l="Monto" v={fPago.monto||''} on={v=>setFPago({...fPago,monto:Number(v)})} tp="number"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input l="Fecha" v={fPago.fecha||''} on={v=>setFPago({...fPago,fecha:v})} tp="date"/>
                  <Select l="Estado" v={fPago.estado||'pendiente'} on={v=>setFPago({...fPago,estado:v as EstadoPago})} opts={[{v:'pendiente',l:'Pendiente'},{v:'programado',l:'Programado'},{v:'pagado',l:'Pagado'}]}/>
                </div>
                <Select l="Proyecto" v={fPago.proyecto_id||''} on={v=>setFPago({...fPago,proyecto_id:v})} opts={[{v:'',l:'Sin proyecto'},...state.proyectos.map(p=>({v:p.id,l:p.nombre}))]}/>
              </>}
              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium btn-press ${dark?'bg-white/5':'bg-gray-100'} ${t2}`}>Cancelar</button>
                <button onClick={saveItem} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white btn-press shadow-lg shadow-red-500/20">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}