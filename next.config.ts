import type { NextConfig } from "next";
import { createHash } from "node:crypto";
import { THEME_SCRIPT } from "./src/lib/themeScript";

// The app was restructured from top-level student routes (/guide, /team,
// /roles, /settings) into course-scoped routes (/courses/[courseId]/...).
// Redirect the old paths to the built-in course so existing links keep working.
// (/dashboard is no longer redirected — it is now the platform's personal home.)
const SEED = "security-plus";

// NOTE ON script-src: we do NOT ship a hash, deliberately.
//
// The first attempt whitelisted the inline theme script by SHA-256 hash and also
// listed 'unsafe-inline'. That fails, and the CSP spec says why: **once a hash or
// nonce is present, 'unsafe-inline' is ignored**. The theme script ran, but every
// OTHER inline script Next emits — the bootstrap and flight payloads that hydrate
// the app — was refused. Measured against the real build: 48 violations and a
// broken page.
//
// The correct strict fix is a per-request nonce generated in the proxy, which
// Next then stamps onto its own inline scripts. That is a real upgrade path, but
// it forces every page into dynamic rendering, which would undo the static
// optimisation the marketing pages depend on for SEO and speed. So for launch:
// allow inline scripts, and keep the rest of the policy tight (no third-party
// script origins, no eval in production, object-src none, frame-ancestors none,
// base-uri and form-action locked to self).
//
// The hash is still computed below and exported for the nonce migration and so
// the theme script has exactly one definition (src/lib/themeScript.ts).
export const THEME_SCRIPT_HASH = `'sha256-${createHash("sha256").update(THEME_SCRIPT).digest("base64")}'`;

// Supabase is contacted directly from the browser (auth + REST + realtime), so
// its origin has to be allowed explicitly. Derived from the same env var the app
// uses; when it's unset (local/demo builds) the entry is simply omitted.
const supabaseOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
      : "";
  } catch {
    return "";
  }
})();
const supabaseWs = supabaseOrigin.replace(/^https:/, "wss:").replace(/^http:/, "ws:");

// `unsafe-eval` and the loose `script-src` that Next's dev overlay needs are only
// applied in development; production gets the strict policy. Shipping the dev
// policy would make the header decorative.
const isDev = process.env.NODE_ENV === "development";

const csp = [
  `default-src 'self'`,
  // 'unsafe-inline' only, per the note above — adding a hash here would silently
  // disable it and break hydration. Dev additionally needs 'unsafe-eval' for
  // React Refresh; production does not get it.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // Tailwind and next/font emit inline <style>; there is no hash-stable form.
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob:`,
  `font-src 'self' data:`,
  [`connect-src 'self'`, supabaseOrigin, supabaseWs].filter(Boolean).join(" "),
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `object-src 'none'`,
  `upgrade-insecure-requests`,
].join("; ");

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/guide", destination: `/courses/${SEED}/guide`, permanent: false },
      { source: "/settings", destination: `/courses/${SEED}`, permanent: false },
      { source: "/team/:teamId", destination: `/courses/${SEED}/team/:teamId`, permanent: false },
      { source: "/roles/:path*", destination: `/courses/${SEED}`, permanent: false },
      // GRC Workspace was generalized into the role-aware Deliverables page.
      { source: "/courses/:courseId/grc", destination: "/courses/:courseId/docs", permanent: false },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          // Two years, subdomains included, preload-eligible. Only meaningful
          // over HTTPS; harmless on localhost.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // The app uses none of these; denying them shrinks the attack surface
          // and stops a future dependency quietly asking for them.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
