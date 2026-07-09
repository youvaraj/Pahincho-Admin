import Link from "next/link";
import { getClaims } from "@/lib/queries";
import { claimTone } from "@/lib/statusTone";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/Card";

export default async function ClaimsPage() {
  const claims = await getClaims();

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-1 text-lg font-semibold text-ink-primary">Claims</h1>
      <p className="mb-6 text-sm text-ink-secondary">
        Open penalties (escalated or disputed) plus disputed/escalated requests and transactions, merged
        and sorted by most recent.
      </p>
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-ink-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Transaction</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Amount</th>
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
                  {c.userId ? (
                    <Link href={`/users/${c.userId}`} className="font-mono text-xs text-accent hover:underline">
                      {c.userId}
                    </Link>
                  ) : (
                    <span className="text-ink-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {c.itemId ? (
                    <Link href={`/items/${c.itemId}`} className="font-mono text-xs text-accent hover:underline">
                      {c.itemId}
                    </Link>
                  ) : (
                    <span className="text-ink-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink-secondary">{c.transactionId ?? "—"}</td>
                <td className="px-4 py-3 max-w-xs truncate" title={c.reason ?? undefined}>
                  {c.reason ?? "—"}
                </td>
                <td className="px-4 py-3">{c.amount ?? "—"}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
            {claims.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-ink-muted">
                  No open claims.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
