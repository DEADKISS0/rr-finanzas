'use client';

import { useState, useEffect } from 'react';

// ============ TYPES ============
type EstadoProyecto = 'planificacion' | 'activo' | 'pausado' | 'completado' | 'cancelado';
type TipoMovimiento = 'ingreso' | 'egreso';
type EstadoPago = 'pendiente' | 'programado' | 'pagado' | 'vencido';

interface Proyecto {
  id: string;
  nombre: string;
  cliente: string;
  estado: EstadoProyecto;
  valor_total: number;
  valor_pagado: number;
  fecha_inicio: string;
  fecha_fin: string;
  descripcion: string;
  servicios: string[];
}

interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  concepto: string;
  monto: number;
  fecha: string;
  categoria: string;
  proyecto_id: string;
}

interface Pago {
  id: string;
  concepto: string;
  monto: number;
  fecha: string;
  estado: EstadoPago;
  tipo: 'ingreso' | 'egreso';
  proyecto_id: string;
}

// ============ INITIAL DATA (REAL STATE AS OF AUG 2026) ============
// NO se ha hecho ningún pago aún. Solo hay contrato y adelantos pendientes.

const INITIAL_PROYECTOS: Proyecto[] = [
  { id: 'wunder', nombre: 'Wunder', cliente: 'Wunder', estado: 'activo', valor_total: 9000000, valor_pagado: 0, fecha_inicio: '2026-07-01', fecha_fin: '2026-12-31', descripcion: 'Marketing digital completo: video, diseño, redes, web, pauta, SEO. Retroactivo día 60.', servicios: ['Producción Video', 'Piezas Gráficas', 'Branding', 'Gestión Redes', 'Desarrollo Web', 'Pauta', 'SEO'] },
  { id: 'boga', nombre: 'BOGA', cliente: 'BOGA', estado: 'activo', valor_total: 1200000, valor_pagado: 0, fecha_inicio: '2026-07-15', fecha_fin: '2026-09-30', descripcion: 'Setup completo. Adelanto pendiente de pago.', servicios: ['Branding', 'Producción Video', 'Diseño', 'Redes', 'Web', 'Pauta', 'SEO'] },
  { id: 'zapatos', nombre: 'ZAPATOS', cliente: 'ZAPATOS', estado: 'activo', valor_total: 900000, valor_pagado: 0, fecha_inicio: '2026-08-01', fecha_fin: '2026-10-31', descripcion: 'Mismo esquema que Wunder. 15-30 días después.', servicios: ['Producción Video', 'Piezas Gráficas', 'Branding', 'Gestión Redes', 'Desarrollo Web', 'Pauta', 'SEO'] },
  { id: 'amsterdam1', nombre: 'AMSTERDAM #1', cliente: 'AMSTERDAM', estado: 'activo', valor_total: 2000000, valor_pagado: 0, fecha_inicio: '2026-08-01', fecha_fin: '2026-11-30', descripcion: 'Producción de video y contenido. Sin pricing final.', servicios: ['Producción Video', 'Diseño'] },
  { id: 'amsterdam2', nombre: 'AMSTERDAM #2', cliente: 'AMSTERDAM', estado: 'activo', valor_total: 2000000, valor_pagado: 0, fecha_inicio: '2026-08-01', fecha_fin: '2026-11-30', descripcion: 'Producción de video y contenido. Sin pricing final.', servicios: ['Producción Video', 'Diseño'] },
  { id: 'amsterdam3', nombre: 'AMSTERDAM #3', cliente: 'AMSTERDAM', estado: 'activo', valor_total: 2000000, valor_pagado: 0, fecha_inicio: '2026-08-01', fecha_fin: '2026-11-30', descripcion: 'Producción de video y contenido. Sin pricing final.', servicios: ['Producción Video', 'Diseño'] },
  { id: 'globos', nombre: 'GLOBOS', cliente: 'GLOBOS', estado: 'activo', valor_total: 1200000, valor_pagado: 0, fecha_inicio: '2026-08-01', fecha_fin: '2026-10-31', descripcion: 'Servicios de marketing. Sin pricing final.', servicios: ['Producción Video', 'Diseño', 'Redes'] },
  { id: 'flores', nombre: 'FLORES', cliente: 'FLORES', estado: 'planificacion', valor_total: 0, valor_pagado: 0, fecha_inicio: '2026-09-01', fecha_fin: '2026-12-31', descripcion: 'En conversación. Sin pricing definido.', servicios: [] },
];

// Solo el movimiento real: saldo inicial en Bancolombia
const INITIAL_MOVIMIENTOS: Movimiento[] = [
  { id: 'mov001', tipo: 'ingreso', concepto: 'Saldo inicial Bancolombia', monto: 3600000, fecha: '2026-07-15', categoria: 'saldo', proyecto_id: '' },
];

