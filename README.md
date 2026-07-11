# Capstone Lab Platform

A polished, interactive platform for hands-on, role-based cyber ranges. Ships with a
Security+ capstone course and supports **multiple courses** plus an **instructor studio**
to author new ones. Built with Next.js 16, Tailwind CSS, and Framer Motion.

## Vision & roadmap

Where this is headed and how we get there incrementally:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — the north star (event-sourced, ontology-anchored,
  validator-proven behavioral data; the seven value layers).
- [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) — honest as-is map of today's code vs the target.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — the staged path (MVP → foundations → ground truth → dual-use).
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — **what's needed from you** to run a fully functional app.
- [`docs/INTEGRATION_CERTHATCH.md`](docs/INTEGRATION_CERTHATCH.md) — interop with CertHatch & other platforms
  via a shared competency-ontology kernel (no shared database).
- [`docs/MSSP_MODEL.md`](docs/MSSP_MODEL.md) — the capstone reframed as a real MSSP: the three roles
  professionalized, the engagement lifecycle, and the SOC 2 + ISO 27001 crosswalk.
- [`docs/adr/`](docs/adr/) — decision records for the load-bearing, build-now-or-regret-it choices.

## Features

✅ **Multi-course** — pick a course from the home page; each is fully self-contained  
✅ **Instructor Studio** — create/edit courses, roles, weeks, tasks, steps, and gates (no code)  
✅ **Guided, low-click flow** with step-by-step task runner and progress steppers  
✅ **Role-based tracks** (e.g. Red/Blue/GRC) with variable role and week counts  
✅ **Gate system** for progress tracking  
✅ **Custom SVG diagrams** (lifecycle, role workflow, role interplay)  
✅ **JSON import/export** of courses; duplicate a course to bootstrap a new one  
✅ **Mobile-responsive** + **dark mode**  
✅ **Swappable data layer** — localStorage today, drop-in backend later  

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
1. From the home page, pick a course
2. Enroll with name, team, and role (roles come from the course definition)
3. Use the **Dashboard** to see progress and the lifecycle diagram
4. Work each week step-by-step in the guided task runner; progress saves automatically
5. Completing a week’s required tasks advances its gate
6. Switch courses any time from the home page (progress is tracked per course)

### Instructors
Open **/instructor** (passcode-gated) to:
- Create a course, or **Duplicate** the built-in Security+ course to start from a template
- Edit details, **roles** (name/mission/color/icon), **weeks**, **tasks + steps**, and **gates**
- **Export/Import** a course as JSON to share or back up
- **Preview as student** to test the flow

> The instructor passcode defaults to `instructor`; override with `NEXT_PUBLIC_INSTRUCTOR_PASSCODE`.
> The passcode gate is a stub to be replaced by real auth when a backend is added.

## Architecture

```
src/
├── app/
│   ├── page.tsx                     # course picker (home)
│   ├── courses/[courseId]/          # student app (dashboard, roles, week, team, settings, guide)
│   └── instructor/                  # instructor studio (list + /[courseId] editor)
├── components/
│   ├── GuidedTaskRunner, GuidedStepper, RoleIcon, CourseProvider, ...
│   ├── diagrams/                    # LifecycleFlow, RoleWorkflow, RoleInterplayDiagram (props-driven)
│   └── instructor/                  # course/roles/weeks/tasks/steps/gates editors
└── lib/
    ├── types.ts                     # Course, RoleDef, WeekDef, Task, Step, Gate, Member, ...
    ├── course-helpers.ts            # pure helpers over a Course
    ├── useCourse.ts / useMember.ts  # context hooks
    └── data/                        # the swappable data-access layer
        ├── types.ts                 # CourseRepository, ProgressRepository interfaces
        ├── keys.ts                  # course-scoped localStorage key registry
        ├── localStorageCourseRepo.ts / localStorageProgressRepo.ts
        └── seed/securityPlus.ts     # built-in Security+ course
```

## Data

- **localStorage** for persistence, **course-scoped** (`capstone_{courseId}_…`), per browser
- Built-in courses are seeds shipped in code; instructor-authored courses live in localStorage
- A one-time migration moves any pre-existing (un-scoped) progress under `security-plus`

## Swapping in a backend (future)

All reads/writes go through `CourseRepository` and `ProgressRepository`
(`src/lib/data/`). To get true “access from anywhere,” shared instructor content, and
multi-tenancy, implement these interfaces against a backend (e.g. Supabase) and export the
new singletons from `src/lib/data/index.ts` — **no page or component changes required**.
Add real auth in place of the instructor passcode (`useInstructorAuth`).

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
