# Cliente (Customer)

> **Última actualización:** 2026-04-27
> **Fuentes:** src/lib/customers/, src/app/[business_slug]/(public)/

## Qué es

Un `Customer` es un usuario que realiza pedidos en un negocio. Los clientes son **por negocio** — el mismo email puede tener cuentas de cliente separadas en distintos negocios.

## Campos

```
id           UUID (= auth.users.id cuando está logueado)
business_id  A qué negocio pertenece este cliente
phone        Teléfono
full_name    Nombre completo
email        Email
created_at
```

## Guest vs Cliente registrado

### Guest (sin cuenta)
- No requiere auth
- Completa nombre, teléfono y email en cada checkout
- No puede ver historial de pedidos anteriores
- Pedidos vinculados con `customer_id = null`

### Cliente registrado
- Se autentica con email/password, Google OAuth, o magic link
- El `customer_id` del auth se linkea al `customers` del negocio
- Puede guardar direcciones de delivery
- Puede ver historial completo de pedidos
- No tiene que reingresar sus datos en cada checkout

## Autenticación del cliente

El cliente usa Supabase Auth pero de forma separada al admin. Las rutas de auth del cliente son:
- `/[slug]/login` — formulario de login/signup
- `/auth/callback` — callback de OAuth y magic links

Ver [Autenticación](../arquitectura/autenticacion.md) para detalles técnicos.

## Direcciones guardadas

Los clientes registrados pueden guardar múltiples direcciones:

```
customer_addresses
├── id
├── customer_id
├── label       (ej: "Casa", "Trabajo")
├── street
├── city
├── notes
└── is_default
```

En el checkout, si el cliente está logueado puede seleccionar una dirección guardada en lugar de escribirla de nuevo.

## Perfil del cliente

`/[slug]/perfil` (solo para clientes logueados):
- Ver y editar datos personales (nombre, teléfono)
- Gestionar direcciones guardadas
- Ver órdenes activas (con estado en tiempo real)
- Ver historial de pedidos pasados

Queries en `src/lib/customers/`.

## Privacidad y aislamiento

Los datos del cliente están **aislados por negocio** via RLS. Un cliente del negocio A no puede ver sus datos en el negocio B (aunque use el mismo email). Son registros separados en `customers`.

## Ver también

- [Flujo de Pedidos](../features/pedidos.md)
- [Orden](orden.md)
- [Autenticación](../arquitectura/autenticacion.md)
- [Base de Datos](../arquitectura/base-de-datos.md)
