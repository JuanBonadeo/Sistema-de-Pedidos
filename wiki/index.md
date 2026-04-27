# Wiki Index — Sistema de Pedidos

Índice de todas las páginas del wiki. Actualizar cada vez que se crea o modifica una página.

---

## Overview y Estrategia

| Página | Descripción |
|---|---|
| [overview.md](overview.md) | Resumen ejecutivo del proyecto: qué es, para quién, flujos principales, estado actual |
| [roadmap.md](roadmap.md) | Estado actual, gaps conocidos, mejoras pendientes, decisiones de arquitectura pendientes |

---

## Arquitectura

| Página | Descripción |
|---|---|
| [arquitectura/stack-tecnico.md](arquitectura/stack-tecnico.md) | Stack completo (Next.js 15, Supabase, LangChain, MP), estructura de directorios, decisiones arquitectónicas |
| [arquitectura/base-de-datos.md](arquitectura/base-de-datos.md) | Esquema completo de PostgreSQL: todas las tablas, campos, relaciones, RLS, triggers |
| [arquitectura/autenticacion.md](arquitectura/autenticacion.md) | Métodos de auth, tipos de usuarios, middleware, `ensureAdminAccess()`, RLS como segunda línea |
| [arquitectura/multi-tenancy.md](arquitectura/multi-tenancy.md) | Modelo de aislamiento por tenant: routing por slug, middleware, RLS, credenciales por negocio |

---

## Features

| Página | Descripción |
|---|---|
| [features/chatbot.md](features/chatbot.md) | Agente AI LangChain+OpenAI: tools disponibles, system prompt, config por negocio, tester admin |
| [features/pedidos.md](features/pedidos.md) | Flujo completo de pedidos: cliente web, creación de orden, estados, board realtime, historial |
| [features/catalogo.md](features/catalogo.md) | Productos, categorías, modificadores, gestión admin, display en menú, snapshots |
| [features/pagos.md](features/pagos.md) | Integración Mercado Pago: flujo, webhook, seguridad HMAC, estados de pago, credenciales por negocio |
| [features/menus-del-dia.md](features/menus-del-dia.md) | Combos diarios: diferencias con productos, disponibilidad por día, gestión admin |
| [features/dashboard-admin.md](features/dashboard-admin.md) | Panel admin completo: board de pedidos, catálogo, configuración, chatbot, usuarios, reportes |

---

## Dominio

| Página | Descripción |
|---|---|
| [dominio/negocio.md](dominio/negocio.md) | Entidad Business: campos, relaciones, horarios, credenciales MP, datos demo |
| [dominio/orden.md](dominio/orden.md) | Ciclo de vida completo de una orden: estados, payment_status, items, snapshots, guest orders |
| [dominio/cliente.md](dominio/cliente.md) | Entidad Customer: guest vs registrado, auth, direcciones, perfil, aislamiento por negocio |
| [dominio/producto.md](dominio/producto.md) | Producto y modificadores: campos, precio final, display en menú, carrito, snapshots |

---

## Fuentes (`raw/`)

_Ninguna fuente agregada aún. Ver [CLAUDE.md](../CLAUDE.md) para instrucciones de ingest._

---

## Cómo usar este índice

1. **Para una query:** leer este índice primero, identificar páginas relevantes, leerlas, sintetizar respuesta
2. **Al crear una página nueva:** agregar fila a la sección correspondiente
3. **Al modificar una página:** actualizar la descripción si cambió su scope
4. **Para un lint pass:** buscar páginas sin inbound links, conceptos mencionados sin página propia
