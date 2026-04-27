# Base de Datos

> **Última actualización:** 2026-04-27
> **Fuentes:** supabase/migrations/, local-data.sql

## Motor

**PostgreSQL 17** vía Supabase. RLS (Row-Level Security) habilitado en todas las tablas. 17 migraciones al momento de la exploración inicial.

## Esquema por dominio

### Tenancy y Multi-Tenant

**`businesses`** — el tenant central
```sql
id               uuid PK
slug             text UNIQUE        -- URL identifier (/pizzanapoli/menu)
name             text
address          text
phone            text
email            text
timezone         text               -- ej: America/Argentina/Buenos_Aires
currency         text               -- ej: ARS
primary_color    text               -- branding del negocio
logo_url         text
cover_url        text
settings         jsonb              -- config extra flexible
mp_access_token  text               -- credenciales Mercado Pago del negocio
mp_webhook_secret text
status           text               -- active, inactive, etc.
created_at       timestamptz
updated_at       timestamptz
```

**`users`** — usuarios de la plataforma (linked a `auth.users`)
```sql
id          uuid PK (= auth.users.id)
email       text
full_name   text
created_at  timestamptz
```

**`business_users`** — mapping usuario ↔ negocio con rol
```sql
id           uuid PK
business_id  uuid FK businesses
user_id      uuid FK users
role         text  -- owner | admin | staff
created_at   timestamptz
```

### Catálogo

**`categories`**
```sql
id           uuid PK
business_id  uuid FK businesses
name         text
position     int   -- orden de display
created_at   timestamptz
```

**`products`**
```sql
id             uuid PK
business_id    uuid FK businesses
category_id    uuid FK categories
name           text
description    text
price          numeric
image_url      text
available      boolean
position       int
created_at     timestamptz
updated_at     timestamptz
```

**`modifier_groups`** — grupos de opciones (ej: "Tamaño", "Extras")
```sql
id           uuid PK
product_id   uuid FK products
name         text
required     boolean
min_select   int
max_select   int
position     int
```

**`modifiers`** — opciones individuales dentro de un grupo
```sql
id                uuid PK
modifier_group_id uuid FK modifier_groups
name              text
price_delta       numeric  -- precio adicional (puede ser 0 o negativo)
available         boolean
position          int
```

### Menús del Día (Combos)

**`daily_menus`**
```sql
id              uuid PK
business_id     uuid FK businesses
name            text
description     text
price           numeric
image_url       text
available_days  int[]    -- array de días (0=Dom, 1=Lun, ..., 6=Sáb)
available       boolean
created_at      timestamptz
updated_at      timestamptz
```

**`daily_menu_components`** — componentes del combo (texto libre)
```sql
id             uuid PK
daily_menu_id  uuid FK daily_menus
description    text    -- ej: "1/4 pollo + papas fritas"
position       int
```

### Configuración del Negocio

**`business_hours`**
```sql
id           uuid PK
business_id  uuid FK businesses
day_of_week  int     -- 0=Dom, 1=Lun, ..., 6=Sáb
opens_at     time
closes_at    time
is_open      boolean
```

**`delivery_zones`** _(parcialmente deprecated)_
```sql
id              uuid PK
business_id     uuid FK businesses
name            text
min_order       numeric
delivery_fee    numeric
polygon         jsonb   -- coordenadas del polígono de zona
```

### Clientes

**`customers`**
```sql
id           uuid PK (= auth.users.id cuando aplica)
business_id  uuid FK businesses   -- cliente es por negocio
phone        text
full_name    text
email        text
created_at   timestamptz
```

**`customer_addresses`**
```sql
id           uuid PK
customer_id  uuid FK customers
label        text     -- ej: "Casa", "Trabajo"
street       text
city         text
notes        text
is_default   boolean
```

### Pedidos

**`orders`** — cabecera del pedido
```sql
id               uuid PK
business_id      uuid FK businesses
customer_id      uuid FK customers (nullable para guests)
order_number     int      -- número secuencial por negocio (advisory lock)
status           text     -- ver ciclo de vida abajo
payment_method   text     -- cash | mercadopago
payment_status   text     -- pending | paid | failed | refunded
delivery_type    text     -- delivery | pickup
delivery_address jsonb    -- snapshot de la dirección
subtotal         numeric
delivery_fee     numeric
total            numeric
notes            text
mp_payment_id    text     -- ID de pago en Mercado Pago
created_at       timestamptz
updated_at       timestamptz
```

**`order_items`**
```sql
id           uuid PK
order_id     uuid FK orders
product_id   uuid FK products (nullable si fue eliminado)
name         text     -- snapshot del nombre al momento del pedido
price        numeric  -- snapshot del precio
quantity     int
subtotal     numeric
```

**`order_item_modifiers`**
```sql
id            uuid PK
order_item_id uuid FK order_items
modifier_id   uuid FK modifiers (nullable)
name          text     -- snapshot
price_delta   numeric  -- snapshot
```

**`order_status_history`** — log append-only de cambios de estado
```sql
id         uuid PK
order_id   uuid FK orders
status     text
changed_by uuid FK users (nullable)
notes      text
created_at timestamptz
```

### Chatbot

**`chatbot_contacts`** — participantes en conversaciones
```sql
id           uuid PK
business_id  uuid FK businesses
channel      text    -- whatsapp | web
external_id  text    -- número de WhatsApp u otro identificador
name         text
created_at   timestamptz
```

**`chatbot_conversations`**
```sql
id           uuid PK
business_id  uuid FK businesses
contact_id   uuid FK chatbot_contacts
status       text    -- active | closed
created_at   timestamptz
updated_at   timestamptz
```

**`chatbot_messages`**
```sql
id               uuid PK
conversation_id  uuid FK chatbot_conversations
role             text    -- user | assistant | tool
content          text
tool_calls       jsonb   -- si el assistant llamó tools
tool_results     jsonb   -- resultado de las tools
created_at       timestamptz
```

**`chatbot_configs`** — configuración del agente por negocio
```sql
id                  uuid PK
business_id         uuid FK businesses UNIQUE
system_prompt       text    -- prompt del sistema customizable
enabled_tools       text[]  -- tools habilitadas
tool_overrides      jsonb   -- descripciones customizadas de tools
created_at          timestamptz
updated_at          timestamptz
```

## Ciclo de vida de una orden (status)

```
pending → confirmed → preparing → ready → on_the_way → delivered
                                        → cancelled (desde cualquier estado)
```

## Características especiales

**Advisory locks para order_number:** Para evitar duplicados en el número de orden por negocio bajo alta concurrencia, se usa `pg_advisory_lock` al crear la orden.

**Snapshots en order_items:** El nombre y precio del producto se guardan en el momento del pedido. Si el admin cambia el precio después, los pedidos históricos no se ven afectados.

**Triggers automáticos:** `updated_at` se actualiza automáticamente en todas las tablas que lo tienen, vía trigger de PostgreSQL.

**RLS completo:** Cada tabla tiene políticas de Row-Level Security. Los clientes solo ven sus propios datos; los admins solo ven los datos de sus negocios.

## Ver también

- [Multi-Tenancy](multi-tenancy.md)
- [Autenticación](autenticacion.md)
- [Ciclo de vida de una Orden](../dominio/orden.md)
- [Producto y Modificadores](../dominio/producto.md)
- [Chatbot AI](../features/chatbot.md)
