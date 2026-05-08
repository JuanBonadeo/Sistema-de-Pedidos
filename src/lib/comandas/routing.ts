/**
 * Resuelve a qué station se rutea un item al insertarlo en una comanda.
 *
 * Precedencia: override del producto > default de la categoría > fallback global.
 *
 * Función pura — sin DB, fácil de testear.
 */
export function resolveStation(
  product: {
    station_id: string | null;
    category: { station_id: string | null } | null;
  },
  fallbackStationId: string | null = null,
): string | null {
  return product.station_id ?? product.category?.station_id ?? fallbackStationId;
}
