import Link from "next/link";
import { listAdminClaims } from "@/lib/claims";
import { CLAIM_STATUSES, CLAIM_STATUS_LABELS, type ClaimStatus } from "@/lib/claimTypes";
import { getClaims } from "@/lib/queries";
import { adminClaimTone, claimTone } from "@/lib/statusTone";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/Card";

const FILTERS: { value: ClaimStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  ...CLAIM_STATUSES.map((status) => ({ value: status, label: CLAIM_STATUS_LABELS[status] })),
];

function filterHref(status: ClaimStatus | "all"): string {
  return status === "all" ? "/claims" : `/claims?status=${status}`;
}

export default async function ClaimsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const filter: ClaimStatus | "all" = CLAIM_STATUSES.includes(statusParam as ClaimStatus)
    ? (statusParam as ClaimStatus)
    : "all";

  const [claims, disputes] = await Promise.all([listAdminClaims(filter), getClaims()]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 text-lg font-semibold text-ink-primary">Claims</h1>
          <p className="text-sm text-ink-secondary">
            Admin-managed claim tickets. Track status and leave comments as you work them.
          </p>
        </div>
        <Link
          href="/claims/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          New claim
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-1">
        {FILTERS.map((f) => {
          const active = f.value === filter;
          return (
            <Link
              key={f.value}
              href={filterHref(f.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent-soft text-accent"
                  : "text-ink-secondary hover:bg-page hover:text-ink-primary"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <Card className="mb-10 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-ink-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">Claim ID</th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Claimer</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-page">
                <td className="px-4 py-3 font-mono text-xs text-ink-secondary">{c.claimNumber}</td>
                <td className="px-4 py-3">
                  <Link href={`/claims/${c.id}`} className="font-medium text-accent hover:underline">
                    {c.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {c.firstName} {c.lastName}
                </td>
                <td className="px-4 py-3">
                  {c.userId ? (
                    <Link
                      href={`/users/${c.userId}`}
                      className="font-mono text-xs text-accent hover:underline"
                    >
                      {c.userId.slice(0, 8)}…
                    </Link>
                  ) : (
                    <span className="text-ink-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-secondary">{c.email}</td>
                <td className="px-4 py-3">
                  <StatusBadge tone={adminClaimTone(c.status)} label={CLAIM_STATUS_LABELS[c.status]} />
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
            {claims.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink-muted">
                  No claims in this view.{" "}
                  <Link href="/claims/new" className="text-accent hover:underline">
                    Create one
                  </Link>
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <h2 className="mb-1 text-sm font-semibold text-ink-primary">App disputes</h2>
      <p className="mb-4 text-sm text-ink-secondary">
        Read-only feed of escalated/disputed penalties, requests, and transactions from the app.
      </p>
      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-ink-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {disputes.map((c) => (
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
                <td className="px-4 py-3 max-w-xs truncate" title={c.reason ?? undefined}>
                  {c.reason ?? "—"}
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
            {disputes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-muted">
                  No open app disputes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
