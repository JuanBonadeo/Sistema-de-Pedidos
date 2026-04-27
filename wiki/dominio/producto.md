# Producto

> **Última actualización:** 2026-04-27
> **Fuentes:** supabase/migrations/, src/lib/catalog/, src/components/admin/catalog/

## Qué es

Un `Product` es un item del menú que el cliente puede agregar al carrito. Pertenece a una `Category` dentro de un `Business`.

## Campos

```
id           UUID
business_id  Tenant owner
category_id  Categoría (sección del menú)
name         Nombre del producto
description  Descripción (opcional)
price        Precio base
image_url    URL de imagen (opcional)
available    Toggle de disponibilidad (sin eliminar)
position     Orden dentro de la categoría
```

## Modificadores

Los productos pueden tener opciones personalizables mediante **grupos de modificadores**:

### `modifier_groups` — El contenedor
```
id             UUID
product_id     FK a products
name           Nombre del grupo (ej: "Tamaño", "Extras", "Punto de cocción")
required       Si el cliente debe elegir (boolean)
min_select     Mínimo de opciones (ej: 1 para required)
max_select     Máximo de opciones (ej: 1 para radio, N para checkboxes)
position       Orden de display
```

### `modifiers` — Las opciones individuales
```
id                UUID
modifier_group_id FK a modifier_groups
name              Nombre de la opción (ej: "Grande", "Con queso")
price_delta       Precio adicional (puede ser 0, positivo, o negativo)
available         Toggle (sin eliminar del grupo)
position          Orden
```

## Precio final de un item

```
precio_item = product.price + Σ price_delta de los modifiers seleccionados
```

Ejemplo: Pizza ($1500) + "Grande" (+$500) + "Mozzarella extra" (+$200) = $2200

## Display en el menú

Al hacer click en un producto:
1. Se abre un modal con nombre, descripción, imagen, precio base
2. Se muestran los grupos de modificadores en orden
3. El cliente selecciona opciones (respetando min/max_select y required)
4. Se muestra el precio actualizado en tiempo real
5. "Agregar al carrito" con la cantidad seleccionada

## En el carrito (Zustand)

El item en el carrito tiene:
```typescript
{
  type: "product"
  productId: string
  name: string        // snapshot del nombre
  basePrice: number   // snapshot del precio base
  quantity: number
  selectedModifiers: {
    groupId: string
    modifierId: string
    name: string      // snapshot
    priceDelta: number // snapshot
  }[]
}
```

## Snapshots en pedidos

Al crear una orden, `order_items` y `order_item_modifiers` guardan el `name` y `price`/`price_delta` en ese momento. Los cambios futuros al catálogo no afectan pedidos históricos.

El `product_id` y `modifier_id` en los items del pedido son nullable — si el producto es eliminado del catálogo, los pedidos históricos siguen intactos.

## Disponibilidad

- `products.available = false` → el producto no aparece en el menú del cliente (pero sigue en la DB)
- `modifiers.available = false` → esa opción no aparece para selección
- Si una categoría queda vacía (todos sus productos unavailable), la sección no aparece en el menú

## Ver también

- [Catálogo](../features/catalogo.md)
- [Menús del Día](../features/menus-del-dia.md) — alternativa sin modificadores
- [Orden](orden.md)
- [Chatbot AI](../features/chatbot.md) — usa get_product_details para obtener modificadores
- [Base de Datos](../arquitectura/base-de-datos.md)
