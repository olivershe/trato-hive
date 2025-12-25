import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: ["@trato-hive/ui", "@trato-hive/shared"],
    // Add any other next.js config here
};

export default nextConfig;
