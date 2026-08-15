import * as XLSX from 'xlsx';

export interface DashboardData {
  disponible_hoy: number | null;
  runway_meses: number | null;
  semaforo: string | null;
  burn_mensual: number | null;
}

export interface ModeloNegocio {
  id: number | string;
  modelo: string | null;
  estado: string | null;
  prioridad_caja: number | string | null;
  ingreso_mes_COP: number | string | null;
  costo_mes_COP: number | string | null;
  margen_mes_COP: number | string | null;
  margen_pct: number | string | null;
  owner: string | null;
}

export interface FlujoCaja {
  fecha: string | null;
  proyecto: string | null;
  tipo: string | null;
  concepto: string | null;
  monto: number | null;
  saldo: number | null;
}

export interface FinanzasData {
  generated_at: string;
  dashboard: DashboardData;
  modelos_negocio: ModeloNegocio[];
  flujo_caja: FlujoCaja[];
  servicios: Record<string, unknown[][]>;
  metadata: {
    sheets: string[];
    total_rows: number;
  };
}

function serializeValue(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'number' && isNaN(v)) return null;
  if (typeof v === 'number') return Math.round(v * 100) / 100;
  return v;
}

function sheetToRows(ws: XLSX.WorkSheet, maxRow?: number): Record<string, unknown>[] {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as unknown[][];
  if (!rows.length) return [];
  
  const headers = (rows[0] as unknown[]).map((h, i) => 
    String(h || '').trim() || `col_${i}`
  );
  
  const data: Record<string, unknown>[] = [];
  const endRow = maxRow ? Math.min(maxRow, rows.length) : rows.length;
  
  for (let r = 1; r < endRow; r++) {
    const row = rows[r];
    if (!row || row.every(c => c === null)) continue;
    
    const record: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      if (i < row.length) {
        record[h] = serializeValue(row[i]);
      }
    });
    data.push(record);
  }
  
  return data;
}

function extractDashboard(wb: XLSX.WorkBook): DashboardData {
  const ws = wb.Sheets['00_Dashboard'];
  if (!ws) return { disponible_hoy: null, runway_meses: null, semaforo: null, burn_mensual: null };
  
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, range: 20 }) as unknown[][];
  
  let disponible: number | null = null;
  let runway: number | null = null;
  let semaforo: string | null = null;
  let burn: number | null = null;
  
  for (let i = 0; i < rows.length; i++) {
    const rowStr = rows[i].map(c => String(c || '')).join(' ');
    if (rowStr.includes('DISPONIBLE HOY') && i + 1 < rows.length) {
      const nextRow = rows[i + 1];
      disponible = serializeValue(nextRow[0]) as number | null;
      runway = serializeValue(nextRow[2]) as number | null;
      semaforo = serializeValue(nextRow[4]) as string | null;
      burn = serializeValue(nextRow[6]) as number | null;
    }
  }
  
  return { disponible_hoy: disponible, runway_meses: runway, semaforo: semaforo, burn_mensual: burn };
}

function extractModelos(wb: XLSX.WorkBook): ModeloNegocio[] {
  const ws = wb.Sheets['Modelos_Negocio'];
  if (!ws) return [];
  
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, range: 5 }) as unknown[][];
  if (rows.length < 2) return [];
  
  const headers = (rows[0] as unknown[]).map((h, i) => String(h || '').trim() || `col_${i}`);
  
  return rows.slice(1).filter(row => row[0] != null && String(row[0]).trim() !== '').map(row => {
    const record: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      if (i < row.length) record[h] = serializeValue(row[i]);
    });
    return record as unknown as ModeloNegocio;
  });
}

function extractFlujoCaja(wb: XLSX.WorkBook): FlujoCaja[] {
  const ws = wb.Sheets['Flujo_Caja_Proyectos'];
  if (!ws) return [];
  
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, range: 4 }) as unknown[][];
  const headers = ['fecha', 'proyecto', 'tipo', 'concepto', '_gap', 'monto', 'saldo'];
  
  return rows.filter(row => row[0] != null || row[1] != null).map(row => {
    const record: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      if (i < row.length) record[h] = serializeValue(row[i]);
    });
    return record as unknown as FlujoCaja;
  }).filter(r => r.fecha || r.proyecto);
}

function extractServiceSheets(wb: XLSX.WorkBook): Record<string, unknown[][]> {
  const serviceSheets = [
    'Produccion Video', 'Piezas Graficas', 'Branding',
    'Gestion Redes', 'Desarrollo Web', 'Pauta Publicitaria',
    'SEO Posicionamiento', 'Automatizaciones', 'Email Marketing', 'Masterclass'
  ];
  
  const servicios: Record<string, unknown[][]> = {};
  
  for (const name of serviceSheets) {
    const ws = wb.Sheets[name];
    if (ws) {
      servicios[name] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as unknown[][];
    }
  }
  
  return servicios;
}

export function parseExcel(buffer: Buffer): FinanzasData {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true, cellNF: false, cellText: false });
  
  const dashboard = extractDashboard(wb);
  const modelos = extractModelos(wb);
  const flujo = extractFlujoCaja(wb);
  const servicios = extractServiceSheets(wb);
  
  let totalRows = 0;
  wb.SheetNames.forEach(name => {
    const ws = wb.Sheets[name];
    if (ws) {
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      totalRows += range.e.r - range.s.r + 1;
    }
  });
  
  return {
    generated_at: new Date().toISOString(),
    dashboard,
    modelos_negocio: modelos,
    flujo_caja: flujo,
    servicios,
    metadata: {
      sheets: wb.SheetNames,
      total_rows: totalRows
    }
  };
}