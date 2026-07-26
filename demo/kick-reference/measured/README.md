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
  demo/kick-reference/measured/browse-1440.json \
  clone.json
```

`captured`, `source` and `loggedIn` hold the four facts every number depends on. Add the viewport
to the file name, because a measurement at another width cannot be compared.
