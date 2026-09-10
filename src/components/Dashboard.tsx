'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchSupabaseFinancialSnapshot } from '@/lib/db/fetch';
import type { CashMovementRecord } from '@/lib/db/types';

type EstadoProyecto = 'planificacion' | 'activo' | 'pausado' | 'completado' | 'cancelado';
type CategoriaProyecto = 'cliente' | 'prospecto' | 'interno';
type TipoMovimiento = 'ingreso' | 'egreso';
type EstadoPago = 'pendiente' | 'programado' | 'pagado' | 'vencido';
type VistaCalendario = 'grid' | 'lista';
type CertezaMovimiento = 'confirmado' | 'confiable' | 'comprometido' | 'supuesto' | 'prospecto' | 'historico';
type EscenarioRunway = 'conservador' | 'operativo' | 'expansion';

interface Proyecto { id: string; nombre: string; cliente: string; estado: EstadoProyecto; valor_total: number; valor_pagado: number; fecha_inicio: string; fecha_fin: string; descripcion: string; servicios: string[]; categoria?: CategoriaProyecto; fase?: string; proximo_hito?: string; servicios_potenciales?: string[]; valor_potencial?: number; fuente?: string; equipo?: string[]; costo_reservado?: number; }
interface Movimiento { id: string; tipo: TipoMovimiento; concepto: string; monto: number; fecha: string; categoria: string; proyecto_id: string; }
interface Pago { id: string; concepto: string; monto: number; fecha: string; estado: EstadoPago; tipo: 'ingreso' | 'egreso'; proyecto_id: string; categoria?: string; certeza?: CertezaMovimiento; fuente_notas?: string; ultima_actualizacion?: string; monto_min?: number; monto_max?: number; }
interface FilaRunway { fecha: string; cajaInicial: number; cobros: number; gastosProyecto: number; gastosGenerales: number; cajaFinal: number; movimientos: Pago[]; }
// Fila de la tabla de movimientos: ledger local o overlay Supabase (discriminada por fuente)
type MovFila =
  | (Movimiento & { fuente: 'local' })
  | { id: string; tipo: 'ingreso' | 'egreso' | 'otro'; concepto: string; monto: number; fecha: string; proyecto_id: string; fuente: 'supabase' };

// Helper: crear fecha sin problemas de timezone
const fecha = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
const CORTE_ACTUAL = fecha(2026,8,31);
const CAJA_REAL_ACTUAL = 1630000;
const URGENTE_INICIO = fecha(2026,8,31);
const URGENTE_FIN = fecha(2026,9,5);

const PROYECTOS: Proyecto[] = [
  { id: 'wundeer', nombre: 'Wuundeer', cliente: 'Wuundeer', categoria: 'cliente', estado: 'activo', valor_total: 9000000, valor_pagado: 0, fecha_inicio: fecha(2026,8,15), fecha_fin: fecha(2026,10,15), fase: 'Prueba activa', proximo_hito: 'No contar cobros como recibidos en el corte 31/08. Cualquier entrada futura requiere fecha, monto y certeza actualizados.', descripcion: 'Proyecto registrado en el tablero historico. El usuario confirmo el 31/08 que no ha entrado ningun pago desde el ultimo corte.', servicios: ['Branding','Desarrollo web','Redes sociales','Producción audiovisual','Pauta','SEO','CRM'], servicios_potenciales: [], fuente: 'Actualizacion usuario 31/08/2026 supersede saldos/cobros del 18/08', equipo: ['Branding','Camarógrafo','Supervisor','Modelaje','Edición','Diseño','Gestión de redes','Desarrollo web','CRM','Pauta','SEO','Logística'], costo_reservado: undefined },
  { id: 'boga', nombre: 'BOGA', cliente: 'BOGA', categoria: 'cliente', estado: 'activo', valor_total: 1200000, valor_pagado: 0, fecha_inicio: fecha(2026,7,23), fecha_fin: fecha(2026,8,20), fase: 'Pago no recibido', proximo_hito: 'No contar como caja recibida. Actualizar solo cuando exista comprobante o confirmacion directa de pago.', descripcion: 'El usuario confirmo el 31/08 que no ha entrado ningun pago de BOGA desde el ultimo corte.', servicios: ['Desarrollo web'], servicios_potenciales: ['Mantenimiento','Redes sociales','Pauta','SEO'], fuente: 'Actualizacion usuario 31/08/2026 supersede expectativa de cobro 18/08', equipo: ['Desarrollo web','Dirección / entrega'], costo_reservado: 0 },
  { id: 'zapatos', nombre: 'Zapatos', cliente: 'Zapatos', categoria: 'cliente', estado: 'planificacion', valor_total: 0, valor_pagado: 0, fecha_inicio: fecha(2026,8,30), fecha_fin: fecha(2026,12,31), fase: 'Onboarding programado', proximo_hito: 'Onboarding: 30 ago.–15 sep. Primer pago previsto: 30 sep. (monto por confirmar).', descripcion: 'Cuenta relacionada con el mismo propietario/contacto de Wundeer. El primer cobro está calendarizado para el 30 de septiembre, pero aún no se proyecta monto para no inflar caja.', servicios: [], servicios_potenciales: ['Branding','Desarrollo web','Redes sociales','Producción audiovisual','Pauta','SEO','CRM'], fuente: 'Actualización operativa 18/08' },
  { id: 'satiro', nombre: 'Sátiro Sushi', cliente: 'Sátiro Sushi', categoria: 'cliente', estado: 'activo', valor_total: 12000000, valor_pagado: 0, fecha_inicio: fecha(2026,8,1), fecha_fin: fecha(2027,11,30), fase: 'Pago no recibido', proximo_hito: 'No contar cuotas como caja hasta confirmacion de pago recibido o cobro confiable con fecha.', descripcion: 'Ecosistema gastronomico RR. El usuario confirmo el 31/08 que no ha entrado ningun pago de Satiro Sushi desde el ultimo corte.', servicios: ['Plataforma gastronómica','CRM administrativo','NFC','Pasarela de pago','Mesero/Cocina/Admin'], servicios_potenciales: ['Redes sociales','Producción audiovisual','Pauta','SEO'], fuente: 'Actualizacion usuario 31/08/2026 supersede proyeccion automatica de cuotas', equipo: ['Desarrollo full-stack','Implementación CRM','NFC / impresión 3D','QA / entrega'], costo_reservado: undefined },
  { id: 'candilejas', nombre: 'Candilejas', cliente: 'Restaurante Candilejas', categoria: 'cliente', estado: 'activo', valor_total: 0, valor_pagado: 0, valor_potencial: 20000000, fecha_inicio: fecha(2026,8,26), fecha_fin: fecha(2026,9,5), fase: 'Produccion / pagos urgentes', proximo_hito: 'Cerrar pagos de personal el 31 ago con plazo maximo al 5 sep. Edicion y transporte siguen como supuestos editables.', descripcion: 'Tres sesiones de produccion. Personal confirmado total: COP 690.000. Edicion y transporte no estan confirmados como obligacion final y se modelan aparte como rango editable.', servicios: ['Producción audiovisual'], servicios_potenciales: ['Plataforma gastronómica','CRM administrativo','NFC','Pasarela de pago','Arquitectura multisede'], fuente: 'Actualizacion usuario 31/08/2026' },
  { id: 'labanca', nombre: 'La Banca', cliente: 'La Banca', categoria: 'prospecto', estado: 'planificacion', valor_total: 0, valor_pagado: 0, valor_potencial: 12000000, fecha_inicio: fecha(2026,8,18), fecha_fin: fecha(2026,8,22), fase: 'Prototipo / pitch', proximo_hito: 'Entregar prototipo funcional el 22 ago.', descripcion: 'Prospecto gastronómico. Modelo comercial base: $12M financiado o $10M acelerado.', servicios: ['Plataforma gastronómica','CRM administrativo','NFC','Pasarela de pago'], servicios_potenciales: ['Redes sociales','Producción audiovisual','Pauta','SEO'], fuente: 'Actualización operativa 18/08' },
  { id: 'marytierra', nombre: 'Mar y Tierra', cliente: 'Mar y Tierra Zipaquirá', categoria: 'prospecto', estado: 'planificacion', valor_total: 0, valor_pagado: 0, valor_potencial: 12000000, fecha_inicio: fecha(2026,8,18), fecha_fin: fecha(2026,9,1), fase: 'Prototipo / pitch', proximo_hito: 'Presentar prototipo el 1 sep.', descripcion: 'Prospecto gastronómico para el mismo ecosistema de Sátiro.', servicios: ['Plataforma gastronómica','CRM administrativo','NFC','Pasarela de pago'], servicios_potenciales: ['Redes sociales','Producción audiovisual','Pauta','SEO'], fuente: 'Actualización operativa 18/08' },
  { id: 'plazoleta', nombre: 'Plazoleta Jardín', cliente: 'Plazoleta Jardín Chía', categoria: 'prospecto', estado: 'planificacion', valor_total: 0, valor_pagado: 0, valor_potencial: 72000000, fecha_inicio: fecha(2026,8,18), fecha_fin: fecha(2026,9,1), fase: 'Prototipo / negociación', proximo_hito: 'Desarrollar prototipo + pitch para el 1 sep.', descripcion: 'Arquitectura multi-restaurante: superadmin global, administradores por restaurante y roles mesero/cocina. Incentivos por volumen.', servicios: ['Plataforma multi-restaurante','CRM multirol','NFC','Pasarela de pago','Superadmin'], servicios_potenciales: ['Redes sociales','Producción audiovisual','Pauta','SEO'], fuente: 'Actualización operativa 18/08' },
  { id: 'charly', nombre: 'Charly Brawn Billar Club', cliente: 'Charly Brawn Billar Club', categoria: 'prospecto', estado: 'planificacion', valor_total: 0, valor_pagado: 0, valor_potencial: 15000000, fecha_inicio: fecha(2026,8,18), fecha_fin: fecha(2026,9,1), fase: 'Prototipo / pitch', proximo_hito: 'Desarrollar prototipo para el 1 sep.', descripcion: 'Desarrollo web con activación NFC mediante llavero o elemento físico/impreso en 3D sobre la mesa.', servicios: ['Desarrollo web','NFC','Experiencia digital en mesa'], servicios_potenciales: ['Redes sociales','Pauta','CRM','Producción audiovisual'], fuente: 'Actualización operativa 18/08' },
  { id: 'amsterdam1', nombre: 'Amsterdam #1', cliente: 'Amsterdam', categoria: 'prospecto', estado: 'planificacion', valor_total: 0, valor_pagado: 0, valor_potencial: 5000000, fecha_inicio: fecha(2026,8,1), fecha_fin: fecha(2026,12,31), fase: 'Prototipo listo', proximo_hito: 'Definir fecha de presentación/entrega en Aruba.', descripcion: 'Prototipo ya desarrollado y pagado por RR. Solo falta coordinar con Alejandra la entrega/presentación en Aruba. Pipeline estimado: $5M si cierra este cliente.', servicios: ['Prototipo listo'], servicios_potenciales: ['Desarrollo web','Branding','Redes sociales','Pauta'], fuente: 'Actualización operativa 18/08' },
  { id: 'amsterdam2', nombre: 'Amsterdam #2', cliente: 'Amsterdam', categoria: 'prospecto', estado: 'planificacion', valor_total: 0, valor_pagado: 0, valor_potencial: 5000000, fecha_inicio: fecha(2026,8,1), fecha_fin: fecha(2026,12,31), fase: 'Prototipo listo', proximo_hito: 'Definir fecha de presentación/entrega en Aruba.', descripcion: 'Prototipo ya desarrollado y pagado por RR. Solo falta coordinar con Alejandra la entrega/presentación en Aruba. Pipeline estimado: $5M si cierra este cliente.', servicios: ['Prototipo listo'], servicios_potenciales: ['Desarrollo web','Branding','Redes sociales','Pauta'], fuente: 'Actualización operativa 18/08' },
  { id: 'amsterdam3', nombre: 'Amsterdam #3', cliente: 'Amsterdam', categoria: 'prospecto', estado: 'planificacion', valor_total: 0, valor_pagado: 0, valor_potencial: 5000000, fecha_inicio: fecha(2026,8,1), fecha_fin: fecha(2026,12,31), fase: 'Prototipo listo', proximo_hito: 'Definir fecha de presentación/entrega en Aruba.', descripcion: 'Prototipo ya desarrollado y pagado por RR. Solo falta coordinar con Alejandra la entrega/presentación en Aruba. Pipeline estimado: $5M si cierra este cliente.', servicios: ['Prototipo listo'], servicios_potenciales: ['Desarrollo web','Branding','Redes sociales','Pauta'], fuente: 'Actualización operativa 18/08' },
  { id: 'globos', nombre: 'Globos', cliente: 'Globos', categoria: 'prospecto', estado: 'planificacion', valor_total: 0, valor_pagado: 0, fecha_inicio: fecha(2026,8,18), fecha_fin: fecha(2026,12,31), fase: 'Levantamiento de requerimientos', proximo_hito: 'HOY: aprovechar la reunión de BOGA con la misma dueña para levantar requerimientos, definir alcance, prototipo y fechas.', descripcion: 'No existe pricing cerrado. No debe entrar como ingreso comprometido hasta definir requerimientos y propuesta.', servicios: [], servicios_potenciales: ['Desarrollo web','Branding','Redes sociales','Pauta','CRM'], fuente: 'Actualización operativa 18/08' },
  { id: 'junisama', nombre: 'Junisama', cliente: 'Junisama', categoria: 'prospecto', estado: 'planificacion', valor_total: 0, valor_pagado: 0, fecha_inicio: fecha(2026,8,18), fecha_fin: fecha(2026,12,31), fase: 'Requerimientos', proximo_hito: 'Discutir requerimientos y convertirlos en alcance/propuesta.', descripcion: 'Proyecto en evaluación. Mantener fuera de ingresos comprometidos hasta cierre.', servicios: [], servicios_potenciales: ['Desarrollo web','SEO','Pauta','CRM','Redes sociales'], fuente: 'Actualización operativa 18/08' },
  { id: 'rraliados', nombre: 'RR ALIADOS (Interno)', cliente: 'RR ALIADOS', categoria: 'interno', estado: 'activo', valor_total: 0, valor_pagado: 0, fecha_inicio: fecha(2026,7,1), fecha_fin: fecha(2026,12,31), fase: 'Operación interna', proximo_hito: 'Mantener dashboard, finanzas, pitches y entregas sincronizados.', descripcion: 'Proyecto interno / infraestructura operativa.', servicios: [], servicios_potenciales: [], fuente: 'Operación interna' },
];

