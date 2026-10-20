import { Suspense } from "react";
import Link from "next/link";
import { getItemsBrowse, searchItems } from "@/lib/queries";
import {
  isItemDropoffFilter,
  isItemStatus,
  type ItemDropoffFilter,
  type ItemListFilters,
  type ItemStatus,
} from "@/lib/itemFilters";
import { itemTone } from "@/lib/statusTone";
import { StatusBadge } from "@/components/StatusBadge";
import { SearchInput } from "@/components/SearchInput";
import { ItemsFilters } from "@/components/ItemsFilters";
import { Card } from "@/components/Card";
import { Spinner } from "@/components/Spinner";
import { Pagination } from "@/components/Pagination";

const HEADERS = [
  "Title",
  "Owner",
  "Status",
  "Drop-off",
  "Points (acquire)",
  "Points (rent)",
  "Listed",
];

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
              <td className="px-4 py-3 text-ink-secondary">
                {item.ownerWillingToDropoff ? "Yes" : "No"}
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

function listExtraQuery(q: string, filters: ItemListFilters) {
  return {
    q: q || undefined,
    status: filters.status && filters.status !== "all" ? filters.status : undefined,
    dropoff: filters.dropoff && filters.dropoff !== "all" ? filters.dropoff : undefined,
  };
}

// Fetches the matching count and the page/search results together so they always
// appear in the same paint. Unfiltered (and filter-only) browsing pages via a
// Firestore cursor stack; an active search term stays capped at a bounded result
// set (see searchItems) rather than paginated.
async function ItemsContent({
  q,
  cursors,
  filters,
}: {
  q: string;
  cursors: string[];
  filters: ItemListFilters;
}) {
  if (q) {
    const items = await searchItems(q, filters);
    return (
      <>
        <p className="mb-3 text-sm text-ink-muted">
          {items.length.toLocaleString()} search result{items.length === 1 ? "" : "s"}
        </p>
        <ItemsTableBody items={items} />
      </>
    );
  }

  const page = await getItemsBrowse(cursors[cursors.length - 1], filters);

  return (
    <>
      <p className="mb-3 text-sm text-ink-muted">{page.total.toLocaleString()} items</p>
      <ItemsTableBody items={page.rows} />
      <Pagination
        basePath="/items"
        currentPage={cursors.length + 1}
        hasPrev={cursors.length > 0}
        hasNext={page.nextCursor !== null}
        prevCursors={cursors.slice(0, -1)}
        nextCursors={page.nextCursor ? [...cursors, page.nextCursor] : cursors}
        extraQuery={listExtraQuery(q, filters)}
      />
    </>
  );
}

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; dropoff?: string; cursors?: string }>;
}) {
  const {
    q = "",
    status: statusParam = "",
    dropoff: dropoffParam = "",
    cursors: cursorsParam = "",
  } = await searchParams;
  const status: ItemStatus | "all" = isItemStatus(statusParam) ? statusParam : "all";
  const dropoff: ItemDropoffFilter = isItemDropoffFilter(dropoffParam) ? dropoffParam : "all";
  const filters: ItemListFilters = { status, dropoff };
  const cursors = cursorsParam ? cursorsParam.split(",").filter(Boolean) : [];

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-4 text-lg font-semibold text-ink-primary">Items</h1>
      <div className="mb-3">
        <ItemsFilters q={q} status={status} dropoff={dropoff} />
      </div>
      <div className="mb-6">
        <SearchInput
          initialValue={q}
          placeholder="Search by title, description, item ID, or owner ID…"
          extraParams={listExtraQuery("", filters)}
        />
      </div>
      <Suspense key={`${q}|${status}|${dropoff}|${cursorsParam}`} fallback={<Spinner />}>
        <ItemsContent q={q} cursors={cursors} filters={filters} />
      </Suspense>
    </div>
  );
}
