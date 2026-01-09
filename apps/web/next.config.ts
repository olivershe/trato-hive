import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: [
        "@trato-hive/ui",
        "@trato-hive/shared",
        "@trato-hive/auth",
        "@trato-hive/db",
    ],
    // Add any other next.js config here
};

export default nextConfig;
