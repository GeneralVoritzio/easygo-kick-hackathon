# Multiview tile footage

A multiview tile plays `/multiview/<channel-slug>.mp4` on a loop, muted. If the file is not
there, the tile falls back to the mock still. So this folder is optional, and the demo runs
without it.

Add a file for a channel by naming it for that channel slug, for example
`demo/public/multiview/ironvow.mp4`.

## The files here are not in the repository

`.gitignore` blocks `*.mp4` in this folder. Brand Identity Section 7 "Our licence gate" does
not let us hold a recording of another person's stream: it blocks a photograph of a real
streamer, and it blocks game art. Spec Test B3 and B4 say the same for a submission.

The footage on this machine is nine League of Legends streams from other broadcasters. Each
one shows a face camera, a channel handle and a donation link. Keep it local, and do not
commit it.

To ship footage in the repository, record our own, which Section 7 allows.

## Format

Keep a file short, quiet and small, because nine of them play at once.

- MP4, H.264
- Muted, and cut to about 8 seconds
- 480p is enough for a tile
