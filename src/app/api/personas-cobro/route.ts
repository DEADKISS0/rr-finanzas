import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/db/supabase';
import type { PersonaCobro } from '@/lib/cuentas-cobro/types';

const requireAdmin = (request: NextRequest) => {
  const token = process.env.RR_ADMIN_TOKEN;
  if (!token) return true;
  return request.headers.get('x-rr-admin-token') === token;
};

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ ok: false, error: 'admin_required' }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: true, source: 'local-only', personas: [] });
  }

  const { data, error } = await supabase
    .from('personas_cobro')
    .select('id,nombre,documento_identidad,correo,telefono,banco,tipo_cuenta,numero_cuenta,requiere_validacion,notas')
    .order('nombre');

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const personas: PersonaCobro[] = (data || []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    documento: p.documento_identidad || '',
    correo: p.correo || '',
    telefono: p.telefono || '',
    banco: p.banco || '',
    tipoCuenta: p.tipo_cuenta || '',
    numeroCuenta: p.numero_cuenta || '',
    necesitaValidacion: Boolean(p.requiere_validacion),
    notas: p.notas || '',
  }));

  return NextResponse.json({ ok: true, source: 'supabase', personas });
}

// Crear o actualizar una persona de cobro (autocompletar + editar)
export async function PATCH(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ ok: false, error: 'admin_required' }, { status: 401 });
  }
  const body = (await request.json()) as PersonaCobro & { id?: string };
  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: 'no_supabase' }, { status: 500 });

  const row = {
    nombre: body.nombre,
    documento_identidad: body.documento || null,
    correo: body.correo || null,
    telefono: body.telefono || null,
    banco: body.banco || null,
    tipo_cuenta: body.tipoCuenta || null,
    numero_cuenta: body.numeroCuenta || null,
    requiere_validacion: Boolean(body.necesitaValidacion),
    notas: body.notas || null,
  };

  // Solo actualizar si el id es un UUID real de la BD (no un id local tipo 'persona-xxx')
  const esUuid = Boolean(body.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id));

  if (esUuid) {
    const { data, error } = await supabase.from('personas_cobro').update(row).eq('id', body.id).select('*').single();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, source: 'supabase', persona: data });
  }

  // Id local (no UUID): buscar por documento o nombre ANTES de insertar,
  // para actualizar la existente en vez de chocar con el UNIQUE de documento_hash.
  let existingId: string | null = null;
  if (body.documento) {
    const { data: porDoc } = await supabase
      .from('personas_cobro')
      .select('id')
      .eq('documento_identidad', body.documento)
      .maybeSingle();
    if (porDoc?.id) existingId = porDoc.id;
  }
  if (!existingId && body.nombre) {
    const { data: porNombre } = await supabase
      .from('personas_cobro')
      .select('id')
      .eq('nombre', body.nombre)
      .maybeSingle();
    if (porNombre?.id) existingId = porNombre.id;
  }

  if (existingId) {
    const { data, error } = await supabase.from('personas_cobro').update(row).eq('id', existingId).select('*').single();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, source: 'supabase', persona: data });
  }

  const { data, error } = await supabase.from('personas_cobro').insert(row).select('*').single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, source: 'supabase', persona: data });
}

