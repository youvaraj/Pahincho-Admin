import { getGuestUsers } from "@/lib/queries";
import { Card } from "@/components/Card";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const HEADERS = ["User id", "First opened", "Last opened", "Location", "Location updated", "Searches"];

function formatWhen(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function formatPlace(city: string | null, state: string | null, country: string | null): string {
  const parts = [city, state, country].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

export default async function GuestsPage() {
  const guests = await getGuestUsers();
  const withLocation = guests.filter((guest) => guest.city || guest.state || guest.country).length;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-1 text-lg font-semibold text-ink-primary">
        Guest users <span className="text-ink-muted">({guests.length.toLocaleString()})</span>
      </h1>
      <p className="mb-6 text-sm text-ink-secondary">
        Anonymous browse sessions. Location and searches appear after the 1.3.5 update, once a guest
        allows location or uses the home search box. {withLocation.toLocaleString()} of {guests.length.toLocaleString()} have a city.
      </p>
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-ink-secondary">
            <tr>
              {HEADERS.map((header) => (
                <th key={header} className="px-4 py-3 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {guests.map((guest) => (
              <tr key={guest.uid} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-ink-secondary">{guest.uid}</td>
                <td className="px-4 py-3 text-ink-muted">{formatWhen(guest.createdAt)}</td>
                <td className="px-4 py-3 text-ink-muted">{formatWhen(guest.lastSignInAt)}</td>
                <td className="px-4 py-3">
                  {formatPlace(guest.city, guest.state, guest.country)}
                </td>
                <td className="px-4 py-3 text-ink-muted">{formatWhen(guest.locationUpdatedAt)}</td>
                <td className="px-4 py-3">
                  {guest.recentSearches.length ? guest.recentSearches.join(", ") : "—"}
                </td>
              </tr>
            ))}
            {guests.length === 0 && (
              <tr>
                <td colSpan={HEADERS.length} className="px-4 py-6 text-center text-ink-muted">
                  No anonymous guests.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
