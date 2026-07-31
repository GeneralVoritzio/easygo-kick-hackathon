# Multiview teaser

A Remotion teaser for KICK Multiview. The park clip opens under a massive KICK
title, the beat plays four beats and pauses, the scene plays out, and the black
end card lands the line on the next downbeat.

## Run

```bash
npm i
npx remotion studio
npx remotion render Teaser out/teaser.mp4
```

## Where the files came from

- `public/clip.mp4` is a copy of `~/Downloads/hf_20260731_041529_3783a74e-f45d-4d3f-a314-c74ab24c418b.mp4`.
- `public/music.mp3` is a copy of "What's The Difference (Instrumental) - Dr. Dre (128k).mp3" from Sam's Downloads folder.
- `public/fonts/kick-font/` is a copy of `pitch/src/assets/fonts/kick-font/`, licence included. Wordmark lockups only.
- `public/fonts/archivo/` is a copy of `pitch/src/assets/fonts/archivo/`, OFL.txt included.
- `public/kick-logo.svg` is a copy of `demo/src/kick/brand/kick-logo.svg`.
- The tempo is measured, not assumed: 91.94 bpm, first beat at 0.0 s, so four beats end at frame 63 at 24 fps.
