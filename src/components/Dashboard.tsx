'use client';

import { useState, useEffect, useCallback } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import type { Proyecto, Movimiento, PagoProgramado, DashboardKPIs, FinanzasState, EstadoProyecto, TipoMovimiento, CategoriaMovimiento, EstadoPago } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

type Tab = 'dashboard' | 'proyectos' | 'movimientos' | 'pagos' | 'calendario';
type ModalType = 'proyecto' | 'movimiento' | 'pago' | null;

const formatCOP = (v: number) => '$' + Number(v || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 });
const formatDate = (d: string) => {
  if (!d) return '--';
  try { return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; }
};

const ESTADO_COLORS: Record<string, string> = {
  planificacion: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  activo: 'bg-green-500/10 text-green-400 border-green-500/20',
  pausado: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  completado: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  cancelado: 'bg-red-500/10 text-red-400 border-red-500/20',
  pendiente: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  programado: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  pagado: 'bg-green-500/10 text-green-400 border-green-500/20',
  vencido: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const CATEGORIAS: { value: CategoriaMovimiento; label: string }[] = [
  { value: 'servicios', label: 'Servicios' },
  { value: 'produccion', label: 'Producción' },
  { value: 'desarrollo', label: 'Desarrollo' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'operaciones', label: 'Operaciones' },
  { value: 'personal', label: 'Personal' },
  { value: 'proveedores', label: 'Proveedores' },
  { value: 'impuestos', label: 'Impuestos' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'servicios_publicos', label: 'Servicios Públicos' },
  { value: 'software', label: 'Software' },
  { value: 'otros', label: 'Otros' },
];

export default function Dashboard() {
  const [state, setState] = useState<FinanzasState | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [modal, setModal] = useState<ModalType>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // Form states
  const [proyectoForm, setProyectoForm] = useState<Partial<Proyecto>>({});
  const [movimientoForm, setMovimientoForm] = useState<Partial<Movimiento>>({});
  const [pagoForm, setPagoForm] = useState<Partial<PagoProgramado>>({});

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (e) {
      console.error('Error fetching state:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchState(); }, [fetchState]);

  const saveProyecto = async (data: Partial<Proyecto>) => {
    setSaving(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...data, id: editingId } : data;
      await fetch('/api/proyectos', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      await fetchState();
      closeModal();
    } finally { setSaving(false); }
  };

  const saveMovimiento = async (data: Partial<Movimiento>) => {
    setSaving(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...data, id: editingId } : data;
      await fetch('/api/movimientos', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      await fetchState();
      closeModal();
    } finally { setSaving(false); }
  };

  const savePago = async (data: Partial<PagoProgramado>) => {
    setSaving(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...data, id: editingId } : data;
      await fetch('/api/pagos', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      await fetchState();
      closeModal();
    } finally { setSaving(false); }
  };

  const deleteItem = async (type: 'proyectos' | 'movimientos' | 'pagos', id: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;
    await fetch(`/api/${type}?id=${id}`, { method: 'DELETE' });
    await fetchState();
  };

  const openModal = (type: ModalType, item?: Proyecto | Movimiento | PagoProgramado) => {
    setModal(type);
    if (item) {
      setEditingId(item.id);
      if (type === 'proyecto') setProyectoForm(item as Proyecto);
      if (type === 'movimiento') setMovimientoForm(item as Movimiento);
      if (type === 'pago') setPagoForm(item as PagoProgramado);
    } else {
      setEditingId(null);
      if (type === 'proyecto') setProyectoForm({ estado: 'planificacion', servicios: [] });
      if (type === 'movimiento') setMovimientoForm({ tipo: 'egreso', categoria: 'otros', fecha: new Date().toISOString().split('T')[0] });
      if (type === 'pago') setPagoForm({ estado: 'pendiente', fecha_programada: new Date().toISOString().split('T')[0] });
    }
  };

  const closeModal = () => { setModal(null); setEditingId(null); setProyectoForm({}); setMovimientoForm({}); setPagoForm({}); };

  const exportExcel = () => { window.open('/api/export', '_blank'); };

  const importExcel = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/import', { method: 'POST', body: formData });
    if (res.ok) {
      await fetchState();
      alert('Datos importados correctamente');
    }
  };

  if (loading || !state) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-[#0a0a0f]' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative"><div className="w-16 h-16 border-4 border-red-500/20 rounded-full"></div><div className="absolute top-0 left-0 w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div></div>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cargando RR ALIADOS...</p>
        </div>
      </div>
    );
  }

  const { proyectos, movimientos, pagos, kpis } = state;
  const bg = darkMode ? 'bg-[#0a0a0f]' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-[#12121a]' : 'bg-white';
  const borderColor = darkMode ? 'border-white/[0.06]' : 'border-gray-200';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const textMuted = darkMode ? 'text-gray-600' : 'text-gray-400';
  const inputBg = darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200';
  const inputFocus = 'focus:border-red-500 focus:ring-1 focus:ring-red-500/20';

  return (
    <div className={`min-h-screen ${bg}`}>
      {/* Header */}
      <header className={`border-b ${borderColor} ${darkMode ? 'bg-[#0a0a0f]/90' : 'bg-white/90'} backdrop-blur-xl sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/20"><span className="text-white font-bold text-xs">RR</span></div>
            <div><h1 className={`text-sm font-bold tracking-tight ${textPrimary}`}>RR ALIADOS</h1><p className={`text-[10px] ${textMuted}`}>Gestión Financiera</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportExcel} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${darkMode ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-green-50 text-green-600 hover:bg-green-100'} transition-all`}>Exportar Excel</button>
            <label className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${darkMode ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'} transition-all`}>
              Importar Excel<input type="file" accept=".xlsx,.xls" onChange={(e) => e.target.files?.[0] && importExcel(e.target.files[0])} className="hidden" />
            </label>
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'} transition-all`}>{darkMode ? '☀️' : '🌙'}</button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className={`border-b ${borderColor} ${darkMode ? 'bg-[#0a0a0f]' : 'bg-white'} sticky top-[57px] z-30`}>
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {([['dashboard', 'Dashboard'], ['proyectos', 'Proyectos'], ['movimientos', 'Movimientos'], ['pagos', 'Pagos'], ['calendario', 'Calendario']] as [Tab, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} className={`px-4 py-3 text-xs font-medium border-b-2 transition-all ${tab === key ? 'border-red-500 text-red-400' : `border-transparent ${textSecondary} hover:${textPrimary}`}`}>{label}</button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* DASHBOARD TAB */}
        {tab === 'dashboard' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Disponible', value: formatCOP(kpis.disponible_hoy), sub: 'Bancolombia', color: 'from-red-500/10' },
                { label: 'Ingresos Mes', value: formatCOP(kpis.total_ingresos_mes), sub: `${proyectos.filter(p=>p.estado==='activo').length} proyectos`, color: 'from-green-500/10' },
                { label: 'Egresos Mes', value: formatCOP(kpis.total_egresos_mes), sub: `${kpis.pagos_pendientes} pagos pendientes`, color: 'from-red-500/10' },
                { label: 'Runway', value: `${kpis.runway_meses} meses`, sub: kpis.pagos_vencidos > 0 ? `${kpis.pagos_vencidos} vencidos` : 'Al día', color: kpis.runway_meses >= 8 ? 'from-green-500/10' : 'from-yellow-500/10' },
              ].map((kpi, i) => (
                <div key={i} className={`${cardBg} border ${borderColor} rounded-2xl p-5 relative overflow-hidden hover:border-red-500/20 transition-all`}>
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${kpi.color} to-transparent rounded-bl-[30px]`}></div>
                  <p className={`text-[10px] font-semibold uppercase tracking-widest ${textMuted} mb-2`}>{kpi.label}</p>
                  <p className={`text-xl font-bold ${textPrimary}`}>{kpi.value}</p>
                  <p className={`text-[10px] ${textMuted} mt-1`}>{kpi.sub}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <button onClick={() => openModal('proyecto')} className={`${cardBg} border ${borderColor} rounded-xl p-4 text-left hover:border-green-500/30 transition-all group`}>
                <div className="text-green-400 mb-2">+</div>
                <p className={`text-xs font-medium ${textPrimary}`}>Nuevo Proyecto</p>
              </button>
              <button onClick={() => openModal('movimiento')} className={`${cardBg} border ${borderColor} rounded-xl p-4 text-left hover:border-blue-500/30 transition-all group`}>
                <div className="text-blue-400 mb-2">+</div>
                <p className={`text-xs font-medium ${textPrimary}`}>Registrar Movimiento</p>
              </button>
              <button onClick={() => openModal('pago')} className={`${cardBg} border ${borderColor} rounded-xl p-4 text-left hover:border-yellow-500/30 transition-all group`}>
                <div className="text-yellow-400 mb-2">+</div>
                <p className={`text-xs font-medium ${textPrimary}`}>Programar Pago</p>
              </button>
              <button onClick={exportExcel} className={`${cardBg} border ${borderColor} rounded-xl p-4 text-left hover:border-purple-500/30 transition-all group`}>
                <div className="text-purple-400 mb-2">↓</div>
                <p className={`text-xs font-medium ${textPrimary}`}>Exportar Excel</p>
              </button>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className={`${cardBg} border ${borderColor} rounded-2xl overflow-hidden`}>
                <div className={`p-4 border-b ${borderColor}`}><h3 className={`text-sm font-semibold ${textPrimary}`}>Últimos Movimientos</h3></div>
                <div className="divide-y divide-white/[0.04]">
                  {movimientos.slice(-8).reverse().map(m => (
                    <div key={m.id} className="px-4 py-3 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${m.tipo === 'ingreso' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{m.tipo === 'ingreso' ? '↑' : '↓'}</div>
                      <div className="flex-1 min-w-0"><p className={`text-xs font-medium ${textPrimary} truncate`}>{m.concepto}</p><p className={`text-[10px] ${textMuted}`}>{formatDate(m.fecha)}</p></div>
                      <span className={`text-xs font-semibold ${m.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}`}>{m.tipo === 'ingreso' ? '+' : '-'}{formatCOP(m.monto)}</span>
                    </div>
                  ))}
                  {movimientos.length === 0 && <div className="px-4 py-8 text-center"><p className={`text-xs ${textMuted}`}>Sin movimientos registrados</p></div>}
                </div>
              </div>

              <div className={`${cardBg} border ${borderColor} rounded-2xl overflow-hidden`}>
                <div className={`p-4 border-b ${borderColor}`}><h3 className={`text-sm font-semibold ${textPrimary}`}>Pagos Próximos</h3></div>
                <div className="divide-y divide-white/[0.04]">
                  {pagos.filter(p => p.estado !== 'pagado').slice(0, 8).map(p => (
                    <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs border ${ESTADO_COLORS[p.estado]}`}>{p.estado === 'vencido' ? '!' : '⏰'}</div>
                      <div className="flex-1 min-w-0"><p className={`text-xs font-medium ${textPrimary} truncate`}>{p.concepto}</p><p className={`text-[10px] ${textMuted}`}>{formatDate(p.fecha_programada)}</p></div>
                      <span className={`text-xs font-semibold ${textPrimary}`}>{formatCOP(p.monto)}</span>
                    </div>
                  ))}
                  {pagos.filter(p => p.estado !== 'pagado').length === 0 && <div className="px-4 py-8 text-center"><p className={`text-xs ${textMuted}`}>Sin pagos pendientes</p></div>}
                </div>
              </div>
            </div>
          </>
        )}

        {/* PROYECTOS TAB */}
        {tab === 'proyectos' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-bold ${textPrimary}`}>Proyectos</h2>
              <button onClick={() => openModal('proyecto')} className="px-4 py-2 rounded-xl text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-all">+ Nuevo Proyecto</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proyectos.map(p => (
                <div key={p.id} className={`${cardBg} border ${borderColor} rounded-2xl p-5 hover:border-red-500/20 transition-all`}>
                  <div className="flex items-start justify-between mb-3">
                    <div><h3 className={`text-sm font-semibold ${textPrimary}`}>{p.nombre}</h3><p className={`text-xs ${textMuted}`}>{p.cliente}</p></div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${ESTADO_COLORS[p.estado]}`}>{p.estado}</span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between"><span className={`text-xs ${textMuted}`}>Valor Total</span><span className={`text-xs font-medium ${textPrimary}`}>{formatCOP(p.valor_total)}</span></div>
                    <div className="flex justify-between"><span className={`text-xs ${textMuted}`}>Pagado</span><span className={`text-xs font-medium text-green-400`}>{formatCOP(p.valor_pagado)}</span></div>
                    <div className="flex justify-between"><span className={`text-xs ${textMuted}`}>Pendiente</span><span className={`text-xs font-medium text-yellow-400`}>{formatCOP(p.valor_total - p.valor_pagado)}</span></div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 mt-2"><div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${p.valor_total > 0 ? (p.valor_pagado / p.valor_total) * 100 : 0}%` }}></div></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openModal('proyecto', p)} className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'} ${textSecondary} transition-all`}>Editar</button>
                    <button onClick={() => deleteItem('proyectos', p.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all`}>Eliminar</button>
                  </div>
                </div>
              ))}
              {proyectos.length === 0 && <div className={`col-span-full ${cardBg} border ${borderColor} rounded-2xl p-12 text-center`}><p className={`text-sm ${textMuted}`}>No hay proyectos registrados</p><button onClick={() => openModal('proyecto')} className="mt-4 px-4 py-2 rounded-xl text-xs font-medium bg-red-500 text-white">Crear primer proyecto</button></div>}
            </div>
          </div>
        )}

        {/* MOVIMIENTOS TAB */}
        {tab === 'movimientos' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-bold ${textPrimary}`}>Movimientos</h2>
              <button onClick={() => openModal('movimiento')} className="px-4 py-2 rounded-xl text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-all">+ Nuevo Movimiento</button>
            </div>
            <div className={`${cardBg} border ${borderColor} rounded-2xl overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className={`border-b ${borderColor}`}>
                    <th className={`text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>Fecha</th>
                    <th className={`text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>Tipo</th>
                    <th className={`text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>Concepto</th>
                    <th className={`text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>Categoría</th>
                    <th className={`text-right px-4 py-3 text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>Monto</th>
                    <th className={`text-right px-4 py-3 text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>Acciones</th>
                  </tr></thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {movimientos.slice().reverse().map(m => (
                      <tr key={m.id} className={`hover:${darkMode ? 'bg-white/[0.02]' : 'bg-gray-50'} transition-colors`}>
                        <td className={`px-4 py-3 text-xs ${textSecondary}`}>{formatDate(m.fecha)}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${m.tipo === 'ingreso' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{m.tipo}</span></td>
                        <td className={`px-4 py-3 text-xs font-medium ${textPrimary}`}>{m.concepto}</td>
                        <td className={`px-4 py-3 text-xs ${textSecondary}`}>{m.categoria}</td>
                        <td className={`px-4 py-3 text-xs font-semibold text-right ${m.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}`}>{m.tipo === 'ingreso' ? '+' : '-'}{formatCOP(m.monto)}</td>
                        <td className="px-4 py-3 text-right"><button onClick={() => openModal('movimiento', m)} className={`text-xs ${textMuted} hover:${textPrimary}`}>Editar</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {movimientos.length === 0 && <div className="px-4 py-12 text-center"><p className={`text-sm ${textMuted}`}>Sin movimientos registrados</p></div>}
            </div>
          </div>
        )}

        {/* PAGOS TAB */}
        {tab === 'pagos' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-bold ${textPrimary}`}>Pagos Programados</h2>
              <button onClick={() => openModal('pago')} className="px-4 py-2 rounded-xl text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-all">+ Programar Pago</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pagos.map(p => {
                const proyecto = proyectos.find(pr => pr.id === p.proyecto_id);
                const isVencido = p.estado !== 'pagado' && new Date(p.fecha_programada) < new Date();
                return (
                  <div key={p.id} className={`${cardBg} border ${isVencido ? 'border-red-500/30' : borderColor} rounded-2xl p-5 transition-all`}>
                    <div className="flex items-start justify-between mb-3">
                      <div><h3 className={`text-sm font-semibold ${textPrimary}`}>{p.concepto}</h3><p className={`text-xs ${textMuted}`}>{proyecto?.nombre || 'Sin proyecto'}</p></div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${ESTADO_COLORS[isVencido ? 'vencido' : p.estado]}`}>{isVencido ? 'vencido' : p.estado}</span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between"><span className={`text-xs ${textMuted}`}>Monto</span><span className={`text-sm font-bold ${textPrimary}`}>{formatCOP(p.monto)}</span></div>
                      <div className="flex justify-between"><span className={`text-xs ${textMuted}`}>Fecha</span><span className={`text-xs ${textPrimary}`}>{formatDate(p.fecha_programada)}</span></div>
                      <div className="flex justify-between"><span className={`text-xs ${textMuted}`}>Responsable</span><span className={`text-xs ${textPrimary}`}>{p.responsable || '--'}</span></div>
                    </div>
                    <div className="flex gap-2">
                      {p.estado !== 'pagado' && <button onClick={() => savePago({ id: p.id, estado: 'pagado', fecha_pagada: new Date().toISOString().split('T')[0] })} className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all">Marcar Pagado</button>}
                      <button onClick={() => openModal('pago', p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100'} ${textSecondary} transition-all`}>Editar</button>
                    </div>
                  </div>
                );
              })}
              {pagos.length === 0 && <div className={`col-span-full ${cardBg} border ${borderColor} rounded-2xl p-12 text-center`}><p className={`text-sm ${textMuted}`}>No hay pagos programados</p></div>}
            </div>
          </div>
        )}

        {/* CALENDARIO TAB */}
        {tab === 'calendario' && (
          <div>
            <h2 className={`text-lg font-bold ${textPrimary} mb-4`}>Calendario de Pagos</h2>
            <div className="space-y-2">
              {pagos.filter(p => p.estado !== 'pagado').sort((a, b) => new Date(a.fecha_programada).getTime() - new Date(b.fecha_programada).getTime()).map(p => {
                const proyecto = proyectos.find(pr => pr.id === p.proyecto_id);
                const isVencido = new Date(p.fecha_programada) < new Date();
                const daysUntil = Math.ceil((new Date(p.fecha_programada).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={p.id} className={`${cardBg} border ${isVencido ? 'border-red-500/30' : borderColor} rounded-xl p-4 flex items-center gap-4 transition-all`}>
                    <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${isVencido ? 'bg-red-500/10' : daysUntil <= 7 ? 'bg-yellow-500/10' : 'bg-blue-500/10'}`}>
                      <span className={`text-lg font-bold ${isVencido ? 'text-red-400' : daysUntil <= 7 ? 'text-yellow-400' : 'text-blue-400'}`}>{new Date(p.fecha_programada).getDate()}</span>
                      <span className={`text-[9px] ${textMuted}`}>{new Date(p.fecha_programada).toLocaleDateString('es-CO', { month: 'short' })}</span>
                    </div>
                    <div className="flex-1"><p className={`text-sm font-medium ${textPrimary}`}>{p.concepto}</p><p className={`text-xs ${textMuted}`}>{proyecto?.nombre} · {p.responsable}</p></div>
                    <div className="text-right"><p className={`text-sm font-bold ${textPrimary}`}>{formatCOP(p.monto)}</p><p className={`text-[10px] ${isVencido ? 'text-red-400' : daysUntil <= 7 ? 'text-yellow-400' : textMuted}`}>{isVencido ? `Vencido hace ${-daysUntil}d` : `En ${daysUntil}d`}</p></div>
                  </div>
                );
              })}
              {pagos.filter(p => p.estado !== 'pagado').length === 0 && <div className={`${cardBg} border ${borderColor} rounded-2xl p-12 text-center`}><p className={`text-sm ${textMuted}`}>No hay pagos pendientes</p></div>}
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${cardBg} border ${borderColor} rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto`}>
            <div className={`p-5 border-b ${borderColor} flex items-center justify-between`}>
              <h3 className={`text-sm font-bold ${textPrimary}`}>{editingId ? 'Editar' : 'Nuevo'} {modal === 'proyecto' ? 'Proyecto' : modal === 'movimiento' ? 'Movimiento' : 'Pago'}</h3>
              <button onClick={closeModal} className={`p-1 rounded-lg ${darkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>✕</button>
            </div>
            <div className="p-5 space-y-4">
              {modal === 'proyecto' && <>
                <div><label className={`text-xs font-medium ${textSecondary} mb-1 block`}>Nombre</label><input value={proyectoForm.nombre || ''} onChange={e => setProyectoForm({...proyectoForm, nombre: e.target.value})} className={`w-full px-3 py-2 rounded-lg text-sm ${inputBg} border ${textPrimary} ${inputFocus} outline-none`} placeholder="Nombre del proyecto" /></div>
                <div><label className={`text-xs font-medium ${textSecondary} mb-1 block`}>Cliente</label><input value={proyectoForm.cliente || ''} onChange={e => setProyectoForm({...proyectoForm, cliente: e.target.value})} className={`w-full px-3 py-2 rounded-lg text-sm ${inputBg} border ${textPrimary} ${inputFocus} outline-none`} placeholder="Nombre del cliente" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={`text-xs font-medium ${textSecondary} mb-1 block`}>Estado</label><select value={proyectoForm.estado || 'planificacion'} onChange={e => setProyectoForm({...proyectoForm, estado: e.target.value as EstadoProyecto})} className={`w-full px-3 py-2 rounded-lg text-sm ${inputBg} border ${textPrimary} ${inputFocus} outline-none`}><option value="planificacion">Planificación</option><option value="activo">Activo</option><option value="pausado">Pausado</option><option value="completado">Completado</option><option value="cancelado">Cancelado</option></select></div>
                  <div><label className={`text-xs font-medium ${textSecondary} mb-1 block`}>Valor Total</label><input type="number" value={proyectoForm.valor_total || ''} onChange={e => setProyectoForm({...proyectoForm, valor_total: Number(e.target.value)})} className={`w-full px-3 py-2 rounded-lg text-sm ${inputBg} border ${textPrimary} ${inputFocus} outline-none`} placeholder="0" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={`text-xs font-medium ${textSecondary} mb-1 block`}>Fecha Inicio</label><input type="date" value={proyectoForm.fecha_inicio || ''} onChange={e => setProyectoForm({...proyectoForm, fecha_inicio: e.target.value})} className={`w-full px-3 py-2 rounded-lg text-sm ${inputBg} border ${textPrimary} ${inputFocus} outline-none`} /></div>
                  <div><label className={`text-xs font-medium ${textSecondary} mb-1 block`}>Fecha Fin Estimada</label><input type="date" value={proyectoForm.fecha_fin_estimada || ''} onChange={e => setProyectoForm({...proyectoForm, fecha_fin_estimada: e.target.value})} className={`w-full px-3 py-2 rounded-lg text-sm ${inputBg} border ${textPrimary} ${inputFocus} outline-none`} /></div>
                </div>
                <div><label className={`text-xs font-medium ${textSecondary} mb-1 block`}>Descripción</label><textarea value={proyectoForm.descripcion || ''} onChange={e => setProyectoForm({...proyectoForm, descripcion: e.target.value})} className={`w-full px-3 py-2 rounded-lg text-sm ${inputBg} border ${textPrimary} ${inputFocus} outline-none`} rows={3} /></div>
                <div><label className={`text-xs font-medium ${textSecondary} mb-1 block`}>Notas</label><textarea value={proyectoForm.notas || ''} onChange={e => setProyectoForm({...proyectoForm, notas: e.target.value})} className={`w-full px-3 py-2 rounded-lg text-sm ${inputBg} border ${textPrimary} ${inputFocus} outline-none`} rows={2} /></div>
              </>}

              {modal === 'movimiento' && <>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={`text-xs font-medium ${textSecondary} mb-1 block`}>Tipo</label><select value={movimientoForm.tipo || 'egreso'} onChange={e => setMovimientoForm({...movimientoForm, tipo: e.target.value as TipoMovimiento})} className={`w-full px-3 py-2 rounded-lg text-sm ${inputBg} border ${textPrimary} ${inputFocus} outline-none`}><option value="ingreso">Ingreso</option><option value="egreso">Egreso</option></select></div>
                  <div><label className={`text-xs font-medium ${textSecondary} mb-1 block`}>Monto</label><input type="number" value={movimientoForm.monto || ''} onChange={e => setMovimientoForm({...movimientoForm, monto: Number(e.target.value)})} className={`w-full px-3 py-2 rounded-lg text-sm ${inputBg} border ${textPrimary} ${inputFocus} outline-none`} placeholder="0" /></div>
                </div>
                <div><label className={`text-xs font-medium ${textSecondary} mb-1 block`}>Concepto</label><input value={movimientoForm.concepto || ''} onChange={e => setMovimientoForm({...movimientoForm, concepto: e.target.value})} className={`w-full px-3 py-2 rounded-lg text-sm ${inputBg} border ${textPrimary} ${inputFocus} outline-none`} placeholder="Descripción del movimiento" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={`text-xs font-medium ${textSecondary} mb-1 block`}>Fecha</label><input type="date" value={movimientoForm.fecha || ''} onChange={e => setMovimientoForm({...movimientoForm, fecha: e.target.value})} className={`w-full px-3 py-2 rounded-lg text-sm ${inputBg} border ${textPrimary} ${inputFocus} outline-none`} /></div>
                  <div><label className={`text-xs font-medium ${textSecondary} mb-1 block`}>Categoría</label><select value={movimientoForm.categoria || 'otros'} onChange={e => setMovimientoForm({...movimientoForm, categoria: e.target.value as CategoriaMovimiento})} className={`w-full px-3 py-2 rounded-lg text-sm ${inputBg} border ${textPrimary} ${inputFocus} outline-none`}>{CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                </div>
                <div><label className={`text-xs font-medium ${textSecondary} mb-1 block`}>Proyecto (opcional)</label><select value={movimientoForm.proyecto_id || ''} onChange={e => setMovimientoForm({...movimientoForm, proyecto_id: e.target.value || null})} className={`w-full px-3 py-2 rounded-lg text-sm ${inputBg} border ${textPrimary} ${inputFocus} outline-none`}><option value="">Sin proyecto</option>{proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                <div><label className={`text-xs font-medium ${textSecondary} mb-1 block`}>Notas</label><textarea value={movimientoForm.notas || ''} onChange={e => setMovimientoForm({...movimientoForm, notas: e.target.value})} className={`w-full px-3 py-2 rounded-lg text-sm ${inputBg} border ${textPrimary} ${inputFocus} outline-none`} rows={2} /></div>
              </>}

              {modal === 'pago' && <>
                <div><label className={`text-xs font-medium ${textSecondary} mb-1 block`}>Concepto</label><input value={pagoForm.concepto || ''} onChange={e => setPagoForm({...pagoForm, concepto: e.target.value})} className={`w-full px-3 py-2 rounded-lg text-sm ${inputBg} border ${textPrimary} ${inputFocus} outline-none`} placeholder="Descripción del pago" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={`text-xs font-medium ${textSecondary} mb-1 block`}>Monto</label><input type="number" value={pagoForm.monto || ''} onChange={e => setPagoForm({...pagoForm, monto: Number(e.target.value)})} className={`w-full px-3 py-2 rounded-lg text-sm ${inputBg} border ${textPrimary} ${inputFocus} outline-none`} placeholder="0" /></div>
                  <div><label className={`text-xs font-medium ${textSecondary} mb-1 block`}>Fecha Programada</label><input type="date" value={pagoForm.fecha_programada || ''} onChange={e => setPagoForm({...pagoForm, fecha_programada: e.target.value})} className={`w-full px-3 py-2 rounded-lg text-sm ${inputBg} border ${textPrimary} ${inputFocus} outline-none`} /></div>
                </div>
                <div><label className={`text-xs font-medium ${textSecondary} mb-1 block`}>Proyecto</label><select value={pagoForm.proyecto_id || ''} onChange={e => setPagoForm({...pagoForm, proyecto_id: e.target.value})} className={`w-full px-3 py-2 rounded-lg text-sm ${inputBg} border ${textPrimary} ${inputFocus} outline-none`}><option value="">Seleccionar proyecto</option>{proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={`text-xs font-medium ${textSecondary} mb-1 block`}>Estado</label><select value={pagoForm.estado || 'pendiente'} onChange={e => setPagoForm({...pagoForm, estado: e.target.value as EstadoPago})} className={`w-full px-3 py-2 rounded-lg text-sm ${inputBg} border ${textPrimary} ${inputFocus} outline-none`}><option value="pendiente">Pendiente</option><option value="programado">Programado</option><option value="pagado">Pagado</option></select></div>
                  <div><label className={`text-xs font-medium ${textSecondary} mb-1 block`}>Responsable</label><input value={pagoForm.responsable || ''} onChange={e => setPagoForm({...pagoForm, responsable: e.target.value})} className={`w-full px-3 py-2 rounded-lg text-sm ${inputBg} border ${textPrimary} ${inputFocus} outline-none`} placeholder="Nombre" /></div>
                </div>
                <div><label className={`text-xs font-medium ${textSecondary} mb-1 block`}>Notas</label><textarea value={pagoForm.notas || ''} onChange={e => setPagoForm({...pagoForm, notas: e.target.value})} className={`w-full px-3 py-2 rounded-lg text-sm ${inputBg} border ${textPrimary} ${inputFocus} outline-none`} rows={2} /></div>
              </>}

              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'} ${textSecondary} transition-all`}>Cancelar</button>
                <button onClick={() => modal === 'proyecto' ? saveProyecto(proyectoForm) : modal === 'movimiento' ? saveMovimiento(movimientoForm) : savePago(pagoForm)} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-all">{saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}