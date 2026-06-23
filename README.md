# Capstone Lab Platform — Phase 1

A polished, interactive static site for the Security+ Capstone lab. Built with Next.js 14, Tailwind CSS, and Framer Motion.

## Features

✅ **4-week lab structure** with role-based tasks (Red/Blue/GRC)  
✅ **Interactive checklists** with localStorage persistence  
✅ **Gate system** for progress tracking and week unlock  
✅ **Framework tags** (NIST CSF, CIS, OWASP, etc.)  
✅ **Smooth animations** and great UX  
✅ **Mobile-responsive** design  
✅ **Dark mode** support  
✅ **No backend required** for Phase 1  

## Quick Start

### Prerequisites
- Node.js 18+ (and npm)
- Git

### Local Development

```bash
cd capstone-static-site
npm install
npm run dev
```

Visit `http://localhost:3000` and enroll to get started.

### Build for Production

```bash
npm run build
npm run start
```

## Deployment

### Vercel (Recommended — Auto-Deploy on Push)

1. Sign up at https://vercel.com
2. Connect your GitHub repo
3. Vercel auto-deploys every time you push to `main`
4. Share the live URL with students

### Netlify

```bash
npm run build
# Deploy .next folder to Netlify
```

### Self-Hosted

```bash
npm run build && npm run start
```

## Usage

### Students
1. Enroll with name, team (01–03), and role (Red/Blue/GRC)
2. View **Dashboard** to see your progress
3. Visit your **role hub** to view tasks
4. Click checkboxes to mark steps complete — progress saves automatically
5. Gates unlock when you complete all tasks for the week

### Instructors
- Edit tasks in `src/lib/content-data.ts`
- Customize weeks, roles, frameworks
- Deploy via Vercel for instant updates

## Architecture

```
src/
├── app/              # Pages (layout, dashboard, roles, settings)
├── components/       # UI (TaskCard, ChecklistItem, GateBadge, etc.)
├── lib/
│   ├── types.ts      # TypeScript types
│   ├── storage.ts    # localStorage hooks
│   ├── content-data.ts # All tasks & weeks
│   ├── frameworks.ts # NIST/CIS/OWASP utilities
│   └── utils.ts      # Helpers
└── app/globals.css   # Tailwind styles
```

## Data

- **localStorage** for persistence (per-student, per-browser)
- **No backend** in Phase 1 — all client-side
- Data survives refresh, clears with browser cache

## Phase 2 (Future)

- Artifact upload → Supabase Storage
- GRC assembly view + real artifacts
- Role-cohort collaboration (Discord/built-in)
- Instructor dashboards
- LTI 1.3 integration
- Email notifications

## Customization

### Colors
Edit `tailwind.config.js`

### Animations
Adjust Framer Motion values in components

### Adding Teams
Edit `src/app/settings/page.tsx` and update `teamOptions`

## Troubleshooting

**Build fails locally?**
```bash
npm install --legacy-peer-deps
npm run build
```

**localStorage not working?**
- Ensure browser allows localStorage (not private mode)
- Clear browser cache

**Vercel deployment issues?**
- Test locally: `npm run build` ✓
- All dependencies in `package.json`? ✓
- Commit and push again

## Support

Refer to [Next.js docs](https://nextjs.org/docs) or check inline code comments.

---

**Built for UPLIFT WEB STUDIO Security+ Capstone**
