-- ============================================
-- BUSINESS
-- ============================================
insert into businesses (slug, name, timezone, currency, phone, email, address, logo_url, settings)
values (
  'pizzanapoli',
  'Pizza Napoli',
  'America/Argentina/Buenos_Aires',
  'ARS',
  '+54 11 5555-1234',
  'hola@pizzanapoli.test',
  'Av. Corrientes 1234, CABA',
  'https://picsum.photos/seed/pn-logo/200',
  jsonb_build_object(
    'primary_color', '#E11D48',
    'primary_foreground', '#FFFFFF',
    'logo_url', 'https://picsum.photos/seed/pn-logo/200'
  )
);

-- ============================================
-- HORARIOS (lunes a domingo 11:00 → 23:00)
-- ============================================
insert into business_hours (business_id, day_of_week, opens_at, closes_at)
select b.id, d, time '11:00', time '23:00'
from businesses b, generate_series(0, 6) as d
where b.slug = 'pizzanapoli';

-- ============================================
-- DELIVERY ZONES
-- ============================================
insert into delivery_zones (business_id, name, delivery_fee_cents, min_order_cents, estimated_minutes, sort_order)
select b.id, v.name, v.fee, v.min_order, v.mins, v.sort
from businesses b,
(values
  ('Centro',      150000::bigint, 0::bigint,      25, 0),
  ('Zona Norte',  250000::bigint, 500000::bigint, 45, 1)
) as v(name, fee, min_order, mins, sort)
where b.slug = 'pizzanapoli';

-- ============================================
-- CATEGORIES
-- ============================================
insert into categories (business_id, name, slug, sort_order)
select b.id, v.name, v.slug, v.sort
from businesses b,
(values
  ('Pizzas',    'pizzas',    0),
  ('Empanadas', 'empanadas', 1),
  ('Bebidas',   'bebidas',   2)
) as v(name, slug, sort)
where b.slug = 'pizzanapoli';

-- ============================================
-- PRODUCTS
-- ============================================
insert into products (business_id, category_id, name, slug, description, price_cents, image_url, sort_order)
select b.id, c.id, v.name, v.slug, v.description, v.price, v.image, v.sort
from businesses b,
     categories c,
     (values
       ('pizzas',    'Pizza Muzzarella',         'muzzarella',     'Muzzarella fresca, salsa de tomate y orégano.',          1000000::bigint, 'https://picsum.photos/seed/muzza/400',     0),
       ('pizzas',    'Pizza Napolitana',         'napolitana',     'Muzzarella, rodajas de tomate, ajo y aceitunas negras.', 1200000::bigint, 'https://picsum.photos/seed/napo/400',      1),
       ('pizzas',    'Pizza Fugazzetta',         'fugazzetta',     'Muzzarella, cebolla caramelizada y queso extra.',        1100000::bigint, 'https://picsum.photos/seed/fuga/400',      2),
       ('pizzas',    'Pizza Calabresa',          'calabresa',      'Muzzarella, longaniza calabresa picante y morrones.',    1300000::bigint, 'https://picsum.photos/seed/cala/400',      3),
       ('empanadas', 'Empanada de Carne',        'empanada-carne', 'Carne cortada a cuchillo, cebolla y huevo.',               80000::bigint, 'https://picsum.photos/seed/emp-carne/400', 0),
       ('empanadas', 'Empanada de Jamón y Queso','empanada-jyq',   'Clásica, al horno.',                                       75000::bigint, 'https://picsum.photos/seed/emp-jyq/400',   1),
       ('bebidas',   'Coca-Cola 1.5L',           'coca-1500',      'Botella retornable.',                                     250000::bigint, 'https://picsum.photos/seed/coca/400',      0),
       ('bebidas',   'Agua Mineral 500ml',       'agua-500',       'Sin gas.',                                                150000::bigint, 'https://picsum.photos/seed/agua/400',      1)
     ) as v(cat_slug, name, slug, description, price, image, sort)
where b.slug = 'pizzanapoli'
  and c.business_id = b.id
  and c.slug = v.cat_slug;

-- ============================================
-- MODIFIER GROUPS + MODIFIERS (Pizza Muzzarella)
-- ============================================
with muzza as (
  select p.id as product_id, p.business_id
  from products p
  join businesses b on b.id = p.business_id
  where b.slug = 'pizzanapoli' and p.slug = 'muzzarella'
),
gtamano as (
  insert into modifier_groups (business_id, product_id, name, min_selection, max_selection, is_required, sort_order)
  select business_id, product_id, 'Tamaño', 1, 1, true, 0 from muzza
  returning id
),
gextras as (
  insert into modifier_groups (business_id, product_id, name, min_selection, max_selection, is_required, sort_order)
  select business_id, product_id, 'Extras', 0, 3, false, 1 from muzza
  returning id
)
insert into modifiers (group_id, name, price_delta_cents, sort_order)
select id, 'Chica',     0,      0 from gtamano
union all select id, 'Mediana',   150000, 1 from gtamano
union all select id, 'Grande',    300000, 2 from gtamano
union all select id, 'Jamón',      80000, 0 from gextras
union all select id, 'Huevo',      50000, 1 from gextras
union all select id, 'Aceitunas',  40000, 2 from gextras;
