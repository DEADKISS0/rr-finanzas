import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/db/supabase';
import type { DocumentRecord } from '@/lib/db/types';

// GET /api/documentos — lista los documentos registrados (índice/respaldo en Supabase).
// La verdad de los archivos vive en el Drive (drive_path); aquí solo el índice.
export async function GET() {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: true, source: 'native', documentos: [] });
  }

  const { data, error } = await supabase
    .from('documentos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const documentos: DocumentRecord[] = (data || []).map((d) => ({
    id: d.id,
    titulo: d.titulo,
    tipo: d.tipo || 'otro',
    proyecto: d.proyecto || null,
    drive_path: d.drive_path || null,
    file_name: d.file_name || null,
    file_path: d.file_path || null,
    mime_type: d.mime_type || null,
    size_bytes: d.size_bytes ?? null,
    version: d.version ?? 1,
    estado: d.estado || 'vigente',
    notas: d.notas || null,
    created_at: d.created_at,
    updated_at: d.updated_at,
  }));

  return NextResponse.json({ ok: true, source: 'supabase', documentos });
}

// POST /api/documentos — registra un documento. Acepta:
//  - { titulo, tipo, proyecto, drive_path, estado, notas } : referencia a un archivo del Drive (SSOT)
//  - o { titulo, tipo, proyecto, drive_path/notas }        : metadato con ruta canónica
// Server-side (service role / RLS). Si no hay credenciales, responde source:'native'
// sin fallar (modo local-first), igual que el resto de la app.
export async function POST(request: Request) {
  const supabase = getSupabaseServer();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const titulo = String(body.titulo || '').trim();
  if (!titulo) {
    return NextResponse.json({ ok: false, error: 'titulo_requerido' }, { status: 400 });
  }

  // Mapa de tipos válidos para mantener coherencia con el resto del negocio.
  const tiposValidos = ['contrato', 'factura', 'cuenta_cobro', 'soporte', 'propuesta', 'otro'];
  const tipo = String(body.tipo || 'otro');
  if (!tiposValidos.includes(tipo)) {
    return NextResponse.json({ ok: false, error: 'tipo_invalido' }, { status: 400 });
  }

  const estado = String(body.estado || 'vigente');
  const estadosValidos = ['borrador', 'vigente', 'reemplazado', 'anulado'];
  if (!estadosValidos.includes(estado)) {
    return NextResponse.json({ ok: false, error: 'estado_invalido' }, { status: 400 });
  }

  // Sin Supabase configurado: modo local-first (no falla, solo reporta).
  if (!supabase) {
    return NextResponse.json({
      ok: true,
      source: 'native',
      documento: {
        id: `local-${Date.now().toString(36)}`,
        titulo,
        tipo,
        proyecto: body.proyecto || null,
        drive_path: body.drive_path || null,
        estado,
        notas: body.notas || null,
      },
    });
  }

  const { data, error } = await supabase
    .from('documentos')
    .insert({
      titulo,
      tipo,
      proyecto: body.proyecto || null,
      drive_path: body.drive_path || null,
      file_name: body.file_name || null,
      file_path: body.file_path || null,
      mime_type: body.mime_type || null,
      size_bytes: body.size_bytes ?? null,
      version: body.version ?? 1,
      estado,
      notas: body.notas || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, source: 'supabase', documento: data });
}
