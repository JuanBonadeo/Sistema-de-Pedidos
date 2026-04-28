/**
 * Message template helpers.
 *
 * Available placeholders:
 *   {name}     — customer name (or empty if missing)
 *   {code}     — personal promo code generated for this customer
 *   {discount} — humanized discount ("20% OFF" / "$1500 OFF" / "Envío gratis")
 *   {business} — business name
 *
 * Sustitución es naive — solo string replace, sin escape. El admin escribe
 * el template y nosotros lo renderizamos por cliente. Si el dueño escribe
 * "{nombre}" en lugar de "{name}" no rompe — queda como literal en el msg.
 */

export type RenderContext = {
  name: string | null;
  code: string;
  discount: string;
  business: string;
};

export function renderTemplate(template: string, ctx: RenderContext): string {
  return template
    .replaceAll("{name}", ctx.name?.trim() || "")
    .replaceAll("{code}", ctx.code)
    .replaceAll("{discount}", ctx.discount)
    .replaceAll("{business}", ctx.business);
}

/**
 * Generate a friendly random code: PREFIX-A1B2C3 (6 alphanum chars) or just
 * A1B2C3 if no prefix. Avoids 0/O/I/1 ambiguity.
 */
const SAFE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generatePromoCode(prefix?: string): string {
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += SAFE_ALPHABET[Math.floor(Math.random() * SAFE_ALPHABET.length)];
  }
  if (prefix) {
    const cleanPrefix = prefix.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
    if (cleanPrefix) return `${cleanPrefix}-${suffix}`;
  }
  return suffix;
}

export const MESSAGE_TEMPLATE_PRESETS: { label: string; template: string }[] = [
  {
    label: "Volvé pronto (clientes inactivos)",
    template:
      "Hola {name}! Hace tiempo que no nos visitás 🥺 Te dejo un código para que vuelvas: *{code}* — {discount}. Te esperamos!",
  },
  {
    label: "Bienvenida (clientes nuevos)",
    template:
      "Hola {name}! Gracias por tu primer pedido en {business} 🙌 Para tu próxima compra usá *{code}* y te llevás {discount}.",
  },
  {
    label: "VIP (top spenders)",
    template:
      "Hola {name}! Sos uno de nuestros mejores clientes ✨ Como agradecimiento te dejo un código exclusivo: *{code}* ({discount}).",
  },
  {
    label: "Genérico",
    template:
      "Hola {name}! Te dejo un código de descuento para tu próximo pedido en {business}: *{code}* — {discount} 🎁",
  },
];

/**
 * Build a wa.me deep link with phone + pre-filled message. Phones are stripped
 * of non-digits so wa.me accepts them. If the phone is empty we return null.
 */
export function buildWaMeLink(phone: string, message: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
