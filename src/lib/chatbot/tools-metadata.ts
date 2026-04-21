/**
 * Metadata de las tools del chatbot. Sin dependencias del server (sin
 * "server-only") para que la UI del dashboard pueda importarla directamente.
 *
 * La implementación de cada tool (los builders de LangChain) vive en
 * `src/lib/chatbot/agent.ts` y usa el `name` de acá como clave.
 */

export type ToolGroup = "info" | "cart" | "checkout";

export type ToolMetadata = {
  name: string;
  group: ToolGroup;
  label: string;
  description: string;
  /** Markdown que se inyecta en el system prompt cuando la tool está habilitada. */
  promptSection: string;
  /** Otras tools que deben estar habilitadas para que esta tenga sentido. */
  dependsOn?: string[];
};

export const TOOL_GROUPS: Record<ToolGroup, { label: string; description: string }> = {
  info: {
    label: "Información",
    description:
      "Herramientas para que el bot consulte el catálogo, horarios y datos del negocio.",
  },
  cart: {
    label: "Carrito",
    description:
      "Permiten al bot armar el carrito del cliente durante la conversación.",
  },
  checkout: {
    label: "Checkout",
    description:
      "Cierran el flujo generando el link al checkout web.",
  },
};

export const TOOL_METADATA: ToolMetadata[] = [
  {
    name: "search_products",
    group: "info",
    label: "Buscar productos",
    description:
      "Busca en el catálogo del negocio. Es la base para cualquier flujo que mencione productos.",
    promptSection: `### \`search_products(query)\`
Busca productos activos del catálogo por nombre o descripción.
- **Siempre** antes de mencionar un producto/precio/disponibilidad.
- Usá \`price_ars\` tal cual — no recalcules.
- Si no trae resultados, probá una variación (singular/plural, sinónimo, sin acentos).
- **Cada producto viene con un \`id\` (UUID).** Guardalo mentalmente — lo necesitás para \`get_product_details\` y \`add_to_cart\`. **Nunca inventes un \`id\`**; si no lo tenés, volvé a buscar con \`search_products\`.`,
  },
  {
    name: "get_product_details",
    group: "info",
    label: "Detalles de producto",
    description:
      "Trae el producto con sus grupos de opciones (toppings, tamaños, etc). Requisito para productos con modifiers.",
    dependsOn: ["search_products"],
    promptSection: `### \`get_product_details(product_id)\`
Devuelve el producto con sus \`modifier_groups\` (toppings, tamaños, etc.). Cada grupo tiene \`min_selection\`, \`max_selection\`, \`is_required\`.
- Usala **antes** de \`add_to_cart\` cuando el producto pueda tener opciones.
- Si hay grupos con \`is_required: true\` o \`min_selection > 0\`, preguntale al cliente qué elige antes de agregar.
- Respetá los \`max_selection\` — si el cliente pide más opciones de las permitidas, avisale.`,
  },
  {
    name: "check_business_status",
    group: "info",
    label: "Estado del local (abierto/cerrado)",
    description:
      "Dice si el negocio está abierto, cuándo cierra hoy o cuándo abre la próxima vez.",
    promptSection: `### \`check_business_status()\`
Dice si el local está abierto, cuándo cierra, o cuándo abre.
- Llamala **una sola vez al inicio** de la conversación, como parte del primer mensaje (ver "Primer mensaje").
- Después, volvela a llamar **solo si** el cliente pregunta explícitamente por horarios o si pueden pedir ahora. No la uses como chequeo de rutina.
- Nunca inventes horarios.`,
  },
  {
    name: "get_delivery_info",
    group: "info",
    label: "Info de envío",
    description:
      "Costo de envío, mínimo de pedido, tiempo estimado, dirección del local.",
    promptSection: `### \`get_delivery_info()\`
Delivery fee, mínimo de pedido, minutos estimados, dirección del local (para pickup).
- Usala si preguntan por costo de envío, hasta dónde llevan, mínimo, o dirección para retirar.`,
  },
  {
    name: "get_cart",
    group: "cart",
    label: "Ver carrito",
    description:
      "Muestra el estado del carrito con subtotal y si alcanza el mínimo de delivery.",
    promptSection: `### \`get_cart()\`
Muestra el carrito actual con subtotal y si alcanza el mínimo.
- Llamala antes de \`generate_checkout_link\` **siempre**.
- Llamala cuando el cliente pregunte "qué llevo" / "cuánto va" / "¿cuánto es?".`,
  },
  {
    name: "add_to_cart",
    group: "cart",
    label: "Agregar al carrito",
    description:
      "Agrega un producto al carrito. Valida modifiers contra el producto.",
    dependsOn: ["search_products", "get_product_details"],
    promptSection: `### \`add_to_cart(product_id, quantity, modifier_ids?, notes?)\`
Agrega un ítem al carrito. El server valida producto, modifiers y cantidades.
- Nunca inventes modifier_ids — usá los que te dio \`get_product_details\` o \`add_to_cart\` (cuando devuelve \`needs_options\`).
- Si devuelve \`{ "needs_options": true, groups: [...] }\`: **NO es un error para el cliente**. Usá la info de \`groups\` para preguntarle qué prefiere (una pregunta corta por grupo, con las opciones disponibles). Después volvé a llamar \`add_to_cart\` con los \`modifier_ids\` elegidos. **Nunca le digas al cliente "hubo un error" ni "no se pudo agregar"** — es solo que faltan opciones.
- Si devuelve \`{ "error": ... }\` de verdad (ej. producto no disponible): decilo con empatía y ofrecé alternativas.`,
  },
  {
    name: "remove_from_cart",
    group: "cart",
    label: "Quitar del carrito",
    description: "Remueve una línea del carrito por su id.",
    dependsOn: ["get_cart"],
    promptSection: `### \`remove_from_cart(line_id)\`
Quita una línea del carrito. Usá el \`id\` que viene en \`get_cart\`/\`add_to_cart\`.`,
  },
  {
    name: "generate_checkout_link",
    group: "checkout",
    label: "Generar link de checkout",
    description:
      "Cierra el flujo: guarda el carrito con un token y devuelve la URL para terminar en la web.",
    dependsOn: ["get_cart", "add_to_cart"],
    promptSection: `### \`generate_checkout_link()\`
Genera el link para terminar el pedido en la web. Solo llamala cuando:
1. El cliente confirmó que no quiere agregar más.
2. Llamaste \`get_cart\` en el mensaje previo.
3. El carrito no está vacío.`,
  },
];

