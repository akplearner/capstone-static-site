# Step screenshots

Real screenshots referenced by `Step.images` in the seed courses. A step declares
a slot like this:

```ts
images: [
  {
    src: '/screenshots/cysa-w1-agents-active.png',
    alt: 'Wazuh Agents list with both team machines showing Active',
    caption: 'Agents → both machines Active',
    placeholder: true, // remove once the real file is committed here
  },
]
```

While `placeholder: true` the UI renders a labelled dashed box naming the file to
drop in, so a step with planned imagery looks intentional rather than broken.
Delete the flag once the asset exists.

Rules enforced by `src/lib/data/content-integrity.test.ts`:

- `src` must start with `/screenshots/`
- `alt` must be non-empty (it is the only description a screen-reader user gets)

Guidance:

- Crop to the panel being discussed, not the whole desktop.
- Redact real hostnames, IPs outside the `10.10.100.x` lab range, and any student
  names before committing.
- Prefer PNG. Keep files under ~300 KB; they ship in the bundle.
- Images render through `next/image` (bare `<img>` is banned by the lint config).

Where a mock is clearer than a photo, prefer `Step.walkthrough` instead — it draws
an annotated UI mock from data, adapts to light/dark, and never goes stale when
the vendor reskins their dashboard.
