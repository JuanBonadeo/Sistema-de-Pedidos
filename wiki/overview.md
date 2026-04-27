# Sistema de Pedidos — Overview

> **Última actualización:** 2026-04-27
> **Fuentes:** codebase exploración inicial

## Qué es

**Sistema de Pedidos** es una plataforma SaaS multi-tenant que permite a negocios gastronómicos en Argentina/LATAM tener su propio portal de pedidos online. Cada negocio obtiene una URL propia (`/[slug]/menu`), un panel de administración, y un chatbot AI para tomar pedidos por WhatsApp.

## Para quién

- **Restaurantes y locales de comida** que quieren vender online sin depender de plataformas de delivery de terceros (PedidosYa, Rappi, etc.)
- **Administradores de plataforma** que gestionan todos los negocios desde un panel raíz

## Propuesta de valor

| Problema | Solución |
|---|---|
| Alto costo de comisiones en plataformas de delivery | Canal propio sin comisiones por pedido |
| Fricción para tomar pedidos por WhatsApp | Chatbot AI que automatiza el proceso |
| Gestión manual de pedidos | Board de pedidos en tiempo real |
| Pagos por fuera del sistema | Integración nativa con Mercado Pago |

## Flujo principal del cliente

```
1. Cliente entra al menú del negocio (/[slug]/menu)
2. Explora productos y combos del día
3. Agrega items al carrito (con modificadores: tamaño, extras, etc.)
4. Completa checkout (dirección de delivery o retiro en local)
5. Elige método de pago (efectivo / Mercado Pago)
6. Confirma pedido → recibe número de orden
7. Puede seguir el estado desde su perfil
```

## Flujo principal del admin

```
1. Admin entra a /[slug]/admin/pedidos
2. Ve el board de pedidos en tiempo real (actualización automática)
3. Cambia estados: pendiente → confirmado → preparando → listo → en camino → entregado
4. Gestiona catálogo, combos, configuración del negocio
5. Configura y prueba el chatbot AI
6. Ve reportes y métricas de ventas
```

## Arquitectura de alto nivel

```
┌─────────────────────────────────────────────────────┐
│                    Next.js 15                        │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ Portal del   │  │ Admin Panel  │  │ Platform  │  │
│  │ Cliente      │  │ /[slug]/admin│  │ Admin /   │  │
│  │ /[slug]/menu │  │              │  │           │  │
│  └──────────────┘  └──────────────┘  └───────────┘  │
│  ┌──────────────────────────────────────────────┐    │
│  │            API Routes                        │    │
│  │  /api/chatbot  /api/mp/webhook               │    │
│  └──────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    Supabase         LangChain        Mercado
   (PostgreSQL       + OpenAI          Pago
    + Auth +         Chatbot          Payments
    Realtime)        Agent
```

## Estado actual (v0.1.0)

**Funcional:**
- Portal de pedidos completo (menú → carrito → checkout → confirmación)
- Panel admin con board de pedidos en tiempo real
- Chatbot AI con 7+ tools (LangChain + OpenAI)
- Integración Mercado Pago con webhooks
- Multi-tenancy completo con RLS en PostgreSQL
- Auth: email/password + Google OAuth + magic links
- Menús del día (combos con disponibilidad por día de la semana)
- Gestión de equipo con roles (owner, admin, staff)

**Gaps conocidos:**
- Sin integración WhatsApp real (framework de chatbot existe, canal pendiente)
- Cobertura de tests limitada
- Sin app móvil nativa (solo web)

## Ver también

- [Stack Técnico](arquitectura/stack-tecnico.md)
- [Base de Datos](arquitectura/base-de-datos.md)
- [Multi-Tenancy](arquitectura/multi-tenancy.md)
- [Chatbot AI](features/chatbot.md)
- [Flujo de Pedidos](features/pedidos.md)
- [Roadmap](roadmap.md)
