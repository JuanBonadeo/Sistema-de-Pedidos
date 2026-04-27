# Autenticación y Autorización

> **Última actualización:** 2026-04-27
> **Fuentes:** src/middleware.ts, src/lib/auth/, src/lib/admin/context.ts

## Proveedor

**Supabase Auth** — maneja sesiones, tokens JWT, OAuth providers, magic links, y OTP.

## Métodos de autenticación

| Método | Quién lo usa | Implementación |
|---|---|---|
| Email + Password | Admins y clientes | Supabase `signInWithPassword` |
| Google OAuth | Admins y clientes | Supabase OAuth (callback en `/auth/callback`) |
| Magic Link | Clientes | Supabase `signInWithOtp` (email) |
| OTP (invite) | Nuevos miembros del equipo | Token especial para invitaciones + creación de password |

## Tipos de usuarios

### 1. Platform Admin
- Accede a `/` y `/negocios/*`
- Tiene acceso a todos los negocios de la plataforma
- Identificado por flag interno (email específico o role en tabla `users`)

### 2. Business User (admin del negocio)
- Accede a `/[slug]/admin/*`
- Role puede ser: `owner`, `admin`, `staff`
- Registrado en tabla `business_users` con su `business_id` y `role`
- Acceso verificado por `ensureAdminAccess()` en `src/lib/admin/context.ts`

### 3. Customer (cliente del negocio)
- Accede a `/[slug]/(public)/*`
- Registrado en tabla `customers` por negocio
- Auth opcional (puede pedir como guest o loguearse para guardar historial)

## Middleware de routing (`src/middleware.ts`)

El middleware intercepta cada request y aplica reglas de acceso:

```
/                         → requiere auth de platform admin
/negocios/*               → requiere auth de platform admin
/[slug]/admin/*           → requiere auth de business user para ese slug
/[slug]/admin/login       → ruta pública (formulario de login del admin)
/[slug]/(public)/*        → público, sin requisito de auth
/auth/*                   → público (callbacks OAuth)
```

En producción, el middleware también maneja **subdominio rewriting**:
- `pizzanapoli.pedidos.com.ar` → reescribe internamente a `/pizzanapoli/*`

## Flujo de invitación de miembros del equipo

1. Admin crea invitación desde `/[slug]/admin/usuarios`
2. Sistema envía email con link de invitación (token OTP de Supabase)
3. Nuevo miembro hace click en el link → llega a `/[slug]/admin/bienvenida`
4. Crea su password en esa pantalla
5. Queda autenticado y con acceso al admin del negocio

## `ensureAdminAccess()` — función crítica

Ubicada en `src/lib/admin/context.ts`. Se llama al inicio de cada Server Action y route handler del admin:

```typescript
const { user, business } = await ensureAdminAccess(slug);
```

- Verifica que el usuario está autenticado
- Verifica que el usuario tiene un registro en `business_users` para ese `slug`
- Si no cumple alguna condición, redirige a `/[slug]/admin/login`
- Retorna `{ user, business }` para que el caller los use

## RLS (Row-Level Security) como segunda línea de defensa

Aunque el middleware protege las rutas, la base de datos tiene RLS habilitado en todas las tablas. Esto significa que incluso si alguien bypaseara el middleware:
- Un `business_user` del negocio A no puede ver datos del negocio B
- Un `customer` del negocio A no puede ver órdenes del negocio B
- Las políticas de RLS reflejan exactamente los mismos roles que el middleware

## Sesiones

- **Cliente Supabase SSR** maneja la persistencia de la sesión en cookies HTTP-only
- Las sesiones se renuevan automáticamente (refresh token)
- En Server Components: `createServerClient()` → lee cookies del request
- En Client Components: `createBrowserClient()` → usa el estado local
- En Server Actions: `createServerClient()` con helpers para leer/escribir cookies

## Seguridad adicional

- **CSRF protection:** Las Server Actions de Next.js tienen CSRF protection built-in
- **Webhook verification:** El endpoint de Mercado Pago verifica la firma HMAC del webhook
- **Rate limiting:** Upstash Redis puede limitar requests al chatbot API (opcional)

## Ver también

- [Multi-Tenancy](multi-tenancy.md)
- [Base de Datos](base-de-datos.md)
- [Negocio](../dominio/negocio.md)
