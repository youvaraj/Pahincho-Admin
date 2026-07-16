"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ToastTone = "success" | "error";

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_MS = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, tone }]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      showSuccess: (message) => showToast(message, "success"),
      showError: (message) => showToast(message, "error"),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <ToastBanner key={toast.id} toast={toast} durationMs={TOAST_MS} onDone={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastBanner({
  toast,
  durationMs,
  onDone,
}: {
  toast: ToastItem;
  durationMs: number;
  onDone: (id: number) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDone(toast.id), durationMs);
    return () => window.clearTimeout(timer);
  }, [toast.id, durationMs, onDone]);

  const styles =
    toast.tone === "success"
      ? "border-good/20 bg-good-soft text-good"
      : "border-critical/20 bg-critical-soft text-critical";

  return (
    <div
      className={`pointer-events-auto max-w-md rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${styles}`}
      role="status"
    >
      {toast.message}
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

/** Fires a toast when a server-action state gains success/error. */
export function useActionToast(state: { success?: string; error?: string } | null | undefined) {
  const { showSuccess, showError } = useToast();
  useEffect(() => {
    if (state?.success) showSuccess(state.success);
  }, [state?.success, showSuccess]);
  useEffect(() => {
    if (state?.error) showError(state.error);
  }, [state?.error, showError]);
}
