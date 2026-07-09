import { AlertOctagon, AlertTriangle, CheckCircle2, Circle, XCircle } from "lucide-react";
import type { Tone } from "@/lib/statusTone";

const TONE_STYLES: Record<Tone, { text: string; bg: string; icon: typeof Circle }> = {
  good: { text: "text-good", bg: "bg-good-soft", icon: CheckCircle2 },
  warning: { text: "text-warning", bg: "bg-warning-soft", icon: AlertTriangle },
  serious: { text: "text-serious", bg: "bg-serious-soft", icon: AlertOctagon },
  critical: { text: "text-critical", bg: "bg-critical-soft", icon: XCircle },
  neutral: { text: "text-neutral", bg: "bg-neutral-soft", icon: Circle },
};

/** Icon + label pill — never color alone, since warning/serious tones are sub-3:1 on the light surface. */
export function StatusBadge({ tone, label }: { tone: Tone; label: string }) {
  const { text, bg, icon: Icon } = TONE_STYLES[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${text} ${bg}`}
    >
      <Icon size={13} strokeWidth={2.25} />
      {label}
    </span>
  );
}