const MOVIMIENTOS: Movimiento[] = [
  { id: 'mov001', tipo: 'ingreso', concepto: 'Caja real actual - Bancolombia - corte 31/08', monto: CAJA_REAL_ACTUAL, fecha: CORTE_ACTUAL, categoria: 'saldo confirmado', proyecto_id: '' },
];

// Generador de pagos con fechas correctas
const genPagos = (): Pago[] => {
  const pagos: Pago[] = [];
  let id = 1;
  const add = (concepto: string, monto: number, f: string, tipo: 'ingreso'|'egreso', proyecto: string, estado: EstadoPago = 'programado', extra: Partial<Pago> = {}) => {
    pagos.push({ id: `p${id++}`, concepto, monto, fecha: f, tipo, proyecto_id: proyecto, estado, ultima_actualizacion: CORTE_ACTUAL, ...extra });
  };

  // Comprometidos a pagar el 31 ago (plazo máximo personal Candilejas: 5 sep)
  add('Candilejas S1 - modelo', 60000, URGENTE_INICIO, 'egreso', 'candilejas', 'pendiente', { categoria: 'talento', certeza: 'comprometido', fuente_notas: 'Confirmado 31/08: pagar 31 ago (máx 5 sep). Sesión 1 modelo COP 60.000' });
  add('Candilejas S1 - supervisora', 60000, URGENTE_INICIO, 'egreso', 'candilejas', 'pendiente', { categoria: 'talento', certeza: 'comprometido', fuente_notas: 'Confirmado 31/08: sesión 1 supervisora COP 60.000' });
  add('Candilejas S1 - camarógrafo', 60000, URGENTE_INICIO, 'egreso', 'candilejas', 'pendiente', { categoria: 'produccion', certeza: 'comprometido', fuente_notas: 'Confirmado 31/08: sesión 1 camarógrafo COP 60.000' });
  add('Candilejas S2 - 2 camarógrafos', 120000, URGENTE_INICIO, 'egreso', 'candilejas', 'pendiente', { categoria: 'produccion', certeza: 'comprometido', fuente_notas: 'Confirmado 31/08: sesión 2, dos camarógrafos COP 60.000 c/u' });
  add('Candilejas S2 - 2 modelos', 120000, URGENTE_INICIO, 'egreso', 'candilejas', 'pendiente', { categoria: 'talento', certeza: 'comprometido', fuente_notas: 'Confirmado 31/08: sesión 2, dos modelos COP 60.000 c/u' });
  add('Candilejas S3 - modelo principal', 150000, URGENTE_INICIO, 'egreso', 'candilejas', 'pendiente', { categoria: 'talento', certeza: 'comprometido', fuente_notas: 'Confirmado 31/08: sesión 3 modelo COP 150.000' });
  add('Candilejas S3 - camarógrafo', 60000, URGENTE_INICIO, 'egreso', 'candilejas', 'pendiente', { categoria: 'produccion', certeza: 'comprometido', fuente_notas: 'Confirmado 31/08: sesión 3 camarógrafo COP 60.000' });
  add('Candilejas S3 - supervisora', 60000, URGENTE_INICIO, 'egreso', 'candilejas', 'pendiente', { categoria: 'talento', certeza: 'comprometido', fuente_notas: 'Confirmado 31/08: sesión 3 supervisora COP 60.000' });

  add('Juan Manuel Mesa (quincena)', 200000, URGENTE_INICIO, 'egreso', 'rraliados', 'pendiente', { categoria: 'nomina', certeza: 'comprometido', fuente_notas: 'Obligaciones Excel/CxP: fijo 15 y 30. Incluido en corte 31/08 si quincena aún pendiente.' });
  add('Samuel Zuluaga (quincena)', 100000, URGENTE_INICIO, 'egreso', 'rraliados', 'pendiente', { categoria: 'nomina', certeza: 'comprometido', fuente_notas: 'Obligaciones Excel/CxP: fijo 15 y 30. Incluido en corte 31/08 si quincena aún pendiente.' });

  add('Candilejas - edición si aplica a 3 sesiones', 1125000, URGENTE_FIN, 'egreso', 'candilejas', 'programado', { categoria: 'desarrollo', certeza: 'supuesto', monto_min: 750000, monto_max: 1125000, fuente_notas: 'Supuesto editable: COP 25.000/min, 10-15 min por sesión — NO sumar al total comprometido del 31' });
  add('Candilejas - transporte si aplica a 3 sesiones', 180000, URGENTE_FIN, 'egreso', 'candilejas', 'programado', { categoria: 'transporte', certeza: 'supuesto', monto_min: 0, monto_max: 180000, fuente_notas: 'Supuesto editable — NO sumar al total comprometido del 31' });

  add('BOGA - cobro pendiente no recibido', 0, URGENTE_FIN, 'ingreso', 'boga', 'programado', { categoria: 'cobro cliente', certeza: 'historico', fuente_notas: 'No contar como caja: usuario confirmó 31/08 sin pago recibido.' });
  add('Sátiro Sushi - cuota pendiente no recibida', 0, URGENTE_FIN, 'ingreso', 'satiro', 'programado', { categoria: 'cobro cliente', certeza: 'historico', fuente_notas: 'No contar como caja: usuario confirmó 31/08 sin pago recibido.' });
  add('Wuundeer - cobro pendiente no recibido', 0, URGENTE_FIN, 'ingreso', 'wundeer', 'programado', { categoria: 'cobro cliente', certeza: 'historico', fuente_notas: 'No contar como caja: usuario confirmó 31/08 sin pago recibido.' });

  return pagos;
};

const PAGOS = genPagos();

// Storage — bump key para forzar corte 31/08 (evita localStorage viejo)
const STORAGE_KEY = 'rr-v12-pagos-31-2026-08-31';
interface AppState { proyectos: Proyecto[]; movimientos: Movimiento[]; pagos: Pago[]; }
const loadState = (): AppState => {
  if (typeof window === 'undefined') return { proyectos: PROYECTOS, movimientos: MOVIMIENTOS, pagos: PAGOS };
  const s = localStorage.getItem(STORAGE_KEY);
  if (s) try { return JSON.parse(s); } catch {}
  return { proyectos: PROYECTOS, movimientos: MOVIMIENTOS, pagos: PAGOS };
};
const saveState = (s: AppState) => { if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); };

const fmt = (v: number) => '$' + Number(v||0).toLocaleString('es-CO', {maximumFractionDigits:0});
const fmtDate = (d: string) => {
  if (!d) return '--';
  const parts = d.split('-');
  if (parts.length === 3) {
    const mes = new Date(parseInt(parts[0]), parseInt(parts[1])-1).toLocaleDateString('es-CO',{month:'short'});
    return `${parseInt(parts[2])} ${mes} ${parts[0].slice(2)}`;
  }
  return d;
};
// Colores por nivel de certeza (confirmado > confiable > comprometido > supuesto > prospecto > historico)
const certezaColor = (c?: CertezaMovimiento) => {
  switch (c) {
    case 'confirmado': return 'bg-green-500/10 text-green-400';
    case 'confiable': return 'bg-cyan-500/10 text-cyan-400';
    case 'comprometido': return 'bg-red-500/10 text-red-400';
    case 'supuesto': return 'bg-yellow-500/10 text-yellow-400';
    case 'prospecto': return 'bg-blue-500/10 text-blue-400';
    case 'historico': return 'bg-gray-500/10 text-gray-400';
    default: return 'bg-gray-500/10 text-gray-400';
  }
};
const genId = () => Math.random().toString(36).substr(2,9);

// Parsear fecha sin timezone
const parseFecha = (f: string) => {
  const [y,m,d] = f.split('-').map(Number);
  return new Date(y, m-1, d);
};

