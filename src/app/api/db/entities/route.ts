import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/db/supabase';

export async function GET() {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, entities: [], source: 'none' });
  }

  const { data, error } = await supabase.from('entities').select('*').order('nombre');
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, entities: data, source: 'supabase' });
}
