"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { deleteWishlistItems } from "@/lib/wishlistAdmin";

export type DeleteWishlistState = { error?: string; success?: string };

export async function deleteWishlistItemsAction(
  _prev: DeleteWishlistState,
  formData: FormData,
): Promise<DeleteWishlistState> {
  await requireAdmin();

  const ids = formData
    .getAll("wishlistIds")
    .map((v) => String(v).trim())
    .filter(Boolean);

  if (ids.length === 0) {
    return { error: "Select at least one wishlist entry to delete." };
  }

  try {
    const deleted = await deleteWishlistItems(ids);
    if (deleted === 0) {
      return { error: "No wishlist entries were found to delete." };
    }
    revalidatePath("/wishlist");
    const label = deleted === 1 ? "entry" : "entries";
    return { success: `Deleted ${deleted} wishlist ${label}.` };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete wishlist entries.";
    if (/not found|no document/i.test(message)) {
      return {
        error:
          "Could not update a linked user profile (user may have been deleted). Try again.",
      };
    }
    return { error: message };
  }
}
