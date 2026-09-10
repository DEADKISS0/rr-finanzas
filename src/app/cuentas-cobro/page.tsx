'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, FileText, Plus, Save, ShieldCheck, Trash2, User, Banknote, ChevronLeft } from 'lucide-react';
import type { CuentaCobroPayload, CuentaCobroTemplate, PersonaCobro } from '@/lib/cuentas-cobro/types';
import { DECLARACION_NO_SUBCONTRATACION } from '@/lib/cuentas-cobro/types';

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const hoy = () => new Date().toISOString().slice(0, 10);
const genId = () => Math.random().toString(36).slice(2, 10);

// Colaboradores reales del equipo RR (knowledge 'Equipo' + 'Manual de Roles' + proveedores)
const personasIniciales: PersonaCobro[] = [
  { id: 'juan-manuel-mesa', nombre: 'Juan Manuel Mesa', documento: '1038866073', notas: 'Director Operativo. Cédula verificada.' },
  { id: 'samuel-zuluaga', nombre: 'Samuel Zuluaga', documento: '1027660916', notas: 'Director Creativo. Cédula verificada.' },
  { id: 'paulina', nombre: 'Paulina', documento: '', notas: 'Equipo de producción Candilejas. Completar cédula y datos bancarios.' },
  { id: 'samuel-garcia', nombre: 'Samuel García', documento: '', notas: 'Camarógrafo. Completar datos.' },
  { id: 'estefania', nombre: 'Estefanía', documento: '', notas: 'Supervisora. Completar datos.' },
  { id: 'sebastian-vargas', nombre: 'Sebastián Vargas', documento: '', notas: 'Camarógrafo. Completar datos.' },
  { id: 'santiago-tansi-beats', nombre: 'Santiago Tansi Beats', documento: '', notas: 'Modelo. Completar datos.' },
  { id: 'sofia-vega', nombre: 'Sofía Vega', documento: '', notas: 'Modelo. Completar datos.' },
  { id: 'laura', nombre: 'Laura', documento: '', notas: 'Modelo. Completar datos.' },
  { id: 'handle', nombre: 'Handle', documento: '', notas: 'Desarrollo.' },
  { id: 'sam', nombre: 'Sam', documento: '', notas: 'Desarrollo / creativo.' },
  { id: 'martin', nombre: 'Martín', documento: '', notas: 'Desarrollo.' },
  { id: 'manuel', nombre: 'Manuel', documento: '', notas: 'Backend / desarrollo.' },
];

const templates: CuentaCobroTemplate[] = [
  { id: 'produccion-candilejas', nombre: 'Producción Candilejas', concepto: 'Servicios de apoyo en producción audiovisual Candilejas', proyecto: 'Candilejas', responsable: 'RR Aliados', periodo: '31 de agosto al 5 de septiembre de 2026' },
  { id: 'modelo-sesion', nombre: 'Modelo / sesión', concepto: 'Participación como modelo en sesión de producción audiovisual', proyecto: 'Candilejas', responsable: 'RR Aliados', periodo: 'Agosto 2026' },
  { id: 'camara-sesion', nombre: 'Cámara / sesión', concepto: 'Servicio de cámara para sesión de producción audiovisual', proyecto: 'Candilejas', responsable: 'RR Aliados', periodo: 'Agosto 2026' },
  { id: 'desarrollo', nombre: 'Desarrollo', concepto: 'Servicios de desarrollo de software', proyecto: 'RR Aliados', responsable: 'RR Aliados', periodo: 'Agosto 2026' },
];

interface ConceptoLinea { id: string; concepto: string; cantidad: number; precio: number; }
const nuevaLinea = (concepto = 'Servicios profesionales', precio = 0, cantidad = 1): ConceptoLinea => ({ id: genId(), concepto, cantidad, precio });
// Subtotal de una línea = cantidad × precio
const subtotalLinea = (l: ConceptoLinea) => (l.cantidad || 0) * (l.precio || 0);

