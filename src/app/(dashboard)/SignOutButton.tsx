"use client";

import { useRouter } from "next/navigation";
import { BASE_PATH } from "@/lib/basePath";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await fetch(`${BASE_PATH}/api/auth/logout`, { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-ink-secondary underline-offset-2 hover:text-ink-primary hover:underline"
    >
      Sign out
    </button>
  );
}
