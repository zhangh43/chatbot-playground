import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",

  // Add async headers for CORS
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // In production, limit this to specific domains
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-CSRF-Token',
          },
        ],
      },
    ];
  },

  // Add API rewrites if needed
  async rewrites() {
    return {
      beforeFiles: [
        // Example of a rewrite that could help with CORS
        // Uncomment and modify if needed
        // {
        //   source: '/api/memobase/:path*',
        //   destination: 'https://memobase-api-url/:path*',
        // }
      ],
    };
  },
};

export default withNextIntl(nextConfig);

initOpenNextCloudflareForDev();
