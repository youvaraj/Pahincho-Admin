import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Prev/Next paging over a Firestore cursor stack — each `cursors` entry is the last
 * doc id of the page reached by that step, so building the next/prev href is just
 * pushing/popping the stack. No arbitrary page-N jump: Firestore has no cheap
 * random-access offset, so this intentionally stays sequential (constant cost per
 * click, regardless of how deep you page).
 */
export function Pagination({
  basePath,
  currentPage,
  hasPrev,
  hasNext,
  prevCursors,
  nextCursors,
}: {
  basePath: string;
  currentPage: number;
  hasPrev: boolean;
  hasNext: boolean;
  prevCursors: string[];
  nextCursors: string[];
}) {
  const prevHref = prevCursors.length ? `${basePath}?cursors=${prevCursors.join(",")}` : basePath;
  const nextHref = `${basePath}?cursors=${nextCursors.join(",")}`;

  return (
    <div className="mt-4 flex items-center justify-between">
      {hasPrev ? (
        <Link
          href={prevHref}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink-primary hover:bg-page"
        >
          <ChevronLeft size={15} /> Previous
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-ink-muted opacity-50">
          <ChevronLeft size={15} /> Previous
        </span>
      )}

      <span className="text-sm text-ink-muted">Page {currentPage}</span>

      {hasNext ? (
        <Link
          href={nextHref}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink-primary hover:bg-page"
        >
          Next <ChevronRight size={15} />
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-ink-muted opacity-50">
          Next <ChevronRight size={15} />
        </span>
      )}
    </div>
  );
}
