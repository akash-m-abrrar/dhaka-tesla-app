import type { NextConfig } from "next";

// Validate required public API configuration at dev/build startup.
import "./lib/api/config";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
