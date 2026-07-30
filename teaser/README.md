# Card Sets teaser

A Remotion teaser for Kick Card Sets. Black intro with the KICK wordmark and the
opener text, then the "let's trade" supercut, then a green flood close.

## Run

```bash
npm i
npx remotion studio        # preview
npx remotion render Teaser out/teaser.mp4
```

## Where the files came from

- `public/brand/kick-logo.svg` is a copy of `demo/src/kick/brand/kick-logo.svg`.
- `public/fonts/archivo/` is a copy of `pitch/src/assets/fonts/archivo/`, OFL.txt included.
- `public/clips/` holds copies of the eight "let's trade" clips from Sam's Downloads
  folder, 30 July 2026, apostrophes removed from the names.
- The trim points in `src/clips.ts` come from whisper (model base, word timestamps).
