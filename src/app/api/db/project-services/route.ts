import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/db/supabase';

// GET /api/db/project-services
// Expone la tabla `project_services` con el nombre del proyecto
// (join implícito project_id -> projects.id) para leer servicios por proyecto.
// Mismo patrón de respuesta que /api/db/projects: { ok, projectServices/error, source }.
export async function GET() {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, projectServices: [], source: 'none' });
  }

  const { data, error } = await supabase
    .from('project_services')
    .select('*, projects(nombre)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, projectServices: data, source: 'supabase' });
}
