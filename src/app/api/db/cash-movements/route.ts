import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/db/supabase';

// GET /api/db/cash-movements
// Expone la tabla `cash_movements` (flujo de caja real) para que el dashboard
// pueda superponer los movimientos de Supabase sobre el ledger local.
// Mismo patrón de respuesta que /api/db/projects: { ok, cashMovements/error, source }.
export async function GET() {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, cashMovements: [], source: 'none' });
  }

  const { data, error } = await supabase
    .from('cash_movements')
    .select('*')
    .order('fecha', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, cashMovements: data, source: 'supabase' });
}
