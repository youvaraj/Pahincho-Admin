import { requireAdmin } from "@/lib/auth";
import { SignOutButton } from "./SignOutButton";
import { Sidebar } from "./Sidebar";
import { DashboardShell } from "./DashboardShell";

// Every page under this layout reads the session cookie and queries Firestore
// per-request — never attempt to statically prerender them at build time.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <DashboardShell>
      <div className="flex min-h-screen bg-page">
        <aside className="flex w-60 flex-col border-r border-border bg-surface py-5">
          <div className="mb-6 px-4">
            <span className="text-sm font-semibold text-ink-primary">Pahincho Admin</span>
          </div>
          <Sidebar />
          <div className="mt-auto flex flex-col gap-2 border-t border-border px-4 pt-4">
            <span className="truncate text-xs text-ink-muted">{session.email}</span>
            <SignOutButton />
          </div>
        </aside>
        <main className="flex-1 overflow-x-auto px-8 py-8">{children}</main>
      </div>
    </DashboardShell>
  );
}