const nuevaCuenta = (persona: PersonaCobro, lineas: ConceptoLinea[]): CuentaCobroPayload => ({
  numero: `RR-CC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
  version: 1,
  estado: 'borrador',
  persona,
  proyecto: 'Candilejas',
  responsable: 'RR Aliados',
  concepto: lineas.map((l) => l.concepto).join(' + '),
  monto: lineas.reduce((s, l) => s + subtotalLinea(l), 0),
  periodo: '31 de agosto al 5 de septiembre de 2026',
  fecha: hoy(),
  notas: 'Cuenta de cobro generada desde el dashboard de finanzas RR Aliados.',
  declaracionNoSubcontratacion: false,
  declaracionTexto: DECLARACION_NO_SUBCONTRATACION,
  declaracionFecha: hoy(),
});

export default function CuentasCobroPage() {
  const [personas, setPersonas] = useState<PersonaCobro[]>(personasIniciales);
  const [personaId, setPersonaId] = useState(personasIniciales[0].id);
  const persona = useMemo(() => personas.find((p) => p.id === personaId) || personas[0], [personaId, personas]);
  const [lineas, setLineas] = useState<ConceptoLinea[]>([nuevaLinea('Servicios profesionales', 60000, 1)]);
  const [cuenta, setCuenta] = useState<CuentaCobroPayload>(() => nuevaCuenta(personasIniciales[0], [nuevaLinea('Servicios profesionales', 60000, 1)]));
  const [adminToken, setAdminToken] = useState('');
  const [historial, setHistorial] = useState<CuentaCobroPayload[]>([]);
  const [status, setStatus] = useState('');
  const [dark, setDark] = useState(true);

  // Al cargar: personas reales + siguiente número serial + preseleccionar colaborador por query param
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/personas-cobro', { cache: 'no-store' });
        const json = await res.json();
        if (json.ok && Array.isArray(json.personas) && json.personas.length) {
          setPersonas((prev) => {
            // Priorizar la BD: las personas de Supabase (con UUID) reemplazan a las locales
            // que coincidan por nombre o documento, evitando duplicados (id local vs UUID).
            const bd = json.personas as PersonaCobro[];
            const merged = [...bd];
            // Agregar las locales que NO existen en la BD (nuevas o sin datos en BD)
            prev.forEach((p) => {
              const existe = bd.some((b) =>
                b.id === p.id ||
                (p.documento && b.documento === p.documento) ||
                (!p.documento && b.nombre?.toLowerCase() === p.nombre?.toLowerCase())
              );
              if (!existe) merged.push(p);
            });
            // Autocompletar la persona actualmente seleccionada con los datos frescos de la BD
            setPersonaId((prevId) => {
              const cur = merged.find((p) => p.id === prevId) || merged[0];
              if (cur) setCuenta((c) => ({ ...c, persona: cur }));
              return cur?.id || prevId;
            });
            return merged;
          });
        }
      } catch { /* fallback local */ }
    })();
  }, []);

  // Al cargar, sugerir el siguiente número serial de cuenta de cobro
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/cuentas-cobro/siguiente', { cache: 'no-store' });
        const json = await res.json();
        if (json.ok && json.numero) {
          setCuenta((prev) => ({ ...prev, numero: json.numero }));
        }
      } catch { /* mantiene el número local */ }
    })();
  }, []);

  // Preseleccionar colaborador y conceptos desde "Pagos por persona" (?persona=&conceptos=&proyecto=)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nombre = params.get('persona');
    const proyectoParam = params.get('proyecto');
    if (nombre) {
      const p = personas.find((x) => x.nombre.toLowerCase() === nombre.toLowerCase()) || personas.find((x) => x.nombre.toLowerCase().includes(nombre.toLowerCase()));
      if (p) {
        setPersonaId(p.id);
        setCuenta((prev) => ({ ...prev, persona: p }));
      }
    }
    // conceptos: JSON array [{concepto, monto}]
    const rawConceptos = params.get('conceptos');
    if (rawConceptos) {
      try {
        const arr = JSON.parse(decodeURIComponent(rawConceptos)) as { concepto: string; monto?: number; precio?: number; cantidad?: number }[];
        if (Array.isArray(arr) && arr.length) {
          const lineasNuevas = arr.map((c) => nuevaLinea(c.concepto, c.monto ?? c.precio ?? 0, c.cantidad ?? 1));
          setLineas(lineasNuevas);
          setCuenta((prev) => ({
            ...prev,
            concepto: lineasNuevas.map((l) => l.concepto).join(' + '),
            monto: lineasNuevas.reduce((s, l) => s + subtotalLinea(l), 0),
            proyecto: proyectoParam || prev.proyecto,
          }));
        }
      } catch { /* si falla el parse, mantiene líneas por defecto */ }
    } else if (proyectoParam) {
      setCuenta((prev) => ({ ...prev, proyecto: proyectoParam }));
    }
    // limpiar la URL para que un refresh no re-aplique
    window.history.replaceState({}, '', window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Función para refrescar el siguiente número (tras guardar)
  const refrescarNumero = async () => {
    try {
      const res = await fetch('/api/cuentas-cobro/siguiente', { cache: 'no-store' });
      const json = await res.json();
      if (json.ok && json.numero) {
        setCuenta((prev) => ({ ...prev, numero: json.numero }));
      }
    } catch { /* mantiene el actual */ }
  };

  // Recalcular cuenta cuando cambia persona o líneas
  const totalLineas = lineas.reduce((s, l) => s + subtotalLinea(l), 0);

  const seleccionarPersona = (id: string) => {
    const p = personas.find((x) => x.id === id) || personas[0];
    setPersonaId(p.id);
    setCuenta((prev) => ({ ...prev, persona: p }));
  };

  const updatePersona = (patch: Partial<PersonaCobro>) => {
    const updated = { ...persona, ...patch };
    setPersonas((prev) => prev.map((p) => (p.id === persona.id ? updated : p)));
    setCuenta((prev) => ({ ...prev, persona: updated }));
  };

  // Guardar datos editados del colaborador en la BD (autocompletar + editar)
  const [personaStatus, setPersonaStatus] = useState('');
  const guardarPersona = async () => {
    setPersonaStatus('Guardando...');
    try {
      // Determinar si la persona ya existe en la BD: buscar por documento o por id real (UUID)
      const esNueva = !persona.id || persona.id.startsWith('persona-') || persona.id.length !== 36;
      // Para actualizar necesitamos el id REAL de la BD: si es local, primero buscar por documento
      let idBd = esNueva ? null : persona.id;
      if (esNueva && persona.documento) {
        try {
          const listaRes = await fetch('/api/personas-cobro', { cache: 'no-store' });
          const lista = await listaRes.json();
          const match = (lista.personas || []).find((p: PersonaCobro) => p.documento === persona.documento);
          if (match?.id) idBd = match.id;
        } catch { /* sin match */ }
      }
      const body = idBd ? { ...persona, id: idBd } : persona;
      const res = await fetch('/api/personas-cobro', {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'No se pudo guardar');
      // Actualizar el state con el id real devuelto por la BD
      if (json.persona?.id) {
        const saved = { ...persona, id: json.persona.id };
        // Reemplazar CUALQUIER entrada que tenga el id local o el mismo documento
        setPersonas((prev) => {
          const sinLocal = prev.filter((p) => p.id !== persona.id && (esNueva ? p.documento !== persona.documento : true));
          return [...sinLocal, saved];
        });
        setPersonaId(saved.id);
        setCuenta((prev) => ({ ...prev, persona: saved }));
      }
      setPersonaStatus('✅ Datos del colaborador guardados');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setPersonaStatus(`❌ ${msg}`);
    }
  };

  const crearPersona = () => {
    const next: PersonaCobro = { id: `persona-${genId()}`, nombre: 'Nueva persona', documento: '', notas: 'Completar y validar antes de emitir.' };
    setPersonas((prev) => [...prev, next]);
    setPersonaId(next.id);
    setCuenta(nuevaCuenta(next, lineas));
  };

  // Recalcular cuenta desde las líneas (concepto concatenado + total = Σ cantidad×precio)
  const syncCuentaDesdeLineas = (next: ConceptoLinea[]) => {
    setCuenta((c) => ({
      ...c,
      concepto: next.map((l) => l.concepto).join(' + '),
      monto: next.reduce((s, l) => s + subtotalLinea(l), 0),
    }));
  };

  const actualizarLinea = (id: string, patch: Partial<ConceptoLinea>) => {
    setLineas((prev) => {
      const next = prev.map((l) => (l.id === id ? { ...l, ...patch } : l));
      syncCuentaDesdeLineas(next);
      return next;
    });
  };

  const agregarLinea = () => {
    setLineas((prev) => {
      const next = [...prev, nuevaLinea('Concepto adicional', 0, 1)];
      syncCuentaDesdeLineas(next);
      return next;
    });
  };

  const quitarLinea = (id: string) => {
    setLineas((prev) => {
      const next = prev.filter((l) => l.id !== id);
      syncCuentaDesdeLineas(next);
      return next;
    });
  };

  const aplicarTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    // Reemplazar las líneas editables con el concepto de la plantilla (monto editable en 0 para que el usuario lo ajuste)
    const lineasTemplate = [nuevaLinea(template.concepto, 0, 1)];
    setLineas(lineasTemplate);
    setCuenta((prev) => ({
      ...prev,
      concepto: template.concepto,
      proyecto: template.proyecto || prev.proyecto,
      responsable: template.responsable,
      periodo: template.periodo,
      monto: 0,
    }));
  };

  const headers = (): Record<string, string> => {
    const h: Record<string, string> = { 'content-type': 'application/json' };
    if (adminToken) h['x-rr-admin-token'] = adminToken;
    return h;
  };

  const registrar = async (estado = cuenta.estado) => {
    const payload = { ...cuenta, estado, persona, monto: totalLineas, concepto: lineas.map((l) => l.concepto).join(' + '), lineas: lineas.map((l) => ({ concepto: l.concepto, cantidad: l.cantidad, precio: l.precio })), updatedAt: new Date().toISOString() };
    const res = await fetch('/api/cuentas-cobro', { method: 'POST', headers: headers(), body: JSON.stringify(payload) });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'No se pudo registrar');
    const registrada = { ...payload, id: json.cuenta?.id || payload.id, archivoPath: json.cuenta?.archivo_path || payload.archivoPath };
    setCuenta(registrada);
    setHistorial((prev) => [registrada, ...prev.filter((x) => x.numero !== registrada.numero)]);
    setStatus(json.source === 'supabase' ? `✅ Registrada en Supabase · ${registrada.numero}` : 'Modo local: lista para registrar cuando existan credenciales');
    // Sugerir el siguiente número serial para la próxima cuenta
    await refrescarNumero();
    return registrada;
  };

  const descargarPdf = async () => {
    // Generar el PDF directamente con los datos actuales (sin depender de registrar)
    setStatus('Generando PDF...');
    try {
      const payloadPdf = {
        ...cuenta,
        persona,
        monto: totalLineas,
        concepto: lineas.map((l) => l.concepto).join(' + '),
        lineas: lineas.map((l) => ({ concepto: l.concepto, cantidad: l.cantidad || 1, precio: l.precio || 0 })),
      };
      const res = await fetch('/api/cuentas-cobro/pdf', { method: 'POST', headers: headers(), body: JSON.stringify(payloadPdf) });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || 'No se pudo generar el PDF');
      }
      const blob = await res.blob();
      if (blob.size === 0) throw new Error('El PDF se generó vacío');
      // Descarga robusta: agregar al DOM, click, y revocar DESPUÉS de un delay
      // (revocar inmediatamente puede cancelar la descarga en algunos navegadores)
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${payloadPdf.numero || 'RR-CC'}-v${payloadPdf.version || 1}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setStatus(`📄 PDF descargado: ${a.download}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus(`❌ ${msg}`);
      // Mostrar el error al usuario
      window.alert(`No se pudo descargar el PDF: ${msg}`);
    }
  };

  const bg = dark ? 'bg-[#08080c]' : 'bg-gray-50';
  const card = dark ? 'bg-[#0f0f15]' : 'bg-white';
  const bd = dark ? 'border-white/[0.06]' : 'border-gray-200';
  const t = dark ? 'text-[#f5ede1]' : 'text-gray-900';
  const t2 = dark ? 'text-[#8a8778]' : 'text-gray-500';
  const t3 = dark ? 'text-[#6b6859]' : 'text-gray-400';
  const inp = dark ? 'bg-white/5 border-white/10 text-[#f5ede1]' : 'bg-gray-50 border-gray-200 text-gray-900';

  return (
    <main className={`min-h-screen ${bg}`}>
      {/* Header */}
      <header className={`border-b ${bd} ${dark ? 'bg-[#08080c]/80' : 'bg-white/80'} backdrop-blur-xl sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className={`p-2 rounded-lg ${dark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className={`text-sm font-extrabold tracking-tight ${t}`}>Cuentas de <span className="text-[#ce3d1f]">cobro</span></h1>
              <p className="text-[10px] text-[#8a8778] font-medium">Generación · edición · PDF con firma</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-semibold ${dark ? 'bg-white/5 text-[#8a8778]' : 'bg-gray-100 text-gray-500'}`}>
              <ShieldCheck className="h-3.5 w-3.5 text-[#ce3d1f]" /> Datos sensibles · server-side
            </div>
            <button onClick={() => setDark(!dark)} className={`p-2.5 rounded-xl ${dark ? 'bg-white/5' : 'bg-gray-100'}`}>{dark ? '☀️' : '🌙'}</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          {/* ── Columna izquierda: persona + plantillas ── */}
          <div className="space-y-4">
            {/* Persona */}
            <div className={`${card} border ${bd} rounded-2xl overflow-hidden`}>
              <div className={`p-4 border-b ${bd} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[#ce3d1f]" />
                  <h2 className={`text-sm font-semibold ${t}`}>Colaborador</h2>
                </div>
                <button onClick={crearPersona} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#ce3d1f]/15 text-[#e7785e] hover:bg-[#ce3d1f]/25 transition-colors inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Nuevo</button>
              </div>
              <div className="p-4 space-y-3">
                <select value={personaId} onChange={(e) => seleccionarPersona(e.target.value)} className={`w-full px-3 py-2.5 rounded-xl text-sm ${inp} border focus:border-[#ce3d1f] outline-none`}>
                  {personas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <F label="Nombre" v={persona.nombre} on={(v) => updatePersona({ nombre: v })} dark={dark} />
                <F label="Documento / cédula" v={persona.documento} on={(v) => updatePersona({ documento: v })} dark={dark} />
                <F label="Correo" v={persona.correo || ''} on={(v) => updatePersona({ correo: v })} dark={dark} />
                <F label="Teléfono" v={persona.telefono || ''} on={(v) => updatePersona({ telefono: v })} dark={dark} />
                <div className="grid grid-cols-2 gap-2">
                  <F label="Banco" v={persona.banco || ''} on={(v) => updatePersona({ banco: v })} dark={dark} />
                  <F label="Tipo cuenta" v={persona.tipoCuenta || ''} on={(v) => updatePersona({ tipoCuenta: v })} dark={dark} />
                </div>
                <F label="Número cuenta" v={persona.numeroCuenta || ''} on={(v) => updatePersona({ numeroCuenta: v })} dark={dark} />
                {persona.notas && <p className={`text-[10px] ${t3} leading-relaxed`}>{persona.notas}</p>}
                {/* Guardar datos editados del colaborador en la BD */}
                <div className="pt-1">
                  <button
                    onClick={guardarPersona}
                    className="w-full px-3 py-2.5 rounded-xl text-xs font-bold bg-[#3f0035] text-[#e8c069] hover:bg-[#3f0035]/80 border border-[#3f0035]/40 transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" /> Guardar datos del colaborador
                  </button>
                  {personaStatus && <p className={`text-[10px] mt-1.5 font-medium ${personaStatus.startsWith('✅') ? 'text-green-400' : personaStatus.startsWith('❌') ? 'text-red-400' : t3}`}>{personaStatus}</p>}
                </div>
              </div>
            </div>

            {/* Plantillas */}
            <div className={`${card} border ${bd} rounded-2xl overflow-hidden`}>
              <div className={`p-4 border-b ${bd}`}><h2 className={`text-sm font-semibold ${t}`}>Plantillas</h2></div>
              <div className="p-3 space-y-1.5">
                {templates.map((tmpl) => (
                  <button key={tmpl.id} onClick={() => aplicarTemplate(tmpl.id)} className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${dark ? 'hover:bg-white/5 text-[#f5ede1]' : 'hover:bg-gray-100 text-gray-800'} border ${bd}`}>
                    {tmpl.nombre}
                    <span className={`block text-[9px] ${t3} mt-0.5`}>{tmpl.concepto}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Columna derecha: formulario + preview ── */}
          <div className="space-y-4">
            {/* Formulario de la cuenta */}
            <div className={`${card} border ${bd} rounded-2xl overflow-hidden`}>
              <div className={`p-4 border-b ${bd}`}>
                <h2 className={`text-sm font-semibold ${t}`}>Detalle de la cuenta</h2>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <F label="Número" v={cuenta.numero || ''} on={(v) => setCuenta({ ...cuenta, numero: v })} dark={dark} />
                <F label="Fecha" v={cuenta.fecha} type="date" on={(v) => setCuenta({ ...cuenta, fecha: v })} dark={dark} />
                <F label="Proyecto" v={cuenta.proyecto || ''} on={(v) => setCuenta({ ...cuenta, proyecto: v })} dark={dark} />
                <F label="Periodo" v={cuenta.periodo} on={(v) => setCuenta({ ...cuenta, periodo: v })} dark={dark} />
                <F label="Responsable" v={cuenta.responsable} on={(v) => setCuenta({ ...cuenta, responsable: v })} dark={dark} />
                <div>
                  <label className={`text-xs font-medium ${t2} mb-1.5 block`}>Estado</label>
                  <select value={cuenta.estado} onChange={(e) => setCuenta({ ...cuenta, estado: e.target.value as CuentaCobroPayload['estado'] })} className={`w-full px-3 py-2.5 rounded-xl text-sm ${inp} border focus:border-[#ce3d1f] outline-none`}>
                    {['borrador', 'revision', 'emitida', 'anulada', 'reemplazada'].map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                  </select>
                </div>
              </div>

              {/* Conceptos editables — cantidad × precio */}
              <div className={`px-4 pb-4`}>
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-xs font-medium ${t2}`}>Conceptos · cantidad × precio</label>
                  <button onClick={agregarLinea} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#ce3d1f]/15 text-[#e7785e] hover:bg-[#ce3d1f]/25 transition-colors inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Agregar concepto</button>
                </div>
                {/* Encabezado de columnas */}
                <div className={`grid grid-cols-[1fr_64px_110px_110px_32px] gap-2 px-1 mb-1 text-[9px] uppercase tracking-wider font-semibold ${t3}`}>
                  <span>Concepto</span>
                  <span className="text-center">Cant.</span>
                  <span className="text-right">Precio</span>
                  <span className="text-right">Subtotal</span>
                  <span></span>
                </div>
                <div className="space-y-2">
                  {lineas.map((linea) => (
                    <div key={linea.id} className={`grid grid-cols-[1fr_64px_110px_110px_32px] items-center gap-2 p-2 rounded-xl border ${bd} ${dark ? 'bg-white/[0.02]' : 'bg-gray-50'}`}>
                      <input value={linea.concepto} onChange={(e) => actualizarLinea(linea.id, { concepto: e.target.value })} placeholder="Concepto (ej: Sesión de cámara)" className={`w-full px-3 py-2 rounded-lg text-sm ${inp} border outline-none focus:border-[#ce3d1f]`} />
                      <input type="number" min={0} value={linea.cantidad || ''} onChange={(e) => actualizarLinea(linea.id, { cantidad: Number(e.target.value) || 0 })} placeholder="1" className={`w-full px-2 py-2 rounded-lg text-sm text-center ${inp} border outline-none focus:border-[#ce3d1f]`} />
                      <div className="relative">
                        <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-xs ${t3}`}>$</span>
                        <input type="number" min={0} value={linea.precio || ''} onChange={(e) => actualizarLinea(linea.id, { precio: Number(e.target.value) || 0 })} placeholder="0" className={`w-full pl-6 pr-2 py-2 rounded-lg text-sm ${inp} border outline-none focus:border-[#ce3d1f] text-right`} />
                      </div>
                      <span className="text-xs font-bold text-[#e7785e] text-right">{COP.format(subtotalLinea(linea))}</span>
                      <button onClick={() => quitarLinea(linea.id)} className="p-2 rounded-lg text-[#ef4444] hover:bg-red-500/10 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
                <div className={`mt-3 flex items-center justify-between px-3 py-2.5 rounded-xl ${dark ? 'bg-[#ce3d1f]/10 border border-[#ce3d1f]/20' : 'bg-red-50 border border-red-200'}`}>
                  <span className={`text-xs font-semibold ${t}`}>Total a cobrar</span>
                  <span className="text-lg font-extrabold text-[#e7785e]">{COP.format(totalLineas)}</span>
                </div>
              </div>

              {/* Notas */}
              <div className="px-4 pb-4">
                <label className={`text-xs font-medium ${t2} mb-1.5 block`}>Notas</label>
                <textarea value={cuenta.notas || ''} onChange={(e) => setCuenta({ ...cuenta, notas: e.target.value })} className={`w-full min-h-16 px-3 py-2.5 rounded-xl text-sm ${inp} border focus:border-[#ce3d1f] outline-none`} />
              </div>

              {/* Declaración de no subcontratación — OPCIONAL (toggle) */}
              <div className="px-4 pb-4">
                <div className={`rounded-xl border p-4 transition-all ${cuenta.declaracionNoSubcontratacion !== undefined && cuenta.declaracionNoSubcontratacion !== null ? `${bd} ${dark ? 'bg-white/[0.03]' : 'bg-gray-50'}` : `${bd}`}`}>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div>
                      <p className={`text-xs font-bold ${t}`}>Incluir declaración de no subcontratación</p>
                      <p className={`text-[10px] ${t3}`}>Opcional — aparece en el documento y PDF si está habilitada</p>
                    </div>
                    {/* Toggle switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(cuenta.declaracionNoSubcontratacion)}
                      onClick={() => setCuenta((prev) => ({
                        ...prev,
                        declaracionNoSubcontratacion: !prev.declaracionNoSubcontratacion,
                        declaracionFecha: !prev.declaracionNoSubcontratacion ? hoy() : prev.declaracionFecha,
                      }))}
                      className={`relative w-12 h-6.5 rounded-full transition-colors flex-shrink-0 ${cuenta.declaracionNoSubcontratacion ? 'bg-[#ce3d1f]' : 'bg-gray-300'}`}
                      style={{ height: 26 }}
                    >
                      <span className={`absolute top-0.5 w-5.5 h-5.5 rounded-full bg-white shadow transition-transform ${cuenta.declaracionNoSubcontratacion ? 'translate-x-6' : 'translate-x-0.5'}`} style={{ width: 22, height: 22, top: 2 }} />
                    </button>
                  </div>
                  {cuenta.declaracionNoSubcontratacion && (
                    <>
                      <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all mt-1 ${'border-[#ce3d1f]/40 bg-[#ce3d1f]/5'}`}>
                        <input
                          type="checkbox"
                          checked={Boolean(cuenta.declaracionNoSubcontratacion === true)}
                          onChange={() => setCuenta({ ...cuenta, declaracionNoSubcontratacion: true, declaracionFecha: hoy() })}
                          className="mt-0.5 h-4 w-4 rounded accent-[#ce3d1f]"
                        />
                        <span className="block">
                          <span className={`block text-[10px] ${t3} leading-relaxed`}>
                            {cuenta.declaracionTexto || DECLARACION_NO_SUBCONTRATACION}
                          </span>
                          <span className={`block text-[10px] mt-1 font-semibold text-green-400`}>
                            ✓ El prestador declaró el {cuenta.declaracionFecha}
                          </span>
                        </span>
                      </label>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Preview + acciones */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4">
              <Preview cuenta={{ ...cuenta, persona, monto: totalLineas, concepto: lineas.map((l) => l.concepto).join(' + ') }} lineas={lineas} dark={dark} />
              <div className="space-y-3">
                <button onClick={() => registrar()} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-[#3f0035] text-[#e8c069] hover:bg-[#3f0035]/80 border border-[#3f0035]/40 transition-colors">
                  <Save className="h-4 w-4" /> Registrar
                </button>
                <button onClick={descargarPdf} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-[#ce3d1f] to-[#3f0035] text-white hover:opacity-90 transition-opacity">
                  <Download className="h-4 w-4" /> Descargar PDF
                </button>
                <div className={`p-3 rounded-xl border ${bd} ${dark ? 'bg-white/[0.02]' : 'bg-gray-50'}`}>
                  <p className={`text-[10px] ${t3} leading-relaxed`}>{status || 'El PDF incluye la firma autorizada y los datos del colaborador.'}</p>
                </div>
                <div className={`${card} border ${bd} rounded-xl overflow-hidden`}>
                  <div className={`px-3 py-2 border-b ${bd} text-xs font-semibold ${t}`}>Registradas en sesión</div>
                  {historial.length === 0 ? (
                    <p className={`px-3 py-4 text-[10px] ${t3}`}>Sin cuentas registradas aún.</p>
                  ) : historial.map((h) => (
                    <div key={`${h.numero}-${h.version}`} className={`px-3 py-2 border-t ${bd} text-[10px]`}>
                      <p className={`font-bold ${t}`}>{h.numero} · {h.persona.nombre}</p>
                      <p className={t3}>{COP.format(h.monto)} · {h.estado}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function F({ label, v, on, type = 'text', dark }: { label: string; v: string; on: (v: string) => void; type?: string; dark?: boolean }) {
  const inp = dark ? 'bg-white/5 border-white/10 text-[#f5ede1]' : 'bg-gray-50 border-gray-200 text-gray-900';
  return (
    <div>
      <label className={`text-xs font-medium ${dark ? 'text-[#8a8778]' : 'text-gray-500'} mb-1.5 block`}>{label}</label>
      <input type={type} value={v} onChange={(e) => on(e.target.value)} className={`w-full px-3 py-2.5 rounded-xl text-sm ${inp} border focus:border-[#ce3d1f] focus:ring-1 focus:ring-[#ce3d1f]/20 outline-none`} />
    </div>
  );
}

function Preview({ cuenta, lineas, dark }: { cuenta: CuentaCobroPayload; lineas: ConceptoLinea[]; dark?: boolean }) {
  const paper = dark ? 'bg-[#f5ede1] text-[#141414]' : 'bg-white text-gray-900';
  return (
    <article className={`min-h-[560px] rounded-2xl border border-[#ce3d1f]/20 p-8 shadow-2xl ${paper}`}>
      {/* Header */}
      <div className="flex items-start justify-between border-b-4 border-[#3f0035] pb-5 mb-6">
        <div>
          <p className="font-mono text-xs uppercase text-[#ce3d1f] font-bold">{cuenta.numero} · v{cuenta.version || 1}</p>
          <h2 className="mt-1 text-3xl font-black uppercase tracking-tight">Cuenta de cobro</h2>
          <p className="text-xs text-gray-600 mt-1">RR ALIADOS S.A.S. · NIT 902.036.366</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="w-16 h-16 rounded-xl bg-[#3f0035] flex items-center justify-center text-[#e8c069] font-black text-lg">RR</div>
          <p className="text-[9px] text-gray-500 mt-1 text-right">Documento operativo<br />generado por el sistema</p>
        </div>
      </div>

      {/* Datos */}
      <div className="grid grid-cols-2 gap-5 text-sm mb-6">
        <div>
          <p className="text-[10px] font-black uppercase text-[#ce3d1f] mb-1">Cobrador</p>
          <p className="font-semibold">{cuenta.persona.nombre}</p>
          <p className="text-xs text-gray-600">C.C. {cuenta.persona.documento || 'Pendiente'}</p>
          <p className="text-xs text-gray-600">{cuenta.persona.correo || 'Correo pendiente'}</p>
          <p className="text-xs text-gray-600">{cuenta.persona.telefono || 'Teléfono pendiente'}</p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-[#ce3d1f] mb-1">Datos bancarios</p>
          <p className="text-xs text-gray-700">{cuenta.persona.banco || 'Banco pendiente'}</p>
          <p className="text-xs text-gray-700">{cuenta.persona.tipoCuenta || 'Tipo pendiente'} · {cuenta.persona.numeroCuenta || 'Cuenta pendiente'}</p>
          <p className="text-[10px] font-black uppercase text-[#ce3d1f] mt-2 mb-1">Detalle</p>
          <p className="text-xs text-gray-700">Proyecto: {cuenta.proyecto || 'Operación general'}</p>
          <p className="text-xs text-gray-700">Periodo: {cuenta.periodo}</p>
          <p className="text-xs text-gray-700">Fecha: {cuenta.fecha}</p>
        </div>
      </div>

      {/* Concepto + detalle de líneas */}
      <div className="my-6 border-y-2 border-[#3f0035]/20 py-5">
        <p className="text-[10px] font-black uppercase text-[#ce3d1f] mb-2">Concepto</p>
        <p className="text-base font-semibold leading-relaxed mb-3">{cuenta.concepto}</p>
        {lineas.length > 0 && (
          <div className="space-y-1.5">
            {lineas.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-gray-700 flex-1">{l.concepto}</span>
                <span className="text-gray-500 flex-shrink-0">{l.cantidad || 0} × {COP.format(l.precio || 0)}</span>
                <span className="font-semibold text-[#3f0035] flex-shrink-0 w-24 text-right">{COP.format(subtotalLinea(l))}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between mt-8">
        <div>
          <p className="text-[10px] font-black uppercase text-[#ce3d1f]">Valor a cobrar</p>
          <p className="text-4xl font-black text-[#3f0035]">{COP.format(cuenta.monto || 0)}</p>
        </div>
      </div>

      {/* Firmas: colaborador + representante legal (1 sola firma del rep. legal, con imagen) */}
      <div className="mt-8 grid grid-cols-2 gap-8">
        {/* Firma del colaborador — datos desde la BD, con amplio espacio para firmar */}
        <div>
          <p className="text-[10px] font-black uppercase text-[#3f0035] mb-1">El colaborador</p>
          <div className="space-y-0.5 text-xs text-gray-700 mb-3">
            <p><span className="font-semibold">Nombre:</span> {cuenta.persona.nombre || '—'}</p>
            <p><span className="font-semibold">C.C.:</span> {cuenta.persona.documento || 'Pendiente'}</p>
            {cuenta.persona.banco && <p><span className="font-semibold">Banco:</span> {cuenta.persona.banco}</p>}
            {cuenta.persona.numeroCuenta && <p><span className="font-semibold">Cuenta:</span> {cuenta.persona.numeroCuenta} {cuenta.persona.tipoCuenta ? `(${cuenta.persona.tipoCuenta})` : ''}</p>}
          </div>
          <div className="border-t-2 border-gray-400 pt-1.5 mt-16">
            <p className="text-[9px] text-gray-500 text-center">Firma del colaborador</p>
          </div>
        </div>
        {/* Firma del representante legal — con imagen de firma */}
        <div className="text-center">
          <p className="text-[10px] font-black uppercase text-[#3f0035] mb-1">Representante legal</p>
          <p className="text-xs text-gray-700 mb-1">RR ALIADOS S.A.S.</p>
          <img src="/firma-rr.png" alt="Firma Santiago Rosas Ríos" className="h-16 object-contain mx-auto mb-1" />
          <div className="border-t border-gray-400 pt-1">
            <p className="text-[10px] font-semibold text-gray-700">Santiago Rosas Ríos</p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-[10px] text-gray-500 leading-relaxed">{cuenta.notas}</p>

      {/* Declaración de no subcontratación — SOLO si está habilitada */}
      {cuenta.declaracionNoSubcontratacion && (
        <div className="mt-6 rounded-lg border-2 p-4 border-[#3f0035]/30 bg-[#3f0035]/5">
          <p className="text-[10px] font-black uppercase mb-1.5 text-[#3f0035]">Declaración de no subcontratación · ✓ firmada</p>
          <p className="text-[10px] text-gray-700 leading-relaxed">{cuenta.declaracionTexto || 'El prestador declara que prestó los servicios personalmente y no subcontrató a terceros.'}</p>
          {cuenta.declaracionFecha && <p className="text-[9px] text-gray-500 mt-1.5">Fecha de declaración: {cuenta.declaracionFecha}</p>}
        </div>
      )}
    </article>
  );
}
