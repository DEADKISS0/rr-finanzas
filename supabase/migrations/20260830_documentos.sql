-- Índice de documentos RR Finanzas
-- Fecha: 2026-08-30
-- No destructiva. La verdad de los archivos vive en el Drive (drive_path = ruta canónica).
-- Esta tabla es el índice/respaldo para trazabilidad y búsqueda rápida.

create table if not exists documentos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text not null default 'otro'
    check (tipo in ('contrato','cuenta_cobro','factura','propuesta','soporte','otro')),
  proyecto text,
  drive_path text,          -- ruta canónica en el Drive (SSOT)
  file_name text,           -- nombre original si se subió una copia local
  file_path text,           -- ruta de respaldo en storage/privat
  mime_type text,
  size_bytes bigint,
  version integer not null default 1,
  estado text not null default 'vigente'
    check (estado in ('borrador','vigente','reemplazado','anulado')),
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists documentos_touch on documentos;
create trigger documentos_touch
before update on documentos
for each row execute function touch_updated_at();

-- RLS: solo el service role server-side (rutas /api/documentos) accede.
alter table documentos enable row level security;

-- Índices útiles para el índice busable.
create index if not exists idx_documentos_tipo on documentos (tipo);
create index if not exists idx_documentos_proyecto on documentos (proyecto);
create index if not exists idx_documentos_created on documentos (created_at);
