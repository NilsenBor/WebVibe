import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: "avatar.vercel.sh",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/next/:path*",
        destination: "http://26.136.241.116:8081/:path*",
      },
    ];
  },
};

export default nextConfig;
