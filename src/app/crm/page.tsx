'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { EntityRecord, ProjectRecord, SyncRun, TalentCandidate } from '@/lib/db/types';

export default function CrmPage() {
  const [entities, setEntities] = useState<EntityRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [talent, setTalent] = useState<TalentCandidate[]>([]);
  const [syncRuns, setSyncRuns] = useState<SyncRun[]>([]);
  const [tab, setTab] = useState<'pipeline' | 'talento' | 'sync'>('pipeline');

  useEffect(() => {
    Promise.all([
      fetch('/api/db/entities').then((r) => r.json()),
      fetch('/api/db/projects').then((r) => r.json()),
      fetch('/api/db/talent').then((r) => r.json()),
      fetch('/api/db/sync-runs').then((r) => r.json()),
    ]).then(([e, p, t, s]) => {
      if (e.ok) setEntities(e.entities);
      if (p.ok) setProjects(p.projects);
      if (t.ok) setTalent(t.candidates);
      if (s.ok) setSyncRuns(s.runs);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-white/10 px-4 py-3 flex items-center justify-between max-w-7xl mx-auto">
        <div>
          <h1 className="text-lg font-bold">CRM RR Aliados</h1>
          <p className="text-xs text-gray-500">Pipeline · Talento · Sync</p>
        </div>
        <Link href="/" className="text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10">
          ← Dashboard
        </Link>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4 flex gap-2 border-b border-white/10">
        {(['pipeline', 'talento', 'sync'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-lg text-sm capitalize ${tab === k ? 'bg-red-500/20 text-red-300' : 'text-gray-400 hover:bg-white/5'}`}
          >
            {k}
          </button>
        ))}
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {tab === 'pipeline' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <section>
              <h2 className="text-sm font-semibold mb-3 text-gray-300">Entidades ({entities.length})</h2>
              <div className="space-y-2">
                {entities.map((e) => (
                  <div key={e.id} className="p-4 rounded-xl bg-[#12121a] border border-white/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{e.nombre_canonico}</p>
                        <p className="text-xs text-gray-500">{e.tipo} · {e.estado}</p>
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded bg-white/5">{e.slug}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 truncate">{e.drive_path}</p>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h2 className="text-sm font-semibold mb-3 text-gray-300">Proyectos ({projects.length})</h2>
              <div className="space-y-2">
                {projects.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl bg-[#12121a] border border-white/5">
                    <div className="flex justify-between">
                      <p className="font-medium">{p.nombre}</p>
                      <span className={`text-[10px] px-2 py-1 rounded ${p.alcance === 'confirmado' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                        {p.alcance}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{p.fase || p.estado}</p>
                    {p.proximo_hito && <p className="text-xs text-gray-400 mt-2">{p.proximo_hito}</p>}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === 'talento' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {talent.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-[#12121a] border border-white/5">
                <p className="font-medium">{c.nombre_completo || 'Sin nombre'}</p>
                <p className="text-xs text-gray-500">{c.rol_id} · {c.estado}</p>
                {c.pool_de_talento && <span className="text-[10px] text-green-400">Pool</span>}
              </div>
            ))}
            {!talent.length && <p className="text-gray-500 text-sm">Sin candidatos en Supabase. Exportá backup desde PrimerContactoWeb.</p>}
          </div>
        )}

        {tab === 'sync' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-4">
              Ejecutar semanalmente: <code className="bg-white/5 px-2 py-1 rounded">npm run sync-scheduler</code> en bot_telegram
            </p>
            {syncRuns.map((r) => (
              <div key={r.id} className="p-4 rounded-xl bg-[#12121a] border border-white/5 flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{r.source}</p>
                  <p className="text-xs text-gray-500">{r.started_at}</p>
                  {r.error_message && <p className="text-xs text-red-400">{r.error_message}</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded ${r.status === 'success' ? 'bg-green-500/20 text-green-300' : r.status === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                  {r.status} {r.records_processed != null ? `(${r.records_processed})` : ''}
                </span>
              </div>
            ))}
            {!syncRuns.length && <p className="text-gray-500 text-sm">Sin corridas registradas. Ejecutá migrate-initial en bot_telegram.</p>}
          </div>
        )}
      </main>
    </div>
  );
}
