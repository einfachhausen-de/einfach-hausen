import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

// Die Live-Vorschau erreicht den Dev-Server unter einem wechselnden Public-Host.
// Ohne Freigabe blockiert Next.js Dev-Ressourcen (HMR, Schriften) cross-origin -
// im Browser bleibt dann eine alte, ungestylte Fassung stehen.
const devPreviewOrigins = isDev ? ['*.e2b.app'] : [];

// Global CSP tuned to this app's integrations: no third-party browser scripts,
// same-origin API/server actions/uploads, inline styles/scripts required by
// Next.js without nonce-based dynamic rendering (see next/dist/docs CSP guide).
// Supabase gateway origin for browser auth (see csp-defect evidence T-0169).
const supabaseConnectOrigin = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');

const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  // The T-0170-verified production auth path signs in via the browser Supabase
  // client (src/app/login/page.tsx). The gateway origin must be connectable,
  // otherwise the /login form fails with "Failed to fetch" under this CSP
  // (reproduced in T-0169, see .sin-gpt-web/evidence/T-0169/oci/csp-defect.txt).
  `connect-src 'self'${supabaseConnectOrigin ? ` ${supabaseConnectOrigin}` : ''}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
];

const securityHeaders = [
  { key: 'Content-Security-Policy', value: cspDirectives.join('; ') },
  ...(isDev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]),
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Self-scoped capture keeps the binding voice/photo intake flows viable
  // (Web Speech in hausmeister-composer) without opening cross-origin access.
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(), browsing-topics=()' },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost', ...devPreviewOrigins],
  serverExternalPackages: ['better-sqlite3'],
  experimental: {
    // OCI production runs on ARM; serialize Next page-data collection to avoid
    // native-addon fork instability during `next build`.
    cpus: 1,
    serverActions: {
      bodySizeLimit: '14mb',
      // Browser-Origin der Vorschau neben dem Host-Header des Proxys; sonst
      // bricht Next die Server-Action (Login) dort still ab. Nur im
      // Dev-Betrieb, damit in Produktion keine fremde Origin erlaubt ist.
      allowedOrigins: [...devPreviewOrigins],
    },
  },
  turbopack: { root: process.cwd() },
  // /app/more war ein Relikt-Navigationspunkt; alle Bereiche haben heute einen
  // eigenen Platz. Alte Bookmarks/Links gehen auf den Ausgangspunkt zurueck.
  async redirects() {
    return [
      { source: '/app/more', destination: '/app', permanent: true },
    ];
  },
  async headers(){
    return [
      // Kein eigenes Cache-Control auf /_next/static mehr: Das Override
      // liess Next dev-seitig warnen und hielt Browser stattdessen auf alten
      // Chunks fest (Betreiber 24.09., mehrfach »sieht alt aus«). Next dev
      // liefert Chunks von itself ohne Cache aus; Produktion hasht Namen.
      {source:'/(.*)',headers:securityHeaders},
      {source:'/sw.js',headers:[{key:'Cache-Control',value:'no-cache, no-store, must-revalidate'}]},
      {source:'/manifest.webmanifest',headers:[{key:'Cache-Control',value:'no-cache, max-age=0, must-revalidate'}]},
    ];
  },
};

export default nextConfig;
