# KICK assets

Where every brand asset and font came from. This file is the record. It is not a folder you build
against, because **there is no root `assets/` folder any more.**

**Every project holds its own copies.** A project that needs a font, a logo or a plate keeps that
file in its own folder and imports it locally. Never point a build at a path that climbs out of the
project, because a bundler will not serve it in dev. **Keep the licence file with the asset**, and
say in the project README which file the copy came from.

Nothing is fetched from the network, at build time or at run time.

## Where each file lives now

| Asset | Home | Used by |
|---|---|---|
| Inter variable, with `OFL.txt` | `demo/src/kick/fonts/`, `pitch/src/assets/fonts/inter/`, `prototypes/kick-timelines-2/assets/fonts/` | Every UI |
| Archivo variable, with `OFL.txt` | `pitch/src/assets/fonts/archivo/` | The deck |
| KICK display font, with its licence | `pitch/src/assets/fonts/kick-font/` | The deck |
| The wordmark `kick-logo.svg` | `demo/src/kick/brand/`, `pitch/src/assets/brand/`, `prototypes/hypeprops/src/assets/` | Every surface |
| Favicon and social logos | `pitch/src/assets/brand/` | The deck |
| Border devices and patterns | `pitch/src/assets/brand/devices/`, `pitch/src/assets/brand/patterns/` | The deck |
| The icon set, 67 files | `demo/src/kick/icons/` | The demo |
| KICK's 282 design tokens | `.claude/reference/kick-neon-tokens.css` | Read-only ground truth |
| The page scrape | `demo/kick-reference/` | The demo |

The icon set grew from 22 to 67 when we scraped kick.com on 26 July 2026. See
`.claude/KICK-SITE-REFERENCE.md` Section 10 and `demo/kick-reference/README.md`.


Read 25 July 2026. To refresh a file, use the source URL in the table and record the new date.

## How to fetch these pages

`about.kick.com` and `brandfolder.com` return HTTP 403 to a plain request. They answer a request
that sends a browser user agent. Use this:

```
curl -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" <url>
```

## `brand/`: KICK own assets

| File | Source | Notes |
|---|---|---|
| `kick-logo.svg` | `https://about.kick.com/img/kick-logo.svg` | The official wordmark. 97x26 viewBox, one path, `fill="#53FC18"` |
| `kick-social-logo-1200x630.png` | `https://kick.com/img/kick-social-logo-1200x630.png` | KICK own Open Graph image |
| `kick-social-logo-1600x840.png` | `https://kick.com/img/kick-social-logo-1600x840.png` | The larger Open Graph image |
| `kick-favicon.ico` | `https://about.kick.com/favicon.ico` | |

### `brand/patterns/`: the pattern plates. **Look at these before you build a background**

| File | Size | What it shows |
|---|---|---|
| `pattern-3.png` | 4096x4096 | Two colours only, green `#53FC18` and cyan `#00FFFF`. They meet through a **halftone dot screen**, never a gradient |
| `cta-section.png` | 1920x1080 | The full vocabulary on one plate: green flood, cyan blocks, a field of `+` registration crosses, halftone dot fields, and hard-edged macroblocks with short vertical fades into a dark olive |
| `background-values.png` | 1389x1002 | The plate behind the values section |

`cta-section.png` is the single most useful file here. Brand Identity Section 3 and Section 8 are
written from it.

### `icons/kick-inline/`: KICK own icons, 22 files

Lifted verbatim from the markup `kick.com` serves, read **26 July 2026**. Design System Section 5
names this folder, and until now the folder was missing.

| Property | Value |
|---|---|
| Grid | `viewBox="0 0 32 32"`, with `menu`, `home` and `browse` on `0 0 16 16` |
| Style | Solid fill, no stroke |
| Colour | `fill="currentColor"` |
| Rendered size | 16px on kick.com, Tailwind `size-4` |

Real KICK icons: `menu` `search` `close` `home` `browse` `following` `collapseChat` `play`
`volume` `pip` `clip` `theatre` `fullscreen` `settings` `share` `chatters` `gift` `globe`
`verified`.

**Three are ours, not KICK's:** `pause` and `mute`, because a logged out page never shows them, and
`timeline`, because KICK has no such icon. All three are drawn on the same grid from KICK's own
`play` and `volume` geometry. Do not present them as KICK's.

**These are KICK trademarks.** They are here so we can match the chrome, not so we can ship them.

Current copy: `prototypes/kick-timelines-2/js/icons.js`.

### `brand/devices/`: the edge bar

| File | Size |
|---|---|
| `border-boldly-authentic.png` | 14x116 |
| `border-chaotically-brave.png` | 14x116 |
| `border-deliberately-different.png` | 14x140 |

A 14px wide vertical strip of green and cyan blocks. KICK sets one against the left edge of each
value block. Brand Identity Section 5 calls it the edge bar.

