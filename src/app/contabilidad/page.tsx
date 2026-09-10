'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Tab = 'bancos' | 'cuentas_por_pagar' | 'obligaciones';
type RecordRow = { id: string; [key: string]: string | number | boolean | null | undefined };

const tabs: { id: Tab; label: string; singular: string }[] = [
  { id: 'bancos', label: 'Bancos y caja', singular: 'cuenta bancaria' },
  { id: 'cuentas_por_pagar', label: 'Cuentas por pagar', singular: 'cuenta por pagar' },
  { id: 'obligaciones', label: 'Obligaciones', singular: 'obligación' },
];

const fields: Record<Tab, { key: string; label: string; type?: string; options?: string[]; required?: boolean }[]> = {
  bancos: [
    { key: 'nombre', label: 'Nombre', required: true }, { key: 'saldo', label: 'Saldo COP', type: 'number', required: true },
    { key: 'moneda', label: 'Moneda' }, { key: 'conciliado', label: 'Conciliado', type: 'checkbox' },
    { key: 'fecha_corte', label: 'Fecha de corte', type: 'date' }, { key: 'notas', label: 'Notas', type: 'textarea' },
  ],
  cuentas_por_pagar: [
    { key: 'proveedor', label: 'Proveedor', required: true }, { key: 'concepto', label: 'Concepto' },
    { key: 'monto', label: 'Monto COP', type: 'number', required: true }, { key: 'fecha_vencimiento', label: 'Vencimiento', type: 'date' },
    { key: 'estado', label: 'Estado', options: ['pendiente', 'vencida', 'pagada', 'anulada'] },
    { key: 'proyecto', label: 'Proyecto' }, { key: 'categoria', label: 'Categoría' }, { key: 'notas', label: 'Notas', type: 'textarea' },
  ],
  obligaciones: [
    { key: 'concepto', label: 'Concepto', required: true }, { key: 'monto', label: 'Monto COP', type: 'number', required: true },
    { key: 'frecuencia', label: 'Frecuencia', options: ['unica', 'mensual', 'quincenal', 'semanal'] },
    { key: 'dia_pago', label: 'Día de pago', type: 'number' }, { key: 'responsable', label: 'Responsable' },
    { key: 'estado', label: 'Estado', options: ['activo', 'pausado', 'pagado', 'cancelado'] }, { key: 'notas', label: 'Notas', type: 'textarea' },
  ],
};

const money = (value: unknown) => Number(value || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 });

export default function ContabilidadPage() {
  const [tab, setTab] = useState<Tab>('bancos');
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [form, setForm] = useState<Record<string, string | number | boolean>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const config = useMemo(() => tabs.find((item) => item.id === tab)!, [tab]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/db/contabilidad/${tab}`, { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok || !json.ok) throw new Error(json.error || 'No se pudo cargar');
      setRows(json.records || []);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Error cargando datos'); }
    finally { setLoading(false); }
  }, [tab]);

  // La carga es una sincronización con la API; el helper actualiza el estado al resolver.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const reset = () => { setForm({}); setEditing(null); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage('Guardando…');
    const response = await fetch(`/api/db/contabilidad/${tab}`, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { ...form, id: editing } : form) });
    const json = await response.json();
    if (!response.ok || !json.ok) { setMessage(json.error || 'No se pudo guardar'); return; }
    setMessage('Guardado correctamente'); reset(); void load();
  };
  const remove = async (id: string) => {
    if (!window.confirm('¿Eliminar este registro?')) return;
    const response = await fetch(`/api/db/contabilidad/${tab}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (response.ok) { setMessage('Registro eliminado'); void load(); } else setMessage('No se pudo eliminar');
  };
  const startEdit = (row: RecordRow) => { setEditing(row.id); setForm(Object.fromEntries(fields[tab].map((field) => [field.key, row[field.key] ?? '']))); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return <main className="min-h-screen px-5 py-8 md:px-10">
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div><Link href="/" className="text-xs text-[#e7785e] hover:underline">← Volver al dashboard</Link><h1 className="mt-3 text-3xl font-extrabold tracking-tight">Contabilidad central</h1><p className="mt-2 text-sm text-[var(--muted-foreground)]">Edición controlada en Supabase · fuente financiera original: Drive / Excel</p></div>
        {message && <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-[var(--muted-foreground)]">{message}</span>}
      </div>
      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-white/10">
        {tabs.map((item) => <button key={item.id} onClick={() => { setTab(item.id); reset(); }} className={`whitespace-nowrap px-4 py-3 text-sm font-semibold ${tab === item.id ? 'border-b-2 border-[var(--primary)] text-[#e7785e]' : 'text-[var(--muted-foreground)]'}`}>{item.label}</button>)}
      </div>
      <section className="rr-card mb-8 rounded-2xl border border-white/10 p-5">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-bold">{editing ? 'Editar' : 'Registrar'} {config.singular}</h2>{editing && <button onClick={reset} className="text-xs text-[var(--muted-foreground)] hover:text-white">Cancelar edición</button>}</div>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          {fields[tab].map((field) => <label key={field.key} className={`text-xs text-[var(--muted-foreground)] ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}><span className="mb-1.5 block">{field.label}{field.required && ' *'}</span>
            {field.options ? <select required={field.required} value={String(form[field.key] ?? field.options[0])} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white"><option value="" className="bg-[#111117]">Seleccionar</option>{field.options.map((option) => <option key={option} value={option} className="bg-[#111117]">{option}</option>)}</select>
              : field.type === 'textarea' ? <textarea required={field.required} value={String(form[field.key] ?? '')} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white" />
              : field.type === 'checkbox' ? <input type="checkbox" checked={Boolean(form[field.key])} onChange={(e) => setForm({ ...form, [field.key]: e.target.checked })} className="h-4 w-4 accent-[var(--primary)]" />
              : <input required={field.required} type={field.type || 'text'} value={String(form[field.key] ?? '')} onChange={(e) => setForm({ ...form, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white" />}
          </label>)}
          <div className="md:col-span-2"><button className="rr-btn-primary rounded-xl px-5 py-3 text-sm font-bold" type="submit">{editing ? 'Actualizar' : 'Guardar'} registro</button></div>
        </form>
      </section>
      <section className="rr-card overflow-hidden rounded-2xl border border-white/10"><div className="border-b border-white/10 px-5 py-4"><h2 className="font-bold">Registros guardados</h2></div>{loading ? <p className="p-5 text-sm text-[var(--muted-foreground)]">Cargando…</p> : rows.length === 0 ? <p className="p-5 text-sm text-[var(--muted-foreground)]">No hay registros todavía.</p> : <div className="divide-y divide-white/10">{rows.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"><div><p className="font-semibold">{String(row.nombre || row.proveedor || row.concepto || 'Sin nombre')}</p><p className="mt-1 text-xs text-[var(--muted-foreground)]">{row.estado ? String(row.estado) : row.fecha_vencimiento ? `Vence ${String(row.fecha_vencimiento)}` : 'Sin estado'}</p></div><div className="flex items-center gap-4"><strong className="text-sm text-[#e8c069]">{row.saldo !== undefined ? `$${money(row.saldo)}` : row.monto !== undefined ? `$${money(row.monto)}` : ''}</strong><button onClick={() => startEdit(row)} className="text-xs text-[#e7785e]">Editar</button><button onClick={() => void remove(row.id)} className="text-xs text-red-400">Eliminar</button></div></div>)}</div>}</section>
    </div>
  </main>;
}
