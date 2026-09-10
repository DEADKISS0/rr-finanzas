-- Generador masivo de cuentas de cobro RR Finanzas
-- Fecha: 2026-08-30
-- No ejecutar en produccion sin backup previo. Migracion no destructiva.

create extension if not exists pgcrypto;

create table if not exists personas_cobro (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  documento_identidad text,
  documento_hash text generated always as (
    case
      when documento_identidad is null or documento_identidad = '' then null
      else encode(digest(regexp_replace(documento_identidad, '\D', '', 'g'), 'sha256'), 'hex')
    end
  ) stored,
  correo text,
  telefono text,
  banco text,
  tipo_cuenta text,
  numero_cuenta text,
  requiere_validacion boolean not null default false,
  estado text not null default 'activo',
  fuente text,
  responsable text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (documento_hash)
);

create table if not exists cuentas_cobro (
  id uuid primary key default gen_random_uuid(),
  numero text not null,
  version integer not null default 1,
  estado text not null check (estado in ('borrador','revision','emitida','anulada','reemplazada')),
  persona_id uuid references personas_cobro(id),
  persona_nombre text not null,
  persona_documento text,
  persona_payload jsonb not null default '{}'::jsonb,
  proyecto text,
  concepto text not null,
  monto numeric(14,2) not null check (monto >= 0),
  periodo text not null,
  fecha date not null,
  responsable text not null,
  archivo_path text,
  reemplaza_cuenta_id uuid references cuentas_cobro(id),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (numero, version)
);

create table if not exists document_audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  target_table text not null,
  target_id uuid,
  actor text not null default 'admin',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists personas_cobro_touch on personas_cobro;
create trigger personas_cobro_touch
before update on personas_cobro
for each row execute function touch_updated_at();

drop trigger if exists cuentas_cobro_touch on cuentas_cobro;
create trigger cuentas_cobro_touch
before update on cuentas_cobro
for each row execute function touch_updated_at();

-- RLS se habilita para evitar exposicion accidental en clientes publicos.
alter table personas_cobro enable row level security;
alter table cuentas_cobro enable row level security;
alter table document_audit_log enable row level security;

-- Las rutas Next.js deben usar service role server-side. No se crean policies anon.

