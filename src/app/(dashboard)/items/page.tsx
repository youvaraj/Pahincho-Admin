import { Suspense } from "react";
import Link from "next/link";
import { getItemsCount, getItemsPage, searchItems } from "@/lib/queries";
import { itemTone } from "@/lib/statusTone";
import { StatusBadge } from "@/components/StatusBadge";
import { SearchInput } from "@/components/SearchInput";
import { Card } from "@/components/Card";
import { Spinner } from "@/components/Spinner";
import { Pagination } from "@/components/Pagination";

const HEADERS = ["Title", "Owner", "Status", "Points (acquire)", "Points (rent)", "Listed"];

function ItemsTableBody({ items }: { items: Awaited<ReturnType<typeof searchItems>> }) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-ink-secondary">
          <tr>
            {HEADERS.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.itemId} className="border-b border-border last:border-0 hover:bg-page">
              <td className="px-4 py-3 font-medium">
                <Link href={`/items/${item.itemId}`} className="text-accent hover:underline">
                  {item.title}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/users/${item.ownerId}`}
                  className="font-mono text-xs text-ink-secondary hover:underline"
                >
                  {item.ownerId}
                </Link>
              </td>
              <td className="px-4 py-3">
                <StatusBadge tone={itemTone(item.status)} label={item.status} />
              </td>
              <td className="px-4 py-3">{item.pointsToAcquire}</td>
              <td className="px-4 py-3">{item.pointsToRent}</td>
              <td className="px-4 py-3 text-ink-muted">
                {item.listedAt ? new Date(item.listedAt).toLocaleDateString() : "—"}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={HEADERS.length} className="px-4 py-6 text-center text-ink-muted">
                No items found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}

// Fetches the total count and the page/search results together so they always
// appear in the same paint. Unfiltered browsing pages via a Firestore cursor stack
// (Prev/Next, 25 at a time — see Pagination); an active search term stays capped at
// a bounded result set (see searchItems) rather than paginated, since the
// prefix/id/owner/substring fallback chain doesn't have one stable shared cursor to
// page through, and a real search is usually narrow anyway.
async function ItemsContent({ q, cursors }: { q: string; cursors: string[] }) {
  const total = await getItemsCount();

  if (q) {
    const items = await searchItems(q);
    return (
      <>
        <h1 className="mb-6 flex items-center gap-2 text-lg font-semibold text-ink-primary">
          Items <span className="text-ink-muted">({total.toLocaleString()})</span>
        </h1>
        <ItemsTableBody items={items} />
      </>
    );
  }

  const page = await getItemsPage(cursors[cursors.length - 1]);
  return (
    <>
      <h1 className="mb-6 flex items-center gap-2 text-lg font-semibold text-ink-primary">
        Items <span className="text-ink-muted">({total.toLocaleString()})</span>
      </h1>
      <ItemsTableBody items={page.rows} />
      <Pagination
        basePath="/items"
        currentPage={cursors.length + 1}
        hasPrev={cursors.length > 0}
        hasNext={page.nextCursor !== null}
        prevCursors={cursors.slice(0, -1)}
        nextCursors={page.nextCursor ? [...cursors, page.nextCursor] : cursors}
      />
    </>
  );
}

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cursors?: string }>;
}) {
  const { q = "", cursors: cursorsParam = "" } = await searchParams;
  const cursors = cursorsParam ? cursorsParam.split(",").filter(Boolean) : [];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <SearchInput initialValue={q} placeholder="Search by title, description, item ID, or owner ID…" />
      </div>
      <Suspense key={`${q}|${cursorsParam}`} fallback={<Spinner />}>
        <ItemsContent q={q} cursors={cursors} />
      </Suspense>
    </div>
  );
}
