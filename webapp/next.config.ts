import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: [
    "@github/copilot",
    "@github/copilot-sdk",
    "@github/copilot-win32-x64",
  ],
};

export default nextConfig;
