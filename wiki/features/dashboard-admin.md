# Dashboard Admin

> **Última actualización:** 2026-04-27
> **Fuentes:** src/app/[business_slug]/admin/, src/components/admin/, src/lib/admin/

## Estructura del panel admin

Ruta base: `/[slug]/admin/`

La navegación del admin está en `src/components/admin/admin-sidebar.tsx`.

### Secciones principales

| Ruta | Sección | Función |
|---|---|---|
| `/admin` | Dashboard | Métricas del día, acceso rápido |
| `/admin/pedidos` | Pedidos | Board realtime de pedidos |
| `/admin/catalogo` | Catálogo | Productos, categorías, modificadores |
| `/admin/menu-del-dia` | Menú del Día | Combos diarios |
| `/admin/chatbot` | Chatbot | Config y tester del agente AI |
| `/admin/usuarios` | Usuarios | Gestión del equipo |
| `/admin/configuracion` | Configuración | Settings del negocio |
| `/admin/reportes` | Reportes | Análisis y estadísticas |

## Dashboard principal

`/[slug]/admin` muestra métricas del negocio:
- Órdenes del día (total, por estado)
- Ingresos del día
- Acceso rápido al board de pedidos

Queries en `src/lib/admin/dashboard-query.ts`.

## Board de Pedidos en Tiempo Real

`/[slug]/admin/pedidos` — la herramienta más usada día a día.

**Características:**
- Columnas por estado: Pendiente | Confirmado | Preparando | Listo | En Camino
- **Actualizaciones en tiempo real** vía Supabase Realtime (WebSocket)
- Cada tarjeta muestra: número de orden, cliente, items, total, tiempo transcurrido
- Acciones rápidas por tarjeta: avanzar al siguiente estado, cancelar
- Filtros: fecha, estado
- Búsqueda por número de orden o cliente

Componente clave: `src/components/admin/orders-realtime-board.tsx`

Las queries de pedidos están en `src/lib/admin/orders-query.ts`.

## Gestión de Usuarios del Equipo

`/[slug]/admin/usuarios`

- Ver lista de miembros del equipo con sus roles
- **Invitar** nuevos miembros por email
  - Se envía email con link de invitación
  - El nuevo miembro crea su password al aceptar
- Cambiar rol de un miembro (owner, admin, staff)
- Eliminar miembro del equipo

Queries en `src/lib/admin/members-query.ts`.

## Configuración del Negocio

`/[slug]/admin/configuracion`

Secciones:
- **Info básica:** nombre, dirección, teléfono, email
- **Branding:** logo, imagen de portada, color primario
- **Horarios:** apertura y cierre por día de la semana
- **Delivery:** zonas, costos, mínimos
- **Pagos:** credenciales de Mercado Pago (mp_access_token, mp_webhook_secret)
- **Regional:** moneda, zona horaria

Componentes en `src/components/admin/settings/`.

## Chatbot Admin

`/[slug]/admin/chatbot`

- **Editor de prompt:** textarea para editar el system prompt del agente
- **Toggle de tools:** habilitar/deshabilitar tools individuales
- **Override de descripciones:** personalizar cómo se describe cada tool al LLM
- **Tester:** interfaz de chat para probar el bot sin WhatsApp

Componentes: `chatbot-tester.tsx`, `chatbot-prompt-editor.tsx`.

## Reportes

`/[slug]/admin/reportes`

- Gráficos de ventas por período
- Productos más vendidos
- Ingresos históricos
- Métricas de órdenes (canceladas, entregadas, etc.)

## Onboarding

`/[slug]/admin/bienvenida`

Pantalla de bienvenida para nuevos miembros invitados. Guía los primeros pasos del admin.

## Autenticación del admin

- Ruta de login en `/[slug]/admin/login`
- Protegido por middleware + `ensureAdminAccess()`
- Ver [Autenticación](../arquitectura/autenticacion.md) para detalles

## Ver también

- [Flujo de Pedidos](pedidos.md)
- [Catálogo](catalogo.md)
- [Chatbot AI](chatbot.md)
- [Autenticación](../arquitectura/autenticacion.md)
- [Negocio (dominio)](../dominio/negocio.md)
