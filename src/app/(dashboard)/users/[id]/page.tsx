import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getClaimsForUser,
  getItemsForOwner,
  getPointsTransactionsForUser,
  getTransactionsAsBorrower,
  getTransactionsAsOwner,
  getUserById,
  type TransactionRow,
} from "@/lib/queries";
import {
  claimTone,
  isTransactionOverdue,
  itemTone,
  pointsTransactionTone,
  transactionTone,
  userTone,
} from "@/lib/statusTone";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { StatTile } from "@/components/StatTile";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="mb-3 text-sm font-semibold text-ink-primary">{title}</h2>
      <Card className="overflow-x-auto">{children}</Card>
    </div>
  );
}

function TransactionsTable({
  rows,
  counterpartLabel,
  counterpartId,
}: {
  rows: TransactionRow[];
  counterpartLabel: string;
  counterpartId: (row: TransactionRow) => string;
}) {
  if (rows.length === 0) {
    return <p className="px-4 py-6 text-center text-sm text-ink-muted">None.</p>;
  }
  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-border text-ink-secondary">
        <tr>
          <th className="px-4 py-3 font-medium">Item</th>
          <th className="px-4 py-3 font-medium">{counterpartLabel}</th>
          <th className="px-4 py-3 font-medium">Type</th>
          <th className="px-4 py-3 font-medium">Status</th>
          <th className="px-4 py-3 font-medium">Due</th>
          <th className="px-4 py-3 font-medium">Created</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((t) => (
          <tr key={t.transactionId} className="border-b border-border last:border-0 hover:bg-page">
            <td className="px-4 py-3">
              <Link href={`/items/${t.itemId}`} className="text-accent hover:underline">
                {t.itemId}
              </Link>
            </td>
            <td className="px-4 py-3">
              <Link href={`/users/${counterpartId(t)}`} className="text-accent hover:underline">
                {counterpartId(t)}
              </Link>
            </td>
            <td className="px-4 py-3 capitalize">{t.transactionType}</td>
            <td className="px-4 py-3">
              <StatusBadge
                tone={isTransactionOverdue(t) ? "warning" : transactionTone(t.status)}
                label={isTransactionOverdue(t) ? "overdue" : t.status}
              />
            </td>
            <td className="px-4 py-3 text-ink-muted">
              {t.currentDueDate ? new Date(t.currentDueDate).toLocaleDateString() : "—"}
            </td>
            <td className="px-4 py-3 text-ink-muted">
              {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUserById(id);
  if (!user) notFound();

  const [postedItems, borrowedTx, lentTx, claims, pointsHistory] = await Promise.all([
    getItemsForOwner(id),
    getTransactionsAsBorrower(id),
    getTransactionsAsOwner(id),
    getClaimsForUser(id),
    getPointsTransactionsForUser(id),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/users" className="text-sm text-ink-secondary hover:text-ink-primary">
        ← Users
      </Link>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink-primary">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-sm text-ink-secondary">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge tone={userTone(user.accountStatus)} label={user.accountStatus} />
          {user.isAccountFrozen && <StatusBadge tone="warning" label="frozen" />}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatTile label="Points" value={user.points} />
        <StatTile label="Rating" value={user.rating} />
        <StatTile label="Unresolved penalty" value={user.unresolvedPenaltyAmount} />
        <StatTile label="Listed items" value={user.listedItemCount} />
        <StatTile label="Borrowed items" value={user.borrowedItemCount} />
      </div>

      <Section title={`Items posted (${postedItems.length})`}>
        {postedItems.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-ink-muted">None.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-ink-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Points (rent)</th>
                <th className="px-4 py-3 font-medium">Listed</th>
              </tr>
            </thead>
            <tbody>
              {postedItems.map((item) => (
                <tr key={item.itemId} className="border-b border-border last:border-0 hover:bg-page">
                  <td className="px-4 py-3">
                    <Link href={`/items/${item.itemId}`} className="text-accent hover:underline">
                      {item.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={itemTone(item.status)} label={item.status} />
                  </td>
                  <td className="px-4 py-3">{item.pointsToRent}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {item.listedAt ? new Date(item.listedAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title={`Borrowed (${borrowedTx.length})`}>
        <TransactionsTable rows={borrowedTx} counterpartLabel="Owner" counterpartId={(t) => t.ownerId} />
      </Section>

      <Section title={`Lent out (${lentTx.length})`}>
        <TransactionsTable rows={lentTx} counterpartLabel="Borrower" counterpartId={(t) => t.borrowerId} />
      </Section>

      <Section title={`Claims (${claims.length})`}>
        {claims.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-ink-muted">None.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-ink-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => (
                <tr key={`${c.kind}-${c.id}`} className="border-b border-border last:border-0 hover:bg-page">
                  <td className="px-4 py-3 capitalize">{c.kind}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={claimTone(c.status)} label={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    {c.itemId ? (
                      <Link href={`/items/${c.itemId}`} className="text-accent hover:underline">
                        {c.itemId}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate" title={c.reason ?? undefined}>
                    {c.reason ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title={`Points history (${pointsHistory.length})`}>
        {pointsHistory.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-ink-muted">None.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-ink-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Related</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {pointsHistory.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-page">
                  <td className="px-4 py-3 text-ink-muted">
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={pointsTransactionTone(p.type)} label={p.category} />
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate" title={p.description}>
                    {p.description || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {p.relatedItemId ? (
                      <Link href={`/items/${p.relatedItemId}`} className="text-accent hover:underline">
                        {p.relatedItemTitle || p.relatedItemId}
                      </Link>
                    ) : p.otherPartyUserId ? (
                      <Link href={`/users/${p.otherPartyUserId}`} className="text-accent hover:underline">
                        {p.otherPartyName || p.otherPartyUserId}
                      </Link>
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 font-medium ${p.amount >= 0 ? "text-good" : "text-critical"}`}>
                    {p.amount >= 0 ? "+" : ""}
                    {p.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{p.balance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}
