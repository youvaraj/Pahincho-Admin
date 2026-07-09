import { Card } from "./Card";

function formatCompact(value: number): string {
  if (value < 1000) return value.toLocaleString();
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    value
  );
}

export function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm text-ink-secondary">{label}</p>
      <p className="mt-1.5 text-3xl font-semibold text-ink-primary">{formatCompact(value)}</p>
      {sub && <p className="mt-1 text-xs text-ink-muted">{sub}</p>}
    </Card>
  );
}
