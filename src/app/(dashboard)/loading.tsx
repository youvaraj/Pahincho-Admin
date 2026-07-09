import { Spinner } from "@/components/Spinner";

// Automatic Suspense fallback for navigating into any dashboard route — shows
// while the whole page's data loads, then swaps to the full page at once.
export default function Loading() {
  return <Spinner className="py-32" />;
}
