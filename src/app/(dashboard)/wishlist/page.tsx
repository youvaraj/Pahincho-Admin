import { Suspense } from "react";
import {
  enrichWishlistWithUsers,
  getWishlistCount,
  getWishlistPage,
} from "@/lib/queries";
import { WishlistTable } from "@/components/WishlistTable";
import { Spinner } from "@/components/Spinner";
import { Pagination } from "@/components/Pagination";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function WishlistContent({ cursors }: { cursors: string[] }) {
  const [total, page] = await Promise.all([
    getWishlistCount(),
    getWishlistPage(cursors[cursors.length - 1]),
  ]);
  const rows = await enrichWishlistWithUsers(page.rows);

  return (
    <>
      <h1 className="mb-6 flex items-center gap-2 text-lg font-semibold text-ink-primary">
        Wishlist <span className="text-ink-muted">({total.toLocaleString()})</span>
      </h1>
      <WishlistTable rows={rows} />
      <Pagination
        basePath="/wishlist"
        currentPage={cursors.length + 1}
        hasPrev={cursors.length > 0}
        hasNext={page.nextCursor !== null}
        prevCursors={cursors.slice(0, -1)}
        nextCursors={page.nextCursor ? [...cursors, page.nextCursor] : cursors}
      />
    </>
  );
}

export default async function WishlistPage({
  searchParams,
}: {
  searchParams: Promise<{ cursors?: string }>;
}) {
  const { cursors: cursorsParam = "" } = await searchParams;
  const cursors = cursorsParam ? cursorsParam.split(",").filter(Boolean) : [];

  return (
    <div className="mx-auto max-w-6xl">
      <p className="mb-6 text-sm text-ink-secondary">
        What neighbors are looking for — newest first. Click a user to open their profile.
      </p>
      <Suspense key={cursorsParam} fallback={<Spinner />}>
        <WishlistContent cursors={cursors} />
      </Suspense>
    </div>
  );
}
