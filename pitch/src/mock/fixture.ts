/*
  The same fixture the prototype seeds, so the deck and the demo tell one story.
  Source: prototypes/kick-timelines/js/mock-api.js and docs/KICK-TIMELINES-SUMMARY.md.
*/
export const channel = {
  username: 'ClutchGoblin',
  title: 'PREMIER GRIND until we hit Global Elite (or i uninstall)',
  viewers: '14.8K',
}

export const beats = [
  { at: '01:05', label: 'Raid from Ac7ionMan', detail: 'The room doubles' },
  { at: '02:41', label: 'Category to Slots and Casino', detail: 'Viewers drop 15.3%' },
  { at: '03:29', label: '5,000 kicks from BigYoshi_AU', detail: 'The loudest moment' },
]

export const chat = [
  { user: 'GoblinModeGaz', colour: 'var(--id-lime)', text: 'that flick was disgusting' },
  { user: 'NanaBread77', colour: 'var(--id-sunshine)', text: '!clip' },
  { user: 'ZeroPingZeke', colour: 'var(--id-sky)', text: 'CLIP IT CLIP IT CLIP IT' },
  { user: 'bucket_hat_bailey', colour: 'var(--id-rose)', text: 'ok that is going in the montage' },
  { user: 'TurboRaccoon_', colour: 'var(--id-mint)', text: 'chat carried that round tbh' },
]

export const curve = [
  8, 10, 9, 12, 14, 13, 17, 22, 46, 44, 39, 34, 31, 33, 36, 32,
  29, 27, 24, 22, 19, 17, 21, 18, 15, 14, 16, 13, 12, 15, 19, 24,
  31, 44, 62, 88, 100, 82, 61, 48, 40, 35, 30, 27, 25, 23, 21, 20,
]

export const markers = [
  { at: 8, kind: 'raid' },
  { at: 21, kind: 'clip' },
  { at: 26, kind: 'decision' },
  { at: 33, kind: 'poll' },
  { at: 36, kind: 'gift' },
]

export const decision = {
  from: 'Just Chatting',
  to: 'Slots and Casino',
  at: '02:41',
  viewers: '-15.3%',
  follows: '-66%',
  subs: '-4',
}
