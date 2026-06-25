import type { NextConfig } from "next";

// The app was restructured from top-level student routes (/dashboard, /guide,
// /team, /roles, /settings) into course-scoped routes (/courses/[courseId]/...).
// Redirect the old paths to the built-in course so existing links keep working.
const SEED = "security-plus";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/dashboard", destination: `/courses/${SEED}`, permanent: false },
      { source: "/guide", destination: `/courses/${SEED}/guide`, permanent: false },
      { source: "/settings", destination: `/courses/${SEED}`, permanent: false },
      { source: "/team/:teamId", destination: `/courses/${SEED}/team/:teamId`, permanent: false },
      { source: "/roles/:path*", destination: `/courses/${SEED}`, permanent: false },
      // GRC Workspace was generalized into the role-aware Deliverables page.
      { source: "/courses/:courseId/grc", destination: "/courses/:courseId/docs", permanent: false },
    ];
  },
};

export default nextConfig;
