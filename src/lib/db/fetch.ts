import type { ProjectRecord } from './types';

interface DashboardProyecto {
  id: string;
  nombre: string;
  cliente: string;
  estado: 'planificacion' | 'activo' | 'pausado' | 'completado' | 'cancelado';
  valor_total: number;
  valor_pagado: number;
  fecha_inicio: string;
  fecha_fin: string;
  descripcion: string;
  servicios: string[];
  categoria?: 'cliente' | 'prospecto' | 'interno';
  fase?: string;
  proximo_hito?: string;
  servicios_potenciales?: string[];
  valor_potencial?: number;
  fuente?: string;
}

export function mapDbProjectToDashboard(p: ProjectRecord): DashboardProyecto {
  return {
    id: p.slug,
    nombre: p.nombre,
    cliente: p.nombre.split(' (')[0],
    estado: (p.estado as DashboardProyecto['estado']) || 'planificacion',
    valor_total: Number(p.valor_total) || 0,
    valor_pagado: Number(p.valor_pagado) || 0,
    fecha_inicio: '',
    fecha_fin: '',
    descripcion: p.descripcion || '',
    servicios: p.servicios || [],
    categoria: (p.categoria as DashboardProyecto['categoria']) || 'cliente',
    fase: p.fase || undefined,
    proximo_hito: p.proximo_hito || undefined,
    servicios_potenciales: p.servicios_potenciales || [],
    valor_potencial: p.valor_potencial != null ? Number(p.valor_potencial) : undefined,
    fuente: 'supabase',
  };
}

export async function fetchSupabaseProjects(): Promise<DashboardProyecto[]> {
  const res = await fetch('/api/db/projects');
  if (!res.ok) return [];
  const json = await res.json();
  if (!json.ok || !json.projects?.length) return [];
  return json.projects.map(mapDbProjectToDashboard);
}

export async function fetchSupabaseFinancialSnapshot() {
  const res = await fetch('/api/db/financial');
  if (!res.ok) return null;
  const json = await res.json();
  return json.ok ? json.snapshot : null;
}
