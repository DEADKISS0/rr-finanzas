export interface EntityRecord {
  id: string;
  slug: string;
  nombre: string;
  nombre_canonico: string;
  tipo: string;
  estado: string;
  drive_path: string;
  probabilidad_cierre?: number | null;
  notas?: string | null;
}

export interface ProjectRecord {
  id: string;
  slug: string;
  entity_id?: string | null;
  nombre: string;
  categoria: string;
  estado: string;
  fase?: string | null;
  proximo_hito?: string | null;
  descripcion?: string | null;
  alcance: string;
  valor_total?: number | null;
  valor_pagado?: number | null;
  valor_potencial?: number | null;
  servicios?: string[];
  servicios_potenciales?: string[];
}

export interface FinancialSnapshot {
  disponible_hoy?: number | null;
  runway_meses?: number | null;
  semaforo?: string | null;
  burn_mensual?: number | null;
  synced_at?: string;
}

export interface TalentCandidate {
  id: string;
  local_id: string;
  rol_id: string;
  estado: string;
  nombre_completo?: string | null;
  pool_de_talento?: boolean;
  prioridad?: string | null;
}

export interface SyncRun {
  id: string;
  source: string;
  status: string;
  records_processed?: number;
  started_at?: string;
  finished_at?: string | null;
  error_message?: string | null;
}

export interface CashMovementRecord {
  id: string;
  fecha?: string;
  concepto?: string;
  monto?: number | null;
  tipo?: string | null; // 'ingreso' | 'egreso' (según convención del tablero)
  categoria?: string | null;
  proyecto_id?: string | null;
  synced_at?: string;
  created_at?: string;
}

export interface ProjectServiceRecord {
  id: string;
  project_id?: string | null;
  servicio?: string | null;
  tipo?: string | null; // 'confirmado' | 'potencial' (según convención del tablero)
  monto?: number | null;
  estado?: string | null;
  created_at?: string;
  projects?: { nombre?: string | null } | null;
}
