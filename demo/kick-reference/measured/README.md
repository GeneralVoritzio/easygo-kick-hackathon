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
| `following-categories-2560.json` | `/following/categories` | 2560 by 1249 |
| `channel-evscape-2560.json` | `/evscape`, live | 2560 by 1249 |
| `channel-evscape-clips-2560.json` | `/evscape/clips` | 2560 by 1249 |
| `settings-profile-1024.json` | `/settings/profile` | 1024 by 577 |
| `settings-preferences-1024.json` | `/settings/preferences` | 1024 by 576 |
| `browse-1440.json` | `/browse` | 1440 by 900, read before the box held borders and shadows |

**The two settings files are at 1024**, because the Chrome screen dropped to 1024 by 768 during
the capture. Below `lg` the sidebar is the 56px rail, so those two do not compare against the
2560 files. Read them again at 2560.

## Each page family needs its own targets

The default `TARGETS` in `measure.js` describe a grid page. They do not fit every page, and a
target that finds nothing measures nothing:

- **Home, browse and following** fit the default set.
- **The following list pages** hold a list, so `firstGrid` and `firstCard` find nothing.
- **A channel page** holds a player and a chat: use `player`, `playerVideo`, `channelContent`,
  `chat`, `chatMessages` and `chatFooter`, which are all `id` selectors on kick.com.
- **A settings page** holds tabs and a form, so use the tab `data-testid` values and the inputs.

Each file records the targets it used, and says in `note` which ones do not fit.
