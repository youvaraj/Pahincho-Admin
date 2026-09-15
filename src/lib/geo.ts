export type LocationFields = {
  itemCity: string | null;
  itemZipCode: string | null;
  requesterCity: string | null;
  requesterZipCode: string | null;
  distanceMiles: number | null;
};

/** Haversine distance in miles — same formula/radius as the RN app. */
export function haversineMiles(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function formatCityZip(city: string | null, zipCode: string | null): string {
  const parts = [city, zipCode].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

export function formatMiles(miles: number | null): string {
  if (miles == null || !Number.isFinite(miles)) return "—";
  if (miles < 0.1) return "Nearby";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}
