# Stack Técnico

> **Última actualización:** 2026-04-27
> **Fuentes:** package.json, next.config.ts, exploración de codebase

## Frontend / Framework

| Tecnología | Versión | Rol |
|---|---|---|
| **Next.js** | 15 | Framework principal, App Router, SSR/SSG |
| **React** | 19 | UI library |
| **TypeScript** | strict | Tipado estático en todo el proyecto |
| **Tailwind CSS** | 4 | Styling utility-first |
| **shadcn/ui** | latest | Componentes UI base (dialogs, forms, etc.) |
| **Base UI** | latest | Componentes accesibles adicionales |

## Backend / Datos

| Tecnología | Versión | Rol |
|---|---|---|
| **Supabase** | latest | PostgreSQL + Auth + Realtime + Storage |
| **PostgreSQL** | 17 | Base de datos principal |
| **Supabase SSR** | latest | Manejo de sesiones server/client |

## Estado y Formularios

| Tecnología | Rol |
|---|---|
| **Zustand** | Estado del carrito (client-side + localStorage) |
| **React Hook Form** | Manejo de formularios |
| **Zod** | Validación de schemas |

## AI / Chatbot

| Tecnología | Rol |
|---|---|
| **LangChain Core** | Orquestación de tools, agente conversacional |
| **LangChain OpenAI** | Integración con modelos OpenAI |
| **OpenAI API** | LLM para el chatbot (modelo configurable) |

## Pagos

| Tecnología | Rol |
|---|---|
| **Mercado Pago SDK** | Procesamiento de pagos LATAM |
| **Webhooks** | Actualización de estado de pago post-checkout |

## Infraestructura / DevOps

| Tecnología | Rol |
|---|---|
| **pnpm** | Package manager |
| **Upstash Redis** | Rate limiting (opcional) |
| **Vitest** | Testing framework |
| **React Testing Library** | Tests de componentes |
| **ESLint + Prettier** | Linting y formateo |

## Librerías utilitarias clave

| Librería | Uso |
|---|---|
| **date-fns + date-fns-tz** | Manejo de fechas con timezone (Argentina = America/Argentina/Buenos_Aires) |
| **Sonner** | Toast notifications |
| **React Markdown** | Renderizado de markdown en chat |
| **Zod** | Validación en formularios y server actions |

## Estructura del proyecto

```
src/
├── app/                    # Rutas Next.js App Router
│   ├── (platform)/        # Admin de plataforma (root)
│   ├── [business_slug]/   # Rutas por tenant
│   │   ├── (public)/      # Portal del cliente
│   │   └── admin/         # Panel admin del negocio
│   ├── api/               # API routes (chatbot, MP webhook)
│   └── auth/              # Callbacks OAuth
├── lib/                    # Lógica de negocio y utilities
│   ├── supabase/          # Cliente Supabase (browser, server, service role)
│   ├── auth/              # Flujos de auth
│   ├── admin/             # Queries y actions del admin
│   ├── catalog/           # Gestión de catálogo
│   ├── customers/         # Órdenes y direcciones del cliente
│   ├── orders/            # Creación y estado de pedidos
│   ├── payments/          # Integración Mercado Pago
│   ├── chatbot/           # Agente LangChain + tools
│   ├── daily-menus/       # Menús del día
│   └── platform/          # Features de plataforma
├── components/             # Componentes React
│   ├── admin/             # UI del panel admin
│   ├── menu/              # UI del menú del cliente
│   ├── cart/              # UI del carrito
│   ├── checkout/          # UI del checkout
│   └── ui/                # Componentes base (shadcn)
├── stores/                 # Zustand stores
└── middleware.ts           # Routing + auth middleware
```

## Decisiones arquitectónicas notables

**Server Components por defecto:** Next.js App Router usa Server Components por defecto. Solo se agrega `"use client"` donde hace falta interactividad (carrito, formularios, realtime).

**Server Actions para mutaciones:** En lugar de API routes para CRUD, se usan Server Actions de Next.js (archivos `*-actions.ts`). Esto simplifica el código cliente y aprovecha el streaming de React.

**Supabase como BaaS completo:** Una sola herramienta cubre DB, auth, storage, y realtime. Reduce la cantidad de servicios externos.

**LangChain para el chatbot:** Abstrae la orquestación de tools del LLM. Si se quiere cambiar el modelo (OpenAI → Anthropic), el cambio es mínimo.

## Variables de entorno requeridas

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
ROOT_DOMAIN                          # ej: pedidos.com.ar
NEXT_PUBLIC_SITE_URL                 # ej: https://pedidos.com.ar
UPSTASH_REDIS_REST_URL               # opcional, para rate limiting
UPSTASH_REDIS_REST_TOKEN             # opcional
```

Cada negocio tiene sus propias credenciales de Mercado Pago almacenadas en la tabla `businesses` (no como env var).

## Ver también

- [Base de Datos](base-de-datos.md)
- [Autenticación](autenticacion.md)
- [Multi-Tenancy](multi-tenancy.md)
- [Chatbot AI](../features/chatbot.md)
