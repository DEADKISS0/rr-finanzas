import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/db/supabase';

const TABLES = {
  bancos: ['nombre', 'saldo', 'moneda', 'conciliado', 'fecha_corte', 'notas'],
  cuentas_por_pagar: ['proveedor', 'concepto', 'monto', 'fecha_emision', 'fecha_vencimiento', 'fecha_pagada', 'medio', 'estado', 'proyecto', 'categoria', 'notas'],
  obligaciones: ['concepto', 'monto', 'frecuencia', 'dia_pago', 'responsable', 'estado', 'notas'],
} as const;

type Tabla = keyof typeof TABLES;

async function tableFrom(request: NextRequest, params: Promise<{ tabla: string }>) {
  const { tabla } = await params;
  if (!(tabla in TABLES)) return null;
  const adminToken = process.env.RR_ADMIN_TOKEN;
  if (adminToken && request.headers.get('x-rr-admin-token') !== adminToken) return 'unauthorized' as const;
  return tabla as Tabla;
}

function cleanPayload(tabla: Tabla, payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const allowed = TABLES[tabla] as readonly string[];
  return Object.fromEntries(Object.entries(payload).filter(([key, value]) => allowed.includes(key) && value !== undefined));
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ tabla: string }> }) {
  const tabla = await tableFrom(request, params);
  if (tabla === 'unauthorized') return NextResponse.json({ ok: false, error: 'admin_required' }, { status: 401 });
  if (!tabla) return NextResponse.json({ ok: false, error: 'tabla_no_permitida' }, { status: 404 });
  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: true, source: 'local-only', records: [] });
  const { data, error } = await supabase.from(tabla).select('*').order('created_at', { ascending: false }).limit(200);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, source: 'supabase', records: data || [] });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ tabla: string }> }) {
  const tabla = await tableFrom(request, params);
  if (tabla === 'unauthorized') return NextResponse.json({ ok: false, error: 'admin_required' }, { status: 401 });
  if (!tabla) return NextResponse.json({ ok: false, error: 'tabla_no_permitida' }, { status: 404 });
  const payload = cleanPayload(tabla, await request.json());
  if (!payload) return NextResponse.json({ ok: false, error: 'payload_invalido' }, { status: 400 });
  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: true, source: 'local-only', record: payload });
  const { data, error } = await supabase.from(tabla).insert(payload).select('*').single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, source: 'supabase', record: data }, { status: 201 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ tabla: string }> }) {
  const tabla = await tableFrom(request, params);
  if (tabla === 'unauthorized') return NextResponse.json({ ok: false, error: 'admin_required' }, { status: 401 });
  if (!tabla) return NextResponse.json({ ok: false, error: 'tabla_no_permitida' }, { status: 404 });
  const body = await request.json();
  if (!body?.id) return NextResponse.json({ ok: false, error: 'id_requerido' }, { status: 400 });
  const payload = cleanPayload(tabla, body);
  if (!payload) return NextResponse.json({ ok: false, error: 'payload_invalido' }, { status: 400 });
  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: true, source: 'local-only', record: { ...payload, id: body.id } });
  const { data, error } = await supabase.from(tabla).update(payload).eq('id', body.id).select('*').single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, source: 'supabase', record: data });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ tabla: string }> }) {
  const tabla = await tableFrom(request, params);
  if (tabla === 'unauthorized') return NextResponse.json({ ok: false, error: 'admin_required' }, { status: 401 });
  if (!tabla) return NextResponse.json({ ok: false, error: 'tabla_no_permitida' }, { status: 404 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'id_requerido' }, { status: 400 });
  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: true, source: 'local-only' });
  const { error } = await supabase.from(tabla).delete().eq('id', id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, source: 'supabase' });
}
