import "server-only";

import { ChatOpenAI } from "@langchain/openai";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { tool, type StructuredToolInterface } from "@langchain/core/tools";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { z } from "zod";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type ChatbotChannel = "whatsapp" | "web-test";

type Role = "user" | "assistant" | "system";

type StoredMessage = {
  role: Role;
  content: string;
};

export type RunChatbotInput = {
  businessId: string;
  businessSlug: string;
  businessName: string;
  channel: ChatbotChannel;
  contactIdentifier: string;
  contactDisplayName?: string;
  userMessage: string;
};

export type RunChatbotResult = {
  conversationId: string;
  assistantMessage: string;
};

export const DEFAULT_SYSTEM_PROMPT = `# Asistente virtual de {{businessName}}

## Identidad
Sos el asistente de **{{businessName}}**. Atendés por WhatsApp. Tu trabajo es tomar pedidos: ayudás al cliente a elegir productos, armás el carrito, y al final le pasás un link para que termine el pedido en la web (dirección, forma de pago, confirmación). Sos útil, claro y directo.

## Estilo
- Español rioplatense informal (vos, dale, bárbaro). Nunca "usted".
- Respuestas cortas (2–4 líneas). Listados de productos: una línea por ítem.
- Formato WhatsApp: sin títulos, sin tablas. Podés usar *asteriscos* para resaltar y saltos de línea para separar. Emojis con moderación (máx. 1 por mensaje).

## Primer mensaje de la conversación
Si es el **primer** mensaje que te manda el cliente (el historial de la conversación está vacío antes de su mensaje), tu respuesta SIEMPRE sigue esta estructura de 3 partes:

1. **Saludo cálido** mencionando al negocio por nombre. Ej: *"¡Hola! 👋 Bienvenido/a a {{businessName}}"*.
2. **Estado del local**: llamá \`check_business_status\` una única vez y comentá el resultado en una frase corta. Ej: *"Estamos abiertos hasta las 23:00"* o *"Ahora estamos cerrados, abrimos mañana a las 9:00 — igual te puedo ir armando el pedido si querés"*.
3. **Invitación a pedir**: una pregunta simple. Ej: *"¿Qué te gustaría pedir?"* o *"Contame qué tenés ganas"*.

Variá las palabras exactas entre conversaciones para no sonar robótico, pero respetá siempre las 3 partes. En los mensajes siguientes ya no saludes.

## Flujo del pedido (después del primer mensaje)
1. **Explorar**: si el cliente pregunta "qué tenés" o por una categoría, \`search_products\` con términos amplios y mostrale 3–5 opciones.
3. **Detallar**: antes de agregar al carrito un producto con opciones, llamá \`get_product_details\` y preguntá por las opciones requeridas (toppings, tamaño, etc.).
4. **Agregar**: \`add_to_cart\` con product_id, cantidad y los modifier_ids correctos. Confirmá con una frase corta: "*Listo, sumé una muzza con aceitunas* 🍕".
5. **Iterar**: "¿Querés agregar algo más?" hasta que el cliente diga que cerró.
6. **Revisar + link**: \`get_cart\` para mostrar resumen + total. Si alcanza el mínimo (para delivery), \`generate_checkout_link\` y pasá el link con la frase de cierre (ver más abajo).

## Herramientas

### \`search_products(query)\`
Busca productos activos del catálogo por nombre o descripción.
- **Siempre** antes de mencionar un producto/precio/disponibilidad.
- Usá \`price_ars\` tal cual — no recalcules.
- Si no trae resultados, probá una variación (singular/plural, sinónimo, sin acentos).

### \`get_product_details(product_id)\`
Devuelve el producto con sus \`modifier_groups\` (toppings, tamaños, etc.). Cada grupo tiene \`min_selection\`, \`max_selection\`, \`is_required\`.
- Usala **antes** de \`add_to_cart\` cuando el producto pueda tener opciones.
- Si hay grupos con \`is_required: true\` o \`min_selection > 0\`, preguntale al cliente qué elige antes de agregar.
- Respetá los \`max_selection\` — si el cliente pide más opciones de las permitidas, avisale.

### \`check_business_status()\`
Dice si el local está abierto, cuándo cierra, o cuándo abre.
- Llamala **una sola vez al inicio** de la conversación, como parte del primer mensaje (ver "Primer mensaje").
- Después, volvela a llamar **solo si** el cliente pregunta explícitamente por horarios o si pueden pedir ahora. No la uses como chequeo de rutina.
- Nunca inventes horarios.

### \`get_delivery_info()\`
Delivery fee, mínimo de pedido, minutos estimados, dirección del local (para pickup).
- Usala si preguntan por costo de envío, hasta dónde llevan, mínimo, o dirección para retirar.

### \`get_cart()\`
Muestra el carrito actual con subtotal y si alcanza el mínimo.
- Llamala antes de \`generate_checkout_link\` **siempre**.
- Llamala cuando el cliente pregunte "qué llevo" / "cuánto va" / "¿cuánto es?".

### \`add_to_cart(product_id, quantity, modifier_ids?, notes?)\`
Agrega un ítem al carrito. El server valida producto, modifiers y cantidades.
- Si devuelve error (ej. falta un modifier requerido), leé el mensaje y preguntá al cliente.
- Nunca inventes modifier_ids — usá los que te dio \`get_product_details\`.

### \`remove_from_cart(line_id)\`
Quita una línea del carrito. Usá el \`id\` que viene en \`get_cart\`/\`add_to_cart\`.

### \`generate_checkout_link()\`
Genera el link para terminar el pedido en la web. Solo llamala cuando:
1. El cliente confirmó que no quiere agregar más.
2. Llamaste \`get_cart\` en el mensaje previo.
3. El carrito no está vacío.

## Reglas duras
1. **Nunca** inventes productos, precios, modifiers ni horarios. Todo sale de las tools.
2. **Nunca** llames \`generate_checkout_link\` sin haber mostrado el carrito antes.
3. **Nunca** pidas nombre, dirección, teléfono ni forma de pago. Eso se completa en la web al clickear el link. Si el cliente pregunta "¿cómo pago?" o "¿a dónde mandás?", respondé: *"Todo eso lo cargás en el link al final — elegís delivery o pickup, dirección y forma de pago."*
4. Si el carrito no alcanza el mínimo para delivery, avisá cuánto falta antes de generar el link.
5. Si el local está cerrado y el cliente está por pedir, avisá y preguntá si quiere igual dejar armado el pedido para después.

## Qué sabés y qué NO sabés
**Sabés**: catálogo, modifiers, horarios, info de delivery (fee, mínimo, estimado), dirección del local.
**NO sabés**: estado de pedidos ya hechos, promociones específicas, datos del cliente. Si preguntan, sé honesto.

## Fuera de alcance
Si preguntan algo no relacionado con el negocio, redirigí en una línea:
> "De eso no te puedo ayudar jeje 😅 ¿Querés que veamos algo del menú?"

## Cierre con link
Cuando mandes el link, usá esta estructura:
> "Listo, tenés esto:
> *1× Muzza con aceitunas — $5.500*
> *1× Coca 1.5L — $2.800*
> *Total: $8.300*
>
> Terminá tu pedido acá 👉 [url]
> Ahí cargás dirección y forma de pago."`;

