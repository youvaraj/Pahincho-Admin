export type Tone = "good" | "warning" | "serious" | "critical" | "neutral";

/** For UI use on an already-mapped row (e.g. to highlight an overdue rental in a table). */
export function isTransactionOverdue(row: { status: string; currentDueDate: string | null }): boolean {
  return row.status === "active_rental" && !!row.currentDueDate && new Date(row.currentDueDate) < new Date();
}

/** Maps each entity's real status strings (confirmed against the Pahincho1 app schema) to a tone. */
export function transactionTone(status: string): Tone {
  switch (status) {
    case "completed_get":
    case "completed_return_on_time":
      return "good";
    case "pending_approval":
    case "pending_pickup":
    case "active_pickup":
    case "active_rental":
      return "neutral";
    case "completed_return_late":
      return "warning";
    case "disputed":
      return "serious";
    case "escalated":
    case "defaulted_lost":
    case "defaulted_lost_by_borrower":
    case "defaulted_damaged_by_borrower":
    case "defaulted_not_returned":
      return "critical";
    case "voided":
    default:
      return "neutral";
  }
}

export function itemTone(status: string): Tone {
  switch (status) {
    case "available":
    case "given":
      return "good";
    case "pending_pickup":
    case "rented":
      return "neutral";
    case "lost_by_borrower":
      return "critical";
    case "removed":
    default:
      return "neutral";
  }
}

export function userTone(accountStatus: string): Tone {
  switch (accountStatus) {
    case "active":
      return "good";
    case "suspended":
      return "warning";
    case "banned":
      return "critical";
    default:
      return "neutral";
  }
}

export function pointsTransactionTone(type: string): Tone {
  switch (type) {
    case "earned":
    case "bonus":
    case "refund":
      return "good";
    case "penalty":
      return "critical";
    case "spent":
    case "purchase":
    default:
      return "neutral";
  }
}

export function claimTone(status: string): Tone {
  switch (status) {
    case "paid":
    case "fulfilled":
    case "approved":
    case "active_rental":
      return "good";
    case "pending":
    case "pending_payment":
      return "neutral";
    case "disputed":
    case "failed_return":
    case "partially_paid":
      return "serious";
    case "escalated":
      return "critical";
    case "rejected":
    case "canceled_by_seeker":
    case "canceled_by_owner":
    case "expired":
    case "waived":
    default:
      return "neutral";
  }
}
