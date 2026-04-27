# Catálogo de Productos

> **Última actualización:** 2026-04-27
> **Fuentes:** src/lib/catalog/, src/lib/admin/catalog-query.ts, src/components/admin/catalog/

## Estructura del catálogo

```
Negocio
└── Categorías (ordenadas por position)
    └── Productos (ordenados por position)
        └── Grupos de modificadores
            └── Modificadores (opciones)
```

## Entidades

### Categoría
- Agrupa productos relacionados (ej: "Pizzas", "Bebidas", "Postres")
- Tiene `position` para controlar el orden de display
- Sin la categoría, el producto no aparece en el menú

### Producto
Campos principales:
- `name`, `description`, `price`, `image_url`
- `available` (boolean) — puede ocultarse temporalmente sin eliminar
- `position` — orden dentro de la categoría
- `category_id` — categoría a la que pertenece

### Grupo de modificadores (`modifier_groups`)
Define un conjunto de opciones para un producto. Ejemplos:
- "Tamaño" (required: true, max_select: 1)
- "Extras" (required: false, max_select: 3)
- "Punto de cocción" (required: true, max_select: 1)

Campos:
- `required` — si el cliente debe elegir al menos una opción
- `min_select` / `max_select` — mínimo/máximo de opciones seleccionables

### Modificador (`modifiers`)
Una opción dentro de un grupo. Ejemplos:
- "Chico" (price_delta: 0), "Mediano" (price_delta: +200), "Grande" (price_delta: +400)
- "Mozzarella extra" (price_delta: +150)
- `available` — puede desactivarse individualmente

## Gestión admin

Desde `/[slug]/admin/catalogo` el admin puede:

**Categorías:**
- Crear / editar / eliminar categorías
- Reordenar (drag & drop o flechas)

**Productos:**
- Crear producto con nombre, descripción, precio, imagen
- Editar cualquier campo
- Toggle de disponibilidad (aparece/desaparece del menú inmediatamente)
- Eliminar producto (soft delete o hard delete — verificar implementación)
- Upload de imagen

**Modificadores:**
- Agregar grupos de modificadores a un producto
- Configurar `required`, `min_select`, `max_select`
- Agregar/editar/eliminar modificadores dentro del grupo
- Reordenar modificadores

## Display en el menú del cliente

El menú del cliente (`/[slug]/menu`) muestra:
1. Categorías como secciones separadas (solo categorías con productos disponibles)
2. Dentro de cada sección, los productos disponibles con imagen, nombre, precio
3. Al hacer click en un producto, se abre un modal con descripción y modificadores
4. El cliente selecciona modificadores (validando required/max) y agrega al carrito

## Disponibilidad y horarios

- Los productos tienen `available` (toggle manual)
- El menú completo se muestra como cerrado si el negocio está fuera del horario definido en `business_hours`
- Los menús del día aparecen solo en los días de la semana configurados

## Queries principales

- `src/lib/admin/catalog-query.ts` — queries para el panel admin
- `src/lib/catalog/` — queries y actions del catálogo (CRUD)

Las queries incluyen joins automáticos para traer categorías con sus productos y modificadores en una sola query (evita N+1).

## Snapshots en pedidos

Cuando se crea una orden, `order_items` guarda `name` y `price` del producto en ese momento. Así si el admin cambia el precio del producto, los pedidos históricos no se ven afectados.

## Ver también

- [Producto (dominio)](../dominio/producto.md)
- [Menús del Día](menus-del-dia.md)
- [Flujo de Pedidos](pedidos.md)
- [Chatbot AI](chatbot.md) — usa search_products y get_product_details
- [Base de Datos](../arquitectura/base-de-datos.md)