// Max iterations of the tool-calling loop — guard against runaway calls.
// With cart tools the bot may chain search → details → add → get_cart → link
// in a single turn, so we allow a bit more headroom.
const MAX_TOOL_ITERATIONS = 8;

// Override via CHATBOT_MODEL in .env.local. Defaults to gpt-4o which follows
// multi-section prompts reliably; drop to gpt-4o-mini if cost becomes an issue.
const CHATBOT_MODEL = process.env.CHATBOT_MODEL ?? "gpt-4o";

export async function runChatbot(
  input: RunChatbotInput,
): Promise<RunChatbotResult> {
  const service = createSupabaseServiceClient();

  const contactId = await upsertContact(service, input);
  const conversationId = await getOrOpenConversation(
    service,
    input.businessId,
    contactId,
  );
  const history = await fetchHistory(service, conversationId);
  const systemPrompt = await resolveSystemPrompt(
    service,
    input.businessId,
    input.businessName,
  );

  await insertMessage(service, conversationId, "user", input.userMessage);

  const assistantMessage = await invokeLlm({
    businessId: input.businessId,
    businessSlug: input.businessSlug,
    conversationId,
    systemPrompt,
    history,
    userMessage: input.userMessage,
  });

  await insertMessage(service, conversationId, "assistant", assistantMessage);
  await touchConversation(service, conversationId);

  return { conversationId, assistantMessage };
}

export async function closeConversation(
  conversationId: string,
  businessId: string,
): Promise<{ ok: boolean }> {
  const service = createSupabaseServiceClient();
  const { error } = await service
    .from("chatbot_conversations")
    .update({ closed_at: new Date().toISOString() })
    .eq("id", conversationId)
    .eq("business_id", businessId);
  if (error) throw new Error(`Failed to close conversation: ${error.message}`);
  return { ok: true };
}

// ---------------- internals ----------------

type Service = ReturnType<typeof createSupabaseServiceClient>;

