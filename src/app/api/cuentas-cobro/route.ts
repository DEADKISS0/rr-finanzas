import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getSupabaseServer } from '@/lib/db/supabase';
import { nextCuentaNumero } from '@/lib/cuentas-cobro/pdf';
import type { CuentaCobroPayload } from '@/lib/cuentas-cobro/types';

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
    return NextResponse.json({ ok: true, source: 'local-only', cuentas: [] });
  }

  const { data, error } = await supabase
    .from('cuentas_cobro')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, source: 'supabase', cuentas: data || [] });
}

// Endpoint: siguiente número serial de cuenta de cobro (consulta el último en BD)
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function siguienteNumero(supabase: ReturnType<typeof getSupabaseServer>): Promise<string> {
  if (!supabase) return nextCuentaNumero(0);
  const { data, error } = await supabase
    .from('cuentas_cobro')
    .select('numero')
    .order('created_at', { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) return nextCuentaNumero(0);
  // Extraer el último correlativo del formato RR-CC-YYYY-NNNN
  const last = data[0]?.numero || '';
  const m = last.match(/RR-CC-\d{4}-(\d+)/);
  const n = m ? parseInt(m[1], 10) : 0;
  return nextCuentaNumero(n);
}

export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ ok: false, error: 'admin_required' }, { status: 401 });
  }

  const payload = (await request.json()) as CuentaCobroPayload;
  const supabase = getSupabaseServer();
  const now = new Date().toISOString();
  // Si el payload no trae número, sugerir el siguiente serial real (último en BD + 1)
  const numero = payload.numero || await siguienteNumero(supabase);
  let personaId: string | null = null;

  if (supabase) {
    const normalizedDocumento = (payload.persona.documento || '').replace(/\D/g, '');
    if (normalizedDocumento) {
      const documentoHash = createHash('sha256').update(normalizedDocumento).digest('hex');
      const { data: existingPerson } = await supabase
        .from('personas_cobro')
        .select('id')
        .eq('documento_hash', documentoHash)
        .maybeSingle();
      if (existingPerson?.id) personaId = existingPerson.id;
    }

    if (!personaId) {
      const { data: newPerson, error: personError } = await supabase
        .from('personas_cobro')
        .insert({
          nombre: payload.persona.nombre,
          documento_identidad: payload.persona.documento || null,
          correo: payload.persona.correo || null,
          telefono: payload.persona.telefono || null,
          banco: payload.persona.banco || null,
          tipo_cuenta: payload.persona.tipoCuenta || null,
          numero_cuenta: payload.persona.numeroCuenta || null,
          requiere_validacion: Boolean(payload.persona.necesitaValidacion),
          fuente: 'RR Finanzas / cuentas de cobro',
          responsable: payload.responsable || 'admin',
          notas: payload.persona.notas || null,
        })
        .select('id')
        .single();
      if (personError) return NextResponse.json({ ok: false, error: personError.message }, { status: 500 });
      personaId = newPerson.id;
    }
  }

  const record = {
    numero,
    version: payload.version || 1,
    estado: payload.estado || 'borrador',
    persona_id: personaId,
    persona_nombre: payload.persona.nombre,
    persona_documento: payload.persona.documento,
    persona_payload: payload.persona,
    proyecto: payload.proyecto || null,
    concepto: payload.concepto,
    monto: payload.monto,
    periodo: payload.periodo,
    fecha: payload.fecha,
    responsable: payload.responsable,
    archivo_path: payload.archivoPath || `private/cuentas-cobro/${numero}-v${payload.version || 1}.pdf`,
    // Las líneas (cantidad × precio) se guardan DENTRO del JSONB `payload`
    // (la tabla cuentas_cobro no tiene columna `lineas` propia)
    payload,
    created_at: payload.createdAt || now,
    updated_at: now,
  };

  if (!supabase) {
    return NextResponse.json({ ok: true, source: 'local-only', cuenta: record });
  }

  const { data: existing } = await supabase
    .from('cuentas_cobro')
    .select('id')
    .eq('numero', numero)
    .maybeSingle();

  const query = existing
    ? supabase.from('cuentas_cobro').update(record).eq('id', existing.id).select('*').single()
    : supabase.from('cuentas_cobro').insert(record).select('*').single();

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  await supabase.from('document_audit_log').insert({
    action: existing ? 'cuenta_cobro_actualizada' : 'cuenta_cobro_registrada',
    target_table: 'cuentas_cobro',
    target_id: data.id,
    actor: payload.responsable || 'admin',
    metadata: { numero, estado: record.estado, archivo_path: record.archivo_path },
  });

  return NextResponse.json({ ok: true, source: 'supabase', cuenta: data });
}