export default function Dashboard() {
  const [state, setState] = useState<AppState>({proyectos:[],movimientos:[],pagos:[]});
  const [dbSnapshot, setDbSnapshot] = useState<{ disponible_hoy?: number; runway_meses?: number; semaforo?: string; burn_mensual?: number; synced_at?: string; source_hash?: string } | null>(null);
  const [dbSource, setDbSource] = useState<'local' | 'supabase'>('local');
  // Overlay de flujo de caja real desde Supabase (tabla cash_movements)
  const [dbMovs, setDbMovs] = useState<CashMovementRecord[]>([]);
  const [dbMovSource, setDbMovSource] = useState<'local' | 'supabase'>('local');
  const [tab, setTab] = useState<'resumen'|'gastos'|'proyectos'|'servicios'|'movimientos'|'pagos'|'calendario'|'brechas'>('resumen');
  const [modal, setModal] = useState<string|null>(null);
  const [editId, setEditId] = useState<string|null>(null);
  const [dark, setDark] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [fProyecto, setFP] = useState<Partial<Proyecto>>({});
  const [fMov, setFM] = useState<Partial<Movimiento>>({});
  const [fPago, setFPago] = useState<Partial<Pago>>({});
  const [vistaCal, setVistaCal] = useState<VistaCalendario>('grid');
  const [diaSeleccionado, setDiaSeleccionado] = useState<string|null>(null);
  const [diaDetalle, setDiaDetalle] = useState<{y:number;m:number;d:number}|null>(null);
  const [fCerteza, setFCerteza] = useState<string>('todos');

  useEffect(() => {
    setState(loadState());
    setLoaded(true);

    // Ledger local-first: Supabase no reemplaza proyectos/pagos del tablero.
    // Solo acepta KPI si el snapshot es del corte actual o más reciente.
    (async () => {
      try {
        const snapshot = await fetchSupabaseFinancialSnapshot();
        if (snapshot?.synced_at && String(snapshot.synced_at).slice(0, 10) >= CORTE_ACTUAL) {
          setDbSnapshot(snapshot);
          setDbSource('supabase');
        }
      } catch {
        // fallback local
      }
      // Overlay de flujo de caja real: si hay movimientos frescos (>= corte),
      // la pestaña "movimientos" los muestra en lugar del ledger local.
      try {
        const res = await fetch('/api/db/cash-movements');
        if (res.ok) {
          const json = await res.json();
          if (json.ok && Array.isArray(json.cashMovements) && json.cashMovements.length) {
            const fresh = (json.cashMovements as CashMovementRecord[]).filter((m) => {
              const f = m.fecha || m.synced_at || '';
              return String(f).slice(0, 10) >= CORTE_ACTUAL;
            });
            if (fresh.length) {
              setDbMovs(fresh);
              setDbMovSource('supabase');
            }
          }
        }
      } catch {
        // overlay local si Supabase no está configurado / ruta no disponible
      }
    })();
  }, []);
  const save = (n: Partial<AppState>) => { const u = {...state,...n}; setState(u); saveState(u); };
  
  const openModal = (t: string, item?: Proyecto|Movimiento|Pago, fechaDefault?: string) => {
    setModal(t);
    if (item) { 
      setEditId(item.id); 
      if (t==='proyecto') setFP(item as Proyecto); 
      if (t==='movimiento') setFM(item as Movimiento); 
      if (t==='pago') setFPago(item as Pago); 
    } else { 
      setEditId(null); 
      if (t==='proyecto') setFP({estado:'activo',servicios:[]}); 
      if (t==='movimiento') setFM({tipo:'egreso',fecha:fechaDefault||fecha(2026,8,15)}); 
      if (t==='pago') setFPago({tipo:'egreso',estado:'pendiente',fecha:fechaDefault||fecha(2026,8,30)}); 
    }
  };
  
  const closeModal = () => { 
    setModal(null); 
    setEditId(null); 
    // Si venimos del detalle del día, volver ahí
    if (diaSeleccionado) {
      setDiaSeleccionado(null);
    }
  };
  
  const saveItem = () => {
    if (modal==='proyecto') { const p={...fProyecto,id:editId||'p_'+genId()} as Proyecto; save({proyectos:editId?state.proyectos.map(x=>x.id===editId?p:x):[...state.proyectos,p]}); }
    if (modal==='movimiento') { const m={...fMov,id:editId||'m_'+genId()} as Movimiento; save({movimientos:editId?state.movimientos.map(x=>x.id===editId?m:x):[...state.movimientos,m]}); }
    if (modal==='pago') { const p={...fPago,id:editId||'pa_'+genId()} as Pago; save({pagos:editId?state.pagos.map(x=>x.id===editId?p:x):[...state.pagos,p]}); }
    setModal(null);
    setEditId(null);
    setDiaSeleccionado(null);
    // Mantener diaDetalle abierto si existe
  };
  
  const del = (t:'proyectos'|'movimientos'|'pagos',id:string) => { if (confirm('¿Eliminar?')) save({[t]:state[t].filter((x:Proyecto|Movimiento|Pago)=>x.id!==id)}); };
  const delPago = (id:string) => { if (confirm('¿Eliminar este pago?')) save({pagos:state.pagos.filter(p=>p.id!==id)}); };
  const markPagado = (id:string) => save({pagos:state.pagos.map(p=>p.id===id?{...p,estado:'pagado' as EstadoPago}:p)});

  const hoy = new Date();
  const hoyStr = fecha(hoy.getFullYear(), hoy.getMonth()+1, hoy.getDate());
  const localDisp = state.movimientos.filter(m=>m.tipo==='ingreso').reduce((s,m)=>s+m.monto,0) || CAJA_REAL_ACTUAL;
  // Preferir caja del corte local; solo overlay Supabase si snapshot fresco (ver useEffect)
  const disp = dbSnapshot?.disponible_hoy != null ? Number(dbSnapshot.disponible_hoy) : localDisp;
  const burn = dbSnapshot?.burn_mensual ?? 500000;
  const runway = dbSnapshot?.runway_meses ?? (disp > 0 ? Math.round((disp/burn)*10)/10 : 0);

  const pagos31 = state.pagos.filter(p =>
    p.tipo === 'egreso' &&
    p.estado !== 'pagado' &&
    p.certeza === 'comprometido' &&
    p.fecha >= URGENTE_INICIO &&
    p.fecha <= URGENTE_INICIO
  );
  const total31 = pagos31.reduce((s, p) => s + p.monto, 0);
  const cajaTras31 = disp - total31;

  // Desglose 31/08: Candilejas personal vs nómina (690.000 + 300.000 = 990.000)
  const candilejas31 = pagos31.filter(p => p.proyecto_id === 'candilejas').reduce((s, p) => s + p.monto, 0);
  const nomina31 = pagos31.filter(p => p.proyecto_id === 'rraliados').reduce((s, p) => s + p.monto, 0);

  // Semana urgente 31/08–05/09: comprometidos + supuestos (edición/transporte no son obligación final)
  const pagosSemanaUrgente = state.pagos.filter(p =>
    p.estado !== 'pagado' && p.fecha >= URGENTE_INICIO && p.fecha <= URGENTE_FIN
  );
  const supuestosSemana = pagosSemanaUrgente.filter(p => p.certeza === 'supuesto');
  const supuestoMin = supuestosSemana.reduce((s, p) => s + (p.monto_min ?? 0), 0);
  const supuestoMax = supuestosSemana.reduce((s, p) => s + (p.monto_max ?? p.monto), 0);

  // Cobros pendientes por recibir (monto 0 = NO recibidos al corte)
  const cobrosPendientes = state.pagos.filter(p => p.tipo === 'ingreso' && p.monto === 0 && p.estado !== 'pagado');

  // ── GASTOS MENSUALES ─────────────────────────────────────────────
  // 1) Gastos fijos recurrentes (se pagan cada mes, día 15 y 30)
  const GASTOS_FIJOS_MENSUALES = [
    { concepto: 'Quincena Manuel (15 y 30)', monto: 200000, frecuencia: '2/mes' },
    { concepto: 'Quincena Samuel (15 y 30)', monto: 100000, frecuencia: '2/mes' },
    { concepto: 'Suscripciones IA (DeepSeek + OpenCode)', monto: 70000, frecuencia: '1/mes' },
    { concepto: 'Hosting / infraestructura', monto: 50000, frecuencia: '1/mes' },
    { concepto: 'Otros servicios operativos', monto: 80000, frecuencia: '1/mes' },
  ];
  const totalFijosMes = GASTOS_FIJOS_MENSUALES.reduce((s, g) => s + g.monto * (g.frecuencia === '2/mes' ? 2 : 1), 0);

  // 2) Gastos ya estipulados / comprometidos (egresos con certeza confirmado o comprometido, no pagados)
  const gastosEstipulados = state.pagos.filter(p =>
    p.tipo === 'egreso' && p.estado !== 'pagado' &&
    (p.certeza === 'confirmado' || p.certeza === 'comprometido')
  ).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const totalEstipulado = gastosEstipulados.reduce((s, p) => s + p.monto, 0);

  // 3) Gastos nuevos (supuestos / prospectos / sin certeza fuerte — por decidir o recientes)
  const gastosNuevos = state.pagos.filter(p =>
    p.tipo === 'egreso' && p.estado !== 'pagado' &&
    (p.certeza === 'supuesto' || p.certeza === 'prospecto' || !p.certeza)
  ).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const totalNuevoMin = gastosNuevos.reduce((s, p) => s + (p.monto_min ?? p.monto), 0);
  const totalNuevoMax = gastosNuevos.reduce((s, p) => s + (p.monto_max ?? p.monto), 0);

  // 4) Gastos ya pagados este corte (históricos, para contexto)
  const gastosPagados = state.pagos.filter(p => p.tipo === 'egreso' && p.estado === 'pagado');
  const totalPagado = gastosPagados.reduce((s, p) => s + p.monto, 0);

  // ── PAGOS POR PERSONA (mapeo confirmado por el dueño 31/08/2026) ─────
  // Cada persona con sus conceptos y montos. Permite generar cuentas de cobro.
  const PAGOS_POR_PERSONA: { persona: string; concepto: string; monto: number; proyecto: string }[] = [
    { persona: 'Handle', concepto: 'Desarrollo', monto: 200000, proyecto: 'Candilejas' },
    { persona: 'Sam', concepto: 'Desarrollo', monto: 450000, proyecto: 'Candilejas' },
    { persona: 'Martín', concepto: 'Desarrollo', monto: 300000, proyecto: 'Candilejas' },
    { persona: 'Manuel', concepto: 'Base pendiente de contrato', monto: 300000, proyecto: 'RR Aliados' },
    { persona: 'Paulina', concepto: 'Modelo, sesión 1', monto: 60000, proyecto: 'Candilejas' },
    { persona: 'Samuel García', concepto: 'Camarógrafo, sesiones 1 y 2', monto: 120000, proyecto: 'Candilejas' },
    { persona: 'Estefanía', concepto: 'Supervisora, sesiones 1 y 3', monto: 120000, proyecto: 'Candilejas' },
    { persona: 'Sebastián Vargas', concepto: 'Camarógrafo, sesiones 2 y 3', monto: 120000, proyecto: 'Candilejas' },
    { persona: 'Santiago Tansi Beats', concepto: 'Modelo, sesión 2', monto: 60000, proyecto: 'Candilejas' },
    { persona: 'Sofía Vega', concepto: 'Modelo, sesión 2', monto: 60000, proyecto: 'Candilejas' },
    { persona: 'Laura', concepto: 'Modelo, sesión 3', monto: 150000, proyecto: 'Candilejas' },
  ];
  // Agrupar por persona (total por colaborador)
  const personasMap = new Map<string, { persona: string; items: { concepto: string; monto: number; proyecto: string }[]; total: number }>();
  PAGOS_POR_PERSONA.forEach(p => {
    const cur = personasMap.get(p.persona) || { persona: p.persona, items: [], total: 0 };
    cur.items.push({ concepto: p.concepto, monto: p.monto, proyecto: p.proyecto });
    cur.total += p.monto;
    personasMap.set(p.persona, cur);
  });
  const personasPagos = Array.from(personasMap.values()).sort((a, b) => b.total - a.total);
  const totalPersonas = personasPagos.reduce((s, p) => s + p.total, 0);

  // Persona seleccionada para generar cuenta de cobro
  const [personaSel, setPersonaSel] = useState<string | null>(null);
  const [ccStatus, setCcStatus] = useState('');
  const personaActual = personasPagos.find(p => p.persona === personaSel) || null;

  // Tabla de movimientos: overlay Supabase si hay datos frescos, si no ledger local
  const movsTabla: MovFila[] = dbMovSource === 'supabase'
    ? dbMovs.map(m => ({
        id: m.id,
        tipo: (m.tipo === 'ingreso' || m.tipo === 'egreso' ? m.tipo : 'otro') as 'ingreso' | 'egreso' | 'otro',
        concepto: m.concepto || '—',
        monto: Number(m.monto) || 0,
        fecha: String(m.fecha || m.synced_at || '').slice(0, 10),
        proyecto_id: m.proyecto_id || '',
        fuente: 'supabase' as const,
      }))
    : state.movimientos.slice().reverse().map(m => ({ ...m, fuente: 'local' as const }));

  // Proyección 6 meses
  const meses: {mes:string;ing:number;egr:number;saldo:number;brecha:boolean}[] = [];
  let sal = disp;
  for (let i=0;i<6;i++) {
    const y = hoy.getFullYear();
    const m = hoy.getMonth()+1+i;
    const realM = m > 12 ? m-12 : m;
    const realY = m > 12 ? y+1 : y;
    const f = fecha(realY, realM, 1);
    const lastDay = new Date(realY, realM, 0).getDate();
    const fm = fecha(realY, realM, lastDay);
    const pm = state.pagos.filter(p=>p.fecha>=f && p.fecha<=fm && p.estado!=='pagado');
    const ing = pm.filter(p=>p.tipo==='ingreso').reduce((s,p)=>s+p.monto,0);
    const egr = pm.filter(p=>p.tipo==='egreso').reduce((s,p)=>s+p.monto,0);
    sal += ing - egr;
    meses.push({mes: new Date(realY,realM-1).toLocaleDateString('es-CO',{month:'short',year:'2-digit'}),ing,egr,saldo:sal,brecha:sal<0});
  }

  // Próximos pagos
  const pagosProx = state.pagos.filter(p=>p.estado!=='pagado' && p.fecha>=hoyStr).sort((a,b)=>a.fecha.localeCompare(b.fecha)).slice(0,20);

  // Calendario: Ago 2026 - Mar 2027
  const calendarMonths: {y:number;m:number;nombre:string;lastDay:number}[] = [];
  for (let y=2026;y<=2027;y++) {
    const mMax = y===2027 ? 3 : 12;
    const mStart = y===2026 ? 8 : 1;
    for (let m=mStart;m<=mMax;m++) {
      calendarMonths.push({y,m,nombre:new Date(y,m-1).toLocaleDateString('es-CO',{month:'long'}),lastDay:new Date(y,m,0).getDate()});
    }
  }

  // Pagos de un día específico
  const getPagosDia = (y:number,m:number,d:number) => state.pagos.filter(p=>{
    const [py,pm,pd] = p.fecha.split('-').map(Number);
    return py===y && pm===m && pd===d && p.estado!=='pagado';
  });

  // Abrir detalle del día
  const clickDia = (y:number,m:number,d:number) => {
    setDiaDetalle({y,m,d});
  };

  // Cerrar detalle del día
  const closeDiaDetalle = () => {
    setDiaDetalle(null);
  };

  // Abrir modal para crear pago desde día seleccionado
  const addPagoDesdeDia = () => {
    if (diaDetalle) {
      const f = fecha(diaDetalle.y, diaDetalle.m, diaDetalle.d);
      openModal('pago', undefined, f);
    }
  };

  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(state.proyectos.map(p=>({Proyecto:p.nombre,Cliente:p.cliente,Categoria:p.categoria||'',Fase:p.fase||'',Estado:p.estado,'Valor Contratado':p.valor_total,Pagado:p.valor_pagado,'Pendiente Contratado':p.valor_total-p.valor_pagado,'Valor Potencial NO comprometido':p.valor_potencial||0,'Proximo Hito':p.proximo_hito||''}))), 'Proyectos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(state.movimientos.map(m=>({Fecha:m.fecha,Tipo:m.tipo,Concepto:m.concepto,Monto:m.tipo==='ingreso'?m.monto:-m.monto}))), 'Movimientos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(state.pagos.map(p=>({Concepto:p.concepto,Tipo:p.tipo,Monto:p.monto,Fecha:p.fecha,Estado:p.estado,Proyecto:p.proyecto_id}))), 'Pagos');
    XLSX.writeFile(wb, `RR_Finanzas_${hoyStr}.xlsx`);
  };

  // Generar cuenta de cobro: navega a /cuentas-cobro con la persona y conceptos pre-cargados
  const generarCuentaCobro = async (p: { persona: string; items: { concepto: string; monto: number; proyecto: string }[]; total: number }) => {
    setCcStatus(`Preparando cuenta para ${p.persona}...`);
    // Construir query con persona + conceptos (JSON) para que la página pre-cargue todo
    const conceptos = p.items.map(i => ({ concepto: i.concepto, precio: i.monto, cantidad: 1 }));
    const qs = new URLSearchParams();
    qs.set('persona', p.persona);
    qs.set('conceptos', JSON.stringify(conceptos));
    qs.set('proyecto', Array.from(new Set(p.items.map(i => i.proyecto))).join(', '));
    // Dar un instante para mostrar el estado antes de navegar
    setTimeout(() => {
      window.location.href = `/cuentas-cobro?${qs.toString()}`;
    }, 300);
  };

  if (!loaded) return <div className="min-h-screen bg-[#08080c] flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#ce3d1f] border-t-transparent rounded-full animate-spin"></div></div>;

  const bg = dark?'bg-[#08080c]':'bg-gray-50';
  const card = dark?'bg-[#0f0f15]':'bg-white';
  const bd = dark?'border-white/[0.06]':'border-gray-200';
  const t = dark?'text-[#f5ede1]':'text-gray-900';
  const t2 = dark?'text-[#8a8778]':'text-gray-500';
  const t3 = dark?'text-[#6b6859]':'text-gray-400';
  const inp = dark?'bg-white/5 border-white/10 text-[#f5ede1]':'bg-gray-50 border-gray-200 text-gray-900';

  const Input = ({l,v,on,tp='text'}:{l:string;v:string|number;on:(v:string)=>void;tp?:string}) => (
    <div><label className={`text-xs font-medium ${t2} mb-1.5 block`}>{l}</label><input type={tp} value={v||''} onChange={e=>on(e.target.value)} className={`w-full px-3 py-2.5 rounded-[var(--radius-input)] text-sm ${inp} border focus:border-[#ce3d1f] focus:ring-1 focus:ring-[#ce3d1f]/20 outline-none`}/></div>
  );
  const Select = ({l,v,on,opts}:{l:string;v:string;on:(v:string)=>void;opts:{v:string;l:string}[]}) => (
    <div><label className={`text-xs font-medium ${t2} mb-1.5 block`}>{l}</label><select value={v} onChange={e=>on(e.target.value)} className={`w-full px-3 py-2.5 rounded-[var(--radius-input)] text-sm ${inp} border focus:border-[#ce3d1f] outline-none`}>{opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
  );

  return (
    <div className={`min-h-screen ${bg}`}>
      {/* HEADER — brandkit RR */}
      <header className={`border-b ${bd} ${dark?'bg-[#08080c]/80':'bg-white/80'} backdrop-blur-xl sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="RR" className="w-10 h-10 rounded-xl shadow-lg ring-1 ring-[#ce3d1f]/40"/>
            <div>
              <h1 className={`text-sm font-extrabold tracking-tight ${t}`}>RR<span className="text-[#ce3d1f]">ALIADOS</span></h1>
              <p className="text-[10px] text-[#8a8778] font-medium">Finanzas · corte {CORTE_ACTUAL}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {dbSource === 'supabase' && dbSnapshot && (
              <div className="hidden md:flex items-center gap-2">
                <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/20">Supabase</span>
                <span className={`px-2 py-1 rounded-lg text-[10px] ${t3}`} title={`Snapshot ${dbSnapshot.synced_at || ''} · hash ${dbSnapshot.source_hash || '—'}`}>
                  sync {fmtDate(String(dbSnapshot.synced_at || '').slice(0, 10))}
                </span>
              </div>
            )}
            <Link href="/crm" className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-[#f5ede1] transition-colors">CRM</Link>
            <Link href="/cuentas-cobro" className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#ce3d1f]/15 text-[#e7785e] hover:bg-[#ce3d1f]/25 transition-colors">Cuentas</Link>
            <Link href="/documentos" className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-[#f5ede1] transition-colors">Documentos</Link>
            <label className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#3f0035]/40 text-[#e8c069] cursor-pointer hover:bg-[#3f0035]/60 border border-[#3f0035]/40 transition-colors">
              Sync Excel
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const fd = new FormData();
                fd.append('file', f);
                await fetch('/api/db/excel', { method: 'POST', body: fd });
                const snap = await fetchSupabaseFinancialSnapshot();
                if (snap) setDbSnapshot(snap);
              }} />
            </label>
            <button onClick={exportExcel} className="rr-btn-primary px-4 py-2 rounded-xl text-xs font-bold">Exportar Excel</button>
            <button onClick={()=>setDark(!dark)} className={`p-2.5 rounded-xl btn-press ${dark?'bg-white/5':'bg-gray-100'}`}>{dark?'☀️':'🌙'}</button>
          </div>
        </div>
      </header>

      {/* TABS */}
      <div className={`border-b ${bd} sticky top-[53px] z-30 glass ${dark?'bg-[#08080c]/80':'bg-white/80'}`}>
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {([['resumen','Resumen'],['gastos','Gastos'],['proyectos','Proyectos'],['servicios','Servicios'],['movimientos','Movimientos'],['pagos','Pagos'],['calendario','Calendario'],['brechas','Brechas']] as [string,string][]).map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k as typeof tab)} className={`px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap tab-indicator ${tab===k?'active text-[#e7785e]':`border-transparent ${t2} hover:${t}`}`}>{l}</button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* RESUMEN */}
        {tab==='resumen' && <>
          <div className="relative overflow-hidden rounded-[var(--radius-hero)] mb-6 p-[1px] bg-gradient-to-br from-[#3f0035] via-[#ce3d1f]/60 to-[#ce3d1f]">
            <div className="rounded-[calc(var(--radius-hero)-1px)] p-5 md:p-6 bg-[#0b0b10]">
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#ce3d1f]/15 blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#3f0035]/30 blur-3xl pointer-events-none"></div>
              <div className="relative flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#e7785e] font-bold mb-1">Pagos del 31 de agosto 2026</p>
                  <p className={`text-sm ${t2} max-w-md`}>Comprometidos (Candilejas personal + quincena Manuel/Samuel). Edición/transporte son supuestos y no entran aquí.</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#e7785e] rr-num">{fmt(total31)}</p>
                  <p className={`text-xs ${t3}`}>Caja tras pagar: <span className={cajaTras31 < 0 ? 'text-[#ef4444] font-semibold' : 'text-[#f5c518] font-semibold'}>{fmt(cajaTras31)}</span></p>
                </div>
              </div>
              {/* Desglose 31/08 + proyección semana urgente */}
              <div className="relative grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                <div className={`px-3 py-2.5 rounded-xl border ${bd} bg-white/[0.02]`}>
                  <p className={`text-[9px] uppercase tracking-widest ${t3} mb-1`}>Candilejas · personal</p>
                  <p className="text-base font-extrabold text-[#e7785e] rr-num">{fmt(candilejas31)}</p>
                  <p className={`text-[9px] ${t3}`}>8 ítems comprometidos</p>
                </div>
                <div className={`px-3 py-2.5 rounded-xl border ${bd} bg-white/[0.02]`}>
                  <p className={`text-[9px] uppercase tracking-widest ${t3} mb-1`}>Nómina · quincena 30/08</p>
                  <p className="text-base font-extrabold text-[#e7785e] rr-num">{fmt(nomina31)}</p>
                  <p className={`text-[9px] ${t3}`}>Manuel 200k + Samuel 100k</p>
                </div>
                <div className={`px-3 py-2.5 rounded-xl border ${bd} bg-white/[0.02]`}>
                  <p className={`text-[9px] uppercase tracking-widest ${t3} mb-1`}>Semana urgente 31/08–05/09</p>
                  <p className="text-base font-extrabold text-[#e8c069] rr-num">{fmt(total31 + supuestoMin)} – {fmt(total31 + supuestoMax)}</p>
                  <p className={`text-[9px] ${t3}`}>comprometidos {fmt(total31)} + supuestos {fmt(supuestoMin)}–{fmt(supuestoMax)}</p>
                </div>
              </div>
              <div className="relative grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {pagos31.map(p => (
                  <button key={p.id} type="button" onClick={() => openModal('pago', p)} className={`text-left px-3 py-2 rounded-xl border ${bd} hover:bg-white/[0.04] flex justify-between gap-2`}>
                    <span className={`text-xs ${t} truncate`}>{p.concepto}</span>
                    <span className="text-xs font-bold text-[#e7785e] rr-num flex-shrink-0">{fmt(p.monto)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          {cobrosPendientes.length > 0 && (
            <div className={`${card} border border-yellow-500/30 rounded-2xl p-5 mb-6 bg-yellow-500/[0.04]`}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-yellow-400 font-semibold mb-1">Cobros pendientes por recibir</p>
                  <p className={`text-xs ${t3}`}>NO recibidos al corte {CORTE_ACTUAL} — no cuentan como caja hasta comprobante o confirmación directa.</p>
                </div>
                <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-yellow-500/20 text-yellow-400">{cobrosPendientes.length} cobro{cobrosPendientes.length!==1?'s':''} en $0</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {cobrosPendientes.map(p => {
                  const pr = state.proyectos.find(x => x.id === p.proyecto_id);
                  return (
                    <button key={p.id} type="button" onClick={() => openModal('pago', p)} className={`text-left px-3 py-2.5 rounded-xl border ${bd} hover:bg-white/[0.04]`}>
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-xs font-medium ${t}`}>{pr?.nombre || p.proyecto_id}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-500/10 text-red-400 whitespace-nowrap">no recibido</span>
                      </div>
                      <p className={`text-[10px] ${t3} mt-1 truncate`}>{p.concepto}</p>
                      <p className={`text-[10px] ${t3} mt-0.5`}>Certeza {p.certeza || 'historico'} · monto sin confirmar · {fmtDate(p.fecha)}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="rr-card border border-[var(--border)] rounded-[var(--radius-card)] p-5 card-hover animate-fadeInUp stagger-1">
              <p className={`text-[10px] uppercase tracking-widest ${t3} mb-2 font-bold`}>Disponible</p>
              <p className="rr-kpi text-3xl">{fmt(disp)}</p>
              <p className={`text-xs ${t3}`}>Bancolombia · corte {CORTE_ACTUAL}</p>
            </div>
            <div className="rr-card border border-[var(--border)] rounded-[var(--radius-card)] p-5 card-hover animate-fadeInUp stagger-2">
              <p className={`text-[10px] uppercase tracking-widest ${t3} mb-2 font-bold`}>Runway</p>
              <p className={`rr-num text-3xl font-extrabold tracking-tight ${runway>=8?'text-[#22c55e]':runway>=4?'text-[#f5c518]':'text-[#ef4444]'}`}>{runway}<span className="text-sm font-bold text-[#8a8778]"> meses</span></p>
              <p className={`text-xs ${t3}`}>Burn {fmt(burn)}/mes</p>
            </div>
            <div className="rr-card border border-[#ce3d1f]/20 rounded-[var(--radius-card)] p-5 card-hover animate-fadeInUp stagger-3">
              <p className="text-[10px] uppercase tracking-widest text-[#e7785e] mb-2 font-bold">A pagar 31/08</p>
              <p className="rr-num text-3xl font-extrabold tracking-tight text-[#e7785e]">{fmt(total31)}</p>
              <p className={`text-xs ${t3}`}>{pagos31.length} ítems comprometidos</p>
            </div>
            <div className="rr-card border border-[var(--border)] rounded-[var(--radius-card)] p-5 card-hover animate-fadeInUp stagger-4">
              <p className={`text-[10px] uppercase tracking-widest ${t3} mb-2 font-bold`}>Tras el 31</p>
              <p className={`rr-num text-3xl font-extrabold tracking-tight ${cajaTras31<500000?'text-[#ef4444]':'text-[#f5c518]'}`}>{fmt(cajaTras31)}</p>
              <p className={`text-xs ${t3}`}>Si se paga todo lo comprometido</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={`${card} border ${bd} rounded-2xl overflow-hidden`}>
              <div className={`p-4 border-b ${bd}`}><h3 className={`text-sm font-semibold ${t}`}>Próximos Pagos</h3></div>
              <div className="max-h-96 overflow-y-auto divide-y divide-white/[0.04]">
                {pagosProx.map(p=>{
                  const dias=Math.ceil((parseFecha(p.fecha).getTime()-Date.now())/86400000);
                  return(
                    <div key={p.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={()=>openModal('pago',p)}>
                      <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${dias<0?'bg-red-500/10':dias<=7?'bg-yellow-500/10':'bg-blue-500/10'}`}>
                        <span className={`text-sm font-bold ${dias<0?'text-red-400':dias<=7?'text-yellow-400':'text-blue-400'}`}>{parseInt(p.fecha.split('-')[2])}</span>
                        <span className={`text-[8px] ${t3}`}>{new Date(parseInt(p.fecha.split('-')[0]),parseInt(p.fecha.split('-')[1])-1).toLocaleDateString('es-CO',{month:'short'})}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${t} truncate`}>{p.concepto}</p>
                        <p className={`text-[10px] ${dias<0?'text-red-400':t3}`}>{dias<0?`Vencido ${-dias}d`:`En ${dias}d`}</p>
                      </div>
                      <span className={`text-xs font-bold flex-shrink-0 ${p.tipo==='ingreso'?'text-green-400':'text-red-400'}`}>{p.tipo==='ingreso'?'+':'-'}{fmt(p.monto)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={`${card} border ${bd} rounded-2xl overflow-hidden`}>
              <div className={`p-4 border-b ${bd}`}><h3 className={`text-sm font-semibold ${t}`}>Últimos Movimientos</h3></div>
              <div className="max-h-96 overflow-y-auto divide-y divide-white/[0.04]">
                {state.movimientos.slice(-10).reverse().map(m=>(
                  <div key={m.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${m.tipo==='ingreso'?'bg-green-500/10 text-green-400':'bg-red-500/10 text-red-400'}`}>{m.tipo==='ingreso'?'↑':'↓'}</div>
                    <div className="flex-1"><p className={`text-xs font-medium ${t}`}>{m.concepto}</p><p className={`text-[10px] ${t3}`}>{fmtDate(m.fecha)}</p></div>
                    <span className={`text-xs font-bold ${m.tipo==='ingreso'?'text-green-400':'text-red-400'}`}>{m.tipo==='ingreso'?'+':'-'}{fmt(m.monto)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {dbMovSource === 'supabase' && dbMovs.length > 0 && (
            <div className={`${card} border ${bd} rounded-2xl overflow-hidden mt-4`}>
              <div className={`p-4 border-b ${bd} flex items-center justify-between`}>
                <h3 className={`text-sm font-semibold ${t}`}>Flujo de caja (Supabase)</h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-green-500/20 text-green-400">Supabase · {dbMovs.length} movs</span>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-white/[0.04]">
                {dbMovs.slice(0, 10).map(m => {
                  const esIng = m.tipo === 'ingreso';
                  const pr = m.proyecto_id ? state.proyectos.find(x => x.id === m.proyecto_id) : undefined;
                  return (
                    <div key={m.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${esIng?'bg-green-500/10 text-green-400':'bg-red-500/10 text-red-400'}`}>{esIng?'↑':'↓'}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${t} truncate`}>{m.concepto || '—'}</p>
                        <p className={`text-[10px] ${t3}`}>{fmtDate(String(m.fecha || m.synced_at || '').slice(0, 10))}{pr ? ` · ${pr.nombre}` : m.proyecto_id ? ` · ${m.proyecto_id}` : ''}</p>
                      </div>
                      <span className={`text-xs font-bold flex-shrink-0 ${esIng?'text-green-400':'text-red-400'}`}>{esIng?'+':'-'}{fmt(Number(m.monto) || 0)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>}

        {/* GASTOS — vista mensual clara */}
        {tab==='gastos' && <>
          <div className="mb-6">
            <h2 className={`text-lg font-bold ${t}`}>Gastos mensuales</h2>
            <p className={`text-xs ${t3} mt-1`}>Fijos recurrentes · estipulados (confirmados/comprometidos) · nuevos (supuestos/prospectos).</p>
          </div>

          {/* KPIs de gastos */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className={`${card} border ${bd} rounded-2xl p-5`}>
              <p className={`text-[10px] uppercase tracking-widest ${t3} mb-2 font-bold`}>Fijos / mes</p>
              <p className="rr-num text-3xl font-extrabold text-[#e7785e]">{fmt(totalFijosMes)}</p>
              <p className={`text-xs ${t3}`}>nómina + suscripciones + hosting</p>
            </div>
            <div className={`${card} border ${bd} rounded-2xl p-5`}>
              <p className={`text-[10px] uppercase tracking-widest ${t3} mb-2 font-bold`}>Estipulados</p>
              <p className="rr-num text-3xl font-extrabold text-red-400">{fmt(totalEstipulado)}</p>
              <p className={`text-xs ${t3}`}>{gastosEstipulados.length} ítems comprometidos/confirmados</p>
            </div>
            <div className={`${card} border ${bd} rounded-2xl p-5`}>
              <p className={`text-[10px] uppercase tracking-widest ${t3} mb-2 font-bold`}>Nuevos (rango)</p>
              <p className="rr-num text-3xl font-extrabold text-yellow-400">{fmt(totalNuevoMin)}–{fmt(totalNuevoMax)}</p>
              <p className={`text-xs ${t3}`}>{gastosNuevos.length} supuestos/prospectos</p>
            </div>
            <div className={`${card} border ${bd} rounded-2xl p-5`}>
              <p className={`text-[10px] uppercase tracking-widest ${t3} mb-2 font-bold`}>Caja disponible</p>
              <p className="rr-num text-3xl font-extrabold text-green-400">{fmt(disp)}</p>
              <p className={`text-xs ${t3}`}>tras fijos + estipulados: {fmt(disp - totalFijosMes - totalEstipulado)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 1) Gastos fijos mensuales */}
            <div className={`${card} border ${bd} rounded-2xl overflow-hidden`}>
              <div className={`p-4 border-b ${bd} flex items-center justify-between`}>
                <h3 className={`text-sm font-semibold ${t}`}>💰 Fijos mensuales</h3>
                <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-blue-500/15 text-blue-400">recurrente</span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {GASTOS_FIJOS_MENSUALES.map((g, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-xs font-medium ${t} truncate`}>{g.concepto}</p>
                      <p className={`text-[10px] ${t3}`}>{g.frecuencia}</p>
                    </div>
                    <span className="text-xs font-bold text-[#e7785e] flex-shrink-0">{fmt(g.monto * (g.frecuencia === '2/mes' ? 2 : 1))}</span>
                  </div>
                ))}
                <div className="px-4 py-3 bg-white/[0.02] flex items-center justify-between">
                  <p className={`text-xs font-semibold ${t}`}>Total mensual</p>
                  <p className="text-sm font-extrabold text-[#e7785e]">{fmt(totalFijosMes)}</p>
                </div>
              </div>
            </div>

            {/* 2) Gastos estipulados */}
            <div className={`${card} border ${bd} rounded-2xl overflow-hidden`}>
              <div className={`p-4 border-b ${bd} flex items-center justify-between`}>
                <h3 className={`text-sm font-semibold ${t}`}>📋 Estipulados / comprometidos</h3>
                <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-red-500/15 text-red-400">{gastosEstipulados.length}</span>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-white/[0.04]">
                {gastosEstipulados.length === 0 && <p className={`px-4 py-6 text-xs ${t3}`}>Sin gastos estipulados pendientes.</p>}
                {gastosEstipulados.map(p => (
                  <div key={p.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={()=>openModal('pago',p)}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${t} truncate`}>{p.concepto}</p>
                      <p className={`text-[10px] ${t3}`}>{fmtDate(p.fecha)}{p.proyecto_id ? ` · ${state.proyectos.find(x=>x.id===p.proyecto_id)?.nombre || p.proyecto_id}` : ''}</p>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold flex-shrink-0 ${certezaColor(p.certeza)}`}>{p.certeza}</span>
                    <span className="text-xs font-bold text-red-400 flex-shrink-0">{fmt(p.monto)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3) Gastos nuevos */}
            <div className={`${card} border ${bd} rounded-2xl overflow-hidden`}>
              <div className={`p-4 border-b ${bd} flex items-center justify-between`}>
                <h3 className={`text-sm font-semibold ${t}`}>🆕 Nuevos / por decidir</h3>
                <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-yellow-500/15 text-yellow-400">{gastosNuevos.length}</span>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-white/[0.04]">
                {gastosNuevos.length === 0 && <p className={`px-4 py-6 text-xs ${t3}`}>Sin gastos nuevos por decidir.</p>}
                {gastosNuevos.map(p => {
                  const min = p.monto_min ?? p.monto;
                  const max = p.monto_max ?? p.monto;
                  return (
                    <div key={p.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={()=>openModal('pago',p)}>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${t} truncate`}>{p.concepto}</p>
                        <p className={`text-[10px] ${t3}`}>{fmtDate(p.fecha)} · rango {fmt(min)}–{fmt(max)}</p>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold flex-shrink-0 ${certezaColor(p.certeza)}`}>{p.certeza || 'sin certeza'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Gastos pagados (contexto histórico) */}
          {gastosPagados.length > 0 && (
            <div className={`${card} border ${bd} rounded-2xl overflow-hidden mt-5`}>
              <div className={`p-4 border-b ${bd} flex items-center justify-between`}>
                <h3 className={`text-sm font-semibold ${t}`}>✅ Pagados este corte</h3>
                <span className="text-xs font-bold text-green-400">{fmt(totalPagado)}</span>
              </div>
              <div className="flex flex-wrap gap-2 p-4">
                {gastosPagados.map(p => (
                  <span key={p.id} className="px-2.5 py-1.5 rounded-lg text-[10px] bg-green-500/10 text-green-400 border border-green-500/20" title={fmtDate(p.fecha)}>{p.concepto.split(' - ')[0]} · {fmt(p.monto)}</span>
                ))}
              </div>
            </div>
          )}

          {/* PAGOS POR PERSONA — confirmar cuánto se paga a cada colaborador + generar cuenta de cobro */}
          <div className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className={`text-lg font-bold ${t}`}>👤 Pagos por persona</h2>
                <p className={`text-xs ${t3} mt-1`}>Total confirmado: <span className="font-bold text-[#e7785e]">{fmt(totalPersonas)}</span> · {personasPagos.length} colaboradores. Selecciona una persona para ver sus conceptos y generar su cuenta de cobro.</p>
              </div>
              {ccStatus && <span className={`text-xs font-medium px-3 py-1.5 rounded-lg ${ccStatus.startsWith('✅')?'bg-green-500/15 text-green-400':'bg-red-500/15 text-red-400'}`}>{ccStatus}</span>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Lista de personas con total */}
              <div className={`${card} border ${bd} rounded-2xl overflow-hidden lg:col-span-1`}>
                <div className={`p-4 border-b ${bd}`}><h3 className={`text-sm font-semibold ${t}`}>Colaboradores</h3></div>
                <div className="max-h-[480px] overflow-y-auto divide-y divide-white/[0.04]">
                  {personasPagos.map(p => (
                    <button key={p.persona} type="button" onClick={() => { setPersonaSel(p.persona); setCcStatus(''); }}
                      className={`w-full px-4 py-3 flex items-center justify-between gap-3 text-left transition-colors ${personaSel === p.persona ? 'bg-[#ce3d1f]/10 border-l-2 border-[#ce3d1f]' : 'hover:bg-white/[0.02]'}`}>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold ${t} truncate`}>{p.persona}</p>
                        <p className={`text-[10px] ${t3}`}>{p.items.length} concepto{p.items.length !== 1 ? 's' : ''}</p>
                      </div>
                      <span className="text-xs font-bold text-[#e7785e] flex-shrink-0">{fmt(p.total)}</span>
                    </button>
                  ))}
                  <div className="px-4 py-3 bg-white/[0.02] flex items-center justify-between">
                    <p className={`text-xs font-semibold ${t}`}>Total</p>
                    <p className="text-sm font-extrabold text-[#e7785e]">{fmt(totalPersonas)}</p>
                  </div>
                </div>
              </div>

              {/* Detalle de la persona seleccionada + generar cuenta */}
              <div className={`${card} border ${bd} rounded-2xl overflow-hidden lg:col-span-2`}>
                <div className={`p-4 border-b ${bd} flex items-center justify-between`}>
                  <h3 className={`text-sm font-semibold ${t}`}>{personaActual ? `Conceptos de ${personaActual.persona}` : 'Selecciona un colaborador'}</h3>
                  {personaActual && <span className="text-sm font-extrabold text-[#e7785e]">{fmt(personaActual.total)}</span>}
                </div>
                {personaActual ? (
                  <div className="p-4">
                    <div className="space-y-2 mb-4">
                      {personaActual.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                          <div className="min-w-0">
                            <p className={`text-xs font-medium ${t}`}>{item.concepto}</p>
                            <p className={`text-[10px] ${t3}`}>{item.proyecto}</p>
                          </div>
                          <span className="text-xs font-bold text-[#e7785e] flex-shrink-0">{fmt(item.monto)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button type="button" onClick={() => generarCuentaCobro(personaActual)}
                        className="rr-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2">
                        🧾 Generar cuenta de cobro
                      </button>
                      <Link href="/cuentas-cobro" className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-[#f5ede1] transition-colors">
                        Ver cuentas de cobro →
                      </Link>
                    </div>
                    <p className={`text-[10px] ${t3} mt-3`}>Genera la cuenta de cobro (número RR-CC), la guarda en la BD y descarga el PDF automáticamente.</p>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className={`text-sm ${t3}`}>👈 Haz clic en un colaborador para ver sus conceptos y generar su cuenta de cobro.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>}

        {/* PROYECTOS */}
        {tab==='proyectos' && <>
          <div className="flex justify-between items-center mb-6"><h2 className={`text-lg font-bold ${t}`}>Proyectos · clientes + prospectos</h2><button onClick={()=>openModal('proyecto')} className="rr-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold">+ Nuevo Proyecto</button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {state.proyectos.map(p=>(
              <div key={p.id} className={`${card} border ${bd} rounded-2xl p-6 card-hover`}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0"><h3 className={`text-sm font-semibold ${t} truncate`}>{p.nombre}</h3><p className={`text-xs ${t3} mt-0.5`}>{p.cliente}</p><div className="flex gap-1.5 mt-2 flex-wrap"><span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${p.categoria==='cliente'?'bg-green-500/10 text-green-400 border border-green-500/20':p.categoria==='prospecto'?'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20':'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>{p.categoria||'sin clasificar'}</span>{p.fase&&<span className="px-2 py-0.5 rounded-full text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20">{p.fase}</span>}</div></div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap flex-shrink-0 ${p.estado==='activo'?'bg-green-500/10 text-green-400 border border-green-500/20':p.estado==='planificacion'?'bg-blue-500/10 text-blue-400 border border-blue-500/20':'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>{p.estado}</span>
                </div>
                <p className={`text-xs ${t2} mb-4 leading-relaxed`}>{p.descripcion}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs"><span className={t3}>Valor Total</span><span className={`font-medium ${t}`}>{fmt(p.valor_total)}</span></div>
                  <div className="flex justify-between text-xs"><span className={t3}>Pagado</span><span className="font-medium text-green-400">{fmt(p.valor_pagado)}</span></div>
                  <div className="flex justify-between text-xs"><span className={t3}>Pendiente contratado</span><span className="font-medium text-yellow-400">{fmt(p.valor_total-p.valor_pagado)}</span></div>{(p.valor_potencial||0)>0&&<div className="flex justify-between text-xs"><span className={t3}>Valor potencial (NO comprometido)</span><span className="font-medium text-blue-400">{fmt(p.valor_potencial||0)}</span></div>}{p.costo_reservado!==undefined&&<div className="flex justify-between text-xs"><span className={t3}>Costo / reserva conocida</span><span className="font-medium text-red-400">{fmt(p.costo_reservado||0)}</span></div>}
                </div>
                {p.valor_total > 0 && <div className="w-full bg-white/5 rounded-full h-2 mb-4"><div className="bg-green-500 h-2 rounded-full progress-bar" style={{width:`${(p.valor_pagado/p.valor_total)*100}%`}}></div></div>}
                {(p.equipo||[]).length>0&&<div className="mb-4"><p className="text-[9px] uppercase tracking-widest text-purple-400 font-semibold mb-1.5">Equipo / capacidades necesarias</p><div className="flex flex-wrap gap-1.5">{(p.equipo||[]).map(e=><span key={e} className="px-2 py-0.5 rounded-md text-[9px] bg-purple-500/10 text-purple-300 border border-purple-500/20">{e}</span>)}</div></div>}{p.proximo_hito&&<div className={`mb-4 p-3 rounded-xl border ${dark?'bg-red-500/[0.04] border-red-500/15':'bg-red-50 border-red-100'}`}><p className="text-[9px] uppercase tracking-widest text-red-400 font-semibold mb-1">Próximo hito</p><p className={`text-[11px] leading-relaxed ${t2}`}>{p.proximo_hito}</p></div>}{p.servicios.length > 0 && <div className="mb-3"><p className="text-[9px] uppercase tracking-widest text-green-400 font-semibold mb-1.5">Alcance confirmado / base</p><div className="flex flex-wrap gap-1.5">{p.servicios.map(s=><span key={s} className="px-2 py-0.5 rounded-md text-[9px] font-medium bg-green-500/10 text-green-400 border border-green-500/20">{s}</span>)}</div></div>}{(p.servicios_potenciales||[]).length > 0 && <div className="mb-4"><p className="text-[9px] uppercase tracking-widest text-yellow-400 font-semibold mb-1.5">Oportunidad futura — NO contratada</p><div className="flex flex-wrap gap-1.5">{(p.servicios_potenciales||[]).map(s=><span key={s} className="px-2 py-0.5 rounded-md text-[9px] font-medium bg-yellow-500/5 text-yellow-400 border border-yellow-500/20">{s}</span>)}</div></div>}
                <div className="flex gap-2 pt-3 border-t ${bd}">
                  <button onClick={()=>openModal('proyecto',p)} className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium btn-press ${dark?'bg-white/5 hover:bg-white/10':'bg-gray-100 hover:bg-gray-200'} ${t2}`}>Editar</button>
                  <button onClick={()=>del('proyectos',p.id)} className="px-3 py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 btn-press">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* SERVICIOS */}
        {tab==='servicios' && <>
          <div className="mb-6">
            <h2 className={`text-lg font-bold ${t}`}>Servicios por proyecto</h2>
            <p className={`text-xs ${t3} mt-1`}>Lectura explícita: verde = confirmado/base del proyecto; amarillo = oportunidad futura, no vendida ni incluida en ingresos.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {state.proyectos.filter(p=>p.categoria!=='interno').map(p=>(
              <div key={p.id} className={`${card} border ${bd} rounded-2xl p-5`}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div><h3 className={`text-sm font-semibold ${t}`}>{p.nombre}</h3><p className={`text-[10px] ${t3} mt-1`}>{p.fase||p.estado}</p></div>
                  <span className={`px-2 py-1 rounded-full text-[9px] font-semibold ${p.categoria==='cliente'?'bg-green-500/10 text-green-400':'bg-yellow-500/10 text-yellow-400'}`}>{p.categoria}</span>
                </div>
                <div className="mb-4">
                  <p className="text-[9px] uppercase tracking-widest text-green-400 font-semibold mb-2">✓ Confirmado / alcance base</p>
                  <div className="flex flex-wrap gap-1.5">{p.servicios.length?p.servicios.map(s=><span key={s} className="px-2.5 py-1 rounded-lg text-[10px] bg-green-500/10 text-green-400 border border-green-500/20">{s}</span>):<span className={`text-xs ${t3}`}>Pendiente de definir</span>}</div>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-yellow-400 font-semibold mb-2">＋ Oportunidad futura · NO contratada</p>
                  <div className="flex flex-wrap gap-1.5">{(p.servicios_potenciales||[]).length?(p.servicios_potenciales||[]).map(s=><span key={s} className="px-2.5 py-1 rounded-lg text-[10px] bg-yellow-500/5 text-yellow-400 border border-yellow-500/20">{s}</span>):<span className={`text-xs ${t3}`}>Sin cross-sell registrado</span>}</div>
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* MOVIMIENTOS */}
        {tab==='movimientos' && <>
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
            <div>
              <h2 className={`text-lg font-bold ${t}`}>Movimientos</h2>
              {dbMovSource === 'supabase' && (
                <p className={`text-xs ${t3} mt-1`}>Overlay Supabase: {dbMovs.length} movimientos frescos (≥ corte {CORTE_ACTUAL}). El ledger local queda oculto bajo esta fuente.</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {dbMovSource === 'supabase' && <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-green-500/20 text-green-400">Supabase</span>}
              <button onClick={()=>openModal('movimiento')} className="rr-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold">+ Nuevo</button>
            </div>
          </div>
          <div className={`${card} border ${bd} rounded-2xl overflow-hidden`}>
            <div className="overflow-x-auto"><table className="w-full"><thead><tr className={`border-b ${bd}`}>
              <th className={`text-left px-5 py-3.5 text-[10px] uppercase tracking-wider font-semibold ${t3}`}>Fecha</th>
              <th className={`text-left px-5 py-3.5 text-[10px] uppercase tracking-wider font-semibold ${t3}`}>Tipo</th>
              <th className={`text-left px-5 py-3.5 text-[10px] uppercase tracking-wider font-semibold ${t3}`}>Concepto</th>
              <th className={`text-left px-5 py-3.5 text-[10px] uppercase tracking-wider font-semibold ${t3}`}>Proyecto</th>
              <th className={`text-right px-5 py-3.5 text-[10px] uppercase tracking-wider font-semibold ${t3}`}>Monto</th>
              <th className={`text-right px-5 py-3.5 text-[10px] uppercase tracking-wider font-semibold ${t3}`}>Fuente</th>
            </tr></thead><tbody className="divide-y divide-white/[0.04]">
              {movsTabla.map(m => {
                const esIng = m.tipo === 'ingreso';
                const esEgr = m.tipo === 'egreso';
                const pr = m.proyecto_id ? state.proyectos.find(x=>x.id===m.proyecto_id) : undefined;
                return (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className={`px-5 py-3.5 text-xs ${t2}`}>{fmtDate(m.fecha)}</td>
                    <td className="px-5 py-3.5"><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${esIng?'bg-green-500/10 text-green-400':esEgr?'bg-red-500/10 text-red-400':'bg-gray-500/10 text-gray-400'}`}>{m.tipo}</span></td>
                    <td className={`px-5 py-3.5 text-xs font-medium ${t}`}>{m.concepto}</td>
                    <td className={`px-5 py-3.5 text-xs ${t2}`}>{pr?.nombre || m.proyecto_id || '—'}</td>
                    <td className={`px-5 py-3.5 text-xs font-bold text-right ${esIng?'text-green-400':esEgr?'text-red-400':'text-gray-400'}`}>{esIng?'+':esEgr?'-':''}{fmt(m.monto)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {m.fuente === 'supabase' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-green-500/10 text-green-400">Supabase</span>
                      ) : (
                        <button onClick={()=>openModal('movimiento', m)} className={`text-xs ${t3} hover:${t}`}>Editar</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody></table></div>
          </div>
        </>}

        {/* PAGOS */}
        {tab==='pagos' && <>
          <div className="flex justify-between items-center mb-6"><h2 className={`text-lg font-bold ${t}`}>Pagos Programados</h2><button onClick={()=>openModal('pago')} className="rr-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold">+ Nuevo</button></div>
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className={`text-xs ${t3}`}>Certeza:</span>
            {(['todos','confirmado','confiable','comprometido','supuesto','prospecto','historico'] as const).map(c => (
              <button key={c} onClick={()=>setFCerteza(c)} className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold capitalize transition-all ${fCerteza===c?'bg-red-500 text-white':`${dark?'bg-white/5':'bg-gray-100'} ${t2}`}`}>{c}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.pagos.filter(p=>p.estado!=='pagado' && (fCerteza==='todos' || p.certeza===fCerteza)).sort((a,b)=>a.fecha.localeCompare(b.fecha)).map(p=>{
              const v = p.fecha < hoyStr;
              return(
                <div key={p.id} className={`${card} border ${v?'border-red-500/30':bd} rounded-2xl p-5 card-hover cursor-pointer`} onClick={()=>openModal('pago',p)}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className={`text-sm font-medium ${t} leading-tight`}>{p.concepto}</h3>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${v?'bg-red-500/10 text-red-400':'bg-yellow-500/10 text-yellow-400'}`}>{v?'vencido':'pendiente'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${certezaColor(p.certeza)}`}>{p.certeza || 'sin certeza'}</span>
                    </div>
                  </div>
                  <p className={`text-xl font-bold ${p.tipo==='ingreso'?'text-green-400':'text-red-400'} mb-1`}>{p.tipo==='ingreso'?'+':'-'}{fmt(p.monto)}</p>
                  <p className={`text-xs ${t3} mb-4`}>{fmtDate(p.fecha)}</p>
                  <div className="flex gap-2">
                    <button onClick={e=>{e.stopPropagation();markPagado(p.id)}} className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 btn-press">Marcar Pagado</button>
                    <button onClick={e=>{e.stopPropagation();openModal('pago',p)}} className={`px-3 py-2 rounded-lg text-xs font-medium btn-press ${dark?'bg-white/5':'bg-gray-100'} ${t2}`}>Editar</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>}

        {/* CALENDARIO */}
        {tab==='calendario' && <>
          <div className="flex items-center justify-between mb-6">
            <div><h2 className={`text-lg font-bold ${t}`}>Calendario de Pagos</h2><p className={`text-xs ${t3}`}>Ago 2026 - Mar 2027 · Click en un día para agregar pago</p></div>
            <div className={`flex gap-1 p-1 rounded-xl ${dark?'bg-white/5':'bg-gray-100'}`}>
              <button onClick={()=>setVistaCal('grid')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${vistaCal==='grid'?'bg-red-500 text-white':t2}`}>Cuadrícula</button>
              <button onClick={()=>setVistaCal('lista')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${vistaCal==='lista'?'bg-red-500 text-white':t2}`}>Lista</button>
            </div>
          </div>

          {/* VISTA GRID */}
          {vistaCal==='grid' && <div className="space-y-8">
            {calendarMonths.map(cm => {
              const primerDia = new Date(cm.y,cm.m-1,1).getDay();
              const offset = primerDia === 0 ? 6 : primerDia - 1;
              return(
                <div key={`${cm.y}-${cm.m}`} className={`${card} border ${bd} rounded-2xl overflow-hidden`}>
                  <div className={`p-5 border-b ${bd}`}>
                    <h3 className={`text-base font-semibold capitalize ${t}`}>{cm.nombre} {cm.y}</h3>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d=>(
                        <div key={d} className={`text-center text-[10px] font-semibold ${t3} py-1`}>{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({length: offset}, (_,i)=>(
                        <div key={`e-${i}`} className="min-h-[70px]"></div>
                      ))}
                      {Array.from({length: cm.lastDay}, (_,i)=>i+1).map(dia => {
                        const pagosDia = getPagosDia(cm.y,cm.m,dia);
                        const total = pagosDia.reduce((s,p)=>s+(p.tipo==='ingreso'?p.monto:-p.monto),0);
                        const esHoy = hoyStr===fecha(cm.y,cm.m,dia);
                        const es15o30 = dia===15 || dia===cm.lastDay;
                        return(
                          <div key={dia} className={`min-h-[70px] rounded-lg border p-1.5 transition-all cursor-pointer hover:border-red-500/50 ${esHoy?'border-red-500 bg-red-500/5':pagosDia.length>0?dark?'border-white/10 bg-white/[0.02]':'border-gray-200 bg-gray-50':dark?'border-white/[0.04]':'border-gray-100'} ${es15o30?'ring-1 ring-red-500/20':''}`} onClick={()=>clickDia(cm.y,cm.m,dia)}>
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-xs font-semibold ${esHoy?'text-red-400':es15o30?'text-red-400':t}`}>{dia}</span>
                              {pagosDia.length > 0 && <span className={`text-[9px] font-bold ${total>=0?'text-green-400':'text-red-400'}`}>{total>=0?'+':''}{fmt(total)}</span>}
                            </div>
                            <div className="space-y-0.5">
                              {pagosDia.slice(0,3).map(p=>(
                                <div key={p.id} className={`text-[8px] truncate px-1 py-0.5 rounded ${p.tipo==='ingreso'?'bg-green-500/10 text-green-400':'bg-red-500/10 text-red-400'}`} title={`${p.concepto}: ${fmt(p.monto)}`} onClick={e=>{e.stopPropagation();openModal('pago',p)}}>
                                  {p.concepto.split(' - ')[0]}
                                </div>
                              ))}
                              {pagosDia.length > 3 && <div className={`text-[8px] ${t3} text-center`}>+{pagosDia.length-3} más</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>}

          {/* VISTA LISTA */}
          {vistaCal==='lista' && <div className="space-y-4">
            {calendarMonths.map(cm => {
              const pagosMes = state.pagos.filter(p=>{
                const [py,pm] = p.fecha.split('-').map(Number);
                return py===cm.y && pm===cm.m && p.estado!=='pagado';
              }).sort((a,b)=>a.fecha.localeCompare(b.fecha));
              const totalIng = pagosMes.filter(p=>p.tipo==='ingreso').reduce((s,p)=>s+p.monto,0);
              const totalEgr = pagosMes.filter(p=>p.tipo==='egreso').reduce((s,p)=>s+p.monto,0);
              if (pagosMes.length === 0) return null;
              return(
                <div key={`${cm.y}-${cm.m}`} className={`${card} border ${bd} rounded-2xl overflow-hidden`}>
                  <div className={`p-4 border-b ${bd} flex justify-between items-center`}>
                    <h3 className={`text-sm font-semibold capitalize ${t}`}>{cm.nombre} {cm.y}</h3>
                    <div className="flex gap-4 text-xs"><span className="text-green-400">+{fmt(totalIng)}</span><span className="text-red-400">-{fmt(totalEgr)}</span></div>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {pagosMes.map(p=>(
                      <div key={p.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={()=>openModal('pago',p)}>
                        <div className={`w-10 text-center flex-shrink-0`}>
                          <span className={`text-lg font-bold ${t}`}>{parseInt(p.fecha.split('-')[2])}</span>
                          <br/><span className={`text-[9px] ${t3}`}>{new Date(parseInt(p.fecha.split('-')[0]),parseInt(p.fecha.split('-')[1])-1,parseInt(p.fecha.split('-')[2])).toLocaleDateString('es-CO',{weekday:'short'})}</span>
                        </div>
                        <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] flex-shrink-0 ${p.tipo==='ingreso'?'bg-green-500/10 text-green-400':'bg-red-500/10 text-red-400'}`}>{p.tipo==='ingreso'?'↑':'↓'}</div>
                        <div className="flex-1 min-w-0"><p className={`text-xs font-medium ${t} truncate`}>{p.concepto}</p></div>
                        <span className={`text-xs font-bold flex-shrink-0 ${p.tipo==='ingreso'?'text-green-400':'text-red-400'}`}>{p.tipo==='ingreso'?'+':'-'}{fmt(p.monto)}</span>
                        <button onClick={e=>{e.stopPropagation();markPagado(p.id)}} className="px-2 py-1 rounded text-[9px] bg-green-500/10 text-green-400 btn-press flex-shrink-0">Pagado</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>}
        </>}

        {/* BRECHAS */}
        {tab==='brechas' && <>
          <h2 className={`text-lg font-bold ${t} mb-2`}>Proyección 6 Meses</h2>
          <p className={`text-xs ${t3} mb-6`}>Análisis de brechas de liquidez</p>
          <div className={`${card} border ${bd} rounded-2xl p-6 mb-6`}>
            <div className="flex items-center gap-6 mb-5">
              <div className={`text-5xl font-bold ${runway>=8?'text-green-400':runway>=4?'text-yellow-400':'text-red-400'}`}>{runway}</div>
              <div><p className={`text-base font-semibold ${t}`}>Meses de Runway</p><p className={`text-sm ${t3}`}>Disponible: {fmt(disp)} · Burn: {fmt(burn)}/mes</p></div>
            </div>
            <div className={`w-full h-5 rounded-full ${dark?'bg-white/5':'bg-gray-100'}`}><div className={`h-5 rounded-full transition-all duration-1000 ${runway>=8?'bg-green-500':runway>=4?'bg-yellow-500':'bg-red-500'}`} style={{width:`${Math.min(runway/12*100,100)}%`}}></div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {meses.map((m,i)=>(
              <div key={i} className={`${card} border ${m.brecha?'border-red-500/30':bd} rounded-2xl p-6 card-hover`}>
                <div className="flex justify-between items-start mb-4"><h3 className={`text-sm font-semibold capitalize ${t}`}>{m.mes}</h3>{m.brecha && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">BRECHA</span>}</div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs"><span className={t3}>Ingresos</span><span className="text-green-400 font-medium">+{fmt(m.ing)}</span></div>
                  <div className="flex justify-between text-xs"><span className={t3}>Egresos</span><span className="text-red-400 font-medium">-{fmt(m.egr)}</span></div>
                  <div className={`flex justify-between text-xs pt-3 border-t ${bd}`}><span className={`font-semibold ${t}`}>Neto</span><span className={`font-bold ${m.ing-m.egr>=0?'text-green-400':'text-red-400'}`}>{fmt(m.ing-m.egr)}</span></div>
                  <div className={`flex justify-between text-sm pt-3 border-t ${bd}`}><span className={`font-bold ${t}`}>Saldo</span><span className={`font-bold ${m.saldo>=0?'text-green-400':'text-red-400'}`}>{fmt(m.saldo)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </>}
      </main>

      {/* MODAL DETALLE DEL DÍA */}
      {diaDetalle && !modal && (() => {
        const pagosDelDia = getPagosDia(diaDetalle.y, diaDetalle.m, diaDetalle.d);
        const fechaStr = fecha(diaDetalle.y, diaDetalle.m, diaDetalle.d);
        const nombreDia = new Date(diaDetalle.y, diaDetalle.m-1, diaDetalle.d).toLocaleDateString('es-CO', {weekday:'long', day:'numeric', month:'long'});
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop" onClick={closeDiaDetalle}>
            <div className={`${card} border ${bd} rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto modal-content shadow-2xl`} onClick={e=>e.stopPropagation()}>
              <div className={`p-6 border-b ${bd} flex justify-between items-center`}>
                <div>
                  <h3 className={`text-base font-bold capitalize ${t}`}>{nombreDia}</h3>
                  <p className={`text-xs ${t3} mt-1`}>{pagosDelDia.length} pago{pagosDelDia.length!==1?'s':''} programado{pagosDelDia.length!==1?'s':''}</p>
                </div>
                <button onClick={closeDiaDetalle} className={`w-8 h-8 rounded-lg flex items-center justify-center ${dark?'bg-white/5 hover:bg-white/10':'bg-gray-100 hover:bg-gray-200'} ${t2} transition-colors`}>✕</button>
              </div>
              
              {pagosDelDia.length > 0 ? (
                <div className="divide-y divide-white/[0.04]">
                  {pagosDelDia.map(p => (
                    <div key={p.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer group" onClick={() => openModal('pago', p)}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${p.tipo==='ingreso'?'bg-green-500/10 text-green-400':'bg-red-500/10 text-red-400'}`}>
                        <span className="text-lg">{p.tipo==='ingreso'?'↑':'↓'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${t} truncate`}>{p.concepto}</p>
                        <p className={`text-xs ${t3}`}>
                          {p.proyecto_id ? state.proyectos.find(pr=>pr.id===p.proyecto_id)?.nombre || p.proyecto_id : 'Sin proyecto'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${p.tipo==='ingreso'?'text-green-400':'text-red-400'}`}>{p.tipo==='ingreso'?'+':'-'}{fmt(p.monto)}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.estado==='pagado'?'bg-green-500/10 text-green-400':p.fecha<hoyStr?'bg-red-500/10 text-red-400':'bg-yellow-500/10 text-yellow-400'}`}>{p.estado==='pagado'?'pagado':p.fecha<hoyStr?'vencido':p.estado}</span>
                          {p.estado!=='pagado' && <button onClick={e=>{e.stopPropagation();markPagado(p.id)}} className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors btn-press">✓</button>}
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${dark?'bg-white/5':'bg-gray-100'}`}>
                        <span className={`text-xs ${t3}`}>✏️</span>
                      </div>
                      <button onClick={e=>{e.stopPropagation();delPago(p.id)}} className={`w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/10 text-red-400 hover:bg-red-500/20`}>
                        <span className="text-xs">🗑</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-12 text-center">
                  <div className={`w-16 h-16 rounded-2xl ${dark?'bg-white/5':'bg-gray-100'} flex items-center justify-center mx-auto mb-4`}>
                    <span className="text-2xl">📅</span>
                  </div>
                  <p className={`text-sm ${t2} mb-1`}>Sin pagos este día</p>
                  <p className={`text-xs ${t3}`}>Crea un nuevo pago para esta fecha</p>
                </div>
              )}

              <div className={`p-6 border-t ${bd}`}>
                <button onClick={addPagoDesdeDia} className="rr-btn-primary w-full px-4 py-3 rounded-xl text-sm font-bold">
                  + Agregar Pago
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL EDITAR/CREAR */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className={`${card} border ${bd} rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto modal-content shadow-2xl`}>
            <div className={`p-6 border-b ${bd} flex justify-between items-center`}>
              <h3 className={`text-sm font-bold ${t}`}>{editId?'Editar':'Nuevo'} {modal==='proyecto'?'Proyecto':modal==='movimiento'?'Movimiento':'Pago'}{diaSeleccionado && !editId ? ` - ${fmtDate(diaSeleccionado)}`:''}</h3>
              <button onClick={closeModal} className={`w-8 h-8 rounded-lg flex items-center justify-center ${dark?'bg-white/5 hover:bg-white/10':'bg-gray-100 hover:bg-gray-200'} ${t2}`}>✕</button>
            </div>
            <div className="p-6 space-y-5">
              {modal==='proyecto' && <>
                <Input l="Nombre" v={fProyecto.nombre||''} on={v=>setFP({...fProyecto,nombre:v})}/>
                <Input l="Cliente" v={fProyecto.cliente||''} on={v=>setFP({...fProyecto,cliente:v})}/>
                <div className="grid grid-cols-2 gap-4">
                  <Select l="Estado" v={fProyecto.estado||'activo'} on={v=>setFP({...fProyecto,estado:v as EstadoProyecto})} opts={[{v:'planificacion',l:'Planificación'},{v:'activo',l:'Activo'},{v:'pausado',l:'Pausado'},{v:'completado',l:'Completado'}]}/>
                  <Input l="Valor Total" v={fProyecto.valor_total||''} on={v=>setFP({...fProyecto,valor_total:Number(v)})} tp="number"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input l="Fecha Inicio" v={fProyecto.fecha_inicio||''} on={v=>setFP({...fProyecto,fecha_inicio:v})} tp="date"/>
                  <Input l="Fecha Fin" v={fProyecto.fecha_fin||''} on={v=>setFP({...fProyecto,fecha_fin:v})} tp="date"/>
                </div>
                <Input l="Descripción" v={fProyecto.descripcion||''} on={v=>setFP({...fProyecto,descripcion:v})}/>
              </>}
              {modal==='movimiento' && <>
                <div className="grid grid-cols-2 gap-4">
                  <Select l="Tipo" v={fMov.tipo||'egreso'} on={v=>setFM({...fMov,tipo:v as TipoMovimiento})} opts={[{v:'ingreso',l:'Ingreso'},{v:'egreso',l:'Egreso'}]}/>
                  <Input l="Monto" v={fMov.monto||''} on={v=>setFM({...fMov,monto:Number(v)})} tp="number"/>
                </div>
                <Input l="Concepto" v={fMov.concepto||''} on={v=>setFM({...fMov,concepto:v})}/>
                <Input l="Fecha" v={fMov.fecha||''} on={v=>setFM({...fMov,fecha:v})} tp="date"/>
              </>}
              {modal==='pago' && <>
                <Input l="Concepto" v={fPago.concepto||''} on={v=>setFPago({...fPago,concepto:v})}/>
                <div className="grid grid-cols-2 gap-4">
                  <Select l="Tipo" v={fPago.tipo||'egreso'} on={v=>setFPago({...fPago,tipo:v as 'ingreso'|'egreso'})} opts={[{v:'ingreso',l:'Ingreso'},{v:'egreso',l:'Egreso'}]}/>
                  <Input l="Monto" v={fPago.monto||''} on={v=>setFPago({...fPago,monto:Number(v)})} tp="number"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input l="Fecha" v={fPago.fecha||''} on={v=>setFPago({...fPago,fecha:v})} tp="date"/>
                  <Select l="Estado" v={fPago.estado||'pendiente'} on={v=>setFPago({...fPago,estado:v as EstadoPago})} opts={[{v:'pendiente',l:'Pendiente'},{v:'programado',l:'Programado'},{v:'pagado',l:'Pagado'}]}/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select l="Certeza" v={fPago.certeza||''} on={v=>setFPago({...fPago,certeza:v as CertezaMovimiento})} opts={[{v:'',l:'Sin definir'},{v:'confirmado',l:'Confirmado'},{v:'confiable',l:'Confiable'},{v:'comprometido',l:'Comprometido'},{v:'supuesto',l:'Supuesto'},{v:'prospecto',l:'Prospecto'},{v:'historico',l:'Histórico'}]}/>
                  <Select l="Proyecto" v={fPago.proyecto_id||''} on={v=>setFPago({...fPago,proyecto_id:v})} opts={[{v:'',l:'Sin proyecto'},...state.proyectos.map(p=>({v:p.id,l:p.nombre}))]}/>
                </div>
              </>}
              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium btn-press ${dark?'bg-white/5':'bg-gray-100'} ${t2}`}>Cancelar</button>
                <button onClick={saveItem} className="rr-btn-primary flex-1 px-4 py-3 rounded-xl text-sm font-bold">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