export type ToolOverrides = Record<string, { promptSection?: string }>;

export function isToolEnabled(
  toolName: string,
  enabledTools: string[] | null | undefined,
): boolean {
  // null/undefined = all tools enabled (backwards compat).
  if (!enabledTools) return true;
  return enabledTools.includes(toolName);
}

/**
 * Returns the markdown section for a given tool, applying the business's
 * override if present. Empty/whitespace overrides fall back to the default.
 */
export function resolveToolPromptSection(
  tool: ToolMetadata,
  overrides?: ToolOverrides | null,
): string {
  const override = overrides?.[tool.name]?.promptSection;
  if (typeof override === "string" && override.trim().length > 0) return override;
  return tool.promptSection;
}

export function buildEnabledToolsMarkdown(
  enabledTools: string[] | null | undefined,
  overrides?: ToolOverrides | null,
): string {
  const sections = TOOL_METADATA.filter((t) =>
    isToolEnabled(t.name, enabledTools),
  ).map((t) => resolveToolPromptSection(t, overrides));
  if (sections.length === 0) {
    return "_(Sin herramientas habilitadas — el bot solo puede usar conocimiento general.)_";
  }
  return sections.join("\n\n");
}

export function buildEnabledToolsList(
  enabledTools: string[] | null | undefined,
): string {
  const names = TOOL_METADATA.filter((t) => isToolEnabled(t.name, enabledTools)).map(
    (t) => `\`${t.name}\``,
  );
  return names.length > 0 ? names.join(", ") : "(ninguna)";
}
