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
| The icon set, 104 files | `demo/src/kick/icons/` | The demo |
| Channel avatars, 16 files | `demo/src/kick/avatars/` | The demo |
| KICK's 282 design tokens | `.claude/reference/kick-neon-tokens.css` | Read-only ground truth |
| The page scrape | `demo/kick-reference/` | The demo |
| Planet textures, 4 files, with `LICENSE.md` | `demo/src/kick/textures/` | The Explore map |
| Vector geography, 4 JSON files | `demo/public/geo/` | The Explore map |

The icon set grew from 22 to 67 when we scraped kick.com on 26 July 2026, and to 104 as the
settings, footer, profile menu and dashboard pages each added their own. See
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

**Two are ours, not KICK's:** `pause`, because a logged out page never shows it, and `timeline`,
because KICK has no such icon. Both are drawn on the same grid from KICK's own `play` and `volume`
geometry. Do not present them as KICK's.

`mute` was ours until 27 July 2026. It is now KICK's own, read from the live player at
`kick.com/odablock` while logged in. Our drawing filled the whole 32 grid, so it rendered larger
than every other icon.

**These are KICK trademarks.** They are here so we can match the chrome, not so we can ship them.

Current copy: `prototypes/kick-timelines-2/js/icons.js`.

### `demo/src/kick/icons/`: the dashboard icons, 15 files

Lifted verbatim from the markup the **dashboard host** serves on `/stream`, read **27 July 2026**
in the user's own Chrome, logged in. The page needs a session, so these cannot be read logged out.
Site Reference Section 22 says where each one sits.

| File | Where it is used |
|---|---|
| `kick-mark.svg` | The K glyph inside the **Go live** button. Not a live dot |
| `dash-popout.svg` | The pop-out button that closes every panel header. 16 by 16, dotted corner |
| `dash-external.svg` | The external-link glyph on a Channel Actions row. A plain box and arrow, and **not** the same glyph as `dash-popout` |
| `dash-filter.svg` | The filter button on Activity Feed and Mod Actions |
| `dash-info.svg` | The rail info button |
| `dash-edit.svg` | The rail edit button, and the pencil on Stream info |
| `dash-webcam.svg` `dash-activity.svg` `dash-mod-actions.svg` `dash-chat.svg` `dash-broadcast.svg` `dash-overlays.svg` | The seven outlined rail tools, with `dash-moderation.svg` as the seventh. Activity Feed, Mod Actions, Chat and Channel Actions reuse four of them as their header icons |
| `dash-tools.svg` | The rail dots button, and the channel-points button in chat. 16 by 16 |
| `chat-emote.svg` | The emote button in the chat input. 16 by 16 |
| `chat-kicks.svg` | The second glyph on the channel-points button. 24 by 24 |

Same rules as the set above: solid fill, no stroke, `fill="currentColor"`, rendered at 16px.

**These are KICK trademarks too.**

**The chat identity badge is not here.** On the live dashboard it is an account-specific PNG
embedded in the SVG, not a shared icon, so the clone uses `verified.svg` in that slot. It reads as
a badge, but it is not the badge KICK shows.

**The default offline banner is not here either.** The dashboard host serves it at 1764 by 993 and
194 KB. It is stock artwork, not chrome, so the same rule that keeps the campaign plates out keeps
it out. The clone shows KICK's own offline card on black instead.

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

## `demo/src/kick/avatars/`: channel avatars, 16 files

**Not KICK's.** These stand in for the profile pictures the API returns, so the demo needs no
account and no network. Read **27 July 2026**.

