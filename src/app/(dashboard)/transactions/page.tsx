import { Suspense } from "react";
import Link from "next/link";
import { getTransactions, type TransactionFilter } from "@/lib/queries";
import { TransactionsTable } from "@/components/TransactionsTable";
import { Spinner } from "@/components/Spinner";
import { Pagination } from "@/components/Pagination";

const FILTERS: { value: TransactionFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
  { value: "disputed", label: "Disputed & escalated" },
];

// Real Firestore-side ordering + cursor per filter (see getTransactions) — paging
// stays a single cheap query no matter how large the collection grows. Click a row
// to expand it in place instead of navigating away, since there's no per-transaction
// detail page and cramming every field into the row would fight the fixed columns.
async function TransactionsResults({ filter, cursors }: { filter: TransactionFilter; cursors: string[] }) {
  const page = await getTransactions(filter, cursors[cursors.length - 1]);

  return (
    <>
      <TransactionsTable transactions={page.rows} filter={filter} />
      <Pagination
        basePath="/transactions"
        currentPage={cursors.length + 1}
        hasPrev={cursors.length > 0}
        hasNext={page.nextCursor !== null}
        prevCursors={cursors.slice(0, -1)}
        nextCursors={page.nextCursor ? [...cursors, page.nextCursor] : cursors}
      />
    </>
  );
}

function filterHref(filter: TransactionFilter): string {
  return filter === "all" ? "/transactions" : `/transactions?status=${filter}`;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; cursors?: string }>;
}) {
  const { status, cursors: cursorsParam = "" } = await searchParams;
  const filter: TransactionFilter = FILTERS.some((f) => f.value === status)
    ? (status as TransactionFilter)
    : "all";
  const cursors = cursorsParam ? cursorsParam.split(",").filter(Boolean) : [];

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-ink-primary">Transactions</h1>
      <p className="mb-6 text-sm text-ink-secondary">
        What&apos;s currently borrowed, given, overdue, or in dispute. Click a row for details.
      </p>

      <div className="mb-4 flex gap-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={filterHref(f.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              filter === f.value
                ? "bg-accent-soft text-accent"
                : "text-ink-secondary hover:bg-page hover:text-ink-primary"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Suspense key={`${filter}|${cursorsParam}`} fallback={<Spinner />}>
        <TransactionsResults filter={filter} cursors={cursors} />
      </Suspense>
    </div>
  );
}
