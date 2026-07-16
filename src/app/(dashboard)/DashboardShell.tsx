"use client";

import { ToastProvider } from "@/components/Toast";

/** Client shell so the server dashboard layout can host toasts. */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
