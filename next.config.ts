import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

function buildContentSecurityPolicy(frameAncestors: "'none'" | "'self'") {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: https://api.qrserver.com",
    "media-src 'self' https: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
    "frame-src 'self' https://js.stripe.com https://www.openstreetmap.org",
    `frame-ancestors ${frameAncestors}`,
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

const sharedSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=()",
  },
] as const;

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },
  async redirects() {
    return [
      {
        source: "/parent/family",
        destination: "/parent/family/children",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        // SMS report viewer — noindex, deny embedding
        source: "/r/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: buildContentSecurityPolicy("'none'"),
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          ...sharedSecurityHeaders,
        ],
      },
      {
        // Public org pages — allow same-origin iframe (director live preview sidebar)
        source: "/p/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: buildContentSecurityPolicy("'self'"),
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          ...sharedSecurityHeaders,
        ],
      },
      {
        // All other routes — deny embedding (clickjacking protection)
        source: "/((?!p/).*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: buildContentSecurityPolicy("'none'"),
          },
          { key: "X-Frame-Options", value: "DENY" },
          ...sharedSecurityHeaders,
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
