# Roadmap y Estado del Proyecto

> **Última actualización:** 2026-04-27
> **Fuentes:** exploración del codebase, análisis de gaps

## Estado actual: v0.1.0

El proyecto tiene una base sólida con el flujo core completo. Está en fase de desarrollo activo, con las funciones fundamentales implementadas pero varias áreas de crecimiento identificadas.

## Funcionalidades completas ✅

- Portal de pedidos (menú → carrito → checkout → confirmación)
- Panel admin con board de pedidos en tiempo real
- Chatbot AI con 7 tools (LangChain + OpenAI)
- Integración Mercado Pago con webhooks
- Multi-tenancy completo con RLS
- Auth: email/password + Google OAuth + magic links + OTP invitaciones
- Menús del día (combos con disponibilidad por día)
- Gestión de equipo con roles
- Historial de pedidos del cliente
- Reportes básicos
- Branding por negocio (logo, color, etc.)

## Gaps conocidos y mejoras pendientes

### Prioridad alta (core del producto)

**Integración WhatsApp**
- El framework del chatbot existe y funciona
- Falta conectar con un proveedor de WhatsApp (Twilio, Meta API, Wati, etc.)
- Es el canal principal prometido al mercado

**Notificaciones al cliente**
- El cliente no recibe notificaciones cuando cambia el estado de su pedido
- Opciones: email, SMS, WhatsApp
- Actualmente solo puede verlo en `/perfil` si lo abre manualmente

**Notificaciones al admin**
- Cuando llega un pedido nuevo, el admin solo lo ve si tiene el board abierto
- Falta: notificación push, sonido, email, o SMS al admin

### Prioridad media

**Cobertura de tests**
- Tests existentes cubren utilidades (cart, business-hours, currency)
- Faltan tests de integración para flujos críticos (crear orden, webhook MP)
- Faltan tests E2E del flujo completo del cliente

**Manejo de errores**
- Algunos API routes tienen manejo de errores básico
- Falta manejo robusto para errores de MP, Supabase, y el agente AI

**Imágenes en el chatbot**
- El agente no puede ver imágenes de productos
- Workaround actual: describir los productos en texto

### Prioridad baja / mejoras futuras

**App móvil nativa**
- Actualmente solo web (pero responsive)
- PWA podría ser un paso intermedio

**Múltiples gateways de pago**
- Solo Mercado Pago actualmente
- Stripe, PayPal para expansión fuera de LATAM

**Reembolsos desde el admin**
- No hay flujo de reembolso iniciado desde el panel
- Hay que ir a la cuenta de MP directamente

**Delivery zones**
- Actualmente parcialmente deprecated
- El cálculo de delivery fee podría mejorar con integración de mapas

**WhatsApp real para órdenes**
- El chatbot puede generar el link de checkout
- Falta: confirmación automática vía WA cuando se completa el pago

**Analytics avanzados**
- Reportes más detallados: productos más vendidos, ticket promedio, horas pico
- Exportación de datos (CSV, Excel)

**Multi-idioma**
- Actualmente solo español Argentina
- Para expansión a otros países LATAM

## Decisiones de arquitectura pendientes

**Canal de WhatsApp:** ¿Twilio, Meta API directa, o un proveedor como Wati/Zoko? Impacto en costos y complejidad de implementación.

**Notificaciones push:** ¿Web Push API, Firebase FCM, o un servicio como OneSignal? La elección afecta la experiencia en PWA vs web.

**Search del chatbot:** A medida que crece el catálogo, la búsqueda por texto simple puede ser insuficiente. ¿PostgreSQL full-text search o vector search?

## Ver también

- [Overview del Proyecto](overview.md)
- [Chatbot AI](features/chatbot.md)
- [Flujo de Pedidos](features/pedidos.md)
- [Stack Técnico](arquitectura/stack-tecnico.md)
