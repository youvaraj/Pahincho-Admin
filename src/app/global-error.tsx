"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#FFF8F0] p-6 font-sans">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-semibold text-[#1D1D1F]">Something went wrong</h1>
          <p className="mt-2 text-sm text-[#555]">
            {error.message || "An unexpected error occurred."}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-4 rounded-md bg-[#FF9500] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