| Property | Value |
|---|---|
| Source | `https://api.dicebear.com/9.x/pixel-art/svg?seed=<slug>&backgroundColor=264653,2a6f97,5f0f40,6a4c93,3d5a80,7f4f24` |
| Style page | [dicebear.com/styles/pixel-art](https://www.dicebear.com/styles/pixel-art/) |
| Licence | CC0 1.0, "Pixel Art" by DiceBear. Public domain, so no attribution is owed |
| Licence file | None needed. Each SVG carries its own `<dc:rights>` block, so the licence travels with the file |
| File name | The channel slug, so `mock/api.ts` finds it by slug |

**Pixel Art is the only avatar style we use.** CLAUDE.md holds the rule. The `backgroundColor` list
gives each seed a solid plate, because the style draws on a transparent background and a floating
head does not read as an avatar on a dark page.

To add a channel, download its avatar first:

```bash
BG="264653,2a6f97,5f0f40,6a4c93,3d5a80,7f4f24"
curl -sS -o "demo/src/kick/avatars/<slug>.svg" \
  "https://api.dicebear.com/9.x/pixel-art/svg?seed=<slug>&backgroundColor=$BG"
```

## `demo/src/kick/textures/`: planet textures, 4 files

**Not KICK's.** Equirectangular maps for the Explore globe, the Moon, Mars and the Sun. Read
**29 July 2026**. `LICENSE.md` sits beside them and holds the MIT text.

| File | Source | Licence |
|---|---|---|
| `earth-dark.jpg` | `https://unpkg.com/three-globe@2.31.0/example/img/earth-dark.jpg` | MIT, three-globe |
| `moon.jpg` `mars.jpg` `sun.jpg` | threex.planets example maps (`moonmap1k.jpg`, `marsmap1k.jpg`, `sunmap.jpg`) | MIT, threex.planets |

They resolve through `demo/src/kick/explore/textures.ts`, which throws on a missing file. A
replacement must also be equirectangular, or the hotspot maths in `explore/geo.ts` puts every dot in
the wrong place.

## `demo/public/geo/`: vector geography, 4 files

**Not KICK's.** Country borders, admin1 borders and city points for the Explore globe, read
**29 July 2026**. They stay in `public/`, not in `src/`, because `borders-countries-fine.json` is
448 KB and the page fetches it only at the near zoom band.

| File | Source | Licence |
|---|---|---|
| `borders-countries-coarse.json` `borders-countries-fine.json` | world-atlas `countries-110m` and `countries-50m` TopoJSON | Public domain, Natural Earth derivative |
| `borders-admin1.json` | Natural Earth `ne_50m_admin_1_states_provinces_lines` | Public domain |
| `cities.json` | Natural Earth `ne_50m_populated_places_simple` | Public domain |

Each file is the output of `prototypes/hypeprops/scripts/build-geo.mjs`, which simplifies the source
with Ramer-Douglas-Peucker at 2 decimal places. Run that script to refresh them.

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

## Channel panel graphics, ours

`demo/src/kick/art/panel-*.svg`, six tiles: `energy`, `gear`, `merch`, `community`, `schedule`,
`sponsor`. Drawn by us on 27 July 2026, **340 by 420**. KICK sizes a panel by width, 340px, and
lets the uploaded image set the height, measured at 340 by 414 and 340 by 340 on one channel. Ours
use one height, so a row of panels stays even.

They stand in for the sponsor and community panels a streamer uploads under the About card. KICK
does not publish these, because each one belongs to a streamer, so there is nothing to copy. They
use the KICK dark surfaces and one accent each, and they carry no real brand name.

**Licence:** ours. No attribution needed.

## Channel and banner art file names

Every avatar in `demo/src/kick/avatars/` and every `banner-*.svg` in `demo/src/kick/art/` was
renamed on 27 July 2026, when the mock channels moved to invented handles. The art is unchanged.
`mock/api.ts` throws when an avatar file is missing, so the file name must match the channel slug.

## Chat emotes, KICK's own

`demo/src/kick/emotes/`, ten files. KICK's own global emoji set, read from the emote picker on
`kick.com/odablock` on 27 July 2026 and downloaded from
`https://files.kick.com/emotes/<id>/fullsize`.

| File | Emote id |
|---|---|
| `emojiAngry.gif` | 1730753 |
| `emojiAstonished.gif` | 1579033 |
| `emojiAngel.gif` | 1730752 |
| `emojiAwake.gif` | 1730754 |
| `emojiBlowKiss.gif` | 1579036 |
| `emojiBubbly.gif` | 1730755 |
| `emojiCheerful.gif` | 1730756 |
| `emojiClown.gif` | 1730758 |
| `emojiCool.gif` | 1730759 |
| `emojiCrave.gif` | 1730760 |

They are animated GIFs, about 430 KB for the ten, so the motion is KICK's own and we add none.
The picker shows them at 28px and a message shows them at 30px.

**Licence:** KICK's. Used to copy their product surface, as with the wordmark and the icon set.

## Chat icons and badges, read from the live chat

Added to `demo/src/kick/icons/` on 27 July 2026 from `kick.com/odablock`, logged in.

| File | Where it is on kick.com |
|---|---|
| `emotes.svg` | The emotes button inside the chat input box |
| `chat-settings.svg` | The chat settings button. **A different gear from `settings.svg`** |
| `channel-points.svg` | The channel points balance in the chat footer |
| `badge-sub-gifter.svg` | The green sub gifter badge |
| `badge-gifter-teal.svg` | The teal sub gifter badge, a higher tier |
| `badge-sub-gifter-purple.svg` | The purple sub gifter badge, a higher tier again |
| `badge-og.svg` | The OG badge, green bars and a purple centre |
| `badge-moderator.svg` | The sword badge in a rounded tile, three stacked gradient fills |

The two badges carry their own fills, not `currentColor`, because KICK's badges are multicoloured.

**The gift rank medals are ours.** KICK serves `kick.com/img/gift-ranks/gift-rank-1..3.png` from
`kick.com` itself, which answers 403 to anything that is not a browser, so the files cannot be
downloaded. `gift-rank-1.svg`, `gift-rank-2.svg` and `gift-rank-3.svg` were drawn by us on
27 July 2026 from a screenshot of the real medals: a hexagon with the rank number, gold, silver
and bronze. Replace them with the real PNGs if we ever hold them.

**`identity-badge.png` is KICK's.** The chat identity button renders a 16 by 16 SVG whose fill is
a pattern holding one embedded PNG, and every visitor gets the same one, logged in or out. Saved
from the live DOM on 27 July 2026 through the browser's own download, then the PNG was extracted:
a white shield with concentric outlines, 540 by 546. The verbatim SVG is kept at
`demo/kick-reference/icons/identity-badge.svg`.

**Licence:** the medals are ours, no attribution needed. The identity badge is KICK's, used to
copy their product surface, as with the wordmark and the icon set.
