# Neon Coast Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/arnoldswingtaiger/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/arnoldswingtaiger/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

A web app that turns your photos and a caption into cover art in the style of
GTA 6 posters: multi-panel layouts, bold condensed lettering, and a Vice City
sunset or neon colour grade — exported as a PNG ready to share. It runs
entirely offline in a desktop browser from its own static files, and your
photos never leave your machine.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. No build step, no network requests, no
libraries: just `app/index.html` and its ES modules.

## Features

- **Multi-panel layouts** — Hero + Strip (one big hero panel plus three
  stacked side panels, the classic box-art look), Grid 2×2, Triptych, and
  Poster (single full-bleed photo). One click switches the layout.
- **Any photo, any panel** — add several photos at once, click a panel to
  select it, then click a thumbnail to fill it. A toggle fills every panel
  with the same photo. Per-panel zoom slider and drag-to-pan on the preview
  (plus pan sliders) crop and position each photo exactly.
- **Caption editing** — title and tagline, live on the preview, in bold
  condensed Anton lettering with an outline and drop shadow, auto-fitted to
  the cover width, over a dark scrim band across the foot.
- **Colour grades** — Sunset (pink/orange), Neon (magenta/cyan), Gold (warm
  amber), and Noir (high-contrast black and white), applied as canvas filters
  and colour washes.
- **Export** — one click downloads a PNG at 1080 × 1080, 1080 × 1350, or
  1920 × 1080, rendered at full size. Photo → caption → export, in seconds.
- **Try it with no upload** — two sample photos are built in (Boulevard and
  Pier, made with an image model for make.fun and free to use).

Everything in the app is original: no Rockstar Games logo, artwork, or fonts.
The Anton typeface is shipped under the SIL Open Font License (see
`app/fonts/OFL.txt`).

## Files

| Path | What it is |
| --- | --- |
| `app/index.html` | The editor page: controls on the left, live canvas preview on the right |
| `app/style.css` | Dark editor theme with a neon accent |
| `app/src/main.js` | Wiring: uploads, samples, controls, panel picking and drag-to-pan, export |
| `app/src/cover.js` | The cover renderer: panels, grades, vignette, badge, lettering |
| `app/src/panels.js` | Layout definitions: panel rectangles per layout per size |
| `app/src/grades.js` | Colour grade definitions: filters, washes, accents |
| `app/src/shots.js` | Screenshot scenes (`?shot=editor` and `?shot=cover`) |
| `app/fonts/` | Anton (OFL) for the cover lettering |
| `app/samples/` | Two built-in sample photos |
| `main.ts` | Hands the entry in: copies `app/` and `screenshots/` to `/output` and writes `dossier.json` |
| `shots.json` | The screenshot scenes and their viewport sizes |
| `screenshots/` | The entry's screenshots: the cover first, then the editor at work |

## Screenshots

`?shot=` scenes drive the screenshots in `screenshots/`: `?shot=cover` shows a
finished cover alone, `?shot=editor` shows the editor with a photo loaded.
`photo`, `photo2`, `caption`, `sub`, `layout`, `grade`, `size`, and `views`
query params pick the scene; `window.__shotReady` is set once it is painted.
