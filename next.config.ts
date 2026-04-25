import type { NextConfig } from "next";

/**
 * Static export under /m90 subpath, deployed via Firebase Hosting
 * (same pattern as klaudiya, donsevero, apexcollective, etc.).
 * NEXT_PUBLIC_BASE_PATH is exposed so the `asset()` helper can prefix
 * <img src> and background-image URLs that Next doesn't rewrite by default.
 */
const BASE_PATH = "/m90";

const nextConfig: NextConfig = {
  output: "export",
  basePath: BASE_PATH,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
};

export default nextConfig;
