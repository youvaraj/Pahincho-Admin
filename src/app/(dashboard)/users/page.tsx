import { Suspense } from "react";
import Link from "next/link";
import { getUsersCount, getUsersPage, searchUsers } from "@/lib/queries";
import { userTone } from "@/lib/statusTone";
import { StatusBadge } from "@/components/StatusBadge";
import { SearchInput } from "@/components/SearchInput";
import { Card } from "@/components/Card";
import { Spinner } from "@/components/Spinner";
import { Pagination } from "@/components/Pagination";

const HEADERS = ["Name", "Email", "Status", "Listed", "Borrowed", "Unresolved penalty", "Joined"];

function UsersTableBody({ users }: { users: Awaited<ReturnType<typeof searchUsers>> }) {
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
          {users.map((u) => (
            <tr key={u.userId} className="border-b border-border last:border-0 hover:bg-page">
              <td className="px-4 py-3 font-medium">
                <Link href={`/users/${u.userId}`} className="text-accent hover:underline">
                  {u.firstName} {u.lastName}
                </Link>
              </td>
              <td className="px-4 py-3 text-ink-secondary">{u.email}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <StatusBadge tone={userTone(u.accountStatus)} label={u.accountStatus} />
                  {u.isAccountFrozen && <StatusBadge tone="warning" label="frozen" />}
                </div>
              </td>
              <td className="px-4 py-3">{u.listedItemCount}</td>
              <td className="px-4 py-3">{u.borrowedItemCount}</td>
              <td className="px-4 py-3">{u.unresolvedPenaltyAmount}</td>
              <td className="px-4 py-3 text-ink-muted">
                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={HEADERS.length} className="px-4 py-6 text-center text-ink-muted">
                No users found.
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
// a bounded result set (see searchUsers) rather than paginated, since the multi-field
// prefix search doesn't have one stable shared cursor to page through, and a real
// search is usually narrow anyway.
async function UsersContent({ q, cursors }: { q: string; cursors: string[] }) {
  const total = await getUsersCount();

  if (q) {
    const users = await searchUsers(q);
    return (
      <>
        <h1 className="mb-6 flex items-center gap-2 text-lg font-semibold text-ink-primary">
          Users <span className="text-ink-muted">({total.toLocaleString()})</span>
        </h1>
        <UsersTableBody users={users} />
      </>
    );
  }

  const page = await getUsersPage(cursors[cursors.length - 1]);
  return (
    <>
      <h1 className="mb-6 flex items-center gap-2 text-lg font-semibold text-ink-primary">
        Users <span className="text-ink-muted">({total.toLocaleString()})</span>
      </h1>
      <UsersTableBody users={page.rows} />
      <Pagination
        basePath="/users"
        currentPage={cursors.length + 1}
        hasPrev={cursors.length > 0}
        hasNext={page.nextCursor !== null}
        prevCursors={cursors.slice(0, -1)}
        nextCursors={page.nextCursor ? [...cursors, page.nextCursor] : cursors}
      />
    </>
  );
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cursors?: string }>;
}) {
  const { q = "", cursors: cursorsParam = "" } = await searchParams;
  const cursors = cursorsParam ? cursorsParam.split(",").filter(Boolean) : [];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <SearchInput initialValue={q} placeholder="Search by name or email…" />
      </div>
      <Suspense key={`${q}|${cursorsParam}`} fallback={<Spinner />}>
        <UsersContent q={q} cursors={cursors} />
      </Suspense>
    </div>
  );
}
