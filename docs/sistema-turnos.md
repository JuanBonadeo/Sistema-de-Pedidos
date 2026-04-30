# Plan: Sistema de turnos / reservas de mesas

## Contexto
Construir desde 0 un sistema de reservas para los negocios del SaaS. Incluye editor visual de plano de salón (mesas posicionables) y flujo de reserva para clientes finales. Stack existente: Next.js 15 (App Router), Supabase, Zustand, react-hook-form, MercadoPago, OTP ya integrado.

## Decisiones tomadas
1. Una sola sucursal por negocio (sin tabla `branches`).
2. Cliente debe loguearse antes de confirmar (reusar auth existente).
3. Slots fijos por configuración (ej: 12:00, 13:30, 15:00, 20:30, 22:00).
4. Admin solo necesita lista por día (no timeline drag&drop).
5. MVP = editor de plano + motor de slots + reserva con asignación automática + lista admin del día.

---

## Fase 1 — MVP

### 1.1 Migración SQL

```sql
-- Plano (uno por negocio en MVP, schema permite varios para fase 2)
create table floor_plans (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null default 'Salón',
  width int not null default 1000,   -- coords lógicas, no px
  height int not null default 700,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Mesas en el plano
create table tables (
  id uuid primary key default gen_random_uuid(),
  floor_plan_id uuid not null references floor_plans(id) on delete cascade,
  label text not null,                -- "Mesa 5", "Barra 2"
  seats int not null check (seats > 0),
  shape text not null check (shape in ('circle','square','rect')),
  x int not null,
  y int not null,
  width int not null,
  height int not null,
  rotation int not null default 0,
  status text not null default 'active' check (status in ('active','disabled')),
  created_at timestamptz default now()
);
create index on tables (floor_plan_id);

-- Configuración de reservas por negocio
create table reservation_settings (
  business_id uuid primary key references businesses(id) on delete cascade,
  slot_duration_min int not null default 90,
  buffer_min int not null default 15,
  lead_time_min int not null default 60,        -- antelación mínima
  advance_days_max int not null default 30,     -- cuánto a futuro
  max_party_size int not null default 12,
  -- horarios y slots fijos por día (0=domingo .. 6=sábado)
  -- formato: { "1": { open: true, slots: ["12:00","13:30","20:30","22:00"] }, ... }
  schedule jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- Reservas
create table reservations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  table_id uuid references tables(id) on delete set null,
  user_id uuid references auth.users(id),       -- cliente logueado
  customer_name text not null,
  customer_phone text not null,
  party_size int not null check (party_size > 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed'
    check (status in ('confirmed','seated','completed','no_show','cancelled')),
  notes text,
  source text not null default 'web' check (source in ('web','admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint reservations_time_valid check (ends_at > starts_at)
);
create index on reservations (business_id, starts_at);
create index on reservations (user_id);

-- Anti-overlap por mesa (sólo reservas vivas ocupan la mesa)
create extension if not exists btree_gist;
alter table reservations add constraint reservations_no_overlap
  exclude using gist (
    table_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('confirmed','seated'));

-- RLS: políticas estándar (admin del business escribe; cliente ve las suyas)
alter table floor_plans enable row level security;
alter table tables enable row level security;
alter table reservation_settings enable row level security;
alter table reservations enable row level security;
-- (las policies se definen siguiendo el patrón ya usado en otras tablas del repo)
```

### 1.2 Estructura de archivos a crear

```
src/lib/reservations/
  availability.ts         # motor de slots: getAvailableSlots(businessId, date, partySize)
  assign-table.ts         # elige la mesa más chica que entre, sin overlap
  schema.ts               # zod schemas (settings, reservation, table)
  types.ts

src/lib/admin/floor-plan/
  actions.ts              # server actions: saveFloorPlan, deleteTable, etc.
  queries.ts              # getFloorPlan(businessId)

src/app/[business_slug]/admin/(authed)/
  reservas/
    page.tsx              # lista del día (default hoy, con date picker)
    layout.tsx            # opcional, para nav lateral
    plano/
      page.tsx            # editor de plano (client component)
    configuracion/
      page.tsx            # horarios, slots, duración, buffer

src/app/[business_slug]/reservar/
  page.tsx                # flujo cliente: fecha → party → slot → confirmar

src/components/admin/floor-plan/
  floor-plan-editor.tsx   # SVG canvas + drag/resize/rotate
  table-shape.tsx         # render de mesa según shape
  toolbar.tsx
  use-floor-plan-store.ts # zustand store del editor

src/components/reservations/
  date-picker.tsx
  party-size-picker.tsx
  slot-grid.tsx
  reservation-form.tsx
  reservation-list-item.tsx  # para admin
```

### 1.3 Motor de disponibilidad (clave del sistema)

`getAvailableSlots(businessId, date: Date, partySize: number) → string[]`

Pseudocódigo:
```ts
1. settings = getReservationSettings(businessId)
2. daySchedule = settings.schedule[dayOfWeek(date)]
3. if (!daySchedule.open) return []
4. slots = daySchedule.slots.filter(slot => {
     start = combine(date, slot)
     if (start < now + leadTime) return false
     end = start + duration + buffer
     // hay al menos una mesa que entra y está libre?
     return tables.some(t =>
       t.seats >= partySize &&
       !overlapsAnyReservation(t.id, start, end)
     )
   })
5. return slots
```

