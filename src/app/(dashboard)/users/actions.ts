"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { adjustUserPoints } from "@/lib/pointsAdjust";

export type AdjustPointsState = { error?: string; success?: string };

export async function adjustPointsAction(
  userId: string,
  _prev: AdjustPointsState,
  formData: FormData
): Promise<AdjustPointsState> {
  const session = await requireAdmin();
  const raw = String(formData.get("amount") ?? "").trim();
  const amount = Number(raw);

  if (!raw || !Number.isFinite(amount)) {
    return { error: "Enter a valid points amount." };
  }

  try {
    const result = await adjustUserPoints({
      userId,
      amount: Math.trunc(amount),
      adminEmail: session.email,
    });
    revalidatePath(`/users/${userId}`);
    const signed = result.amount > 0 ? `+${result.amount}` : String(result.amount);
    return {
      success: `Updated points by ${signed}. New balance: ${result.newBalance}.`,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update points." };
  }
}
