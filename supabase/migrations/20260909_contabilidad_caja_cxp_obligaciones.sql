-- Migración contable RR Finanzas — caja, CxP, obligaciones, bancos
-- Fecha: 2026-09-09
-- Idempotente (IF NOT EXISTS / IF EXISTS). No destructiva.
-- Complementa: cash_movements y financial_snapshots (ya existen en schema v2).
-- La fuente de verdad de los ARCHIVOS sigue en Drive; esto es el índice editable.
-- Aplicar vía: supabase db push, o pegando este archivo en el SQL Editor de Supabase.

-- ============================================================
-- 1) BANCOS / SALDOS POR CUENTA
-- ============================================================
create table if not exists bancos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,              -- bancolombia | nequi | efectivo | daviplata ...
  saldo numeric(14,2) not null default 0,
  moneda text not null default 'COP',
  conciliado boolean not null default false,
  fecha_corte date,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (nombre)
);

create index if not exists idx_bancos_nombre on bancos (nombre);

-- ============================================================
-- 2) CUENTAS POR PAGAR (CxP) — a quién le debemos
-- ============================================================
create table if not exists cuentas_por_pagar (
  id uuid primary key default gen_random_uuid(),
  proveedor text not null,
  concepto text,
  monto numeric(14,2) not null default 0,
  fecha_emision date,
  fecha_vencimiento date,
  fecha_pagada date,
  medio text,                        -- transferencia | efectivo | nequi ...
  estado text not null default 'pendiente'
    check (estado in ('pendiente','vencida','pagada','anulada')),
  proyecto text,
  categoria text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cxp_proveedor on cuentas_por_pagar (proveedor);
create index if not exists idx_cxp_estado on cuentas_por_pagar (estado);
create index if not exists idx_cxp_vencimiento on cuentas_por_pagar (fecha_vencimiento);

-- ============================================================
-- 3) OBLIGACIONES RECURRENTES (nómina, compromisos mensuales)
-- ============================================================
create table if not exists obligaciones (
  id uuid primary key default gen_random_uuid(),
  concepto text not null,            -- nómina | préstamo | producción | desarrollo ...
  monto numeric(14,2) not null default 0,
  frecuencia text not null default 'mensual'
    check (frecuencia in ('unica','mensual','quincenal','semanal')),
  dia_pago smallint,                 -- día del mes (1-31) para recurrentes
  responsable text,
  estado text not null default 'activo'
    check (estado in ('activo','pausado','pagado','cancelado')),
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_obligaciones_estado on obligaciones (estado);

-- ============================================================
-- 4) TRIGGER de updated_at compartido (si no existe ya)
-- ============================================================
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- aplicar trigger a las nuevas tablas (idempotente)
drop trigger if exists bancos_touch on bancos;
create trigger bancos_touch before update on bancos
  for each row execute function touch_updated_at();

drop trigger if exists cxp_touch on cuentas_por_pagar;
create trigger cxp_touch before update on cuentas_por_pagar
  for each row execute function touch_updated_at();

drop trigger if exists obligaciones_touch on obligaciones;
create trigger obligaciones_touch before update on obligaciones
  for each row execute function touch_updated_at();

-- ============================================================
-- 5) RLS: solo service role server-side escribe
-- ============================================================
alter table bancos enable row level security;
alter table cuentas_por_pagar enable row level security;
alter table obligaciones enable row level security;