**These are KICK trademarks and KICK artwork, not our assets.** KICK owns them. They are here so we
can read the brand, not so we can ship them. Brand Identity Section 7 holds the licence gate, and
Brand Identity Section 5 holds the wordmark rule.

### Assets we did not download

`/img/landing/` holds 15 photographed objects: `cassette-tape.png`, `cd.png`, `floppy-disk.png`,
`cinder-block.png`, `cone.png`, `plant.png`, `walkie-talkie.png`, `binoculars.png`,
`microphone.png`, `headphones.png`, `computer.png`, `w-key.png`, `ring-binder.png`,
`paper-plane.png`, `95_5-sign.png`. All under `https://about.kick.com/img/landing/`.

They show KICK's still-life language (Brand Identity Section 5), but they are KICK photography and
we cannot use them in the deck. Read them on the site. Do not commit them.

## `fonts/`

| Folder | Font | Licence | Use |
|---|---|---|---|
| `inter/` | Inter, variable, latin subset | OFL 1.1, `OFL.txt` next to it | All body and all product UI. Same face KICK uses ✅ |
| `archivo/` | Archivo, variable, latin subset | OFL 1.1, `OFL.txt` next to it | Our display substitute for Booster Polygonal |
| `kick-font/` | `kick-font.ttf` | OFL 1.1, `kick-font-license.txt` next to it | A community face built from the KICK wordmark, by "NachoZombiezz". Wordmark lockups only, never reading text |

Inter and Archivo came from Google Fonts, which serves the OFL release of each.

### The KICK display face is not here, and it cannot be

KICK sets its display type in **Booster Polygonal** and **Booster Polygonal Compact**. Both are
retail fonts from [Blaze Type](https://www.myfonts.com/collections/booster-font-blaze-type/).

KICK serves the woff2 files publicly:

```
https://assets.kick.com/about/_next/static/media/BoosterPolygonal_Bold-s.p.3jvxq3we18cwk.woff2
https://assets.kick.com/about/_next/static/media/BoosterPolygonCP_Bold-s.p.18c2jp6cgd31q.woff2
```

**We did not download them, and we must not ship them.** A public URL is not a licence. Hackathon
Brief clause 7(f) makes us licence every asset onward to KICK, and we hold no Booster licence, so
the file would fail the rules test. Brand Identity Section 4 states the same rule.

Use Archivo at weight 800 instead, and say so out loud if a judge asks about type.

## `reference/`: what we read, kept for traceability

| File | What it is |
|---|---|
| `kick-neon-tokens.css` | **282 design tokens, read from KICK own live CSS.** See below |
| `about-kick-brand-copy.txt` | The full copy of `about.kick.com/brand`, tags stripped |
| `about-kick-home-copy.txt` | The full copy of `about.kick.com`, tags stripped |

### `kick-neon-tokens.css` is the important one

KICK ships a design system called **neon**. Its tokens are live CSS custom properties on
about.kick.com, so these are KICK own values, not our guesses:

- **13 colour ramps**, 11 steps each: `neutral`, `green`, `cyan`, `icedOutCyan`, `mint`, `blue`, `purple`, `pink`, `red`, `orange`, `bowelBrown`, plus `light` and `dark` alpha ramps.
- **A semantic layer** on top: `--neon-primary-base`, `--neon-surface-base`, `--neon-text-base`, `--neon-outline-decorative`, `--neon-stateLayer-*`, `--neon-identity-*` and more.
- **A type scale**: 12, 14, 16, 18, 20, 24, 28, 32, 36, 48.
- **A spacing scale**: 0, 1, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96, 112 and up.
- `--neon-font-family-default:Inter`, and weights named Regular, SemiBold, Bold.

`--neon-identity-*` holds the 16 chat username colours: bubblegum, celeste, coral, cyan, lavender,
lime, melon, mint, mist, neon, powder, rose, sand, sky, sunshine, violet.

**Read the tokens, do not paste the file into a build.** Our own tokens stay in
`.claude/KICK-DESIGN-SYSTEM.md` Section 9. This file is the ground truth we correct them against.
Brand Identity Section 3 lists the corrections.

## What is still gated

The **Brand hub** at `https://brandfolder.com/portals/kick` needs a sign-in. It is an Easygo
Brandfolder. `about.kick.com/brand` publishes no logo rule at all: it holds a Download button and
an Explore button, and both point at Brandfolder. So the toolkit is the only place with clear
space, minimum size and misuse rules, and we still cannot read it.

The logo **share** link at `https://brandfolder.com/s/vb9bf4cj6sbkvxmb5x8x7q2g` is public. It shows
"3 Assets from Easygo Brandfolder". Its asset list loads from an API that needs a token, so the
three files are not here. `kick-logo.svg` above is the same wordmark, from KICK own site.

**If a team member can sign in to the Easygo Brandfolder, get the logo rules and the three share
assets.** Brand Identity Section 0 lists what to correct.
