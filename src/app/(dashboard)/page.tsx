import { getKpis } from "@/lib/queries";
import { StatTile } from "@/components/StatTile";

export default async function OverviewPage() {
  const kpis = await getKpis();

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-6 text-lg font-semibold text-ink-primary">Overview</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Total users" value={kpis.totalUsers} />
        <StatTile
          label="New signups"
          value={kpis.newUsers7d}
          sub={`${kpis.newUsers30d.toLocaleString()} in last 30 days`}
        />
        <StatTile label="Total items posted" value={kpis.totalItems} />
        <StatTile
          label="Items posted (7d)"
          value={kpis.newItems7d}
          sub={`${kpis.newItems30d.toLocaleString()} in last 30 days`}
        />
        <StatTile label="Total transactions" value={kpis.totalTransactions} />
        <StatTile
          label="Overdue rentals"
          value={kpis.overdueRentals}
          sub="Active rentals past their due date"
        />
        <StatTile label="Items given away" value={kpis.itemsGiven} />
        <StatTile label="Items currently borrowed" value={kpis.itemsBorrowed} />
        <StatTile label="Frozen accounts" value={kpis.frozenAccounts} />
        <StatTile
          label="Open claims"
          value={kpis.openClaims}
          sub="Disputed / escalated penalties & requests"
        />
      </div>
    </div>
  );
}
