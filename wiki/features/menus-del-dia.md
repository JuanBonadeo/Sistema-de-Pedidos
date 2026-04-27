# Menús del Día (Combos)

> **Última actualización:** 2026-04-27
> **Fuentes:** src/lib/daily-menus/, src/app/[business_slug]/admin/(authed)/menu-del-dia/

## Qué son

Los **menús del día** son combos o platos especiales de precio fijo disponibles en días específicos de la semana. Son entidades separadas de los productos del catálogo.

Ejemplo: "Menú Ejecutivo del Lunes" — precio fijo de $2500, disponible solo los lunes, incluye:
- Entrada: Sopa del día
- Principal: Lomo al punto con papas
- Postre: Flan con dulce de leche

## Diferencia con productos regulares

| | Producto | Menú del Día |
|---|---|---|
| Precio | Fijo + modificadores | Precio único fijo |
| Opciones | Grupos de modificadores | Componentes descriptivos (texto) |
| Disponibilidad | Siempre / toggle manual | Por día de la semana |
| Modificadores | Sí (grupos, opciones) | No (componentes son descriptivos) |
| Aparece en catálogo | Sí, por categoría | Sección separada "Menú del Día" |

## Estructura de datos

**`daily_menus`:**
- `name`, `description`, `price`, `image_url`
- `available_days: int[]` — días en que aparece (0=Dom, 1=Lun, ..., 6=Sáb)
- `available: boolean` — toggle manual de disponibilidad

**`daily_menu_components`:**
- Cada componente es una línea descriptiva de texto
- Sin precios individuales — el combo tiene un precio único
- `position` para el orden de display

## Display en el menú del cliente

En la página de menú (`/[slug]/menu`), los menús del día aparecen en una sección destacada, pero solo si:
1. El `available` del menú es `true`
2. El día actual de la semana está en `available_days`

El cliente no puede personalizar los componentes (no hay modificadores).

## Gestión admin

Desde `/[slug]/admin/menu-del-dia`:
- Crear menú del día con nombre, descripción, precio, imagen
- Agregar componentes (lista de texto con orden)
- Configurar días disponibles
- Toggle de disponibilidad global
- Editar y eliminar

## En el carrito

Los menús del día se pueden agregar al carrito igual que productos regulares. El store de Zustand (`src/stores/cart.ts`) soporta tanto `product` como `daily_menu` como tipo de item.

## En el chatbot

El agente del chatbot puede mencionarlos al responder preguntas sobre el menú. La tool `search_products` probablemente busca también en menús del día (verificar implementación).

## Ver también

- [Catálogo](catalogo.md)
- [Flujo de Pedidos](pedidos.md)
- [Chatbot AI](chatbot.md)
- [Base de Datos](../arquitectura/base-de-datos.md)
