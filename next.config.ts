import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const imageHost = process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL) : null;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: process.env.NODE_ENV === "production",
  images: {
    remotePatterns: imageHost
      ? [
          { protocol: "https", hostname: imageHost.hostname, pathname: "/characters/**" },
          { protocol: "https", hostname: imageHost.hostname, pathname: "/site/**" },
          { protocol: "https", hostname: imageHost.hostname, pathname: "/users/**" },
        ]
      : [],
  },
  async redirects() {
    return [
      { source: "/ranking", destination: "/?all=1", permanent: true },
      { source: "/ranking/:media", destination: "/?media=:media", permanent: true },
    ];
  },
  async headers() {
    const fresh = [{ key: "Cache-Control", value: "no-cache, max-age=0, must-revalidate" }];
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/sw.js", headers: fresh },
      { source: "/offline.html", headers: fresh },
    ];
  },
};

export default nextConfig;
