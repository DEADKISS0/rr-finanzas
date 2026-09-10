import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/db/supabase';
import { siguienteNumero } from '../route';

export async function GET(request: NextRequest) {
  const supabase = getSupabaseServer();
  const numero = await siguienteNumero(supabase);
  return NextResponse.json({ ok: true, numero, source: supabase ? 'supabase' : 'local' });
}
