import { Proyecto, Movimiento, PagoProgramado, FinanzasState, DashboardKPIs } from './types';

// Check if Vercel KV is configured
const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const isKVConfigured = !!(KV_URL && KV_TOKEN);

// Dynamic import for Vercel KV
async function getKV() {
  if (!isKVConfigured) return null;
  try {
    const { kv } = await import('@vercel/kv');
    return kv;
  } catch {
    return null;
  }
}

const KEYS = {
  PROYECTOS: 'rr:proyectos',
  MOVIMIENTOS: 'rr:movimientos',
  PAGOS: 'rr:pagos',
  ULTIMA_ACTUALIZACION: 'rr:ultima_actualizacion',
};

// In-memory fallback (for when KV is not configured)
let memoryStore: Record<string, unknown> = {};

async function getData<T>(key: string): Promise<T | null> {
  const kv = await getKV();
  if (kv) {
    return kv.get<T>(key);
  }
  return (memoryStore[key] as T) || null;
}

async function setData(key: string, value: unknown): Promise<void> {
  const kv = await getKV();
  if (kv) {
    await kv.set(key, value);
  } else {
    memoryStore[key] = value;
  }
}

// ============ PROYECTOS ============

export async function getProyectos(): Promise<Proyecto[]> {
  const data = await getData<Proyecto[]>(KEYS.PROYECTOS);
  return data || [];
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
  const data = await getData<Movimiento[]>(KEYS.MOVIMIENTOS);
  return data || [];
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
  const data = await getData<PagoProgramado[]>(KEYS.PAGOS);
  return data || [];
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