// Pagos programados (Ninguno se ha ejecutado aún)
const INITIAL_PAGOS: Pago[] = [
  // BOGA - Adelanto pendiente
  { id: 'pago001', concepto: 'BOGA - Adelanto 50%', monto: 600000, fecha: '2026-08-20', estado: 'pendiente', tipo: 'ingreso', proyecto_id: 'boga' },
  { id: 'pago002', concepto: 'BOGA - Pago saldo 50%', monto: 600000, fecha: '2026-09-05', estado: 'programado', tipo: 'ingreso', proyecto_id: 'boga' },
  // Wunder - Primer desembolso
  { id: 'pago010', concepto: 'Wunder - Producción Q1 (video+foto+diseño)', monto: 746000, fecha: '2026-08-25', estado: 'pendiente', tipo: 'egreso', proyecto_id: 'wunder' },
  { id: 'pago011', concepto: 'Wunder - Desarrollo web 25%', monto: 472500, fecha: '2026-08-25', estado: 'pendiente', tipo: 'egreso', proyecto_id: 'wunder' },
  { id: 'pago012', concepto: 'Wunder - Pauta publicitaria 50%', monto: 300000, fecha: '2026-08-25', estado: 'pendiente', tipo: 'egreso', proyecto_id: 'wunder' },
  { id: 'pago013', concepto: 'Wunder - SEO & GEO 50%', monto: 150000, fecha: '2026-08-25', estado: 'pendiente', tipo: 'egreso', proyecto_id: 'wunder' },
  // Wunder - Segundo desembolso
  { id: 'pago014', concepto: 'Wunder - Producción Q2', monto: 746000, fecha: '2026-09-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'wunder' },
  { id: 'pago015', concepto: 'Wunder - Desarrollo web 25%', monto: 472500, fecha: '2026-09-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'wunder' },
  { id: 'pago016', concepto: 'Wunder - Pauta 50%', monto: 300000, fecha: '2026-09-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'wunder' },
  { id: 'pago017', concepto: 'Wunder - SEO 50%', monto: 150000, fecha: '2026-09-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'wunder' },
  // AMSTERDAM - Ingresos esperados
  { id: 'pago020', concepto: 'AMSTERDAM #1 - Adelanto', monto: 1000000, fecha: '2026-09-01', estado: 'programado', tipo: 'ingreso', proyecto_id: 'amsterdam1' },
  { id: 'pago021', concepto: 'AMSTERDAM #2 - Adelanto', monto: 1000000, fecha: '2026-09-01', estado: 'programado', tipo: 'ingreso', proyecto_id: 'amsterdam2' },
  { id: 'pago022', concepto: 'AMSTERDAM #3 - Adelanto', monto: 1000000, fecha: '2026-09-01', estado: 'programado', tipo: 'ingreso', proyecto_id: 'amsterdam3' },
  // AMSTERDAM - Egresos estimados
  { id: 'pago023', concepto: 'AMSTERDAM #1 - Producción video', monto: 500000, fecha: '2026-09-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'amsterdam1' },
  { id: 'pago024', concepto: 'AMSTERDAM #2 - Producción video', monto: 500000, fecha: '2026-09-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'amsterdam2' },
  { id: 'pago025', concepto: 'AMSTERDAM #3 - Producción video', monto: 500000, fecha: '2026-09-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'amsterdam3' },
  // GLOBOS
  { id: 'pago030', concepto: 'GLOBOS - Adelanto', monto: 600000, fecha: '2026-09-01', estado: 'programado', tipo: 'ingreso', proyecto_id: 'globos' },
  { id: 'pago031', concepto: 'GLOBOS - Producción', monto: 300000, fecha: '2026-09-15', estado: 'programado', tipo: 'egreso', proyecto_id: 'globos' },
  // Pagos fijos empresa
  { id: 'pago040', concepto: 'Manuel - Quincena 1', monto: 200000, fecha: '2026-08-15', estado: 'pendiente', tipo: 'egreso', proyecto_id: '' },
  { id: 'pago041', concepto: 'Samuel - Quincena 1', monto: 100000, fecha: '2026-08-15', estado: 'pendiente', tipo: 'egreso', proyecto_id: '' },
  { id: 'pago042', concepto: 'Manuel - Quincena 2', monto: 200000, fecha: '2026-08-30', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  { id: 'pago043', concepto: 'Samuel - Quincena 2', monto: 100000, fecha: '2026-08-30', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  { id: 'pago044', concepto: 'Manuel - Quincena 3', monto: 200000, fecha: '2026-09-15', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  { id: 'pago045', concepto: 'Samuel - Quincena 3', monto: 100000, fecha: '2026-09-15', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  { id: 'pago046', concepto: 'Manuel - Quincena 4', monto: 200000, fecha: '2026-09-30', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
  { id: 'pago047', concepto: 'Samuel - Quincena 4', monto: 100000, fecha: '2026-09-30', estado: 'programado', tipo: 'egreso', proyecto_id: '' },
];

// ============ LOCAL STORAGE ============
const STORAGE_KEY = 'rr-finanzas-v3';

interface AppState {
  proyectos: Proyecto[];
  movimientos: Movimiento[];
  pagos: Pago[];
}

function loadState(): AppState {
  if (typeof window === 'undefined') return { proyectos: INITIAL_PROYECTOS, movimientos: INITIAL_MOVIMIENTOS, pagos: INITIAL_PAGOS };
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch { /* ignore */ }
  }
  return { proyectos: INITIAL_PROYECTOS, movimientos: INITIAL_MOVIMIENTOS, pagos: INITIAL_PAGOS };
}

function saveState(state: AppState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ============ HELPERS ============
const fmt = (v: number) => '$' + Number(v || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 });
const fmtDate = (d: string) => {
  if (!d) return '--';
  try { return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' }); } catch { return d; }
};
const genId = () => Math.random().toString(36).substr(2, 9);

// ============ COMPONENT ============
export default function Dashboard() {
  const [state, setState] = useState<AppState>({ proyectos: [], movimientos: [], pagos: [] });
  const [tab, setTab] = useState<'resumen' | 'proyectos' | 'movimientos' | 'pagos' | 'cronograma' | 'brechas'>('resumen');
  const [modal, setModal] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [dark, setDark] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // Forms
  const [fProyecto, setFProyecto] = useState<Partial<Proyecto>>({});
  const [fMov, setFMov] = useState<Partial<Movimiento>>({});
  const [fPago, setFPago] = useState<Partial<Pago>>({});

  useEffect(() => {
    setState(loadState());
    setLoaded(true);
  }, []);

  const save = (newState: Partial<AppState>) => {
    const updated = { ...state, ...newState };
    setState(updated);
    saveState(updated);
  };

  const openModal = (type: string, item?: Proyecto | Movimiento | Pago) => {
    setModal(type);
    if (item) {
      setEditId(item.id);
      if (type === 'proyecto') setFProyecto(item as Proyecto);
      if (type === 'movimiento') setFMov(item as Movimiento);
      if (type === 'pago') setFPago(item as Pago);
    } else {
      setEditId(null);
      if (type === 'proyecto') setFProyecto({ estado: 'activo', servicios: [] });
      if (type === 'movimiento') setFMov({ tipo: 'egreso', fecha: new Date().toISOString().split('T')[0] });
      if (type === 'pago') setFPago({ tipo: 'egreso', estado: 'pendiente', fecha: new Date().toISOString().split('T')[0] });
    }
  };

  const closeModal = () => { setModal(null); setEditId(null); };

  const saveProyecto = () => {
    const p = { ...fProyecto, id: editId || 'proj_' + genId() } as Proyecto;
    const list = editId ? state.proyectos.map(x => x.id === editId ? p : x) : [...state.proyectos, p];
    save({ proyectos: list });
    closeModal();
  };

  const saveMovimiento = () => {
    const m = { ...fMov, id: editId || 'mov_' + genId() } as Movimiento;
    const list = editId ? state.movimientos.map(x => x.id === editId ? m : x) : [...state.movimientos, m];
    save({ movimientos: list });
    closeModal();
  };

  const savePago = () => {
    const p = { ...fPago, id: editId || 'pago_' + genId() } as Pago;
    const list = editId ? state.pagos.map(x => x.id === editId ? p : x) : [...state.pagos, p];
    save({ pagos: list });
    closeModal();
  };

  const deleteItem = (type: 'proyectos' | 'movimientos' | 'pagos', id: string) => {
    if (!confirm('¿Eliminar este registro?')) return;
    save({ [type]: state[type].filter((x: Proyecto | Movimiento | Pago) => x.id !== id) });
  };

  const markPagado = (id: string) => {
    save({ pagos: state.pagos.map(p => p.id === id ? { ...p, estado: 'pagado' as EstadoPago } : p) });
  };

  // ============ CALCULATIONS ============
  const hoy = new Date();
  const totalIngresos = state.movimientos.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0);
  const totalEgresos = state.movimientos.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0);
  const disponible = totalIngresos - totalEgresos;
  const burnMensual = 500000;
  const runway = disponible > 0 ? Math.round((disponible / burnMensual) * 10) / 10 : 0;

  // Proyección 6 meses
  const mesesProyeccion: { mes: string; ingresos: number; egresos: number; saldo: number; brecha: boolean }[] = [];
  let saldoAcumulado = disponible;
  for (let i = 0; i < 6; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
    const mesStr = fecha.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + i + 1, 0);
    
    const pagosMes = state.pagos.filter(p => {
      const f = new Date(p.fecha);
      return f >= fecha && f <= finMes && p.estado !== 'pagado';
    });
    
    const ingMes = pagosMes.filter(p => p.tipo === 'ingreso').reduce((s, p) => s + p.monto, 0);
    const egrMes = pagosMes.filter(p => p.tipo === 'egreso').reduce((s, p) => s + p.monto, 0);
    saldoAcumulado += ingMes - egrMes;
    
    mesesProyeccion.push({ mes: mesStr, ingresos: ingMes, egresos: egrMes, saldo: saldoAcumulado, brecha: saldoAcumulado < 0 });
  }

  // Pagos próximos
  const pagosProximos = state.pagos.filter(p => p.estado !== 'pagado').sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()).slice(0, 15);

  // Export Excel
  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    const wsProy = XLSX.utils.json_to_sheet(state.proyectos.map(p => ({ Proyecto: p.nombre, Cliente: p.cliente, Estado: p.estado, 'Valor Total': p.valor_total, Pagado: p.valor_pagado, Pendiente: p.valor_total - p.valor_pagado, 'Fecha Inicio': p.fecha_inicio, 'Fecha Fin': p.fecha_fin, Descripción: p.descripcion })));
    XLSX.utils.book_append_sheet(wb, wsProy, 'Proyectos');

    const wsMov = XLSX.utils.json_to_sheet(state.movimientos.map(m => ({ Fecha: m.fecha, Tipo: m.tipo, Concepto: m.concepto, Monto: m.tipo === 'ingreso' ? m.monto : -m.monto, Categoría: m.categoria, Proyecto: m.proyecto_id })));
    XLSX.utils.book_append_sheet(wb, wsMov, 'Movimientos');

    const wsPagos = XLSX.utils.json_to_sheet(state.pagos.map(p => ({ Concepto: p.concepto, Tipo: p.tipo, Monto: p.monto, Fecha: p.fecha, Estado: p.estado, Proyecto: p.proyecto_id })));
    XLSX.utils.book_append_sheet(wb, wsPagos, 'Pagos Programados');

    XLSX.writeFile(wb, `RR_Finanzas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Mouse tracking for interactive background
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
  };

  if (!loaded) return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const bg = dark ? 'bg-[#0a0a0f]' : 'bg-gray-50';
  const card = dark ? 'bg-[#12121a]' : 'bg-white';
  const border = dark ? 'border-white/[0.06]' : 'border-gray-200';
  const txt = dark ? 'text-white' : 'text-gray-900';
  const txt2 = dark ? 'text-gray-400' : 'text-gray-500';
  const txt3 = dark ? 'text-gray-600' : 'text-gray-400';
  const inp = dark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900';

  const Input = ({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string }) => (
    <div><label className={`text-xs font-medium ${txt2} mb-1 block`}>{label}</label><input type={type} value={value || ''} onChange={e => onChange(e.target.value)} className={`w-full px-3 py-2 rounded-lg text-sm ${inp} border focus:border-red-500 focus:ring-1 focus:ring-red-500/20 outline-none`} placeholder={placeholder} /></div>
  );

  const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
    <div><label className={`text-xs font-medium ${txt2} mb-1 block`}>{label}</label><select value={value} onChange={e => onChange(e.target.value)} className={`w-full px-3 py-2 rounded-lg text-sm ${inp} border focus:border-red-500 outline-none`}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
  );

  return (
    <div className={`min-h-screen ${bg} bg-gradient-interactive`} onMouseMove={handleMouseMove}>
      {/* HEADER */}
      <header className={`border-b ${border} ${dark ? 'bg-[#0a0a0f]/90' : 'bg-white/90'} backdrop-blur-xl sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="RR ALIADOS" className="w-9 h-9 rounded-lg" />
            <div><h1 className={`text-sm font-bold ${txt}`}>RR ALIADOS</h1><p className={`text-[10px] ${txt3}`}>Control Financiero</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportExcel} className={`px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 btn-press shadow-lg shadow-green-500/20`}>Exportar Excel</button>
            <button onClick={() => setDark(!dark)} className={`p-2.5 rounded-xl btn-press ${dark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}>{dark ? '☀️' : '🌙'}</button>
          </div>
        </div>
      </header>

      {/* TABS */}
      <div className={`border-b ${border} sticky top-[53px] z-30 glass ${dark ? 'bg-[#0a0a0f]/80' : 'bg-white/80'}`}>
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {([['resumen', 'Resumen'], ['proyectos', 'Proyectos'], ['movimientos', 'Movimientos'], ['pagos', 'Pagos'], ['cronograma', 'Cronograma'], ['brechas', 'Brechas 6M']] as [string, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k as typeof tab)} className={`px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap tab-indicator ${tab === k ? 'active text-red-400' : `border-transparent ${txt2} hover:${txt}`}`}>{l}</button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* ============ RESUMEN ============ */}
        {tab === 'resumen' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className={`${card} border ${border} rounded-2xl p-5 card-hover animate-fadeInUp stagger-1`}><p className={`text-[10px] uppercase tracking-widest ${txt3} mb-2`}>Disponible</p><p className={`text-2xl font-bold ${txt} count-up`}>{fmt(disponible)}</p><p className={`text-xs ${txt3}`}>Bancolombia</p></div>
              <div className={`${card} border ${border} rounded-2xl p-5 card-hover animate-fadeInUp stagger-2`}><p className={`text-[10px] uppercase tracking-widest ${txt3} mb-2`}>Runway</p><p className={`text-2xl font-bold ${runway >= 8 ? 'text-green-400' : runway >= 4 ? 'text-yellow-400' : 'text-red-400'} count-up`}>{runway} meses</p><p className={`text-xs ${txt3}`}>Burn {fmt(burnMensual)}/mes</p></div>
              <div className={`${card} border ${border} rounded-2xl p-5 card-hover animate-fadeInUp stagger-3`}><p className={`text-[10px] uppercase tracking-widest ${txt3} mb-2`}>Proyectos Activos</p><p className={`text-2xl font-bold ${txt} count-up`}>{state.proyectos.filter(p => p.estado === 'activo').length}</p><p className={`text-xs ${txt3}`}>{state.proyectos.filter(p => p.estado === 'activo').map(p => p.nombre).join(', ')}</p></div>
              <div className={`${card} border ${border} rounded-2xl p-5 card-hover animate-fadeInUp stagger-4`}><p className={`text-[10px] uppercase tracking-widest ${txt3} mb-2`}>Pagos Pendientes</p><p className={`text-2xl font-bold ${txt} count-up`}>{state.pagos.filter(p => p.estado !== 'pagado').length}</p><p className={`text-xs ${txt3}`}>{fmt(state.pagos.filter(p => p.estado !== 'pagado' && p.tipo === 'egreso').reduce((s, p) => s + p.monto, 0))} por pagar</p></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className={`${card} border ${border} rounded-2xl overflow-hidden`}>
                <div className={`p-4 border-b ${border}`}><h3 className={`text-sm font-semibold ${txt}`}>Próximos Pagos</h3></div>
                <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.04]">
                  {pagosProximos.map(p => {
                    const dias = Math.ceil((new Date(p.fecha).getTime() - Date.now()) / 86400000);
                    return (
                      <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center ${dias < 0 ? 'bg-red-500/10' : dias <= 7 ? 'bg-yellow-500/10' : 'bg-blue-500/10'}`}>
                          <span className={`text-sm font-bold ${dias < 0 ? 'text-red-400' : dias <= 7 ? 'text-yellow-400' : 'text-blue-400'}`}>{new Date(p.fecha).getDate()}</span>
                          <span className={`text-[8px] ${txt3}`}>{new Date(p.fecha).toLocaleDateString('es-CO', { month: 'short' })}</span>
                        </div>
                        <div className="flex-1"><p className={`text-xs font-medium ${txt} truncate`}>{p.concepto}</p><p className={`text-[10px] ${dias < 0 ? 'text-red-400' : txt3}`}>{dias < 0 ? `Vencido ${-dias}d` : `En ${dias}d`}</p></div>
                        <span className={`text-xs font-bold ${p.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}`}>{p.tipo === 'ingreso' ? '+' : '-'}{fmt(p.monto)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`${card} border ${border} rounded-2xl overflow-hidden`}>
                <div className={`p-4 border-b ${border}`}><h3 className={`text-sm font-semibold ${txt}`}>Últimos Movimientos</h3></div>
                <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.04]">
                  {state.movimientos.slice(-10).reverse().map(m => (
                    <div key={m.id} className="px-4 py-3 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${m.tipo === 'ingreso' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{m.tipo === 'ingreso' ? '↑' : '↓'}</div>
                      <div className="flex-1"><p className={`text-xs font-medium ${txt}`}>{m.concepto}</p><p className={`text-[10px] ${txt3}`}>{fmtDate(m.fecha)}</p></div>
                      <span className={`text-xs font-bold ${m.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}`}>{m.tipo === 'ingreso' ? '+' : '-'}{fmt(m.monto)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ============ PROYECTOS ============ */}
        {tab === 'proyectos' && (
          <>
            <div className="flex justify-between mb-4"><h2 className={`text-lg font-bold ${txt}`}>Proyectos</h2><button onClick={() => openModal('proyecto')} className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 btn-press shadow-lg shadow-red-500/20">+ Nuevo Proyecto</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.proyectos.map(p => (
                <div key={p.id} className={`${card} border ${border} rounded-2xl p-5`}>
                  <div className="flex justify-between mb-3"><div><h3 className={`text-sm font-semibold ${txt}`}>{p.nombre}</h3><p className={`text-xs ${txt3}`}>{p.cliente}</p></div><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.estado === 'activo' ? 'bg-green-500/10 text-green-400' : p.estado === 'planificacion' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'}`}>{p.estado}</span></div>
                  <p className={`text-xs ${txt2} mb-3`}>{p.descripcion}</p>
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-xs"><span className={txt3}>Valor Total</span><span className={txt}>{fmt(p.valor_total)}</span></div>
                    <div className="flex justify-between text-xs"><span className={txt3}>Pagado</span><span className="text-green-400">{fmt(p.valor_pagado)}</span></div>
                    <div className="flex justify-between text-xs"><span className={txt3}>Pendiente</span><span className="text-yellow-400">{fmt(p.valor_total - p.valor_pagado)}</span></div>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 mb-3"><div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${p.valor_total > 0 ? (p.valor_pagado / p.valor_total) * 100 : 0}%` }}></div></div>
                  {p.servicios.length > 0 && <div className="flex flex-wrap gap-1 mb-3">{p.servicios.map(s => <span key={s} className={`px-2 py-0.5 rounded text-[9px] ${dark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>{s}</span>)}</div>}
                  <div className="flex gap-2"><button onClick={() => openModal('proyecto', p)} className={`flex-1 px-3 py-1.5 rounded-lg text-xs ${dark ? 'bg-white/5' : 'bg-gray-100'} ${txt2}`}>Editar</button><button onClick={() => deleteItem('proyectos', p.id)} className="px-3 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-400">Eliminar</button></div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ============ MOVIMIENTOS ============ */}
        {tab === 'movimientos' && (
          <>
            <div className="flex justify-between mb-4"><h2 className={`text-lg font-bold ${txt}`}>Movimientos</h2><button onClick={() => openModal('movimiento')} className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 btn-press shadow-lg shadow-red-500/20">+ Nuevo Movimiento</button></div>
            <div className={`${card} border ${border} rounded-2xl overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className={`border-b ${border}`}>
                    <th className={`text-left px-4 py-3 text-[10px] uppercase ${txt3}`}>Fecha</th>
                    <th className={`text-left px-4 py-3 text-[10px] uppercase ${txt3}`}>Tipo</th>
                    <th className={`text-left px-4 py-3 text-[10px] uppercase ${txt3}`}>Concepto</th>
                    <th className={`text-right px-4 py-3 text-[10px] uppercase ${txt3}`}>Monto</th>
                    <th className={`text-right px-4 py-3 text-[10px] uppercase ${txt3}`}>Acciones</th>
                  </tr></thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {state.movimientos.slice().reverse().map(m => (
                      <tr key={m.id}>
                        <td className={`px-4 py-3 text-xs ${txt2}`}>{fmtDate(m.fecha)}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${m.tipo === 'ingreso' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{m.tipo}</span></td>
                        <td className={`px-4 py-3 text-xs font-medium ${txt}`}>{m.concepto}</td>
                        <td className={`px-4 py-3 text-xs font-bold text-right ${m.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}`}>{m.tipo === 'ingreso' ? '+' : '-'}{fmt(m.monto)}</td>
                        <td className="px-4 py-3 text-right"><button onClick={() => openModal('movimiento', m)} className={`text-xs ${txt3} hover:${txt}`}>Editar</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ============ PAGOS ============ */}
        {tab === 'pagos' && (
          <>
            <div className="flex justify-between mb-4"><h2 className={`text-lg font-bold ${txt}`}>Pagos Programados</h2><button onClick={() => openModal('pago')} className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 btn-press shadow-lg shadow-red-500/20">+ Nuevo Pago</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.pagos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()).map(p => {
                const vencido = p.estado !== 'pagado' && new Date(p.fecha) < hoy;
                return (
                  <div key={p.id} className={`${card} border ${vencido ? 'border-red-500/30' : border} rounded-2xl p-5`}>
                    <div className="flex justify-between mb-2"><h3 className={`text-sm font-medium ${txt}`}>{p.concepto}</h3><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.estado === 'pagado' ? 'bg-green-500/10 text-green-400' : vencido ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{vencido ? 'vencido' : p.estado}</span></div>
                    <p className={`text-xl font-bold ${p.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'} mb-2`}>{p.tipo === 'ingreso' ? '+' : '-'}{fmt(p.monto)}</p>
                    <p className={`text-xs ${txt3} mb-3`}>{fmtDate(p.fecha)}</p>
                    <div className="flex gap-2">
                      {p.estado !== 'pagado' && <button onClick={() => markPagado(p.id)} className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400">Marcar Pagado</button>}
                      <button onClick={() => openModal('pago', p)} className={`px-3 py-1.5 rounded-lg text-xs ${dark ? 'bg-white/5' : 'bg-gray-100'} ${txt2}`}>Editar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ============ CRONOGRAMA ============ */}
        {tab === 'cronograma' && (
          <>
            <h2 className={`text-lg font-bold ${txt} mb-4`}>Cronograma Ago-Dic 2026</h2>
            <div className="space-y-6">
              {[8, 9, 10, 11, 12].map(mes => {
                const pagosMes = state.pagos.filter(p => { const f = new Date(p.fecha); return f.getMonth() + 1 === mes && f.getFullYear() === 2026 && p.estado !== 'pagado'; }).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
                const totalIng = pagosMes.filter(p => p.tipo === 'ingreso').reduce((s, p) => s + p.monto, 0);
                const totalEgr = pagosMes.filter(p => p.tipo === 'egreso').reduce((s, p) => s + p.monto, 0);
                const nMes = new Date(2026, mes - 1).toLocaleDateString('es-CO', { month: 'long' });
                return (
                  <div key={mes} className={`${card} border ${border} rounded-2xl overflow-hidden`}>
                    <div className={`p-4 border-b ${border} flex justify-between items-center`}>
                      <h3 className={`text-sm font-semibold capitalize ${txt}`}>{nMes} 2026</h3>
                      <div className="flex gap-4 text-xs"><span className="text-green-400">+{fmt(totalIng)}</span><span className="text-red-400">-{fmt(totalEgr)}</span><span className={`font-bold ${totalIng - totalEgr >= 0 ? 'text-green-400' : 'text-red-400'}`}>Neto: {fmt(totalIng - totalEgr)}</span></div>
                    </div>
                    <div className="divide-y divide-white/[0.04]">
                      {pagosMes.map(p => (
                        <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                          <div className="w-10 text-center"><span className={`text-lg font-bold ${txt}`}>{new Date(p.fecha).getDate()}</span><br /><span className={`text-[9px] ${txt3}`}>{new Date(p.fecha).toLocaleDateString('es-CO', { weekday: 'short' })}</span></div>
                          <div className="flex-1"><p className={`text-xs font-medium ${txt}`}>{p.concepto}</p></div>
                          <span className={`text-xs font-bold ${p.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}`}>{p.tipo === 'ingreso' ? '+' : '-'}{fmt(p.monto)}</span>
                        </div>
                      ))}
                      {pagosMes.length === 0 && <div className="px-4 py-6 text-center"><p className={`text-xs ${txt3}`}>Sin pagos programados</p></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ============ BRECHAS ============ */}
        {tab === 'brechas' && (
          <>
            <h2 className={`text-lg font-bold ${txt} mb-2`}>Proyección 6 Meses</h2>
            <p className={`text-xs ${txt3} mb-6`}>Análisis de brechas de dinero basado en pagos programados</p>
            
            <div className={`${card} border ${border} rounded-2xl p-5 mb-6`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`text-4xl font-bold ${runway >= 8 ? 'text-green-400' : runway >= 4 ? 'text-yellow-400' : 'text-red-400'}`}>{runway}</div>
                <div><p className={`text-sm font-semibold ${txt}`}>Meses de Runway</p><p className={`text-xs ${txt3}`}>Disponible: {fmt(disponible)} · Burn: {fmt(burnMensual)}/mes</p></div>
              </div>
              <div className={`w-full h-4 rounded-full ${dark ? 'bg-white/5' : 'bg-gray-100'}`}>
                <div className={`h-4 rounded-full ${runway >= 8 ? 'bg-green-500' : runway >= 4 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(runway / 12 * 100, 100)}%` }}></div>
              </div>
              <div className="flex justify-between mt-2 text-[10px]"><span className={txt3}>0</span><span className={txt3}>3</span><span className={txt3}>6</span><span className={txt3}>9</span><span className={txt3}>12</span></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mesesProyeccion.map((m, i) => (
                <div key={i} className={`${card} border ${m.brecha ? 'border-red-500/30' : border} rounded-2xl p-5`}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className={`text-sm font-semibold capitalize ${txt}`}>{m.mes}</h3>
                    {m.brecha && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400">BRECHA</span>}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs"><span className={txt3}>Ingresos</span><span className="text-green-400">+{fmt(m.ingresos)}</span></div>
                    <div className="flex justify-between text-xs"><span className={txt3}>Egresos</span><span className="text-red-400">-{fmt(m.egresos)}</span></div>
                    <div className={`flex justify-between text-xs pt-2 border-t ${border}`}><span className="font-semibold">Neto</span><span className={`font-bold ${m.ingresos - m.egresos >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(m.ingresos - m.egresos)}</span></div>
                    <div className={`flex justify-between text-sm pt-2 border-t ${border}`}><span className="font-bold">Saldo</span><span className={`font-bold ${m.saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(m.saldo)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* ============ MODALS ============ */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className={`${card} border ${border} rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto modal-content shadow-2xl`}>
            <div className={`p-5 border-b ${border} flex justify-between`}><h3 className={`text-sm font-bold ${txt}`}>{editId ? 'Editar' : 'Nuevo'} {modal === 'proyecto' ? 'Proyecto' : modal === 'movimiento' ? 'Movimiento' : 'Pago'}</h3><button onClick={closeModal} className={txt2}>✕</button></div>
            <div className="p-5 space-y-4">
              {modal === 'proyecto' && <>
                <Input label="Nombre" value={fProyecto.nombre || ''} onChange={v => setFProyecto({...fProyecto, nombre: v})} />
                <Input label="Cliente" value={fProyecto.cliente || ''} onChange={v => setFProyecto({...fProyecto, cliente: v})} />
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Estado" value={fProyecto.estado || 'activo'} onChange={v => setFProyecto({...fProyecto, estado: v as EstadoProyecto})} options={[{value:'planificacion',label:'Planificación'},{value:'activo',label:'Activo'},{value:'pausado',label:'Pausado'},{value:'completado',label:'Completado'},{value:'cancelado',label:'Cancelado'}]} />
                  <Input label="Valor Total" value={fProyecto.valor_total || ''} onChange={v => setFProyecto({...fProyecto, valor_total: Number(v)})} type="number" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Fecha Inicio" value={fProyecto.fecha_inicio || ''} onChange={v => setFProyecto({...fProyecto, fecha_inicio: v})} type="date" />
                  <Input label="Fecha Fin" value={fProyecto.fecha_fin || ''} onChange={v => setFProyecto({...fProyecto, fecha_fin: v})} type="date" />
                </div>
                <Input label="Descripción" value={fProyecto.descripcion || ''} onChange={v => setFProyecto({...fProyecto, descripcion: v})} />
              </>}
              {modal === 'movimiento' && <>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Tipo" value={fMov.tipo || 'egreso'} onChange={v => setFMov({...fMov, tipo: v as TipoMovimiento})} options={[{value:'ingreso',label:'Ingreso'},{value:'egreso',label:'Egreso'}]} />
                  <Input label="Monto" value={fMov.monto || ''} onChange={v => setFMov({...fMov, monto: Number(v)})} type="number" />
                </div>
                <Input label="Concepto" value={fMov.concepto || ''} onChange={v => setFMov({...fMov, concepto: v})} />
                <Input label="Fecha" value={fMov.fecha || ''} onChange={v => setFMov({...fMov, fecha: v})} type="date" />
                <Select label="Proyecto" value={fMov.proyecto_id || ''} onChange={v => setFMov({...fMov, proyecto_id: v})} options={[{value:'',label:'Sin proyecto'},...state.proyectos.map(p => ({value:p.id,label:p.nombre}))]} />
              </>}
              {modal === 'pago' && <>
                <Input label="Concepto" value={fPago.concepto || ''} onChange={v => setFPago({...fPago, concepto: v})} />
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Tipo" value={fPago.tipo || 'egreso'} onChange={v => setFPago({...fPago, tipo: v as 'ingreso' | 'egreso'})} options={[{value:'ingreso',label:'Ingreso'},{value:'egreso',label:'Egreso'}]} />
                  <Input label="Monto" value={fPago.monto || ''} onChange={v => setFPago({...fPago, monto: Number(v)})} type="number" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Fecha" value={fPago.fecha || ''} onChange={v => setFPago({...fPago, fecha: v})} type="date" />
                  <Select label="Estado" value={fPago.estado || 'pendiente'} onChange={v => setFPago({...fPago, estado: v as EstadoPago})} options={[{value:'pendiente',label:'Pendiente'},{value:'programado',label:'Programado'},{value:'pagado',label:'Pagado'}]} />
                </div>
                <Select label="Proyecto" value={fPago.proyecto_id || ''} onChange={v => setFPago({...fPago, proyecto_id: v})} options={[{value:'',label:'Sin proyecto'},...state.proyectos.map(p => ({value:p.id,label:p.nombre}))]} />
              </>}
              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium btn-press ${dark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'} ${txt2}`}>Cancelar</button>
                <button onClick={() => modal === 'proyecto' ? saveProyecto() : modal === 'movimiento' ? saveMovimiento() : savePago()} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 btn-press shadow-lg shadow-red-500/20">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}