# Sesión Dashboard Financiero — RR ALIADOS

> **Fecha:** 15/08/2026
> **Estado:** En desarrollo
> **Objetivo:** Dashboard interactivo desplegado en Vercel para visualizar datos financieros en tiempo real

---

## Contexto del Proyecto

Dashboard financiero web que sincroniza datos del archivo Excel maestro (`RR_Finanzas_Maestro_FULL 2026.xlsx`) y los visualiza de forma interactiva en una página web desplegada en Vercel.

### Arquitectura
Excel Maestro (.xlsx) → API Serverless (Vercel) → Dashboard (Next.js)

### Stack Tecnológico
- **Frontend:** Next.js + React + TypeScript + Tailwind CSS
- **Gráficos:** Chart.js (react-chartjs-2)
- **API:** Vercel Serverless Functions
- **Procesamiento Excel:** xlsx (SheetJS)
- **Hosting:** Vercel
- **Datos:** Subida manual de Excel → API procesa → JSON en memoria

## Estado Actual documentado al 15/08/2026

### Completado
1. Proyecto Next.js con TypeScript y Tailwind.
2. Parser de Excel para Dashboard, modelos de negocio, flujo de caja y hojas de servicios.
3. API routes para upload y lectura de datos.
4. Dashboard con KPIs, gráficos, proyectos, movimientos, pagos, calendario y filtros.

### Pendiente originalmente
- Persistencia (Vercel KV/PostgreSQL).
- Auto-sync con Google Drive.
- Más visualizaciones.
- Autenticación opcional.

## Estructura principal

```text
rr-finanzas/
├── src/
│   ├── app/
│   ├── components/Dashboard.tsx
│   └── lib/excel-parser.ts
├── public/
├── package.json
└── SESION_DASHBOARD.md
```

## Datos fuente
- Excel principal: `G:\Mi unidad\RR_Aliados\04_Finanzas\RR_Finanzas_Maestro_FULL 2026.xlsx`
- Dashboard HTML anterior: `G:\Mi unidad\RR_Aliados\04_Finanzas\RR_Finanzas_Dashboard.html`
- Script original: `G:\Mi unidad\DashWeb\scripts\excel_to_json.py`
- Contexto financiero: `G:\Mi unidad\RR_Aliados\04_Finanzas\_CONTEXTO.md`

### Métricas registradas al 15/08/2026
- Disponible: $3.600.000 (Bancolombia)
- Runway: 7.2 meses
- Burn mensual: $500.000
- Semáforo: CUIDADO
- Proyectos registrados entonces: Wunder, BOGA, RR ALIADOS, ZAPATOS, AMSTERDAM #1-3 y GLOBOS.

---

## ACTUALIZACIÓN 18/08/2026

Se actualizó `src/components/Dashboard.tsx` con el estado operativo comunicado el 18/08/2026.

### Cambios de modelo
- Se separa **cliente**, **prospecto** e **interno**.
- Se añade **fase** y **próximo hito** por proyecto.
- Se separan servicios en **alcance confirmado/base** y **oportunidad futura NO contratada**.
- Los valores de prospectos no se tratan como caja comprometida.
- Se agrega una pestaña **Servicios** con lectura explícita de confirmado vs oportunidad.

### Proyectos incorporados/actualizados
- BOGA: entrega 18/08 3:30 p. m.; credenciales, correcciones y dominio propio; saldo esperado máximo 20/08.
- Wundeer: onboarding terminado; prueba desde 15/08; primera grabación 22/08; alcance 360°.
- Zapatos: onboarding previsto 30/08.
- Sátiro Sushi: desarrollo; entrega 01/09; plataforma gastronómica + CRM + NFC; 30 cuotas de $400K.
- Candilejas: prototipo 22/08; multisede; referencia comercial $20M para más de 3 sedes.
- La Banca: prototipo 22/08; modelo gastronómico.
- Mar y Tierra: prototipo/pitch 01/09.
- Plazoleta Jardín: pitch 01/09; superadmin + administradores por restaurante + roles operativos.
- Charly Brawn Billar Club: prototipo 01/09; web + NFC físico.
- Amsterdam #1-3: prototipos listos; fechas Aruba por definir.
- Globos: **levantar requerimientos hoy en la misma reunión de BOGA con la dueña**; definir alcance, prototipo y fechas.
- Junisama: requerimientos por definir.

### Criterio financiero actualizado
- Saldo base conservado: $3.600.000 al corte 15/08.
- BOGA: se modela saldo final pendiente de $600K con fecha límite 20/08, sujeto a confirmación de pago real.
- Wundeer: durante la prueba no se agrega ingreso futuro como cobro seguro; se conservan costos operativos del modelo existente para planificación.
- Sátiro: se proyectan 30 cuotas de $400K; confirmar fecha contractual de primera cuota.
- Prospectos (Candilejas, La Banca, Mar y Tierra, Plazoleta, Charly Brawn, Amsterdam, Globos, Junisama): **no generan ingreso comprometido hasta cierre**.

### Próximo paso técnico
Validar build, desplegar el proyecto `rr-finanzas` en Vercel y después conectar una fuente persistente para que las actualizaciones no dependan del estado local del navegador.

---

## Sesión 30/08/2026 — actualización multiagente

> Estado operativo del corte 29/08/2026 ya incorporado (caja 1.630.000, pagos 990.000 al 31/08, caja tras 640.000). Esta sesión conecta el dashboard con Supabase de forma más profunda.

### Cambios de esta sesión

