'use client';

import { useState, useEffect, useCallback } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import * as XLSX from 'xlsx';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const STORAGE_KEY = 'rr-finanzas-data';
const THEME_KEY = 'rr-finanzas-theme';

interface FlujoCaja {
  fecha: string | null;
  proyecto: string | null;
  tipo: string | null;
  concepto: string | null;
  monto: number | null;
  saldo: number | null;
}

interface ModeloNegocio {
  id: number;
  modelo: string;
  estado: string;
  ingreso_mes_COP: number;
  costo_mes_COP: number;
  margen_mes_COP: number;
  owner: string;
}

interface DashboardData {
  disponible_hoy: number;
  runway_meses: number;
  semaforo: string;
  burn_mensual: number;
}

interface FinanzasData {
  generated_at: string;
  dashboard: DashboardData;
  modelos_negocio: ModeloNegocio[];
  flujo_caja: FlujoCaja[];
  proyectos: string[];
  caja_mensual: Record<string, unknown>[];
}

function serializeValue(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'number' && isNaN(v)) return null;
  if (typeof v === 'number') return Math.round(v * 100) / 100;
  return v;
}

function parseExcelFile(file: File): Promise<FinanzasData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });

        // Parse Dashboard
        const dashWs = wb.Sheets['00_Dashboard'];
        let dashboard: DashboardData = { disponible_hoy: 3600000, runway_meses: 7.2, semaforo: '🟡 CUIDADO', burn_mensual: 500000 };
        if (dashWs) {
          const rows = XLSX.utils.sheet_to_json(dashWs, { header: 1, defval: null }) as unknown[][];
          for (let i = 0; i < rows.length; i++) {
            const rowStr = rows[i].map(c => String(c || '')).join(' ');
            if (rowStr.includes('DISPONIBLE HOY') && i + 1 < rows.length) {
              const next = rows[i + 1];
              dashboard = {
                disponible_hoy: Number(next[0]) || 0,
                runway_meses: Number(next[2]) || 0,
                semaforo: String(next[4] || '🟡 CUIDADO'),
                burn_mensual: Number(next[6]) || 0,
              };
            }
          }
        }

        // Parse Modelos de Negocio
        const modelosWs = wb.Sheets['Modelos_Negocio'];
        const modelos: ModeloNegocio[] = [];
        if (modelosWs) {
          const rows = XLSX.utils.sheet_to_json(modelosWs, { header: 1, defval: null, range: 5 }) as unknown[][];
          rows.slice(1).forEach((row, i) => {
            if (row[0] != null && typeof row[0] === 'number') {
              modelos.push({
                id: Number(row[0]),
                modelo: String(row[1] || ''),
                estado: String(row[2] || ''),
                ingreso_mes_COP: Number(row[4]) || 0,
                costo_mes_COP: Number(row[5]) || 0,
                margen_mes_COP: Number(row[6]) || 0,
                owner: String(row[9] || ''),
              });
            }
          });
        }

        // Parse Flujo de Caja
        const flujoWs = wb.Sheets['Flujo_Caja_Proyectos'];
        const flujo: FlujoCaja[] = [];
        const proyectosSet = new Set<string>();
        if (flujoWs) {
          const rows = XLSX.utils.sheet_to_json(flujoWs, { header: 1, defval: null, range: 4 }) as unknown[][];
          rows.forEach(row => {
            if (row[0] != null || row[1] != null) {
              const fecha = row[0] instanceof Date ? (row[0] as Date).toISOString() : String(row[0] || '');
              const proyecto = String(row[1] || '');
              const tipo = String(row[2] || '');
              const concepto = String(row[3] || '');
              const monto = serializeValue(row[5]) as number | null;
              const saldo = serializeValue(row[6]) as number | null;
              
              if (fecha && fecha !== 'Fecha') {
                flujo.push({ fecha, proyecto, tipo, concepto, monto, saldo });
                if (proyecto && !['Branding', 'Producción de Video', 'Piezas graficas', 'Gestion de Redes', 'Desarrollo Web', 'Pauta Publicitaria', 'SEO & GEO', 'Mantenimiento'].includes(proyecto)) {
                  proyectosSet.add(proyecto);
                }
              }
            }
          });
        }

        // Parse Caja mensual
        const cajaSheets = ['Caja_2026-05', 'Caja_2026-06', 'Caja_2026-07'];
        const caja: Record<string, unknown>[] = [];
        cajaSheets.forEach(name => {
          const ws = wb.Sheets[name];
          if (ws) {
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, range: 5 }) as unknown[][];
            rows.forEach(row => {
              if (row[0] != null) {
                caja.push({
                  fecha: serializeValue(row[0]),
                  tipo: serializeValue(row[1]),
                  concepto: serializeValue(row[2]),
                  categoria: serializeValue(row[3]),
                  entrada: serializeValue(row[4]),
                  salida: serializeValue(row[5]),
                  saldo: serializeValue(row[6]),
                  mes: name,
                });
              }
            });
          }
        });

        resolve({
          generated_at: new Date().toISOString(),
          dashboard,
          modelos_negocio: modelos,
          flujo_caja: flujo,
          proyectos: [...proyectosSet].sort(),
          caja_mensual: caja,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

const formatCOP = (v: number | null | undefined) => {
  if (v == null || isNaN(v)) return '$0';
  return '$' + Number(v).toLocaleString('es-CO', { maximumFractionDigits: 0 });
};

const formatDate = (iso: string | null) => {
  if (!iso) return '--';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  } catch {
    return iso;
  }
};

export default function Dashboard() {
  const [data, setData] = useState<FinanzasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'flujo' | 'modelos'>('dashboard');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'light') setDarkMode(false);
    
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        setData(JSON.parse(savedData));
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const parsed = await parseExcelFile(file);
      setData(parsed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch (err) {
      console.error('Error parsing Excel:', err);
      alert('Error al procesar el archivo. Asegúrate de que sea el archivo correcto.');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const clearData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(null);
  };

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-[#0a0a0f]' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-red-500/20 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cargando RR ALIADOS...</p>
        </div>
      </div>
    );
  }

  const bg = darkMode ? 'bg-[#0a0a0f]' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-[#12121a]' : 'bg-white';
  const borderColor = darkMode ? 'border-white/[0.06]' : 'border-gray-200';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const textMuted = darkMode ? 'text-gray-600' : 'text-gray-400';

  // Landing page when no data
  if (!data) {
    return (
      <div className={`min-h-screen ${bg} flex flex-col`}>
        {/* Header */}
        <header className={`border-b ${borderColor} ${darkMode ? 'bg-[#0a0a0f]/80' : 'bg-white/80'} backdrop-blur-xl sticky top-0 z-50`}>
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                <span className="text-white font-bold text-sm">RR</span>
              </div>
              <div>
                <h1 className={`font-bold tracking-tight ${textPrimary}`}>RR ALIADOS</h1>
                <p className={`text-xs ${textMuted}`}>Panel Financiero</p>
              </div>
            </div>
            <button onClick={toggleTheme} className={`p-2.5 rounded-xl ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'} transition-all`}>
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        {/* Hero */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-xl w-full text-center">
            {/* Logo grande */}
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-700 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-red-500/30 mb-6">
                <span className="text-white font-bold text-4xl">RR</span>
              </div>
              <h2 className={`text-3xl font-bold ${textPrimary} mb-3`}>Dashboard Financiero</h2>
              <p className={`text-lg ${textSecondary}`}>Sube el archivo Excel maestro para visualizar las finanzas de RR ALIADOS</p>
            </div>

            {/* Upload zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer ${
                dragActive 
                  ? 'border-red-500 bg-red-500/10 scale-[1.02]' 
                  : darkMode 
                    ? 'border-white/10 hover:border-red-500/50 hover:bg-white/[0.02]' 
                    : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'
              }`}
            >
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {uploading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-red-500/20 rounded-full">
                    <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className={`font-medium ${textPrimary}`}>Procesando archivo...</p>
                  <p className={`text-sm ${textMuted}`}>Extrayendo datos de 28 hojas</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <svg className={`w-8 h-8 ${textSecondary}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className={`font-semibold ${textPrimary} mb-1`}>Arrastra el archivo Excel aquí</p>
                    <p className={`text-sm ${textMuted}`}>o haz clic para seleccionar</p>
                  </div>
                  <div className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <p className={`text-xs font-mono ${textMuted}`}>RR_Finanzas_Maestro_FULL 2026.xlsx</p>
                  </div>
                </div>
              )}
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                { icon: '📊', title: '28 Hojas', desc: 'Datos completos' },
                { icon: '⚡', title: 'Tiempo Real', desc: 'Procesamiento instantáneo' },
                { icon: '💾', title: 'Local', desc: 'Datos guardados en tu navegador' },
              ].map((item, i) => (
                <div key={i} className={`p-4 rounded-xl ${cardBg} border ${borderColor}`}>
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className={`text-sm font-semibold ${textPrimary}`}>{item.title}</p>
                  <p className={`text-xs ${textMuted}`}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Dashboard with data
  const { dashboard, flujo_caja, modelos_negocio, proyectos } = data;
  const runway = dashboard.runway_meses || 0;

  const filterFlujo = (f: FlujoCaja[]) => {
    if (filter === 'all') return f;
    if (filter === 'AMSTERDAM') return f.filter(r => r.proyecto?.includes('AMSTERDAM'));
    return f.filter(r => r.proyecto === filter);
  };

  const flujo = filterFlujo(flujo_caja);
  const movimientos = flujo.filter(r => r.tipo && r.tipo !== 'SALDO').slice(-20).reverse();

  // Aggregate by project
  const byProject: Record<string, { ingreso: number; egreso: number }> = {};
  flujo_caja.forEach(r => {
    if (!r.proyecto || r.monto == null) return;
    if (!byProject[r.proyecto]) byProject[r.proyecto] = { ingreso: 0, egreso: 0 };
    if (r.tipo === 'INGRESO' || r.tipo === 'SALDO') byProject[r.proyecto].ingreso += r.monto;
    else if (r.tipo === 'EGRESO') byProject[r.proyecto].egreso += Math.abs(r.monto);
  });

  // Chart data
  const saldoPoints = flujo.filter(r => r.saldo != null && r.fecha && !isNaN(new Date(r.fecha).getTime()));
  
  const sparkData = {
    labels: saldoPoints.map(r => formatDate(r.fecha)),
    datasets: [{
      data: saldoPoints.map(r => r.saldo!),
      borderColor: '#ef4444',
      backgroundColor: (ctx: { chart: { ctx: CanvasRenderingContext2D } }) => {
        const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(239,68,68,0.3)');
        gradient.addColorStop(1, 'rgba(239,68,68,0)');
        return gradient;
      },
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: '#ef4444',
      borderWidth: 2.5,
    }]
  };

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
      { label: 'Ingresos', data: Object.values(byProject).map(d => d.ingreso), backgroundColor: '#22c55e', borderRadius: 6 },
      { label: 'Egresos', data: Object.values(byProject).map(d => d.egreso), backgroundColor: '#ef4444', borderRadius: 6 }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: darkMode ? '#1a1a2e' : '#ffffff',
        titleColor: darkMode ? '#fff' : '#111',
        bodyColor: darkMode ? '#9ca3af' : '#6b7280',
        borderColor: darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          label: (ctx: { parsed?: { y?: number }; raw?: number }) => formatCOP(ctx.parsed?.y ?? ctx.raw ?? 0),
        }
      }
    },
    scales: {
      x: { 
        grid: { display: false }, 
        ticks: { color: darkMode ? '#4b5563' : '#9ca3af', maxTicksLimit: 8, font: { size: 11 } },
        border: { display: false }
      },
      y: { 
        grid: { color: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }, 
        ticks: { color: darkMode ? '#4b5563' : '#9ca3af', callback: (v: unknown) => formatCOP(v as number), font: { size: 11 } },
        border: { display: false }
      }
    }
  };

  const semaforoColor = runway >= 8 ? 'text-green-400' : runway >= 4 ? 'text-yellow-400' : 'text-red-400';
  const semaforoBg = runway >= 8 ? 'bg-green-500/10' : runway >= 4 ? 'bg-yellow-500/10' : 'bg-red-500/10';
  const semaforoLabel = runway >= 8 ? 'ESTABLE' : runway >= 4 ? 'CUIDADO' : 'CRÍTICO';

  return (
    <div className={`min-h-screen ${bg}`}>
      {/* Header */}
      <header className={`border-b ${borderColor} ${darkMode ? 'bg-[#0a0a0f]/90' : 'bg-white/90'} backdrop-blur-xl sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/20">
              <span className="text-white font-bold text-xs">RR</span>
            </div>
            <div>
              <h1 className={`text-sm font-bold tracking-tight ${textPrimary}`}>RR ALIADOS</h1>
              <p className={`text-[10px] ${textMuted}`}>Actualizado {new Date(data.generated_at).toLocaleDateString('es-CO')}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className={`flex items-center gap-1 p-1 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
            {(['dashboard', 'flujo', 'modelos'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                    : `${textSecondary} hover:${textPrimary}`
                }`}
              >
                {tab === 'dashboard' ? 'Resumen' : tab === 'flujo' ? 'Flujo de Caja' : 'Modelos'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${darkMode ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Actualizar
              <input type="file" accept=".xlsx,.xls" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
            </label>
            <button onClick={clearData} className={`p-2 rounded-lg text-xs ${darkMode ? 'bg-white/5 hover:bg-white/10 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} transition-all`} title="Limpiar datos">
              🗑️
            </button>
            <button onClick={toggleTheme} className={`p-2 rounded-lg text-xs ${darkMode ? 'bg-white/5 hover:bg-white/10 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} transition-all`}>
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'all' ? 'bg-red-500 text-white' : `${cardBg} border ${borderColor} ${textSecondary} hover:border-red-500/50`
            }`}
          >
            Todos
          </button>
          {proyectos.map(p => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                filter === p ? 'bg-red-500 text-white' : `${cardBg} border ${borderColor} ${textSecondary} hover:border-red-500/50`
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className={`${cardBg} border ${borderColor} rounded-2xl p-5 relative overflow-hidden group hover:border-red-500/20 transition-all`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/10 to-transparent rounded-bl-[40px]"></div>
            <p className={`text-[10px] font-semibold uppercase tracking-widest ${textMuted} mb-3`}>Disponible</p>
            <p className={`text-2xl font-bold ${textPrimary} tracking-tight`}>{formatCOP(dashboard.disponible_hoy)}</p>
            <p className={`text-xs ${textMuted} mt-1`}>Bancolombia</p>
          </div>

          <div className={`${cardBg} border ${borderColor} rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/20 transition-all`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-[40px]"></div>
            <p className={`text-[10px] font-semibold uppercase tracking-widest ${textMuted} mb-3`}>Runway</p>
            <p className={`text-2xl font-bold ${textPrimary} tracking-tight`}>{runway.toFixed(1)} <span className={`text-sm font-normal ${textMuted}`}>meses</span></p>
            <p className={`text-xs ${textMuted} mt-1`}>Burn {formatCOP(dashboard.burn_mensual)}/mes</p>
          </div>

          <div className={`${cardBg} border ${borderColor} rounded-2xl p-5 relative overflow-hidden group hover:border-yellow-500/20 transition-all`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-bl-[40px]"></div>
            <p className={`text-[10px] font-semibold uppercase tracking-widest ${textMuted} mb-3`}>Estado</p>
            <p className={`text-2xl font-bold ${semaforoColor} tracking-tight`}>{semaforoLabel}</p>
            <p className={`text-xs ${textMuted} mt-1`}>≥8 OK · 4-8 cuidado · &lt;4 crítico</p>
          </div>

          <div className={`${cardBg} border ${borderColor} rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/20 transition-all`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-[40px]"></div>
            <p className={`text-[10px] font-semibold uppercase tracking-widest ${textMuted} mb-3`}>Proyectos</p>
            <p className={`text-2xl font-bold ${textPrimary} tracking-tight`}>{proyectos.length}</p>
            <p className={`text-xs ${textMuted} mt-1 truncate`}>{proyectos.slice(0, 3).join(', ')}</p>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Sparkline */}
            <div className={`lg:col-span-2 ${cardBg} border ${borderColor} rounded-2xl p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-sm font-semibold ${textPrimary}`}>Flujo de Caja</h3>
                  <p className={`text-xs ${textMuted}`}>Saldo acumulado en el tiempo</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span className={`text-[10px] ${textMuted}`}>Saldo</span>
                </div>
              </div>
              <div className="h-72">
                <Line data={sparkData} options={chartOptions} />
              </div>
            </div>

            {/* Donut */}
            <div className={`${cardBg} border ${borderColor} rounded-2xl p-5`}>
              <div className="mb-4">
                <h3 className={`text-sm font-semibold ${textPrimary}`}>Distribución</h3>
                <p className={`text-xs ${textMuted}`}>Por proyecto</p>
              </div>
              <div className="h-52">
                <Doughnut 
                  data={donutData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: darkMode ? '#1a1a2e' : '#fff',
                        titleColor: darkMode ? '#fff' : '#111',
                        bodyColor: darkMode ? '#9ca3af' : '#6b7280',
                        borderColor: darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
                        borderWidth: 1,
                        cornerRadius: 12,
                      }
                    }
                  }} 
                />
              </div>
              <div className="mt-4 space-y-2">
                {Object.entries(byProject).slice(0, 5).map(([p, d], i) => (
                  <div key={p} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'][i] }}></span>
                    <span className={`text-xs flex-1 truncate ${textSecondary}`}>{p}</span>
                    <span className={`text-xs font-medium ${textPrimary}`}>{formatCOP(d.ingreso + d.egreso)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar Chart */}
            <div className={`lg:col-span-2 ${cardBg} border ${borderColor} rounded-2xl p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-sm font-semibold ${textPrimary}`}>Ingresos vs Egresos</h3>
                  <p className={`text-xs ${textMuted}`}>Comparación por proyecto</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full"></span><span className={`text-[10px] ${textMuted}`}>Ingresos</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-red-500 rounded-full"></span><span className={`text-[10px] ${textMuted}`}>Egresos</span></div>
                </div>
              </div>
              <div className="h-72">
                <Bar data={barData} options={chartOptions} />
              </div>
            </div>

            {/* Movimientos recientes */}
            <div className={`${cardBg} border ${borderColor} rounded-2xl overflow-hidden`}>
              <div className={`p-5 border-b ${borderColor}`}>
                <h3 className={`text-sm font-semibold ${textPrimary}`}>Últimos Movimientos</h3>
                <p className={`text-xs ${textMuted}`}>{movimientos.length} transacciones</p>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {movimientos.slice(0, 10).map((r, i) => (
                  <div key={i} className={`px-5 py-3 flex items-center gap-3 border-b ${borderColor} last:border-0 hover:${darkMode ? 'bg-white/[0.02]' : 'bg-gray-50'} transition-colors`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${r.tipo === 'INGRESO' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {r.tipo === 'INGRESO' ? '↑' : '↓'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${textPrimary} truncate`}>{r.concepto}</p>
                      <p className={`text-[10px] ${textMuted}`}>{r.proyecto}</p>
                    </div>
                    <span className={`text-xs font-semibold whitespace-nowrap ${r.tipo === 'INGRESO' ? 'text-green-400' : 'text-red-400'}`}>
                      {r.tipo === 'INGRESO' ? '+' : ''}{formatCOP(r.monto)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'flujo' && (
          <div className={`${cardBg} border ${borderColor} rounded-2xl overflow-hidden`}>
            <div className={`p-5 border-b ${borderColor}`}>
              <h3 className={`text-sm font-semibold ${textPrimary}`}>Flujo de Caja Completo</h3>
              <p className={`text-xs ${textMuted}`}>{flujo.length} registros</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${borderColor}`}>
                    <th className={`text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>Fecha</th>
                    <th className={`text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>Proyecto</th>
                    <th className={`text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>Tipo</th>
                    <th className={`text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>Concepto</th>
                    <th className={`text-right px-5 py-3 text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>Monto</th>
                    <th className={`text-right px-5 py-3 text-[10px] font-semibold uppercase tracking-wider ${textMuted}`}>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {flujo.filter(r => r.tipo).map((r, i) => (
                    <tr key={i} className={`border-b ${borderColor} last:border-0 hover:${darkMode ? 'bg-white/[0.02]' : 'bg-gray-50'} transition-colors`}>
                      <td className={`px-5 py-3 text-xs ${textSecondary}`}>{formatDate(r.fecha)}</td>
                      <td className={`px-5 py-3 text-xs font-medium ${textPrimary}`}>{r.proyecto}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${r.tipo === 'INGRESO' ? 'bg-green-500/10 text-green-400' : r.tipo === 'EGRESO' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                          {r.tipo}
                        </span>
                      </td>
                      <td className={`px-5 py-3 text-xs ${textSecondary}`}>{r.concepto}</td>
                      <td className={`px-5 py-3 text-xs font-medium text-right ${(r.monto || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(r.monto || 0) >= 0 ? '+' : ''}{formatCOP(r.monto)}
                      </td>
                      <td className={`px-5 py-3 text-xs font-medium text-right ${(r.saldo || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCOP(r.saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'modelos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modelos_negocio.map((m, i) => (
              <div key={i} className={`${cardBg} border ${borderColor} rounded-2xl p-5 hover:border-red-500/20 transition-all`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    m.estado === 'Activo' ? 'bg-green-500/10' : m.estado === 'En desarrollo' ? 'bg-blue-500/10' : 'bg-gray-500/10'
                  }`}>
                    <span className={`text-lg ${
                      m.estado === 'Activo' ? '🟢' : m.estado === 'En desarrollo' ? '🔵' : '⚪'
                    }`}></span>
                  </div>
                  <div>
                    <h4 className={`text-sm font-semibold ${textPrimary}`}>{m.modelo}</h4>
                    <p className={`text-[10px] ${textMuted}`}>{m.owner}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`text-xs ${textMuted}`}>Estado</span>
                    <span className={`text-xs font-medium ${m.estado === 'Activo' ? 'text-green-400' : 'text-blue-400'}`}>{m.estado}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-xs ${textMuted}`}>Ingreso</span>
                    <span className={`text-xs font-medium ${textPrimary}`}>{formatCOP(m.ingreso_mes_COP)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-xs ${textMuted}`}>Costo</span>
                    <span className={`text-xs font-medium ${textPrimary}`}>{formatCOP(m.costo_mes_COP)}</span>
                  </div>
                  <div className={`flex justify-between pt-2 border-t ${borderColor}`}>
                    <span className={`text-xs font-semibold ${textMuted}`}>Margen</span>
                    <span className={`text-xs font-bold ${(m.margen_mes_COP || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCOP(m.margen_mes_COP)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className={`mt-8 pt-6 border-t ${borderColor} text-center`}>
          <p className={`text-xs ${textMuted}`}>
            RR ALIADOS · Dashboard Financiero · {new Date(data.generated_at).toLocaleDateString('es-CO')} · Datos guardados localmente
          </p>
        </footer>
      </main>
    </div>
  );
}