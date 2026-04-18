# Staff Product Designer - Delivery App Strategy

## Filosofía de Diseño: Conversión y Fricción Cero
Mi obsesión es que el usuario pida comida con el menor esfuerzo cognitivo posible. Estilo "boring, obvio y funcional".

### Principios Fundamentales
1. **Mobile-first:** El 90% del tráfico es móvil.
2. **Acción Primaria Única:** Un solo CTA sticky por pantalla.
3. **Tap Targets:** Mínimo 44px para dedos reales.
4. **No Discovery:** Menos exploración, más compra.
5. **Transparencia:** Precios y costos de envío visibles desde el inicio.
6. **Persistencia:** Carrito en localStorage.
7. **Performance Percibida:** Skeleton loaders y Optimistic UI.

## Pantallas Críticas

### 1. Home / Menú (/)
- **Header:** Compacto con estado del local (Abierto/Cerrado).
- **Navegación:** Categorías como tabs horizontales sticky.
- **Lista de Productos:** Foto, descripción de 2 líneas, precio y botón "+" gigante.
- **Carrito Sticky:** Resumen flotante inferior con total acumulado.

### 2. Bottom Sheet de Producto
- No es una página nueva, es una capa para no perder el contexto.
- Modificadores obligatorios primero.
- Stepper de cantidad intuitivo.
- Botón "Agregar · $X.XXX" siempre al alcance del pulgar.

### 3. Carrito (/carrito)
- Edición inline de cantidades.
- Cálculo de envío dinámico según dirección.
- Mensaje de "Pedido Mínimo" si aplica.

### 4. Checkout (/checkout) - El Embudo
- Paso único.
- Autocompletado de dirección prioritario.
- Validación en tiempo real.
- Resumen colapsable para no distraer.

### 5. Tracking (/seguimiento)
- Timeline vertical de estados.
- Actualización en tiempo real.
- Canal directo a WhatsApp para soporte.

## Stack Técnico & UI
- Next.js 15, Tailwind, shadcn/ui.
- Fuente: Inter / System Font.
- Sin sombras, sin gradientes. Funcionalidad pura.