1. **Nuevas rutas API (gap principal de la auditoría):**
   - `src/app/api/db/cash-movements/route.ts` — `GET /api/db/cash-movements`: expone la tabla `cash_movements` (select `*`, `order by fecha desc`, `limit 100`). Mismo patrón de respuesta que `/api/db/projects`: `{ ok, cashMovements|error, source }`.
   - `src/app/api/db/project-services/route.ts` — `GET /api/db/project-services`: expone `project_services` con join implícito a `projects` para traer `nombre` del proyecto (`select *, projects(nombre)`, `order by created_at desc`, `limit 200`).
   - Tipos nuevos en `src/lib/db/types.ts`: `CashMovementRecord` y `ProjectServiceRecord`.

2. **Overlay de flujo de caja real desde Supabase (`Dashboard.tsx`):**
   - Fetch de `/api/db/cash-movements` junto al fetch del snapshot financiero.
   - Si hay movimientos frescos (`fecha`/`synced_at` ≥ corte 29/08), la pestaña **Movimientos** muestra el overlay Supabase (columnas Fecha, Tipo, Concepto, Proyecto, Monto, Fuente) con badge de fuente; si no hay datos, sigue el ledger local intacto.
   - Nueva tarjeta **"Flujo de caja (Supabase)"** en el tab Resumen: últimos 10 movimientos con fecha, concepto, monto y proyecto, solo cuando hay datos Supabase.

3. **Más información en el tab Resumen:**
   - Tarjeta **"Pagos del 31 de agosto 2026"** mejorada: desglose Candilejas personal (690.000) + nómina quincena (300.000) = 990.000, proyección de la semana urgente 31/08–05/09 (comprometidos + supuestos edición/transporte 750.000–1.305.000) y caja tras pagar (640.000).
   - Nueva sección **"Cobros pendientes por recibir"**: BOGA, Sátiro y Wuundeer en monto 0, etiquetados explícitamente "no recibidos al corte" (certeza histórico).

4. **Datos del snapshot en el header:** cuando hay snapshot Supabase fresco se muestra el badge Supabase + fecha de sync y `source_hash` (primeros 8 caracteres).

5. **Certeza en pagos:** filtro por nivel de certeza (todos/confirmado/confiable/comprometido/supuesto/prospecto/histórico), badge de certeza en cada tarjeta y selector de certeza en el modal de edición/creación de pagos.

### Estado actual (SSOT operativo)
- Corte: **30/08/2026 (HOY)** → ventana urgente 31/08–05/09. Corte 29/08 pasa a histórico.
- Caja disponible: **1.630.000** COP (Bancolombia) — sin cambios respecto al 29/08 (confirmado 30/08).
- Burn mensual: 500.000 → runway 3.3 meses.
- Pagos comprometidos al 31/08: **990.000** — **NO ejecutados aún** (confirmado 30/08: quedan PENDIENTES). Candilejas personal 690.000 + quincena Manuel 200.000 / Samuel 100.000.
- Caja tras pagar todo lo comprometido: **640.000**.
- Supuestos NO comprometidos: edición Candilejas 750.000–1.125.000 y transporte 0–180.000.
- Cobros pendientes **no recibidos** al corte (confirmado 30/08): BOGA, Sátiro Sushi, Wuundeer (monto $0, certeza histórico).
- Fuente de verdad operativa: `Dashboard.tsx` (ledger local-first) + seed `RR/ChatBot/bot_telegram/db/seed/finance_corte_2026-08-30.json` (vigente; 29/08 y 31/08 como histórico/proyección).

### Pendientes
- **Auth** en las rutas `/api/db/*` (hoy exponen datos con service key si hay env configurado).
- **Auto-sync con Google Drive** (hoy el único camino de escritura es el upload manual de Excel → `/api/db/excel`).
- Verificar en la consola de Vercel que `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` están definidos para que `cash_movements`/`project_services`/`financial` devuelvan datos reales.
- Validar esquema real de `cash_movements` y `project_services` (columnas `created_at`, `fecha`, `tipo`) contra el ordenamiento usado en las rutas.

---

*Actualización añadida: 30/08/2026.*

---

## Sesión 30/08/2026 — cuentas de cobro masivas

Se agregó el módulo administrativo `/cuentas-cobro` para preparar cuentas de cobro en lote dentro de RR Finanzas.

### Funcionalidad
- Selección de persona existente o creación de una persona nueva.
- Captura de nombre, documento, correo, teléfono, banco, tipo/número de cuenta, concepto, monto, periodo, fecha, responsable y proyecto opcional.
- Plantillas reutilizables para producción Candilejas y roles de sesión.
- Previsualización con branding RR.
- Descarga de PDF con número y versión.
- Registro en Supabase si `SUPABASE_URL` y `SUPABASE_SERVICE_KEY` están configuradas; modo local si faltan credenciales.

### Seguridad
- Si `RR_ADMIN_TOKEN` existe, las APIs exigen header `x-rr-admin-token`.
- Los PDFs se entregan con `cache-control: no-store` y no se publican por URL.
- La migración habilita RLS y no crea policies públicas.
- Samuel García y Estefanía quedan marcados como candidatos que requieren validación; no fusionar identidad solo por nombre.

### Base de datos
- Migración no destructiva: `supabase/migrations/20260830_cuentas_cobro.sql`.
- Tablas: `personas_cobro`, `cuentas_cobro`, `document_audit_log`.
- Cada cuenta conserva número, versión, estado, persona, proyecto, monto, fecha, responsable y ruta privada sugerida.

### Pendiente antes de producción
- Backup Supabase antes de aplicar la migración.
- Probar migración en staging.
- Definir `RR_ADMIN_TOKEN` en Vercel.
- Conectar almacenamiento privado para guardar PDFs emitidos versionados.
