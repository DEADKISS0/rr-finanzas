# RR Finanzas

Centro financiero vivo de RR ALIADOS: caja, runway, cuentas de cobro, documentos y operación contable.

Este es el sistema financiero oficial de RR ALIADOS S.A.S., construido con Next.js, Supabase y Tailwind CSS, siguiendo la identidad visual del Brutalismo Estratégico Colombiano.

## Estado Actual

- **Status**: `core` (fuente principal de finanzas)
- **Owner**: Finanzas RR
- **Última actualización**: 2026-09-17
- **Próximo paso**: Absorber lo útil de rr-finanzas-dashboard y chatbot/finanzas_app

## Visión

Ser el centro financiero único donde toda información de caja, runway, cuentas de cobro y operación contable ingresa o apunta desde aquí.

## Tecnologías

- **Framework**: Next.js 16 (App Router)
- **Base de datos**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS con tokens de marca RR
- **Despliegue**: Vercel
- **Autenticación**: NextAuth + Supabase
- **Reportes**: Componentes personalizados con colores RR

## Características

- 📊 Dashboard financiero en tiempo real
- 💰 Gestión de caja y runway
- 📑 Sistema de cuentas de cobro automatizado
- 📄 Gestión de documentos financieros
- 🔗 Integración con módulos internos de RR
- 🛡️ Seguridad de nivel empresarial (RLS en Supabase)

## Empezando

### Requisitos

- Node.js >= 20
- Cuenta de Supabase
- Git

### Instalación

```bash
git clone https://github.com/DEADKISS0/rr-finanzas.git
cd rr-finanzas
npm install
```

### Configuración de entorno

Crea un archivo `.env.local` en la raíz con:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Desarrollo

```bash
npm run dev
# Abre http://localhost:3000
```

### Producción

```bash
npm run build
npm start
```

## Estructura del Proyecto

```
/app - Rutas Next.js (App Router)
/components - Componentes reutilizables
/lib - Lógica de negocio y conexiones
/supabase - Migraciones y tipos
/public - Assets estáticos
```

## Colores de Marca RR

- **Negro**: `#070001` (fondo primario)
- **Fucsia**: `#BE076D` (acento principal)
- **Mostaza**: `#DED116` (acento secundario/alertas)
- **Orquídea**: `#973D8F` (terciario)
- **Blanco cálido**: `#FFFFF3` (texto sobre fondos oscuros)

## Licencia

Privado - Propiedad de RR ALIADOS S.A.S.

---
*Actualizado como parte de la reorganización interna de desarrollos RR (2026-09-17)*