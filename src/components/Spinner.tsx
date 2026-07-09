import { Loader2 } from "lucide-react";

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-20 ${className}`}>
      <Loader2 size={26} className="animate-spin text-ink-muted" />
    </div>
  );
}
