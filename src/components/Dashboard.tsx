'use client';

import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

interface DashboardData {
  disponible_hoy: number | null;
  runway_meses: number | null;
  semaforo: string | null;
  burn_mensual: number | null;
}

interface FlujoCaja {
  fecha: string | null;
  proyecto: string | null;
  tipo: string | null;
  concepto: string | null;
  monto: number | null;
  saldo: number | null;
}

interface ModeloNegocio {
  id: number | string;
  modelo: string | null;
  estado: string | null;
  ingreso_mes_COP: number | string | null;
}

interface FinanzasData {
  generated_at: string;
  dashboard: DashboardData;
  modelos_negocio: ModeloNegocio[];
  flujo_caja: FlujoCaja[];
}

const formatCOP = (v: number | null | undefined) => {
  if (v == null || isNaN(v)) return '$0';
  return '$' + Number(v).toLocaleString('es-CO', { maximumFractionDigits: 0 });
};

const formatDate = (iso: string | null) => {
  if (!iso) return '--';
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
};

export default function Dashboard() {
  const [data, setData] = useState<FinanzasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {
      // Data not available yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      // Refresh data
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const filterFlujo = (flujo: FlujoCaja[]) => {
    if (filter === 'all') return flujo;
    if (filter === 'AMSTERDAM') return flujo.filter(r => r.proyecto?.includes('AMSTERDAM'));
    return flujo.filter(r => r.proyecto === filter);
  };

  const getProjects = (flujo: FlujoCaja[]) => {
    const projects = new Set<string>();
    flujo.forEach(r => { if (r.proyecto) projects.add(r.proyecto); });
    return [...projects].sort();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
            RR ALIADOS — Dashboard Financiero
          </h1>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
              Subir archivo Excel
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Sube el archivo RR_Finanzas_Maestro_FULL 2026.xlsx para generar el dashboard
            </p>
            
            <label className="block">
              <span className="sr-only">Seleccionar archivo Excel</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleUpload}
                disabled={uploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
              />
            </label>
            
            {uploading && (
              <p className="mt-4 text-red-600">Procesando archivo...</p>
            )}
            {error && (
              <p className="mt-4 text-red-600">Error: {error}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { dashboard, flujo_caja, modelos_negocio } = data;
  const flujo = filterFlujo(flujo_caja);
  const projects = getProjects(flujo_caja);

  // Prepare chart data
  const sparkData = {
    labels: flujo.filter(r => r.saldo != null && r.fecha).map(r => formatDate(r.fecha)),
    datasets: [{
      data: flujo.filter(r => r.saldo != null).map(r => r.saldo!),
      borderColor: '#CE3D1F',
      backgroundColor: 'rgba(206,61,31,0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 3,
    }]
  };

  const byProject: Record<string, { ingreso: number; egreso: number }> = {};
  flujo_caja.forEach(r => {
    if (!r.proyecto || r.monto == null) return;
    if (!byProject[r.proyecto]) byProject[r.proyecto] = { ingreso: 0, egreso: 0 };
    if (r.tipo === 'INGRESO' || r.tipo === 'SALDO') byProject[r.proyecto].ingreso += r.monto;
    else if (r.tipo === 'EGRESO') byProject[r.proyecto].egreso += Math.abs(r.monto);
  });

  const donutData = {
    labels: Object.keys(byProject),
    datasets: [{
      data: Object.values(byProject).map(d => d.ingreso + d.egreso),
      backgroundColor: ['#CE3D1F', '#3F0035', '#2d8a5e', '#c4a035', '#6366f1', '#ec4899', '#14b8a6', '#f97316'],
    }]
  };

  const barData = {
    labels: Object.keys(byProject),
    datasets: [
      { label: 'Ingresos', data: Object.values(byProject).map(d => d.ingreso), backgroundColor: 'rgba(45,138,94,0.8)' },
      { label: 'Egresos', data: Object.values(byProject).map(d => d.egreso), backgroundColor: 'rgba(170,51,51,0.8)' }
    ]
  };

  const movimientos = flujo.filter(r => r.tipo && r.tipo !== 'SALDO').slice(-20).reverse();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">FINANZAS EN VIVO</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Fuente: RR_Finanzas_Maestro_FULL 2026.xlsx · {new Date(data.generated_at).toLocaleDateString('es-CO')}
            </p>
          </div>
          <label className="cursor-pointer bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            {uploading ? 'Procesando...' : 'Actualizar datos'}
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Disponible Hoy</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{formatCOP(dashboard.disponible_hoy)}</p>
            <p className="text-sm text-gray-500 mt-1">Bancolombia</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Runway</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{(dashboard.runway_meses || 0).toFixed(1)} meses</p>
            <p className="text-sm text-gray-500 mt-1">Burn {formatCOP(dashboard.burn_mensual)}/mes</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Semáforo</p>
            <p className={`text-3xl font-bold mt-2 ${
              (dashboard.runway_meses || 0) >= 8 ? 'text-green-600' : 
              (dashboard.runway_meses || 0) >= 4 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {(dashboard.runway_meses || 0) >= 8 ? '🟢 OK' : 
               (dashboard.runway_meses || 0) >= 4 ? '🟡 CUIDADO' : '🔴 CRÍTICO'}
            </p>
            <p className="text-sm text-gray-500 mt-1">≥8 OK · 4–8 cuidado · &lt;4 crítico</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Proyectos Activos</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{projects.length}</p>
            <p className="text-sm text-gray-500 mt-1 truncate">{projects.slice(0, 3).join(', ')}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Todos
          </button>
          {projects.map(p => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === p ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Flujo de Caja — Saldo Acumulado</h2>
            <div className="h-72">
              <Line data={sparkData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Distribución por Proyecto</h2>
            <div className="h-72">
              <Doughnut data={donutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Ingresos vs Egresos por Proyecto</h2>
            <div className="h-72">
              <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Modelos de Negocio</h2>
            <div className="overflow-auto max-h-72">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-2 text-gray-500">Modelo</th>
                    <th className="text-left py-2 text-gray-500">Estado</th>
                    <th className="text-right py-2 text-gray-500">Ingreso</th>
                  </tr>
                </thead>
                <tbody>
                  {modelos_negocio.filter(m => typeof m.id === 'number').map((m, i) => (
                    <tr key={i} className="border-b dark:border-gray-700">
                      <td className="py-2 text-gray-900 dark:text-white">{m.modelo}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          m.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {m.estado}
                        </span>
                      </td>
                      <td className="py-2 text-right text-gray-900 dark:text-white">{formatCOP(m.ingreso_mes_COP as number)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Movements Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Últimos Movimientos de Caja</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-2 text-gray-500">Fecha</th>
                  <th className="text-left py-2 text-gray-500">Proyecto</th>
                  <th className="text-left py-2 text-gray-500">Tipo</th>
                  <th className="text-left py-2 text-gray-500">Concepto</th>
                  <th className="text-right py-2 text-gray-500">Monto</th>
                  <th className="text-right py-2 text-gray-500">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((r, i) => (
                  <tr key={i} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-2 text-gray-900 dark:text-white">{formatDate(r.fecha)}</td>
                    <td className="py-2 text-gray-900 dark:text-white">{r.proyecto}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        r.tipo === 'INGRESO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {r.tipo}
                      </span>
                    </td>
                    <td className="py-2 text-gray-900 dark:text-white">{r.concepto}</td>
                    <td className={`py-2 text-right font-medium ${r.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'}`}>
                      {r.tipo === 'INGRESO' ? '+' : ''}{formatCOP(r.monto)}
                    </td>
                    <td className={`py-2 text-right font-medium ${(r.saldo || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCOP(r.saldo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4 border-t dark:border-gray-700">
          Dashboard generado desde RR_Finanzas_Maestro_FULL 2026.xlsx · Actualizado: {new Date(data.generated_at).toLocaleString('es-CO')}
        </div>
      </div>
    </div>
  );
}