import "server-only";

/**
 * Minimal Pexels client — solo `searchPhoto`.
 * Free tier: 200 requests / hora, 20k / mes. No requiere SDK, fetch nativo.
 */

export type PexelsPhoto = {
  id: number;
  width: number;
  height: number;
  url: string;
  alt: string;
  photographer: string;
  src: {
    original: string;
    large: string;
    large2x: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
};

type PexelsSearchResponse = {
  photos?: PexelsPhoto[];
  total_results?: number;
};

export type PexelsRateLimitError = { kind: "rate_limit" };
export type PexelsNotConfigured = { kind: "not_configured" };

export async function searchPexelsPhoto(
  query: string,
  opts: { orientation?: "landscape" | "portrait" | "square" } = {},
): Promise<PexelsPhoto | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("PEXELS_API_KEY missing"), {
      kind: "not_configured",
    } satisfies PexelsNotConfigured);
  }

  const params = new URLSearchParams({
    query,
    per_page: "1",
    orientation: opts.orientation ?? "landscape",
  });
  const res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
    headers: { Authorization: apiKey },
    // Pexels does honor Cache-Control; default fetch caching here is fine
    cache: "no-store",
  });

  if (res.status === 429) {
    throw Object.assign(new Error("Rate limit hit"), {
      kind: "rate_limit",
    } satisfies PexelsRateLimitError);
  }
  if (!res.ok) {
    throw new Error(`Pexels API error: ${res.status}`);
  }

  const data = (await res.json()) as PexelsSearchResponse;
  return data.photos?.[0] ?? null;
}
