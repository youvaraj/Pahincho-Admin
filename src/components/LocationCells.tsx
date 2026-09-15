import { formatCityZip, formatMiles, type LocationFields } from "@/lib/geo";

export const LOCATION_HEADERS = [
  "Item location",
  "Requester location",
  "Distance",
] as const;

export function LocationCells({ place }: { place: LocationFields }) {
  return (
    <>
      <td className="px-4 py-3 text-ink-muted">
        {formatCityZip(place.itemCity, place.itemZipCode)}
      </td>
      <td className="px-4 py-3 text-ink-muted">
        {formatCityZip(place.requesterCity, place.requesterZipCode)}
      </td>
      <td className="px-4 py-3 text-ink-muted">{formatMiles(place.distanceMiles)}</td>
    </>
  );
}