`assignTable(businessId, start, end, partySize)`: elige la mesa con menor `seats` (que entre) y libre. Devuelve `null` → 409 al cliente.

### 1.4 Editor de plano (client component)

- SVG con `viewBox` = `0 0 width height` del floor plan.
- Estado en Zustand: `tables`, `selectedId`, `tool`, `isDirty`.
- Interacciones:
  - Click en toolbar "+ Mesa redonda" → agrega mesa default en centro.
  - Pointer events sobre `<g>` de mesa para drag (transform translate).
  - Handles en esquinas (cuadraditos) para resize.
  - Handle superior con línea para rotation.
  - Snap a grilla de 10 unidades (Shift para libre).
  - Tecla Delete elimina seleccionada.
  - Panel lateral derecho: editar `label`, `seats`, `shape` de la seleccionada.
- Botón "Guardar" → server action que reemplaza todas las mesas del plan (transacción: delete + insert, o upsert con diff).

### 1.5 Flujo cliente

`/[slug]/reservar`:
1. **Fecha**: calendar limitado por `advance_days_max`.
2. **Comensales**: stepper 1..max_party_size.
3. **Slots**: chips con horarios disponibles (server fetch on submit). Si no hay → mensaje "no quedan lugares, probá otra fecha".
4. **Login gate**: si no está logueado, redirect a `/[slug]/login?next=...` con state preservado en query/searchParams.
5. **Confirmación**: form con nombre + teléfono (prefill de auth.user), notas opcionales. Submit → server action que:
   - Re-valida disponibilidad (race condition).
   - `assignTable`.
   - Inserta `reservations` con status `confirmed`.
   - El exclusion constraint protege contra doble booking concurrente; si tira `23P01` → reintentar con otra mesa o devolver "ya no hay lugar".
6. **Resumen**: muestra fecha/hora/mesa, botón "cancelar reserva" (hasta `lead_time_min` antes).

### 1.6 Admin: lista del día

`/[slug]/admin/reservas`:
- Date picker (default hoy).
- Lista ordenada por `starts_at`: hora · mesa · nombre · personas · teléfono · estado.
- Acciones por reserva: marcar `seated`, `completed`, `no_show`, `cancelar`.
- Botón "+ Nueva reserva" (admin) que abre el mismo formulario sin login gate.

### 1.7 Tests mínimos
- `availability.test.ts`: cubre día cerrado, lead time, mesa ocupada, mesa chica.
- `assign-table.test.ts`: prefiere mesa más chica, falla si no hay.
- Test de integración con Supabase local: insertar 2 reservas concurrentes en la misma mesa/horario → la segunda falla.

---

## Fase 2 — Operación más fluida (post-MVP)

- **Vista plano "live"** en admin: el SVG con cada mesa coloreada por estado actual (libre / próxima reserva en X min / ocupada). Click en mesa → ver/crear reserva en esa mesa.
- **Walk-ins**: sentar comensales sin reserva previa desde el plano live (crea reservation con `source='admin'`, `status='seated'`, sin user_id).
- **Editar reserva** desde admin (mover de horario o mesa).
- **Recordatorios**: cron diario que manda WhatsApp/email 24h y 2h antes (reusar infra de campañas que ya tenés).
- **Cancelación con motivo** y métricas básicas (`reportes`: reservas/día, no-shows, ocupación %).

## Fase 3 — Capacidad inteligente

- **Combinables**: agregar `table_groups` con reglas (mesa 1+2 = 1 de 8). Modificar `assignTable` para considerar grupos cuando no hay mesa individual que entre.
- **Múltiples planos** por negocio (Salón / Terraza). El UI ya existe (la tabla `floor_plans` lo soporta).
- **Múltiples sucursales**: agregar `branches` y mover `floor_plans` a colgar de branch.

## Fase 4 — Comercial

- **Depósito con MercadoPago** para reservas > N personas o en horarios premium. Reusar integración existente.
- **Lista de espera**: si no hay slots, registrar interés; si se libera por cancelación, notificar a la primera persona.
- **Reservas recurrentes** (cliente VIP que reserva todos los viernes).
- **Política de no-show**: tras N no-shows, bloquear al cliente o requerir depósito.

---

## Orden sugerido de PRs (MVP)

1. **PR 1 — Migración + RLS + types**: SQL, regenerar `database.types.ts`, schemas zod.
2. **PR 2 — Editor de plano**: ABM de mesas en SVG + página admin/reservas/plano.
3. **PR 3 — Configuración**: página admin/reservas/configuracion (horarios y slots).
4. **PR 4 — Motor de disponibilidad** + tests.
5. **PR 5 — Flujo cliente** `/reservar` con login gate.
6. **PR 6 — Admin lista del día** + acciones de estado.

## Dudas pendientes (resolver durante implementación)
- ¿La duración del slot es fija global o configurable por slot? (Asumo global; si querés "almuerzo 90min, cena 120min", sumar campo `duration_min` por slot dentro del JSON).
- Política de cancelación: ¿el cliente puede cancelar siempre, o sólo hasta X horas antes? (Default razonable: hasta `lead_time_min` antes).
- ¿El teléfono se valida con OTP también o alcanza con el login? (Alcanza con login; el teléfono va a `customer_phone` para que el local llame, sin verificar).
