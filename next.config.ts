import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: "/api/languages",
        destination: "http://localhost:8000/languages/",
      },
      {
        source: "/api/rooms",
        destination: "http://localhost:8000/rooms/",
      },
    ];
  },
};

export default nextConfig;