async function upsertContact(
  service: Service,
  input: RunChatbotInput,
): Promise<string> {
  const { data: existing } = await service
    .from("chatbot_contacts")
    .select("id")
    .eq("business_id", input.businessId)
    .eq("channel", input.channel)
    .eq("identifier", input.contactIdentifier)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await service
    .from("chatbot_contacts")
    .insert({
      business_id: input.businessId,
      channel: input.channel,
      identifier: input.contactIdentifier,
      display_name: input.contactDisplayName ?? null,
    })
    .select("id")
    .single();
  if (error || !created) {
    throw new Error(`Failed to upsert contact: ${error?.message ?? "unknown"}`);
  }
  return created.id;
}

async function getOrOpenConversation(
  service: Service,
  businessId: string,
  contactId: string,
): Promise<string> {
  const { data: open } = await service
    .from("chatbot_conversations")
    .select("id")
    .eq("contact_id", contactId)
    .is("closed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (open?.id) return open.id;

  const { data: created, error } = await service
    .from("chatbot_conversations")
    .insert({ business_id: businessId, contact_id: contactId })
    .select("id")
    .single();
  if (error || !created) {
    throw new Error(
      `Failed to open conversation: ${error?.message ?? "unknown"}`,
    );
  }
  return created.id;
}

async function fetchHistory(
  service: Service,
  conversationId: string,
): Promise<StoredMessage[]> {
  const { data, error } = await service
    .from("chatbot_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Failed to load history: ${error.message}`);
  return (data ?? []) as StoredMessage[];
}

async function insertMessage(
  service: Service,
  conversationId: string,
  role: Role,
  content: string,
): Promise<void> {
  const { error } = await service
    .from("chatbot_messages")
    .insert({ conversation_id: conversationId, role, content });
  if (error) throw new Error(`Failed to insert message: ${error.message}`);
}

async function touchConversation(service: Service, conversationId: string) {
  await service
    .from("chatbot_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}

async function resolveSystemPrompt(
  service: Service,
  businessId: string,
  businessName: string,
): Promise<string> {
  const { data } = await service
    .from("chatbot_configs")
    .select("system_prompt")
    .eq("business_id", businessId)
    .maybeSingle();

  const template =
    data?.system_prompt && data.system_prompt.trim().length > 0
      ? data.system_prompt
      : DEFAULT_SYSTEM_PROMPT;

  return template.replaceAll("{{businessName}}", businessName);
}

// ---------------- tools ----------------

function buildSearchProductsTool(businessId: string) {
  return tool(
    async ({ query }: { query: string }) => {
      const service = createSupabaseServiceClient();
      const trimmed = query.trim();
      if (!trimmed) {
        return JSON.stringify({ error: "empty query" });
      }
      // Escape ILIKE wildcards in the user-provided fragment so a literal
      // '%' doesn't become a free-for-all match.
      const pattern = `%${trimmed.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;

      const { data, error } = await service
        .from("products")
        .select(
          "name, description, price_cents, is_available, categories(name)",
        )
        .eq("business_id", businessId)
        .eq("is_active", true)
        .or(`name.ilike.${pattern},description.ilike.${pattern}`)
        .order("sort_order", { ascending: true })
        .limit(10);

      if (error) {
        return JSON.stringify({ error: error.message });
      }

      const products = (data ?? []).map((p) => ({
        name: p.name,
        description: p.description ?? null,
        price_cents: p.price_cents,
        price_ars: `$${(Number(p.price_cents) / 100).toFixed(2)}`,
        available: p.is_available,
        category:
          (Array.isArray(p.categories)
            ? p.categories[0]?.name
            : (p.categories as { name: string } | null)?.name) ?? null,
      }));

      return JSON.stringify({ query: trimmed, count: products.length, products });
    },
    {
      name: "search_products",
      description:
        "Busca productos activos del catálogo de este negocio por coincidencia parcial en nombre o descripción. Úsala cuando el cliente pregunte por productos, precios o disponibilidad. Devuelve hasta 10 resultados con nombre, descripción, precio (en centavos y formateado en ARS), disponibilidad y categoría.",
      schema: z.object({
        query: z
          .string()
          .describe(
            "Fragmento de texto a buscar. Ej: 'pizza', 'muzzarella', 'hamburguesa doble', 'bebida'.",
          ),
      }),
    },
  );
}

const DAY_NAMES_ES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

function parseTimeToMinutes(hms: string): number | null {
  // Accept HH:MM or HH:MM:SS.
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(hms);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 24 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function formatMinutesAsHHMM(total: number): string {
  const m = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function buildBusinessStatusTool(businessId: string) {
  return tool(
    async () => {
      const service = createSupabaseServiceClient();
      const [{ data: business }, { data: hours }] = await Promise.all([
        service
          .from("businesses")
          .select("timezone")
          .eq("id", businessId)
          .maybeSingle(),
        service
          .from("business_hours")
          .select("day_of_week, opens_at, closes_at")
          .eq("business_id", businessId),
      ]);

      if (!business) {
        return JSON.stringify({ error: "business not found" });
      }
      const tz = business.timezone || "America/Argentina/Buenos_Aires";
      const now = new Date();
      const currentTime = formatInTimeZone(now, tz, "HH:mm");

      if (!hours || hours.length === 0) {
        return JSON.stringify({
          has_hours: false,
          timezone: tz,
          current_time: currentTime,
          message: "El negocio no tiene horarios configurados.",
        });
      }

      // Position "now" on a 0..10080 week-minutes axis (Sunday 00:00 = 0).
      // date-fns-tz v3: toZonedTime returns a Date whose *UTC* methods reflect
      // the target-zone wall clock. Using .getHours() here would re-apply the
      // server's local offset and break on non-UTC servers.
      const zoned = toZonedTime(now, tz);
      const currentDow = zoned.getUTCDay();
      const currentDayMin =
        zoned.getUTCHours() * 60 + zoned.getUTCMinutes();
      const currentWeekMin = currentDow * 1440 + currentDayMin;

      type Window = {
        startMin: number;
        endMin: number;
        dow: number;
        opensAt: string;
        closesAt: string;
      };

      const windows: Window[] = [];
      for (const h of hours) {
        const opens = parseTimeToMinutes(h.opens_at);
        const closes = parseTimeToMinutes(h.closes_at);
        if (opens == null || closes == null || opens === closes) continue;
        const startMin = h.day_of_week * 1440 + opens;
        const duration =
          closes > opens ? closes - opens : 1440 - opens + closes;
        windows.push({
          startMin,
          endMin: startMin + duration,
          dow: h.day_of_week,
          opensAt: formatMinutesAsHHMM(opens),
          closesAt: formatMinutesAsHHMM(closes),
        });
      }

      // Is any window currently active? Check k=-1,0 to cover cross-week wrap.
      let openWindow: Window | null = null;
      let closeAtWeekMin = 0;
      for (const w of windows) {
        for (const k of [-1, 0]) {
          const s = w.startMin + k * 10080;
          const e = w.endMin + k * 10080;
          if (s <= currentWeekMin && currentWeekMin < e) {
            openWindow = w;
            closeAtWeekMin = e;
            break;
          }
        }
        if (openWindow) break;
      }

      const todayHours = windows
        .filter((w) => w.dow === currentDow)
        .map((w) => ({ opens_at: w.opensAt, closes_at: w.closesAt }));

      if (openWindow) {
        const minutesToClose = closeAtWeekMin - currentWeekMin;
        return JSON.stringify({
          is_open: true,
          current_time: currentTime,
          current_day: DAY_NAMES_ES[currentDow],
          timezone: tz,
          closes_at: openWindow.closesAt,
          closes_in_minutes: minutesToClose,
          today_hours: todayHours,
        });
      }

      // Closed — find next opening across this week / next week wrap.
      let best: { delta: number; dow: number; at: string } | null = null;
      for (const w of windows) {
        for (const k of [0, 1]) {
          const s = w.startMin + k * 10080;
          if (s <= currentWeekMin) continue;
          const delta = s - currentWeekMin;
          if (!best || delta < best.delta) {
            best = { delta, dow: w.dow, at: w.opensAt };
          }
        }
      }

      if (!best) {
        return JSON.stringify({
          is_open: false,
          current_time: currentTime,
          current_day: DAY_NAMES_ES[currentDow],
          timezone: tz,
          today_hours: todayHours,
          message: "No se encontraron próximos horarios.",
        });
      }

      const dowDiff = (best.dow - currentDow + 7) % 7;
      const relative =
        dowDiff === 0 ? "hoy" : dowDiff === 1 ? "mañana" : DAY_NAMES_ES[best.dow];

      return JSON.stringify({
        is_open: false,
        current_time: currentTime,
        current_day: DAY_NAMES_ES[currentDow],
        timezone: tz,
        today_hours: todayHours,
        opens_next: {
          day: DAY_NAMES_ES[best.dow],
          relative,
          at: best.at,
          in_minutes: best.delta,
        },
      });
    },
    {
      name: "check_business_status",
      description:
        "Consulta si el negocio está abierto ahora mismo, a qué hora cierra hoy, y si está cerrado cuándo abre la próxima vez. Úsala siempre que el cliente pregunte por horarios, si están abiertos, o si pueden pasar/pedir ahora. Respeta la timezone del negocio. Devuelve `is_open`, hora actual, horarios de hoy y (si está abierto) `closes_at` + `closes_in_minutes`, o (si está cerrado) `opens_next` con día (hoy/mañana/día de la semana), hora y minutos faltantes.",
      schema: z.object({}),
    },
  );
}

// ---------------- cart helpers ----------------

type CartModifier = {
  modifier_id: string;
  group_id: string;
  name: string;
  price_delta_cents: number;
};

type CartItem = {
  id: string;
  product_id: string;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
  notes?: string;
  image_url?: string | null;
  modifiers: CartModifier[];
};

type CartState = { items: CartItem[] };

type BotCtx = {
  businessId: string;
  businessSlug: string;
  conversationId: string;
};

function readCart(raw: unknown): CartState {
  if (raw && typeof raw === "object" && "items" in raw) {
    const items = (raw as { items: unknown }).items;
    if (Array.isArray(items)) return { items: items as CartItem[] };
  }
  return { items: [] };
}

function lineSubtotalCents(item: CartItem): number {
  const mods = item.modifiers.reduce((a, m) => a + m.price_delta_cents, 0);
  return (item.unit_price_cents + mods) * item.quantity;
}

function formatArs(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

async function getConversationCart(
  service: Service,
  conversationId: string,
): Promise<CartState> {
  const { data, error } = await service
    .from("chatbot_conversations")
    .select("cart_state")
    .eq("id", conversationId)
    .maybeSingle();
  if (error) throw new Error(`cart read failed: ${error.message}`);
  return readCart(data?.cart_state);
}

async function writeConversationCart(
  service: Service,
  conversationId: string,
  cart: CartState,
): Promise<void> {
  const { error } = await service
    .from("chatbot_conversations")
    // supabase expects the Json union; CartState serializes cleanly so this cast is safe.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ cart_state: cart as any })
    .eq("id", conversationId);
  if (error) throw new Error(`cart write failed: ${error.message}`);
}

function summarizeCart(
  cart: CartState,
  minOrderCents: number | null,
): Record<string, unknown> {
  const subtotal = cart.items.reduce((a, i) => a + lineSubtotalCents(i), 0);
  const minRequired = minOrderCents ?? 0;
  return {
    items: cart.items.map((i) => ({
      id: i.id,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price_ars: formatArs(i.unit_price_cents),
      line_subtotal_cents: lineSubtotalCents(i),
      line_subtotal_ars: formatArs(lineSubtotalCents(i)),
      modifiers: i.modifiers.map((m) => ({
        name: m.name,
        price_delta_ars:
          m.price_delta_cents === 0 ? null : formatArs(m.price_delta_cents),
      })),
      notes: i.notes ?? null,
    })),
    subtotal_cents: subtotal,
    subtotal_ars: formatArs(subtotal),
    item_count: cart.items.reduce((a, i) => a + i.quantity, 0),
    min_order_cents: minRequired,
    min_order_ars: minRequired > 0 ? formatArs(minRequired) : null,
    meets_minimum: subtotal >= minRequired,
    missing_for_minimum_ars:
      subtotal >= minRequired ? null : formatArs(minRequired - subtotal),
  };
}

// ---------------- product details + delivery info tools ----------------

function buildProductDetailsTool(businessId: string) {
  return tool(
    async ({ product_id }: { product_id: string }) => {
      const service = createSupabaseServiceClient();
      const { data: product, error: pErr } = await service
        .from("products")
        .select(
          "id, name, description, price_cents, is_available, is_active, category_id, image_url",
        )
        .eq("id", product_id)
        .eq("business_id", businessId)
        .maybeSingle();
      if (pErr) return JSON.stringify({ error: pErr.message });
      if (!product || !product.is_active) {
        return JSON.stringify({ error: "producto no encontrado" });
      }

      const { data: groups, error: gErr } = await service
        .from("modifier_groups")
        .select(
          "id, name, min_selection, max_selection, is_required, sort_order, modifiers(id, name, price_delta_cents, is_available, sort_order)",
        )
        .eq("business_id", businessId)
        .eq("product_id", product_id)
        .order("sort_order", { ascending: true });
      if (gErr) return JSON.stringify({ error: gErr.message });

      const modifierGroups = (groups ?? []).map((g) => ({
        id: g.id,
        name: g.name,
        min_selection: g.min_selection,
        max_selection: g.max_selection,
        is_required: g.is_required,
        modifiers: (
          (Array.isArray(g.modifiers) ? g.modifiers : []) as Array<{
            id: string;
            name: string;
            price_delta_cents: number;
            is_available: boolean;
            sort_order: number;
          }>
        )
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((m) => ({
            id: m.id,
            name: m.name,
            price_delta_cents: m.price_delta_cents,
            price_delta_ars:
              m.price_delta_cents === 0
                ? null
                : formatArs(m.price_delta_cents),
            is_available: m.is_available,
          })),
      }));

      return JSON.stringify({
        id: product.id,
        name: product.name,
        description: product.description,
        price_cents: product.price_cents,
        price_ars: formatArs(product.price_cents),
        is_available: product.is_available,
        image_url: product.image_url,
        modifier_groups: modifierGroups,
      });
    },
    {
      name: "get_product_details",
      description:
        "Devuelve los detalles completos de un producto, incluyendo sus grupos de opciones (modifiers) con reglas (min/max, requerido). Úsala antes de agregar al carrito un producto que pueda tener opciones, para preguntarle al cliente qué elige.",
      schema: z.object({
        product_id: z
          .string()
          .describe(
            "UUID del producto. Se obtiene del resultado de search_products o add_to_cart.",
          ),
      }),
    },
  );
}

function buildDeliveryInfoTool(businessId: string) {
  return tool(
    async () => {
      const service = createSupabaseServiceClient();
      const { data: b, error } = await service
        .from("businesses")
        .select(
          "address, delivery_fee_cents, min_order_cents, estimated_delivery_minutes, mp_accepts_payments, phone",
        )
        .eq("id", businessId)
        .maybeSingle();
      if (error || !b) {
        return JSON.stringify({ error: "business info unavailable" });
      }
      return JSON.stringify({
        delivery_fee_cents: b.delivery_fee_cents ?? 0,
        delivery_fee_ars: formatArs(b.delivery_fee_cents ?? 0),
        min_order_cents: b.min_order_cents ?? 0,
        min_order_ars:
          (b.min_order_cents ?? 0) > 0
            ? formatArs(b.min_order_cents ?? 0)
            : null,
        estimated_delivery_minutes: b.estimated_delivery_minutes ?? null,
        pickup_address: b.address ?? null,
        business_phone: b.phone ?? null,
        accepts_cash: true,
        accepts_mp: Boolean(b.mp_accepts_payments),
      });
    },
    {
      name: "get_delivery_info",
      description:
        "Devuelve info de delivery del negocio: costo de envío, mínimo de pedido, tiempo estimado, dirección para pickup, formas de pago aceptadas. Úsala cuando el cliente pregunte por envío, mínimo, dirección del local, cuánto tarda, o formas de pago.",
      schema: z.object({}),
    },
  );
}

// ---------------- cart tools ----------------

async function fetchMinOrderCents(
  service: Service,
  businessId: string,
): Promise<number> {
  const { data } = await service
    .from("businesses")
    .select("min_order_cents")
    .eq("id", businessId)
    .maybeSingle();
  return data?.min_order_cents ?? 0;
}

function buildGetCartTool(ctx: BotCtx) {
  return tool(
    async () => {
      const service = createSupabaseServiceClient();
      const cart = await getConversationCart(service, ctx.conversationId);
      const minOrder = await fetchMinOrderCents(service, ctx.businessId);
      return JSON.stringify(summarizeCart(cart, minOrder));
    },
    {
      name: "get_cart",
      description:
        "Muestra el estado actual del carrito: líneas con nombre/cantidad/modifiers, subtotal, y si alcanza el mínimo de delivery. Úsala cuando el cliente pregunte por el estado del pedido, los totales, o antes de generar el link de checkout.",
      schema: z.object({}),
    },
  );
}

function buildAddToCartTool(ctx: BotCtx) {
  return tool(
    async ({
      product_id,
      quantity,
      modifier_ids,
      notes,
    }: {
      product_id: string;
      quantity: number;
      modifier_ids?: string[];
      notes?: string;
    }) => {
      const service = createSupabaseServiceClient();

      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return JSON.stringify({ error: "quantity debe ser entero entre 1 y 99" });
      }

      // 1) Validate product.
      const { data: product, error: pErr } = await service
        .from("products")
        .select("id, name, price_cents, is_active, is_available, image_url")
        .eq("id", product_id)
        .eq("business_id", ctx.businessId)
        .maybeSingle();
      if (pErr) return JSON.stringify({ error: pErr.message });
      if (!product || !product.is_active) {
        return JSON.stringify({ error: "producto no encontrado" });
      }
      if (!product.is_available) {
        return JSON.stringify({
          error: `el producto "${product.name}" no está disponible ahora`,
        });
      }

      // 2) Load product's modifier groups.
      const { data: groups } = await service
        .from("modifier_groups")
        .select(
          "id, name, min_selection, max_selection, is_required, modifiers(id, name, price_delta_cents, is_available, group_id)",
        )
        .eq("business_id", ctx.businessId)
        .eq("product_id", product_id);

      const selectedIds = modifier_ids ?? [];
      const modifierSnapshots: CartModifier[] = [];

      if (groups && groups.length > 0) {
        // Build lookup of modifier_id -> (modifier, group) for fast checks.
        const flat = new Map<
          string,
          {
            mod: {
              id: string;
              name: string;
              price_delta_cents: number;
              is_available: boolean;
              group_id: string;
            };
            group: { id: string; name: string; max_selection: number };
          }
        >();
        for (const g of groups) {
          const mods = (Array.isArray(g.modifiers) ? g.modifiers : []) as Array<{
            id: string;
            name: string;
            price_delta_cents: number;
            is_available: boolean;
            group_id: string;
          }>;
          for (const m of mods) {
            flat.set(m.id, {
              mod: m,
              group: { id: g.id, name: g.name, max_selection: g.max_selection },
            });
          }
        }

        // Validate selected ids exist and are available.
        const selectedByGroup = new Map<string, string[]>();
        for (const id of selectedIds) {
          const match = flat.get(id);
          if (!match) {
            return JSON.stringify({
              error: `modifier ${id} no pertenece a este producto`,
            });
          }
          if (!match.mod.is_available) {
            return JSON.stringify({
              error: `la opción "${match.mod.name}" no está disponible`,
            });
          }
          const list = selectedByGroup.get(match.group.id) ?? [];
          list.push(id);
          selectedByGroup.set(match.group.id, list);
          modifierSnapshots.push({
            modifier_id: match.mod.id,
            group_id: match.group.id,
            name: match.mod.name,
            price_delta_cents: match.mod.price_delta_cents,
          });
        }

        // Validate min/max per group.
        for (const g of groups) {
          const count = (selectedByGroup.get(g.id) ?? []).length;
          const needsMin = g.is_required ? Math.max(1, g.min_selection) : g.min_selection;
          if (count < needsMin) {
            return JSON.stringify({
              error: `falta elegir en "${g.name}" (mínimo ${needsMin}).`,
              missing_group: { id: g.id, name: g.name, min: needsMin, max: g.max_selection },
            });
          }
          if (count > g.max_selection) {
            return JSON.stringify({
              error: `elegiste demasiadas opciones en "${g.name}" (máximo ${g.max_selection}).`,
              group: { id: g.id, name: g.name, max: g.max_selection },
            });
          }
        }
      } else if (selectedIds.length > 0) {
        return JSON.stringify({
          error: "este producto no acepta opciones",
        });
      }

      // 3) Load current cart, append, save.
      const cart = await getConversationCart(service, ctx.conversationId);
      const lineId = globalThis.crypto.randomUUID();
      cart.items.push({
        id: lineId,
        product_id: product.id,
        product_name: product.name,
        unit_price_cents: product.price_cents,
        quantity,
        notes: notes?.trim() || undefined,
        image_url: product.image_url ?? null,
        modifiers: modifierSnapshots,
      });
      await writeConversationCart(service, ctx.conversationId, cart);

      const minOrder = await fetchMinOrderCents(service, ctx.businessId);
      return JSON.stringify({
        ok: true,
        added_line_id: lineId,
        cart: summarizeCart(cart, minOrder),
      });
    },
    {
      name: "add_to_cart",
      description:
        "Agrega un producto al carrito con cantidad, modifiers opcionales y notas. Valida modifiers contra el producto. Si falla, te dice qué falta. Si tiene éxito, devuelve el carrito actualizado.",
      schema: z.object({
        product_id: z.string().describe("UUID del producto."),
        quantity: z.number().int().min(1).max(99),
        modifier_ids: z
          .array(z.string())
          .optional()
          .describe(
            "IDs de modifiers elegidos por el cliente (obtenidos de get_product_details). Respeta min/max por grupo.",
          ),
        notes: z
          .string()
          .max(200)
          .optional()
          .describe("Notas opcionales del cliente para esta línea."),
      }),
    },
  );
}

function buildRemoveFromCartTool(ctx: BotCtx) {
  return tool(
    async ({ line_id }: { line_id: string }) => {
      const service = createSupabaseServiceClient();
      const cart = await getConversationCart(service, ctx.conversationId);
      const before = cart.items.length;
      cart.items = cart.items.filter((i) => i.id !== line_id);
      if (cart.items.length === before) {
        return JSON.stringify({ error: "no se encontró esa línea en el carrito" });
      }
      await writeConversationCart(service, ctx.conversationId, cart);
      const minOrder = await fetchMinOrderCents(service, ctx.businessId);
      return JSON.stringify({ ok: true, cart: summarizeCart(cart, minOrder) });
    },
    {
      name: "remove_from_cart",
      description:
        "Quita una línea del carrito por su line_id (el `id` que devolvió get_cart o add_to_cart).",
      schema: z.object({
        line_id: z.string().describe("ID de la línea del carrito a remover."),
      }),
    },
  );
}

function buildGenerateCheckoutLinkTool(ctx: BotCtx) {
  return tool(
    async () => {
      const service = createSupabaseServiceClient();
      const { data: conv, error } = await service
        .from("chatbot_conversations")
        .select("cart_state, cart_token, closed_at")
        .eq("id", ctx.conversationId)
        .maybeSingle();
      if (error || !conv) {
        return JSON.stringify({ error: "conversation not found" });
      }
      const cart = readCart(conv.cart_state);
      if (cart.items.length === 0) {
        return JSON.stringify({ error: "el carrito está vacío" });
      }

      let token = conv.cart_token;
      if (!token) {
        token = globalThis.crypto
          .randomUUID()
          .replace(/-/g, "")
          .slice(0, 16);
        const { error: updErr } = await service
          .from("chatbot_conversations")
          .update({ cart_token: token })
          .eq("id", ctx.conversationId);
        if (updErr) {
          return JSON.stringify({
            error: `failed to persist token: ${updErr.message}`,
          });
        }
      }

      const base =
        process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
        "http://localhost:3000";
      const url = `${base}/${ctx.businessSlug}/cart/${token}`;
      return JSON.stringify({ url, token });
    },
    {
      name: "generate_checkout_link",
      description:
        "Genera el link al checkout web con el carrito actual pre-cargado. Llamala solo cuando el cliente confirmó que terminó de armar el pedido y llamaste get_cart en el mensaje previo. Devuelve la URL que tenés que mandar al cliente para que complete dirección y pago.",
      schema: z.object({}),
    },
  );
}

// ---------------- LLM loop ----------------

async function invokeLlm({
  businessId,
  businessSlug,
  conversationId,
  systemPrompt,
  history,
  userMessage,
}: {
  businessId: string;
  businessSlug: string;
  conversationId: string;
  systemPrompt: string;
  history: StoredMessage[];
  userMessage: string;
}): Promise<string> {
  const ctx = { businessId, businessSlug, conversationId };
  const tools: StructuredToolInterface[] = [
    buildSearchProductsTool(businessId),
    buildBusinessStatusTool(businessId),
    buildProductDetailsTool(businessId),
    buildDeliveryInfoTool(businessId),
    buildGetCartTool(ctx),
    buildAddToCartTool(ctx),
    buildRemoveFromCartTool(ctx),
    buildGenerateCheckoutLinkTool(ctx),
  ];
  const toolsByName: Record<string, StructuredToolInterface> =
    Object.fromEntries(tools.map((t) => [t.name, t]));

  const llm = new ChatOpenAI({
    model: CHATBOT_MODEL,
    temperature: 0.3,
  }).bindTools(tools);

  const messages: BaseMessage[] = [new SystemMessage(systemPrompt)];

  // When the conversation history is empty, nudge the model so it doesn't fall
  // back to a generic "¿en qué te ayudo?" reply. The prompt has a "Primer
  // mensaje" section but short user inputs like "buenas" tend to override it
  // unless we flag the turn explicitly.
  if (history.length === 0) {
    messages.push(
      new SystemMessage(
        "[turn:first] Este es el PRIMER mensaje del cliente en esta conversación. Tu respuesta tiene que seguir obligatoriamente la estructura de 3 partes definida en la sección 'Primer mensaje de la conversación': (1) saludo mencionando al negocio, (2) estado del local usando check_business_status, (3) invitación a pedir. No respondas con un mensaje genérico tipo '¿en qué te ayudo?'.",
      ),
    );
  }

  for (const m of history) {
    if (m.role === "user") messages.push(new HumanMessage(m.content));
    else if (m.role === "assistant") messages.push(new AIMessage(m.content));
  }
  messages.push(new HumanMessage(userMessage));

  for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
    const response = await llm.invoke(messages);
    messages.push(response);

    const calls = response.tool_calls ?? [];
    if (calls.length === 0) {
      return extractText(response.content);
    }

    for (const call of calls) {
      const target = toolsByName[call.name];
      let resultText: string;
      if (!target) {
        resultText = JSON.stringify({ error: `unknown tool: ${call.name}` });
      } else {
        try {
          const result = await target.invoke(call);
          resultText =
            typeof result === "string"
              ? result
              : typeof result?.content === "string"
                ? result.content
                : JSON.stringify(result);
        } catch (err) {
          resultText = JSON.stringify({
            error: err instanceof Error ? err.message : "tool failed",
          });
        }
      }
      console.log(
        `[chatbot] tool=${call.name} args=${JSON.stringify(call.args)} → ${resultText.slice(0, 400)}`,
      );
      messages.push(
        new ToolMessage({
          content: resultText,
          tool_call_id: call.id ?? "",
        }),
      );
    }
  }

  // Safety net: if we exhausted iterations without a final answer, ask the
  // model one more time explicitly for a plain-text response.
  messages.push(
    new HumanMessage(
      "(Se alcanzó el límite de llamadas a herramientas. Respondé ahora con lo que sepas, sin llamar más herramientas.)",
    ),
  );
  const finalLlm = new ChatOpenAI({ model: CHATBOT_MODEL, temperature: 0.3 });
  const final = await finalLlm.invoke(messages);
  return extractText(final.content);
}

function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        typeof part === "string"
          ? part
          : part && typeof part === "object" && "text" in part
            ? String((part as { text: unknown }).text ?? "")
            : "",
      )
      .join("");
  }
  return "";
}
