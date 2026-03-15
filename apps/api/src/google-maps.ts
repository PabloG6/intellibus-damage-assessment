import type { IncidentAddress, IncidentAddressResolution } from "./incidents";

interface GoogleGeocodeResult {
  formatted_address: string;
  place_id: string;
  types: string[];
}

interface GoogleGeocodeResponse {
  status: string;
  results: GoogleGeocodeResult[];
  error_message?: string;
}

const ADDRESS_FALLBACK_ORDER: IncidentAddressResolution[] = [
  "street_address",
  "route",
  "locality",
];

export function shouldEnrichAddress(
  incident: { formattedAddress: string | null },
  refresh = false,
) {
  return refresh || !incident.formattedAddress;
}

export function pickBestReverseGeocodeMatch(
  results: GoogleGeocodeResult[],
): IncidentAddress {
  for (const resolution of ADDRESS_FALLBACK_ORDER) {
    const match = results.find((result) => result.types.includes(resolution));
    if (match) {
      return {
        formatted: match.formatted_address,
        placeId: match.place_id,
        resolution,
      };
    }
  }

  return {
    formatted: null,
    placeId: null,
    resolution: "missing",
  };
}

export async function reverseGeocodeAddress(
  centroid: [number, number],
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<IncidentAddress> {
  const [lng, lat] = centroid;
  const searchParams = new URLSearchParams({
    latlng: `${lat},${lng}`,
    key: apiKey,
  });
  const response = await fetchImpl(
    `https://maps.googleapis.com/maps/api/geocode/json?${searchParams.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Google reverse geocode failed with HTTP ${response.status}`);
  }

  const payload = (await response.json()) as GoogleGeocodeResponse;

  if (payload.status === "ZERO_RESULTS") {
    return {
      formatted: null,
      placeId: null,
      resolution: "missing",
    };
  }

  if (payload.status !== "OK") {
    throw new Error(payload.error_message ?? `Google reverse geocode failed with ${payload.status}`);
  }

  return pickBestReverseGeocodeMatch(payload.results);
}
