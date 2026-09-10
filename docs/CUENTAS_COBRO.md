# Cuentas de cobro masivas - RR Finanzas

Actualizado: 2026-08-30

## Alcance

La ruta `/cuentas-cobro` permite crear cuentas de cobro en lote con datos reutilizables, previsualización y PDF descargable. Está pensada para uso administrativo interno.

## Datos capturados

- Persona: nombre, documento, correo, teléfono y datos bancarios.
- Cuenta: número, versión, estado, concepto, monto, periodo, fecha, responsable y proyecto opcional.
- Archivo: ruta privada sugerida `private/cuentas-cobro/{numero}-v{version}.pdf`.
- Auditoría: registro de alta/actualización en `document_audit_log`.

## Estados

- `borrador`: datos en preparación.
- `revision`: requiere validación interna.
- `emitida`: lista para enviar; no debe sobreescribirse.
- `anulada`: inválida por decisión administrativa.
- `reemplazada`: existe una versión posterior.

## Seguridad

- Los PDFs se entregan por una respuesta `no-store`, no por URL pública.
- Si `RR_ADMIN_TOKEN` existe, las APIs exigen header `x-rr-admin-token`.
- Supabase debe usarse server-side con `SUPABASE_SERVICE_KEY`; la clave no debe ir al cliente.
- RLS queda habilitado y sin policies públicas por defecto.

## Datos semilla no sensibles

Equipo de producción pendiente de completar datos: Paulina, Samuel García, Estefanía, Sebastián Vargas, Santiago Tansi Beats, Sofía Vega y Laura.

Samuel García y Estefanía tienen coincidencias candidatas con registros históricos. No fusionar identidades sin validar documento.

## Verificación local

1. Ejecutar `npm run lint`.
2. Ejecutar `npm run build -- --webpack` si Turbopack falla por restricciones locales.
3. Abrir `/cuentas-cobro`.
4. Crear o seleccionar persona.
5. Registrar borrador.
6. Descargar PDF y validar que el archivo use número + versión.

