# Negocio (Business)

> **Última actualización:** 2026-04-27
> **Fuentes:** supabase/migrations/, src/lib/tenant.ts

## Qué es

El `Business` es la entidad central del sistema. Cada negocio es un **tenant independiente** con su propio catálogo, pedidos, configuración, y equipo.

## Campos clave

```
id               Identificador único
slug             URL identifier (ej: "pizzanapoli") → /pizzanapoli/menu
name             Nombre público del negocio
address          Dirección física
phone            Teléfono de contacto
email            Email de contacto
timezone         Zona horaria (ej: America/Argentina/Buenos_Aires)
currency         Moneda (ej: ARS)
primary_color    Color principal del branding (#hex)
logo_url         URL del logo
cover_url        URL de imagen de portada
settings         JSON flexible para config extra
mp_access_token  Credencial Mercado Pago
mp_webhook_secret Secreto para verificar webhooks de MP
status           Estado del negocio (active, inactive...)
```

## Relaciones

```
Business
├── business_users[]    → equipo (owner, admin, staff)
├── categories[]        → categorías del catálogo
│   └── products[]     → productos
├── daily_menus[]       → menús del día
├── business_hours[]    → horarios de atención
├── delivery_zones[]    → zonas de delivery
├── orders[]            → todos los pedidos
├── customers[]         → clientes registrados
├── chatbot_configs{}   → configuración del chatbot
└── chatbot_conversations[] → conversaciones del chatbot
```

## Identificación: slug vs id

- El **id** (UUID) es el identificador interno en la base de datos
- El **slug** es el identificador público en las URLs y en el código de rutas

El slug es `UNIQUE` en la tabla `businesses`. Si un negocio cambia su nombre, puede cambiar el slug (pero los links viejos dejarían de funcionar).

## Resolución del tenant

```typescript
// src/lib/tenant.ts
const business = await getTenant(slug);
```

Se llama en layouts del App Router para cargar los datos del negocio en context.

## Horarios de atención

Los horarios están en `business_hours` (una fila por día de la semana). La función `src/lib/business-hours.ts` evalúa si el negocio está abierto en un momento dado, considerando la `timezone` del negocio.

Esto es crítico para:
- Mostrar "Abierto/Cerrado" en el menú del cliente
- El chatbot (tool `check_business_status`)
- Validar que se pueda crear una orden

## Configuración de Mercado Pago

Las credenciales de MP son **por negocio**. El admin las configura en `/[slug]/admin/configuracion`. Esto permite que cada negocio tenga su propia cuenta de MP y reciba los pagos directamente.

## Datos demo

El negocio `pizzanapoli` (Pizza Napoli) es el tenant de demo incluido en `local-data.sql`, con:
- Categorías y productos de ejemplo
- Horarios de atención configurados
- Sin credenciales de MP (usar sandbox para pruebas)

## Ver también

- [Multi-Tenancy](../arquitectura/multi-tenancy.md)
- [Dashboard Admin](../features/dashboard-admin.md)
- [Pagos Mercado Pago](../features/pagos.md)
- [Autenticación](../arquitectura/autenticacion.md)
