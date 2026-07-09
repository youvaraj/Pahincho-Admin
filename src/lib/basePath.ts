// Must match `basePath` in next.config.ts. Client-side `fetch()` calls (unlike
// next/link and next/navigation) aren't auto-prefixed by Next.js, so routes
// that call our own API from the browser need this.
export const BASE_PATH = "/admin";
