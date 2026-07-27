# Measured baselines

One file per page and viewport, written by `scripts/in-page/measure.js` from the
`kick-page-clone` skill. Each file records what kick.com measured on the day we read it.

Use them two ways:

- **Drift.** Measure kick.com again and diff against the baseline. A changed number means KICK
  shipped something, and our copy is stale.
- **Fidelity.** Measure the clone and diff against the baseline. A changed number means our copy
  is wrong.

```bash
node .claude/skills/kick-page-clone/scripts/compare.mjs \
  demo/kick-reference/measured/browse-2560.json \
  clone.json
```

`captured`, `source` and `loggedIn` hold the four facts every number depends on. Add the viewport
to the file name, because a measurement at another width cannot be compared.

## What is here

Read on 27 July 2026, logged out.

| File | Page | Viewport |
|---|---|---|
| `home-2560.json` | `/` | 2560 by 1249 |
| `browse-2560.json` | `/browse` | 2560 by 1249 |
| `following-2560.json` | `/following` | 2560 by 1249 |
| `following-channels-2560.json` | `/following/channels` | 2560 by 1249 |
| `following-channels-loggedin-2560.json` | `/following/channels`, **logged in** | 2560 by 1249 |
| `following-categories-2560.json` | `/following/categories` | 2560 by 1249 |
| `channel-evscape-2560.json` | `/evscape`, live | 2560 by 1249 |
| `channel-evscape-clips-2560.json` | `/evscape/clips` | 2560 by 1249 |
| `settings-profile-2560.json` | `/settings/profile`, **logged in** | 2560 by 1249 |
| `settings-preferences-2560.json` | `/settings/preferences`, **logged in** | 2560 by 1249 |
| `browse-1440.json` | `/browse` | 1440 by 900, read before the box held borders and shadows |

**The settings pages need a session.** Logged out they render an empty shell, so the saved HTML in
`html/` holds no cards and no form. Read them in the user's Chrome.

## Each page family needs its own targets

The default `TARGETS` in `measure.js` describe a grid page. They do not fit every page, and a
target that finds nothing measures nothing:

- **Home, browse and following** fit the default set.
- **The following pages need a session.** Logged out they hold an empty state, so `firstGrid` and
  `firstCard` find nothing and only the chrome measures. Logged in, `/following/channels` holds a
  card grid. Read it in the user's Chrome, or you measure the empty state and call it the page.
- **A channel page** holds a player and a chat: use `player`, `playerVideo`, `channelContent`,
  `chat`, `chatMessages` and `chatFooter`, which are all `id` selectors on kick.com.
- **A settings page** holds tabs and a form, so use the tab `data-testid` values and the inputs.

Each file records the targets it used, and says in `note` which ones do not fit.
