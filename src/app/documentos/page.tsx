'use client';

import { useEffect, useMemo, useState } from 'react';
import { FilePlus2, Files, Save, Trash2, FolderOpen, ExternalLink } from 'lucide-react';
import type { DocumentRecord } from '@/lib/db/types';

const hoy = () => new Date().toISOString().slice(0, 10);

const TIPOS: { v: string; l: string }[] = [
  { v: 'contrato', l: 'Contrato' },
  { v: 'cuenta_cobro', l: 'Cuenta de cobro' },
  { v: 'factura', l: 'Factura' },
  { v: 'propuesta', l: 'Propuesta' },
  { v: 'soporte', l: 'Soporte' },
  { v: 'otro', l: 'Otro' },
];

const ESTADOS: { v: string; l: string }[] = [
  { v: 'borrador', l: 'Borrador' },
  { v: 'vigente', l: 'Vigente' },
  { v: 'reemplazado', l: 'Reemplazado' },
  { v: 'anulado', l: 'Anulado' },
];

const tamano = (b?: number | null) => {
  if (b == null) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

export default function DocumentosPage() {
  const [tab, setTab] = useState<'registrar' | 'lista'>('registrar');
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [source, setSource] = useState<'native' | 'supabase'>('native');
  const [status, setStatus] = useState('');

  const [form, setForm] = useState({
    titulo: '',
    tipo: 'contrato',
    proyecto: '',
    drive_path: '',
    estado: 'vigente',
    notas: '',
    fecha: hoy(),
  });

  const esValido = form.titulo.trim().length > 0;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/documentos', { cache: 'no-store' });
        const json = await res.json();
        if (json.ok && Array.isArray(json.documentos)) {
          setDocs(json.documentos);
          setSource(json.source === 'supabase' ? 'supabase' : 'native');
        }
      } catch {
        // local-first
      }
    })();
  }, []);

  const registrar = async () => {
    if (!esValido) return;
    setStatus('Guardando…');
    const payload = {
      titulo: form.titulo.trim(),
      tipo: form.tipo,
      proyecto: form.proyecto.trim() || null,
      drive_path: form.drive_path.trim() || null,
      estado: form.estado,
      notas: form.notas.trim() || null,
    };
    try {
      const res = await fetch('/api/documentos', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'No se pudo registrar');
      const nuevo = json.documento as DocumentRecord;
      setDocs((prev) => [nuevo, ...prev]);
      setSource(json.source === 'supabase' ? 'supabase' : 'native');
      setStatus(json.source === 'supabase' ? 'Documento guardado en Supabase.' : 'Modo local: registrado en esta sesión. Se guardará en Supabase cuando existan credenciales.');
      setForm((f) => ({ ...f, titulo: '', proyecto: '', drive_path: '', notas: '' }));
      setTab('lista');
    } catch (e) {
      setStatus((e as Error).message || 'Error al registrar');
    }
  };

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este documento del índice?')) return;
    setDocs((prev) => prev.filter((d) => d.id !== id));
    setStatus('Eliminado del índice local. La BD se sincroniza al recargar.');
  };

  const badgeTipo = (t: string) => {
    const colors: Record<string, string> = {
      contrato: 'bg-[#ce3d1f]/15 text-[#e7785e] border-[#ce3d1f]/25',
      cuenta_cobro: 'bg-[#3f0035]/40 text-[#e8c069] border-[#3f0035]',
      factura: 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/25',
      propuesta: 'bg-[#3b82f6]/10 text-[#7db4f0] border-[#3b82f6]/25',
      soporte: 'bg-white/5 text-[#8a8778] border-white/10',
      otro: 'bg-white/5 text-[#8a8778] border-white/10',
    };
    return colors[t] || colors.otro;
  };

  const filtrados = useMemo(() => docs, [docs]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-[var(--border)] bg-secondary">
        <div className="mx-auto max-w-7xl px-4 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-primary">RR Finanzas · Documentos</p>
            <h1 className="text-3xl font-black uppercase tracking-tight">Guardar documentos</h1>
            <p className="mt-1 text-sm text-foreground/70">La verdad vive en el Drive · aquí está el índice y el respaldo</p>
          </div>
          <div className="flex items-center gap-2 rounded border border-[var(--border)] px-3 py-2 text-xs text-foreground/80">
            <Files className="h-4 w-4 text-primary" />
            {docs.length} documento{docs.length !== 1 ? 's' : ''}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 flex gap-1">
          <button onClick={() => setTab('registrar')} className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${tab === 'registrar' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>＋ Registrar</button>
          <button onClick={() => setTab('lista')} className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${tab === 'lista' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>Índice ({docs.length})</button>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-6">
        {tab === 'registrar' && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
            <div className="rr-card border border-[var(--border)] rounded-[var(--radius-card)] p-5">
              <div className="flex items-center gap-2 mb-5">
                <FilePlus2 className="h-5 w-5 text-primary" />
                <h2 className="text-sm font-black uppercase">Nuevo documento</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block text-xs font-bold uppercase md:col-span-2">
                  Título *
                  <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="p. ej. Contrato Candilejas S3" className="mt-1 w-full rounded-[var(--radius-input)] border border-[var(--input)] bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
                </label>
                <label className="block text-xs font-bold uppercase">
                  Tipo
                  <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="mt-1 w-full rounded-[var(--radius-input)] border border-[var(--input)] bg-background px-3 py-2.5 text-sm text-foreground">
                    {TIPOS.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-bold uppercase">
                  Proyecto
                  <input value={form.proyecto} onChange={(e) => setForm({ ...form, proyecto: e.target.value })} placeholder="p. ej. Wuundeer" className="mt-1 w-full rounded-[var(--radius-input)] border border-[var(--input)] bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
                </label>
                <label className="block text-xs font-bold uppercase md:col-span-2">
                  Ruta en el Drive (carpeta del documento)
                  <div className="mt-1 flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input value={form.drive_path} onChange={(e) => setForm({ ...form, drive_path: e.target.value })} placeholder="RR/RR_Aliados/04_Finanzas/…" className="w-full rounded-[var(--radius-input)] border border-[var(--input)] bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
                  </div>
                  <span className="mt-1 block text-[11px] text-muted-foreground">Pega la ruta canónica en el Drive. El archivo sigue viviendo allí (regla SSOT).</span>
                </label>
                <label className="block text-xs font-bold uppercase">
                  Estado
                  <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className="mt-1 w-full rounded-[var(--radius-input)] border border-[var(--input)] bg-background px-3 py-2.5 text-sm text-foreground">
                    {ESTADOS.map((e) => <option key={e.v} value={e.v}>{e.l}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-bold uppercase">
                  Fecha
                  <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="mt-1 w-full rounded-[var(--radius-input)] border border-[var(--input)] bg-background px-3 py-2.5 text-sm text-foreground" />
                </label>
                <label className="block text-xs font-bold uppercase md:col-span-2">
                  Notas
                  <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} className="mt-1 min-h-20 w-full rounded-[var(--radius-input)] border border-[var(--input)] bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" placeholder="Versión, tipo de soporte, referencias…" />
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <button onClick={registrar} disabled={!esValido} className="rr-btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase disabled:opacity-40"><Save className="h-4 w-4" /> Guardar documento</button>
              <p className="border border-[var(--border)] p-3 text-xs text-muted-foreground">{status || 'El documento queda indexado aquí y en Supabase si está conectado.'}</p>
              <div className="border border-[var(--border)] p-3">
                <h3 className="mb-2 text-xs font-black uppercase">Regla de oro</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">El archivo en físico vive en tu <span className="text-foreground">Google Drive</span>. Esta página guarda el <span className="text-foreground">índice y el respaldo</span> para encontrarlo rápido y tener trazabilidad. No dupliques el documento aquí.</p>
              </div>
            </div>
          </div>
        )}

        {tab === 'lista' && (
          <div className="rr-card border border-[var(--border)] rounded-[var(--radius-card)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <h2 className="text-sm font-black uppercase">Índice de documentos</h2>
              {source === 'supabase' && <span className="rounded-lg border border-[#22c55e]/25 bg-[#22c55e]/10 px-2 py-1 text-[10px] font-bold text-[#22c55e]">Supabase</span>}
            </div>
            {filtrados.length === 0 ? (
              <div className="p-12 text-center">
                <Files className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Todavía no hay documentos registrados.</p>
                <p className="mt-1 text-xs text-muted-foreground/70">Usa la pestaña “Registrar” para indexar tu primer documento.</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {filtrados.map((d) => (
                  <div key={d.id} className="flex items-start gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-input)] border ${badgeTipo(d.tipo)}`}>
                      <FilePlus2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{d.titulo}</p>
                        <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${badgeTipo(d.tipo)}`}>{TIPOS.find((t) => t.v === d.tipo)?.l || d.tipo}</span>
                        <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${d.estado === 'vigente' ? 'border-[#22c55e]/25 bg-[#22c55e]/10 text-[#22c55e]' : d.estado === 'anulado' ? 'border-[#ef4444]/25 bg-[#ef4444]/10 text-[#ef4444]' : 'border-white/10 bg-white/5 text-[#8a8778]'}`}>{d.estado}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {d.proyecto && <span>{d.proyecto}</span>}
                        {d.created_at && <span className="font-mono">{new Date(d.created_at).toLocaleDateString('es-CO')}</span>}
                        {d.file_name && <span>{tamano(d.size_bytes)}</span>}
                      </div>
                      {d.drive_path && (
                        <a href="#" onClick={(e) => e.preventDefault()} className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          <ExternalLink className="h-3 w-3" /> {d.drive_path}
                        </a>
                      )}
                      {d.notas && <p className="mt-1 text-xs text-muted-foreground">{d.notas}</p>}
                    </div>
                    <button onClick={() => eliminar(d.id)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-[#ef4444]/10 hover:text-[#ef4444] transition-colors" title="Eliminar del índice">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
