import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getClaimsForUser,
  getItemsForOwner,
  getPointsTransactionsForUser,
  getTransactionsAsBorrower,
  getTransactionsAsOwner,
  getUserById,
  enrichTransactionsWithLocations,
  type TransactionRowWithLocation,
} from "@/lib/queries";
import { listAdminClaimsForUser } from "@/lib/claims";
import { CLAIM_STATUS_LABELS } from "@/lib/claimTypes";
import {
  adminClaimTone,
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
import { AdjustPointsForm } from "@/components/AdjustPointsForm";
import { LOCATION_HEADERS, LocationCells } from "@/components/LocationCells";

function formatUserPlace(user: {
  city: string | null;
  state: string | null;
  zipCode: string | null;
}): string | null {
  const place = [user.city, user.state].filter(Boolean).join(", ");
  if (place && user.zipCode) return `${place} · ${user.zipCode}`;
  return place || user.zipCode;
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-8">
      <h2 className={`text-sm font-semibold text-ink-primary ${hint ? "mb-1" : "mb-3"}`}>
        {title}
      </h2>
      {hint ? <p className="mb-3 text-xs text-ink-muted">{hint}</p> : null}
      <Card className="overflow-x-auto">{children}</Card>
    </div>
  );
}

function TransactionsTable({
  rows,
  counterpartLabel,
  counterpartId,
  showDue = false,
}: {
  rows: TransactionRowWithLocation[];
  counterpartLabel: string;
  counterpartId: (row: TransactionRowWithLocation) => string;
  /** Borrow/rental only — get (keep) has no due date. */
  showDue?: boolean;
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
          <th className="px-4 py-3 font-medium">Status</th>
          {showDue ? <th className="px-4 py-3 font-medium">Due</th> : null}
          {LOCATION_HEADERS.map((h) => (
            <th key={h} className="px-4 py-3 font-medium">
              {h}
            </th>
          ))}
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
            <td className="px-4 py-3">
              <StatusBadge
                tone={isTransactionOverdue(t) ? "warning" : transactionTone(t.status)}
                label={isTransactionOverdue(t) ? "overdue" : t.status}
              />
            </td>
            {showDue ? (
              <td className="px-4 py-3 text-ink-muted">
                {t.currentDueDate ? new Date(t.currentDueDate).toLocaleDateString() : "—"}
              </td>
            ) : null}
            <LocationCells place={t} />
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

  const [postedItems, incomingTx, outgoingTx, supportClaims, appDisputes, pointsHistory] =
    await Promise.all([
      getItemsForOwner(id),
      getTransactionsAsBorrower(id),
      getTransactionsAsOwner(id),
      listAdminClaimsForUser(id),
      getClaimsForUser(id),
      getPointsTransactionsForUser(id),
    ]);

  const located = await enrichTransactionsWithLocations([...incomingTx, ...outgoingTx]);
  const incomingIds = new Set(incomingTx.map((t) => t.transactionId));

  // Firestore uses borrowerId for the seeker on both flows. Split by
  // transactionType so get (keep / given away) is not mixed into borrow.
  const incomingLocated = located.filter((t) => incomingIds.has(t.transactionId));
  const outgoingLocated = located.filter((t) => !incomingIds.has(t.transactionId));
  const receivedTx = incomingLocated.filter((t) => t.transactionType === "get");
  const borrowedTx = incomingLocated.filter((t) => t.transactionType !== "get");
  const givenAwayTx = outgoingLocated.filter((t) => t.transactionType === "get");
  const lentTx = outgoingLocated.filter((t) => t.transactionType !== "get");

  const place = formatUserPlace(user);

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
          {place ? <p className="mt-1 text-sm text-ink-muted">{place}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge tone={userTone(user.accountStatus)} label={user.accountStatus} />
          {user.isAccountFrozen && <StatusBadge tone="warning" label="frozen" />}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatTile label="Points" value={user.points} compact={false} />
        <StatTile label="Rating" value={user.rating} />
        <StatTile label="Unresolved penalty" value={user.unresolvedPenaltyAmount} compact={false} />
        <StatTile label="Listed items" value={user.listedItemCount} />
        <StatTile label="Borrowed items" value={user.borrowedItemCount} />
      </div>

      <Section title="Location">
        <dl className="grid gap-4 px-4 py-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-ink-secondary">City</dt>
            <dd className="mt-1 font-medium text-ink-primary">{user.city ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-ink-secondary">State</dt>
            <dd className="mt-1 font-medium text-ink-primary">{user.state ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-ink-secondary">ZIP code</dt>
            <dd className="mt-1 font-medium text-ink-primary">{user.zipCode ?? "—"}</dd>
          </div>
        </dl>
      </Section>

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

      <Section
        title={`Received (${receivedTx.length})`}
        hint="Get requests this user sent — completed means they kept the item."
      >
        <TransactionsTable
          rows={receivedTx}
          counterpartLabel="Owner"
          counterpartId={(t) => t.ownerId}
        />
      </Section>

      <Section
        title={`Borrowed (${borrowedTx.length})`}
        hint="Borrow requests this user sent — due date applies until return."
      >
        <TransactionsTable
          rows={borrowedTx}
          counterpartLabel="Owner"
          counterpartId={(t) => t.ownerId}
          showDue
        />
      </Section>

      <Section
        title={`Given away (${givenAwayTx.length})`}
        hint="Get requests on this user's listings — completed means given for good."
      >
        <TransactionsTable
          rows={givenAwayTx}
          counterpartLabel="Recipient"
          counterpartId={(t) => t.borrowerId}
        />
      </Section>

      <Section
        title={`Lent out (${lentTx.length})`}
        hint="Borrow requests on this user's listings."
      >
        <TransactionsTable
          rows={lentTx}
          counterpartLabel="Borrower"
          counterpartId={(t) => t.borrowerId}
          showDue
        />
      </Section>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink-primary">
            Support claims ({supportClaims.length})
          </h2>
          <Link
            href={`/claims/new?userId=${user.userId}`}
            className="text-sm font-medium text-accent hover:underline"
          >
            + Claim
          </Link>
        </div>
        <Card className="overflow-x-auto">
          {supportClaims.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-muted">No support claims yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-ink-secondary">
                <tr>
                  <th className="px-4 py-3 font-medium">Claim ID</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {supportClaims.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-page">
                    <td className="px-4 py-3 font-mono text-xs text-ink-secondary">{c.claimNumber}</td>
                    <td className="px-4 py-3">
                      <Link href={`/claims/${c.id}`} className="text-accent hover:underline">
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        tone={adminClaimTone(c.status)}
                        label={CLAIM_STATUS_LABELS[c.status]}
                      />
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <Section title={`App disputes (${appDisputes.length})`}>
        {appDisputes.length === 0 ? (
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
              {appDisputes.map((c) => (
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

      <Section title="Adjust points">
        <AdjustPointsForm userId={user.userId} currentPoints={user.points} />
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
