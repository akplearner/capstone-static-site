# Vendored fonts

## PressStart2P-latin.woff2

"Press Start 2P" by CodeMan38, licensed under the **SIL Open Font License 1.1**
(https://openfontlicense.org). The OFL permits bundling and redistribution with
the license intact; the font is not sold and is not the primary value of this
work.

Source: the `latin` subset from Google Fonts
(`https://fonts.googleapis.com/css2?family=Press+Start+2P`), 12.5 KB.

### Why it is vendored rather than fetched

`next/font/google` downloads at **build time**. Vendoring the file makes the
build deterministic and offline-capable — CI, this sandbox, and Vercel all
produce the same result with no network dependency and no chance of a build
failing because a font CDN is unreachable.

Only the `latin` subset is included. The pixel face is used exclusively for
short strings — headings, badges, chips, XP counters — so the other subsets
would be dead weight.

### Where it may be used

`--font-pixel`, applied via the `.pixel` utility class in `globals.css`.

**Never apply it to body copy, commands, terminal output, or step
instructions.** At paragraph length a 8×8 bitmap face is materially harder to
read, and these students are following technical instructions where a misread
character costs them an hour. Headings and badges only.
