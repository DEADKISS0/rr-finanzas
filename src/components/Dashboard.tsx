'use client';

import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, Clock, AlertTriangle, Upload, Sun, Moon, Filter } from 'lucide-react';

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

const formatTimeAgo = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Hace un momento';
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
};

export default function Dashboard() {
  const [data, setData] = useState<FinanzasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

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
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cargando datos financieros...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-8 ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className={`max-w-lg w-full p-8 rounded-2xl shadow-xl ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Upload className="w-8 h-8 text-red-500" />
          </div>
          <h1 className={`text-2xl font-bold text-center mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            RR ALIADOS
          </h1>
          <p className={`text-center mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Sube el archivo Excel para generar el dashboard financiero
          </p>
          
          <label className="block cursor-pointer">
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all hover:border-red-500 ${darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'}`}>
              <Upload className={`w-10 h-10 mx-auto mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <p className={`font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {uploading ? 'Procesando...' : 'Seleccionar archivo Excel'}
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                .xlsx o .xls
              </p>
            </div>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
          
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-500 text-center">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const { dashboard, flujo_caja, modelos_negocio } = data;
  const flujo = filterFlujo(flujo_caja);
  const projects = getProjects(flujo_caja);
  const runway = dashboard.runway_meses || 0;

  // Prepare chart data
  const sparkData = {
    labels: flujo.filter(r => r.saldo != null && r.fecha).map(r => formatDate(r.fecha)),
    datasets: [{
      data: flujo.filter(r => r.saldo != null).map(r => r.saldo!),
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239,68,68,0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6,
      borderWidth: 2,
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
      backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'],
      borderWidth: 0,
      hoverOffset: 8,
    }]
  };

  const barData = {
    labels: Object.keys(byProject),
    datasets: [
      { label: 'Ingresos', data: Object.values(byProject).map(d => d.ingreso), backgroundColor: '#22c55e', borderRadius: 8 },
      { label: 'Egresos', data: Object.values(byProject).map(d => d.egreso), backgroundColor: '#ef4444', borderRadius: 8 }
    ]
  };

  const movimientos = flujo.filter(r => r.tipo && r.tipo !== 'SALDO').slice(-15).reverse();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
        titleColor: darkMode ? '#f3f4f6' : '#111827',
        bodyColor: darkMode ? '#9ca3af' : '#6b7280',
        borderColor: darkMode ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
      }
    },
    scales: {
      x: { 
        grid: { display: false }, 
        ticks: { color: darkMode ? '#6b7280' : '#9ca3af', maxTicksLimit: 8 },
        border: { display: false }
      },
      y: { 
        grid: { color: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }, 
        ticks: { color: darkMode ? '#6b7280' : '#9ca3af', callback: (v: unknown) => formatCOP(v as number) },
        border: { display: false }
      }
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${darkMode ? 'bg-gray-950/80 border-gray-800' : 'bg-white/80 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
              <span className="text-white font-bold text-sm">RR</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">FINANZAS EN VIVO</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Actualizado {data.generated_at ? formatTimeAgo(data.generated_at) : '--'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <label className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
              <Upload className="w-4 h-4" />
              {uploading ? 'Procesando...' : 'Actualizar'}
              <input type="file" accept=".xlsx,.xls" onChange={handleUpload} disabled={uploading} className="hidden" />
            </label>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl transition-all ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Disponible */}
          <div className={`group relative overflow-hidden rounded-2xl p-6 transition-all hover:scale-[1.02] ${darkMode ? 'bg-gray-900 border border-gray-800 hover:border-gray-700' : 'bg-white border border-gray-200 hover:border-gray-300 shadow-sm'}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-transparent rounded-bl-full"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-red-500" />
                </div>
                <span className={`text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Disponible</span>
              </div>
              <p className="text-3xl font-bold tracking-tight">{formatCOP(dashboard.disponible_hoy)}</p>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Bancolombia</p>
            </div>
          </div>

          {/* Runway */}
          <div className={`group relative overflow-hidden rounded-2xl p-6 transition-all hover:scale-[1.02] ${darkMode ? 'bg-gray-900 border border-gray-800 hover:border-gray-700' : 'bg-white border border-gray-200 hover:border-gray-300 shadow-sm'}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <span className={`text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Runway</span>
              </div>
              <p className="text-3xl font-bold tracking-tight">{runway.toFixed(1)} <span className="text-lg font-normal">meses</span></p>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Burn {formatCOP(dashboard.burn_mensual)}/mes</p>
            </div>
          </div>

          {/* Semáforo */}
          <div className={`group relative overflow-hidden rounded-2xl p-6 transition-all hover:scale-[1.02] ${darkMode ? 'bg-gray-900 border border-gray-800 hover:border-gray-700' : 'bg-white border border-gray-200 hover:border-gray-300 shadow-sm'}`}>
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${runway >= 8 ? 'from-green-500/10' : runway >= 4 ? 'from-yellow-500/10' : 'from-red-500/10'} to-transparent rounded-bl-full`}></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${runway >= 8 ? 'bg-green-500/10' : runway >= 4 ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
                  <AlertTriangle className={`w-5 h-5 ${runway >= 8 ? 'text-green-500' : runway >= 4 ? 'text-yellow-500' : 'text-red-500'}`} />
                </div>
                <span className={`text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Semáforo</span>
              </div>
              <p className={`text-3xl font-bold tracking-tight ${runway >= 8 ? 'text-green-500' : runway >= 4 ? 'text-yellow-500' : 'text-red-500'}`}>
                {runway >= 8 ? 'OK' : runway >= 4 ? 'CUIDADO' : 'CRÍTICO'}
              </p>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>≥8 OK · 4–8 cuidado · &lt;4 crítico</p>
            </div>
          </div>

          {/* Proyectos */}
          <div className={`group relative overflow-hidden rounded-2xl p-6 transition-all hover:scale-[1.02] ${darkMode ? 'bg-gray-900 border border-gray-800 hover:border-gray-700' : 'bg-white border border-gray-200 hover:border-gray-300 shadow-sm'}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <span className={`text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Proyectos</span>
              </div>
              <p className="text-3xl font-bold tracking-tight">{projects.length}</p>
              <p className={`text-sm mt-1 truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{projects.slice(0, 3).join(', ')}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-white border border-gray-200'}`}>
            <Filter className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <span className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Filtrar:</span>
          </div>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'all' 
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                : darkMode ? 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Todos
          </button>
          {projects.map(p => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                filter === p 
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                  : darkMode ? 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          {/* Sparkline */}
          <div className={`lg:col-span-2 rounded-2xl p-6 ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold">Flujo de Caja</h2>
                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Saldo acumulado</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Saldo</span>
              </div>
            </div>
            <div className="h-72">
              <Line data={sparkData} options={chartOptions} />
            </div>
          </div>

          {/* Donut */}
          <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200 shadow-sm'}`}>
            <div className="mb-6">
              <h2 className="font-semibold">Distribución</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Por proyecto</p>
            </div>
            <div className="h-72">
              <Doughnut 
                data={donutData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '65%',
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                      titleColor: darkMode ? '#f3f4f6' : '#111827',
                      bodyColor: darkMode ? '#9ca3af' : '#6b7280',
                      borderColor: darkMode ? '#374151' : '#e5e7eb',
                      borderWidth: 1,
                    }
                  }
                }} 
              />
            </div>
            <div className="mt-4 space-y-2">
              {Object.keys(byProject).slice(0, 4).map((p, i) => (
                <div key={p} className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e'][i] }}></span>
                  <span className={`text-sm flex-1 truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{p}</span>
                  <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCOP(byProject[p].ingreso + byProject[p].egreso)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className={`rounded-2xl p-6 mb-8 ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold">Ingresos vs Egresos</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Comparación por proyecto</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Ingresos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Egresos</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Movimientos */}
          <div className={`rounded-2xl overflow-hidden ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200 shadow-sm'}`}>
            <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <h2 className="font-semibold">Últimos Movimientos</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Transacciones recientes</p>
            </div>
            <div className="divide-y divide-gray-800">
              {movimientos.map((r, i) => (
                <div key={i} className={`p-4 flex items-center gap-4 transition-colors ${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.tipo === 'INGRESO' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    {r.tipo === 'INGRESO' ? <ArrowUpRight className="w-5 h-5 text-green-500" /> : <ArrowDownRight className="w-5 h-5 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{r.concepto}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{r.proyecto} · {formatDate(r.fecha)}</p>
                  </div>
                  <span className={`text-sm font-semibold whitespace-nowrap ${r.tipo === 'INGRESO' ? 'text-green-500' : 'text-red-500'}`}>
                    {r.tipo === 'INGRESO' ? '+' : ''}{formatCOP(r.monto)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Modelos */}
          <div className={`rounded-2xl overflow-hidden ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200 shadow-sm'}`}>
            <div className={`p-6 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <h2 className="font-semibold">Modelos de Negocio</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Estado actual</p>
            </div>
            <div className="divide-y divide-gray-800">
              {modelos_negocio.filter(m => typeof m.id === 'number').map((m, i) => (
                <div key={i} className={`p-4 flex items-center gap-4 transition-colors ${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    m.estado === 'Activo' ? 'bg-green-500/10' : m.estado === 'En desarrollo' ? 'bg-blue-500/10' : 'bg-gray-500/10'
                  }`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      m.estado === 'Activo' ? 'bg-green-500' : m.estado === 'En desarrollo' ? 'bg-blue-500' : 'bg-gray-500'
                    }`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{m.modelo}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{m.estado}</p>
                  </div>
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {formatCOP(m.ingreso_mes_COP as number)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className={`mt-12 pt-8 border-t text-center ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <p className={`text-sm ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
            Dashboard financiero · RR ALIADOS · {new Date(data.generated_at).toLocaleDateString('es-CO')}
          </p>
        </footer>
      </main>
    </div>
  );
}