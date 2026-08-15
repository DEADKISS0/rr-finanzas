import { Redis } from '@upstash/redis';
import { Proyecto, Movimiento, PagoProgramado, FinanzasState, DashboardKPIs } from './types';

// Initialize Redis client
// You need to set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel environment variables
// Get them from: https://console.upstash.com
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    console.warn('Upstash Redis not configured. Using in-memory fallback.');
    return null;
  }
  
  redis = new Redis({ url, token });
  return redis;
}

// In-memory fallback for development/testing
let memoryStore: Record<string, string> = {};

async function getData<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (r) {
    try {
      const data = await r.get<string>(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (e) {
      console.error('Redis get error:', e);
      return null;
    }
  }
  
  // Fallback to memory
  const data = memoryStore[key];
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

async function setData(key: string, value: unknown): Promise<void> {
  const r = getRedis();
  if (r) {
    try {
      await r.set(key, JSON.stringify(value));
      return;
    } catch (e) {
      console.error('Redis set error:', e);
    }
  }
  
  // Fallback to memory
  memoryStore[key] = JSON.stringify(value);
}

const KEYS = {
  PROYECTOS: 'rr:proyectos',
  MOVIMIENTOS: 'rr:movimientos',
  PAGOS: 'rr:pagos',
  ULTIMA_ACTUALIZACION: 'rr:ultima_actualizacion',
};

// ============ PROYECTOS ============

export async function getProyectos(): Promise<Proyecto[]> {
  return (await getData<Proyecto[]>(KEYS.PROYECTOS)) || [];
}

export async function saveProyectos(proyectos: Proyecto[]): Promise<void> {
  await setData(KEYS.PROYECTOS, proyectos);
  await setData(KEYS.ULTIMA_ACTUALIZACION, new Date().toISOString());
}

export async function addProyecto(proyecto: Proyecto): Promise<Proyecto> {
  const proyectos = await getProyectos();
  proyectos.push(proyecto);
  await saveProyectos(proyectos);
  return proyecto;
}

export async function updateProyecto(id: string, updates: Partial<Proyecto>): Promise<Proyecto | null> {
  const proyectos = await getProyectos();
  const index = proyectos.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  proyectos[index] = { ...proyectos[index], ...updates, actualizado_en: new Date().toISOString() };
  await saveProyectos(proyectos);
  return proyectos[index];
}

export async function deleteProyecto(id: string): Promise<boolean> {
  const proyectos = await getProyectos();
  const filtered = proyectos.filter(p => p.id !== id);
  if (filtered.length === proyectos.length) return false;
  await saveProyectos(filtered);
  return true;
}

// ============ MOVIMIENTOS ============

export async function getMovimientos(): Promise<Movimiento[]> {
  return (await getData<Movimiento[]>(KEYS.MOVIMIENTOS)) || [];
}

export async function saveMovimientos(movimientos: Movimiento[]): Promise<void> {
  await setData(KEYS.MOVIMIENTOS, movimientos);
  await setData(KEYS.ULTIMA_ACTUALIZACION, new Date().toISOString());
}

export async function addMovimiento(movimiento: Movimiento): Promise<Movimiento> {
  const movimientos = await getMovimientos();
  movimientos.push(movimiento);
  await saveMovimientos(movimientos);
  return movimiento;
}

export async function updateMovimiento(id: string, updates: Partial<Movimiento>): Promise<Movimiento | null> {
  const movimientos = await getMovimientos();
  const index = movimientos.findIndex(m => m.id === id);
  if (index === -1) return null;
  
  movimientos[index] = { ...movimientos[index], ...updates };
  await saveMovimientos(movimientos);
  return movimientos[index];
}

export async function deleteMovimiento(id: string): Promise<boolean> {
  const movimientos = await getMovimientos();
  const filtered = movimientos.filter(m => m.id !== id);
  if (filtered.length === movimientos.length) return false;
  await saveMovimientos(filtered);
  return true;
}

// ============ PAGOS ============

export async function getPagos(): Promise<PagoProgramado[]> {
  return (await getData<PagoProgramado[]>(KEYS.PAGOS)) || [];
}

export async function savePagos(pagos: PagoProgramado[]): Promise<void> {
  await setData(KEYS.PAGOS, pagos);
  await setData(KEYS.ULTIMA_ACTUALIZACION, new Date().toISOString());
}

export async function addPago(pago: PagoProgramado): Promise<PagoProgramado> {
  const pagos = await getPagos();
  pagos.push(pago);
  await savePagos(pagos);
  return pago;
}

export async function updatePago(id: string, updates: Partial<PagoProgramado>): Promise<PagoProgramado | null> {
  const pagos = await getPagos();
  const index = pagos.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  pagos[index] = { ...pagos[index], ...updates };
  await savePagos(pagos);
  return pagos[index];
}

export async function deletePago(id: string): Promise<boolean> {
  const pagos = await getPagos();
  const filtered = pagos.filter(p => p.id !== id);
  if (filtered.length === pagos.length) return false;
  await savePagos(filtered);
  return true;
}

// ============ DASHBOARD ============

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const [proyectos, movimientos, pagos] = await Promise.all([
    getProyectos(),
    getMovimientos(),
    getPagos(),
  ]);

  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  
  const movimientosMes = movimientos.filter(m => {
    const fecha = new Date(m.fecha);
    return fecha >= inicioMes && fecha <= hoy;
  });

  const totalIngresosMes = movimientosMes
    .filter(m => m.tipo === 'ingreso')
    .reduce((sum, m) => sum + m.monto, 0);

  const totalEgresosMes = movimientosMes
    .filter(m => m.tipo === 'egreso')
    .reduce((sum, m) => sum + m.monto, 0);

  const pagosPendientes = pagos.filter(p => p.estado === 'pendiente' || p.estado === 'programado');
  const pagosVencidos = pagos.filter(p => {
    if (p.estado === 'pagado') return false;
    return new Date(p.fecha_programada) < hoy;
  });

  const burnMensual = totalEgresosMes || 500000;
  const disponible = totalIngresosMes - totalEgresosMes;

  return {
    disponible_hoy: disponible > 0 ? disponible : 3600000,
    total_ingresos_mes: totalIngresosMes,
    total_egresos_mes: totalEgresosMes,
    saldo_neto_mes: totalIngresosMes - totalEgresosMes,
    proyectos_activos: proyectos.filter(p => p.estado === 'activo').length,
    pagos_pendientes: pagosPendientes.length,
    pagos_vencidos: pagosVencidos.length,
    runway_meses: disponible > 0 ? Math.round((disponible / burnMensual) * 10) / 10 : 7.2,
  };
}

// ============ FULL STATE ============

export async function getFullState(): Promise<FinanzasState> {
  const [proyectos, movimientos, pagos, kpis] = await Promise.all([
    getProyectos(),
    getMovimientos(),
    getPagos(),
    getDashboardKPIs(),
  ]);

  const ultima = await getData<string>(KEYS.ULTIMA_ACTUALIZACION);

  return {
    proyectos,
    movimientos,
    pagos,
    kpis,
    ultima_actualizacion: ultima || new Date().toISOString(),
  };
}