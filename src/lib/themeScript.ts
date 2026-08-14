/**
 * The pre-paint theme script, as data.
 *
 * It runs inline in <head> (app/layout.tsx) so the saved theme is applied before
 * first paint — a `useEffect` would flash the wrong theme on every load.
 *
 * It lives here, alone, because the Content-Security-Policy in next.config.ts
 * must whitelist it by SHA-256 hash. If the string and the hash were maintained
 * in two places they would eventually drift, and the failure is silent-ish and
 * nasty: the browser blocks the script, the theme flash comes back, and nothing
 * errors loudly. Both sides import this constant and the hash is computed from
 * it at build time, so drift is impossible by construction.
 */
export const THEME_SCRIPT =
  `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})()`;
