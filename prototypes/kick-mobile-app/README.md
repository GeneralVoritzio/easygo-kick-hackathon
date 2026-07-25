# Kick Mobile App

A mobile viewer app for Kick. It has three tabs: Community, Home, and Profile. It uses real Kick channel embeds for video. All other data is mocked.

This is a standalone prototype. It does not share code with `prototypes/hypeprops`. It runs on its own port.

## Requirements

Node 20 or newer. This project uses Vite 8, which needs Node 20 at minimum.

Check your Node version first:

```bash
node --version
```

If you have an older version, install Node 20+ (for example with `nvm` or Homebrew) before you continue.

## Quickstart

```bash
cd prototypes/kick-mobile-app
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5180`).

## What each tab does

**Home** is the main feature. It is called Progressive Mosaic Discovery.

- You start in a full-screen swipeable feed. Swipe up for the next channel, swipe down for the previous one.
- Hold a tile to pin it to a side dock. Discovery keeps going in the freed space.
- Pin up to 4 channels.
- Pinch the screen to fill it with all pinned channels at once. Pinch again to go back to discovery.
- Tap a tile to open it full screen with chat. Tap the speaker icon to move audio focus there instead, without leaving your current view.
- On mouse/trackpad devices, use the small expand button in the corner instead of pinch.

**Community** shows a mock community feed: announcements, discussions, memes and fan art, and upcoming events.

**Profile** shows a mock Kick Passport: a collection of cards earned from past community events. Tap a card to flip it and read the message on the back.

## Video: real Kick embeds, not mocks

The channel list is a small set of real Kick streamers, embedded with `player.kick.com`. If a channel is not live when you open the app, Kick's own player shows its real offline card. This is expected, not a bug. Swap the channel list in `src/shared/mock/mockData.ts` (`LIVE_STREAM_TEMPLATES`) if you want different channels.

Everything else (community posts, passport cards, chat messages, the "3 friends are watching" style signals) is mock data with no backend.

## Design tokens

Colors, radius, and the LIVE badge follow `.claude/KICK-DESIGN-SPEC.md` §9 in the repo root. Icons use `lucide-react`, per §5 of the same spec.

## File layout

```
src/
  App.tsx              the tab shell: swipeable pager + bottom nav + fullscreen stream view
  HomeTab.tsx           Progressive Mosaic Discovery: discovery feed, pinned dock, focus mosaic
  DiscoveryTile.tsx     the full-screen browse tile (swipe, hold-to-pin, tap-to-open)
  PinnedDock.tsx        the side strip of pinned channels
  MosaicGrid.tsx        1-4 tile layout for the focus view
  StreamSurface.tsx     the real Kick iframe embed
  StreamView.tsx        fullscreen stream + chat
  BottomTabBar.tsx      Community / Home / Profile nav
  community/            ported Community and Profile (Kick Passport) tabs
  shared/               types, mock data, hooks, ChannelBadge
```

## Known gaps

- Chat is mock only. Messages sent from the app do not go anywhere real.
- Viewer counts are left unset. There is no API key to source a real number from.
- The channel roster needs an occasional check. Streamers go offline; swap the list if a demo channel is down.
