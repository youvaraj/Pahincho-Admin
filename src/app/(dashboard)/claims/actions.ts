"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { sendClaimConfirmationEmail } from "@/lib/claimEmail";
import {
  addClaimComment,
  createAdminClaim,
  deleteAdminClaim,
  recordClaimConfirmationEmailResult,
  updateAdminClaim,
} from "@/lib/claims";
import { normalizeClaimInput } from "@/lib/claimTypes";

export type ActionState = { error?: string; success?: string };

export async function createClaimAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAdmin();
  const parsed = normalizeClaimInput({
    userId: formData.get("userId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    title: formData.get("title"),
    details: formData.get("details"),
    status: formData.get("status"),
  });
  if (!parsed.ok) return { error: parsed.error };

  const created = await createAdminClaim(parsed.data, session.email);

  // Claim is already saved — email failure must not roll it back.
  const emailResult = await sendClaimConfirmationEmail({
    ...parsed.data,
    claimNumber: created.claimNumber,
  });
  try {
    await recordClaimConfirmationEmailResult(created.id, emailResult);
  } catch (err) {
    console.error("Failed to record claim confirmation email result:", err);
  }
  if (!emailResult.ok) {
    console.error(
      `Claim ${created.claimNumber} created but confirmation email failed:`,
      emailResult.error
    );
  }

  revalidatePath("/claims");
  if (parsed.data.userId) revalidatePath(`/users/${parsed.data.userId}`);
  redirect(`/claims/${created.id}`);
}

export async function updateClaimAction(
  claimId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAdmin();
  const parsed = normalizeClaimInput({
    userId: formData.get("userId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    title: formData.get("title"),
    details: formData.get("details"),
    status: formData.get("status"),
  });
  if (!parsed.ok) return { error: parsed.error };

  try {
    await updateAdminClaim(claimId, parsed.data, session.email);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update claim." };
  }

  revalidatePath("/claims");
  revalidatePath(`/claims/${claimId}`);
  if (parsed.data.userId) revalidatePath(`/users/${parsed.data.userId}`);
  return { success: "Claim updated." };
}

export async function deleteClaimAction(claimId: string): Promise<ActionState> {
  await requireAdmin();
  try {
    await deleteAdminClaim(claimId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete claim." };
  }
  revalidatePath("/claims");
  redirect("/claims");
}

export async function addCommentAction(
  claimId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireAdmin();
  const body = String(formData.get("body") ?? "");
  try {
    await addClaimComment(claimId, body, session.email);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to add comment." };
  }
  revalidatePath(`/claims/${claimId}`);
  return { success: "Comment added." };
}
