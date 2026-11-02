import type { NextConfig } from "next";

const apiServer = process.env.API_SERVER_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Allow dev HMR from local network addresses (e.g. mobile devices)
  allowedDevOrigins: [
    '192.168.43.169',
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiServer}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
