const HEX = /^#[0-9a-fA-F]{3,8}$/;

function sanitize(color: string | undefined, fallback: string): string {
  if (!color) return fallback;
  const trimmed = color.trim();
  return HEX.test(trimmed) ? trimmed : fallback;
}

export function BrandStyle({
  primary,
  primaryForeground,
  scope = "[data-admin-brand]",
}: {
  primary?: string;
  primaryForeground?: string;
  scope?: string;
}) {
  const brand = sanitize(primary, "#E11D48");
  const brandFg = sanitize(primaryForeground, "#FFFFFF");
  const css = `
${scope} {
  --brand: ${brand};
  --brand-foreground: ${brandFg};
  --brand-soft: color-mix(in srgb, ${brand} 10%, #ffffff);
  --brand-hover: color-mix(in srgb, ${brand} 90%, #000000);
}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
