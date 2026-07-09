import type { NextConfig } from "next";

// Deployed as a Cloud Run service, reached via a Firebase Hosting rewrite at
// www.pahincho.com/admin/** (pahincho-web's firebase.json), so every route
// (assets included) must live under /admin. `standalone` output produces a
// minimal self-contained server for the Docker image (see Dockerfile).
const nextConfig: NextConfig = {
  basePath: "/admin",
  output: "standalone",
};

export default nextConfig;
