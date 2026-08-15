export type EstadoProyecto = 'planificacion' | 'activo' | 'pausado' | 'completado' | 'cancelado';
export type TipoMovimiento = 'ingreso' | 'egreso';
export type EstadoPago = 'pendiente' | 'programado' | 'pagado' | 'vencido';
export type CategoriaMovimiento = 
  | 'servicios' | 'produccion' | 'desarrollo' | 'marketing' 
  | 'operaciones' | 'personal' | 'proveedores' | 'impuestos'
  | 'alquiler' | 'servicios_publicos' | 'software' | 'otros';

export interface Proyecto {
  id: string;
  nombre: string;
  cliente: string;
  estado: EstadoProyecto;
  valor_total: number;
  valor_pagado: number;
  fecha_inicio: string;
  fecha_fin_estimada: string;
  descripcion: string;
  servicios: string[];
  notas: string;
  creado_en: string;
  actualizado_en: string;
}

export interface Movimiento {
  id: string;
  proyecto_id: string | null;
  tipo: TipoMovimiento;
  concepto: string;
  monto: number;
  fecha: string;
  categoria: CategoriaMovimiento;
  registrado_por: string;
  evidencia: string;
  notas: string;
  creado_en: string;
}

export interface PagoProgramado {
  id: string;
  proyecto_id: string;
  movimiento_id: string | null;
  concepto: string;
  monto: number;
  fecha_programada: string;
  fecha_pagada: string | null;
  estado: EstadoPago;
  responsable: string;
  notas: string;
  creado_en: string;
}

export interface DashboardKPIs {
  disponible_hoy: number;
  total_ingresos_mes: number;
  total_egresos_mes: number;
  saldo_neto_mes: number;
  proyectos_activos: number;
  pagos_pendientes: number;
  pagos_vencidos: number;
  runway_meses: number;
}

export interface FinanzasState {
  proyectos: Proyecto[];
  movimientos: Movimiento[];
  pagos: PagoProgramado[];
  kpis: DashboardKPIs;
  ultima_actualizacion: string;
}