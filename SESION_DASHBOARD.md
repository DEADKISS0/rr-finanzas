# Sesión Dashboard Financiero — RR ALIADOS

> **Fecha:** 15/08/2026
> **Estado:** En desarrollo
> **Objetivo:** Dashboard interactivo desplegado en Vercel para visualizar datos financieros en tiempo real

---

## Contexto del Proyecto

### ¿Qué es este proyecto?
Dashboard financiero web que sincroniza datos del archivo Excel maestro (`RR_Finanzas_Maestro_FULL 2026.xlsx`) y los visualiza de forma interactiva en una página web desplegada en Vercel.

### Arquitectura
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Excel Maestro  │────▶│  API Serverless  │────▶│   Dashboard     │
│  (.xlsx)        │     │  (Vercel)        │     │   (Next.js)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Stack Tecnológico
- **Frontend:** Next.js 14 + React + TypeScript + Tailwind CSS
- **Gráficos:** Chart.js (react-chartjs-2)
- **API:** Vercel Serverless Functions
- **Procesamiento Excel:** librería xlsx (SheetJS)
- **Hosting:** Vercel
- **Datos:** Subida manual de Excel → API procesa → JSON en memoria

---

## Estado Actual (15/08/2026)

### ✅ Completado
1. Creación del proyecto Next.js con TypeScript y Tailwind
2. Parser de Excel (`src/lib/excel-parser.ts`) que extrae:
   - Dashboard (disponible, runway, semáforo, burn)
   - Modelos de negocio (6 modelos)
   - Flujo de caja por proyecto
   - Hojas de servicios (10 hojas)
3. API routes:
   - `POST /api/upload` — Recibe archivo Excel y lo procesa
   - `GET /api/data` — Retorna datos procesados
4. Componente Dashboard con:
   - 4 KPI cards (disponible, runway, semáforo, proyectos)
   - Gráfico sparkline de saldo acumulado
   - Gráfico dona de distribución por proyecto
   - Gráfico barras ingresos vs egresos
   - Tabla de modelos de negocio
   - Tabla de últimos movimientos
   - Filtros por proyecto
   - Tema claro/oscuro

### 🔄 En Progreso
- Despliegue a Vercel
- Pruebas end-to-end

### 📋 Pendiente
- Conectar Vercel KV para persistencia de datos
- Configurar webhook para auto-sync con Google Drive
- Agregar más visualizaciones
- Configurar autenticación (opcional)

---

## Estructura del Proyecto

```
rr-finanzas/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── upload/route.ts    # API para subir Excel
│   │   │   └── data/route.ts      # API para obtener datos
│   │   ├── layout.tsx
│   │   └── page.tsx               # Página principal
│   ├── components/
│   │   └── Dashboard.tsx          # Componente principal del dashboard
│   └── lib/
│       └── excel-parser.ts        # Parser de Excel a JSON
├── public/
├── package.json
└── SESION_DASHBOARD.md            # Este archivo
```

---

## Cómo Retomar la Sesión

### 1. Verificar estado del proyecto
```bash
cd "G:\Mi unidad\DashWeb\rr-finanzas"
npm run dev
```

### 2. Si necesitas instalar dependencias
```bash
npm install xlsx chart.js react-chartjs-2
```

### 3. Para desplegar a Vercel
```bash
npm i -g vercel
vercel login
vercel --prod
```

### 4. Para sincronizar datos del Excel local
```bash
python "G:\Mi unidad\DashWeb\scripts\excel_to_json.py"
```

---

## Datos Fuente

### Archivo Excel Principal
- **Ruta:** `G:\Mi unidad\RR_Aliados\04_Finanzas\RR_Finanzas_Maestro_FULL 2026.xlsx`
- **Hojas extraídas:** 28 (Dashboard, Caja, Modelos, Combos, Flujo_Caja, etc.)

### Métricas Clave (15/08/2026)
- **Disponible:** $3.600.000 (Bancolombia)
- **Runway:** 7.2 meses
- **Burn mensual:** $500.000
- **Semáforo:** 🟡 CUIDADO
- **Proyectos activos:** 8 (Wunder, BOGA, RR ALIADOS, ZAPATOS, AMSTERDAM #1-3, GLOBOS)

---

## Decisiones Técnicas

### ¿Por qué Next.js?
- Serverless functions nativas en Vercel
- SSR/SSG para performance
- Ecosistema maduro y documentación

### ¿Por qué Chart.js?
- Ligero (~60KB)
- Buen rendimiento con muchos datos
- Fácil de customizar

### ¿Por qué no base de datos externa?
- Para MVP, los datos se procesan en cada upload
- En futuro: Vercel KV o PostgreSQL para persistencia

---

## Próximos Pasos

1. **Corto plazo (esta semana)**
   - Desplegar a Vercel
   - Probar upload del Excel real
   - Verificar todos los gráficos

2. **Medio plazo (próxima semana)**
   - Conectar Vercel KV para persistencia
   - Agregar auto-sync con Google Drive API
   - Mejorar diseño responsive

3. **Largo plazo**
   - Autenticación de usuarios
   - Múltiples archivos Excel
   - Exportar reportes PDF
   - Alertas automáticas (runway < 4 meses)

---

## Notas de la Sesión

### Problemas Encontrados
1. El archivo Excel tiene fórmulas con errores (#REF!) en algunas celdas
   - Solución: El parser maneja errores y retorna null
2. npm install tarda mucho en Windows
   - Solución: Usar timeout más largos

### Aprendizajes
- El Excel tiene 28 hojas con datos estructurados
- El flujo de caja está organizado por proyecto y fecha
- Los modelos de negocio están definidos pero sin ingresos aún

---

## Contactos y Recursos

- **Excel maestro:** `G:\Mi unidad\RR_Aliados\04_Finanzas\RR_Finanzas_Maestro_FULL 2026.xlsx`
- **Dashboard actual (HTML estático):** `G:\Mi unidad\RR_Aliados\04_Finanzas\RR_Finanzas_Dashboard.html`
- **Script Python original:** `G:\Mi unidad\DashWeb\scripts\excel_to_json.py`
- **Documentación financiera:** `G:\Mi unidad\RR_Aliados\04_Finanzas\_CONTEXTO.md`

---

*Última actualización: 15/08/2026 14:30*