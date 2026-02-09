import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseDomain = supabaseUrl ? new URL(supabaseUrl).hostname : '';

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  async headers() {
    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src 'self' data: blob:${supabaseDomain ? ` https://${supabaseDomain}` : ''}`,
      `font-src 'self' data:`,
      `connect-src 'self'${supabaseDomain ? ` https://${supabaseDomain} wss://${supabaseDomain}` : ''}`,
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: cspDirectives.join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
