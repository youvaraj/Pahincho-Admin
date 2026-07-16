export const CLAIM_STATUSES = ["new", "in_review", "need_more_info", "resolved"] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  new: "New",
  in_review: "In review",
  need_more_info: "Need more info",
  resolved: "Resolved",
};

export type AdminClaimRow = {
  id: string;
  claimNumber: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  details: string;
  status: ClaimStatus;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  confirmationEmailSentAt: string | null;
  confirmationEmailError: string | null;
};

export type ClaimCommentRow = {
  id: string;
  body: string;
  authorEmail: string;
  createdAt: string | null;
};

export type ClaimInput = {
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  details: string;
  status: ClaimStatus;
};

export type ClaimUserPrefill = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
};

export function isClaimStatus(value: unknown): value is ClaimStatus {
  return typeof value === "string" && (CLAIM_STATUSES as readonly string[]).includes(value);
}

export function normalizeClaimInput(raw: {
  userId?: FormDataEntryValue | null;
  firstName?: FormDataEntryValue | null;
  lastName?: FormDataEntryValue | null;
  email?: FormDataEntryValue | null;
  title?: FormDataEntryValue | null;
  details?: FormDataEntryValue | null;
  status?: FormDataEntryValue | null;
}): { ok: true; data: ClaimInput } | { ok: false; error: string } {
  const userIdRaw = String(raw.userId ?? "").trim();
  const userId = userIdRaw || null;
  const firstName = String(raw.firstName ?? "").trim();
  const lastName = String(raw.lastName ?? "").trim();
  const email = String(raw.email ?? "").trim().toLowerCase();
  const title = String(raw.title ?? "").trim();
  const details = String(raw.details ?? "").trim();
  const statusRaw = String(raw.status ?? "new").trim();

  if (!firstName) return { ok: false, error: "First name is required." };
  if (!lastName) return { ok: false, error: "Last name is required." };
  if (!email || !email.includes("@")) return { ok: false, error: "A valid email is required." };
  if (!title) return { ok: false, error: "Title is required." };
  if (!details) return { ok: false, error: "Details are required." };
  if (!isClaimStatus(statusRaw)) return { ok: false, error: "Invalid status." };

  return {
    ok: true,
    data: { userId, firstName, lastName, email, title, details, status: statusRaw },
  };
}

/** Human-readable claim ID: CLM-YYYYMMDD-HHMMSS-XXXX (UTC + short random suffix). */
export function generateClaimNumber(now = new Date()): string {
  const yyyy = now.getUTCFullYear().toString();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mi = String(now.getUTCMinutes()).padStart(2, "0");
  const ss = String(now.getUTCSeconds()).padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CLM-${yyyy}${mm}${dd}-${hh}${mi}${ss}-${suffix}`;
}
