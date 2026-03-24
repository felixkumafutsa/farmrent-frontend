import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove static export to allow dynamic routes to work properly
  // output: "export",
  // distDir: "out",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
};

export default nextConfig;
