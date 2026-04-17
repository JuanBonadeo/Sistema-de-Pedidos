const formatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(cents: number | bigint): string {
  const asNumber = typeof cents === "bigint" ? Number(cents) : cents;
  return formatter.format(asNumber / 100);
}
