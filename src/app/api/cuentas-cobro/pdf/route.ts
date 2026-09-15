import { NextRequest, NextResponse } from 'next/server';
import { buildCuentaCobroPdf } from '@/lib/cuentas-cobro/pdf';
import type { CuentaCobroPayload } from '@/lib/cuentas-cobro/types';
import { nombreArchivoCuentaCobro } from '@/lib/cuentas-cobro/filename';

const requireAdmin = (request: NextRequest) => {
  const token = process.env.RR_ADMIN_TOKEN;
  if (!token) return true;
  return request.headers.get('x-rr-admin-token') === token;
};

export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ ok: false, error: 'admin_required' }, { status: 401 });
  }

  const payload = (await request.json()) as CuentaCobroPayload;
  const pdf = await buildCuentaCobroPdf(payload);
  const filename = nombreArchivoCuentaCobro(payload);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}
