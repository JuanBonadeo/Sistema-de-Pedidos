/**
 * Converts a hex color ("#E11D48" or "E11D48") to the space-separated HSL
 * triplet that shadcn/Tailwind CSS vars expect (e.g. "347 89% 57%").
 */
export function hexToHsl(hex: string): string {
  const match = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(match)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const r = parseInt(match.slice(0, 2), 16) / 255;
  const g = parseInt(match.slice(2, 4), 16) / 255;
  const b = parseInt(match.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));

    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;

    h = h * 60;
    if (h < 0) h += 360;
  }

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
