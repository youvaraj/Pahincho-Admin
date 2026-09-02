import path from "node:path";
import type { NextConfig } from "next";

const projectRoot = path.resolve(process.cwd());

// Deployed as a Cloud Run service, reached via a Firebase Hosting rewrite at
// www.pahincho.com/admin/** (pahincho-web's firebase.json), so every route
// (assets included) must live under /admin. `standalone` output produces a
// minimal self-contained server for the Docker image (see Dockerfile).
const nextConfig: NextConfig = {
  basePath: "/admin",
  output: "standalone",
  outputFileTracingRoot: projectRoot,
  // Home-dir lockfiles (e.g. ~/yarn.lock) must not become the Turbopack root.
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
