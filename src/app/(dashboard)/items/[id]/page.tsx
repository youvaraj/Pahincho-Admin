import Link from "next/link";
import { notFound } from "next/navigation";
import { getClaimsForItem, getItemById, getTransactionsForItem } from "@/lib/queries";
import { claimTone, isTransactionOverdue, itemTone, transactionTone } from "@/lib/statusTone";
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

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getItemById(id);
  if (!item) notFound();

  const [transactions, claims] = await Promise.all([getTransactionsForItem(id), getClaimsForItem(id)]);

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/items" className="text-sm text-ink-secondary hover:text-ink-primary">
        ← Items
      </Link>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink-primary">{item.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-secondary">{item.description || "No description."}</p>
          <p className="mt-2 text-sm text-ink-muted">
            Owner:{" "}
            <Link href={`/users/${item.ownerId}`} className="text-accent hover:underline">
              {item.ownerId}
            </Link>
          </p>
          {item.currentBorrowerId && (
            <p className="mt-1 text-sm text-ink-muted">
              Current borrower:{" "}
              <Link href={`/users/${item.currentBorrowerId}`} className="text-accent hover:underline">
                {item.currentBorrowerId}
              </Link>
            </p>
          )}
        </div>
        <StatusBadge tone={itemTone(item.status)} label={item.status} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Points to rent" value={item.pointsToRent} />
        <StatTile label="Points to acquire" value={item.pointsToAcquire} />
        <StatTile label="Estimated value" value={item.estimatedValue} />
        <Card className="p-5">
          <p className="text-sm text-ink-secondary">Condition</p>
          <p className="mt-1.5 text-2xl font-semibold capitalize text-ink-primary">{item.condition}</p>
        </Card>
      </div>

      <Section title={`Transaction history (${transactions.length})`}>
        {transactions.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-ink-muted">None.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-ink-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Borrower</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.transactionId} className="border-b border-border last:border-0 hover:bg-page">
                  <td className="px-4 py-3">
                    <Link href={`/users/${t.ownerId}`} className="text-accent hover:underline">
                      {t.ownerId}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/users/${t.borrowerId}`} className="text-accent hover:underline">
                      {t.borrowerId}
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
        )}
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
    </div>
  );
}
