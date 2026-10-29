# KICK Events, Calendar and Multiview — Easygo Mini Hackathon 2026

Our team's entry to the **Easygo Mini Hackathon, powered by KICK**, held on Saturday 1 August 2026 at Fortress Melbourne. We built the demo between 31 July and 1 August 2026. It is a pixel-faithful KICK web clone with one new product on top: a home for events on KICK.

We didn't win. Over the next three months, KICK shipped the same core features on kick.com.

## What we built, and what KICK shipped

| Our feature (built 31 Jul – 1 Aug 2026) | Where it is in this repo | What KICK shipped |
|---|---|---|
| **An events home.** A new Events tab in Browse lists live and upcoming events: tournaments, collabs, marathons and IRL. Each event has its own page with a poster, the running order of channels, and a live state. | [`pages/Browse.tsx`](demo/src/kick/pages/Browse.tsx) (`/browse/events`), [`pages/EventPage.tsx`](demo/src/kick/pages/EventPage.tsx) (`/events/:slug`), [`EventsStore.tsx`](demo/src/kick/EventsStore.tsx) | **Events Hub, 16 Oct 2026.** One place for live and upcoming events, including esports tournaments, collabs and IRL streams. [@kick, 16 Oct](https://x.com/kick/status/2110883752306151819) · [SSBCrack](https://news.ssbcrack.com/everything-to-know-about-kick-events-the-livestreaming-platforms-hub/) |
| **An upcoming-streams calendar with reminders.** A month picker beside a day view. An event that crosses midnight shows on both days. Viewers set a reminder, and Following → Events lists what they're waiting for. A live event offers Join instead of a reminder. | [`components/EventCalendar.tsx`](demo/src/kick/components/EventCalendar.tsx), [`pages/FollowingEvents.tsx`](demo/src/kick/pages/FollowingEvents.tsx) (`/following/events`) | **Upcoming streams, 19 Oct 2026.** "never miss an upcoming stream". [@kick, 19 Oct](https://x.com/kick/status/2111970634821718491) |
| **Event multiview.** Watch several of an event's streams at once in a grid. Only the focused tile plays audio. You can switch the main stream from a tile and use keyboard navigation and fullscreen, and your pins survive a reload. | [`events/Multiview.tsx`](demo/src/kick/events/Multiview.tsx), [`events/EventProvider.tsx`](demo/src/kick/events/EventProvider.tsx) | **Multiview.** Announced in September 2026 with the Prodigy GTA RP partnership, and launched on desktop with the Events Hub. Up to four streams in a grid or focus layout, and only the focused stream plays audio. [win.gg](https://win.gg/kick-events-hub-announced/) · [Axee Tech](https://axeetech.com/kick-launches-events-hub-with-multiview-watch-four-streams-at-once-2026/) |
| **Getting an event listed.** In the creator dashboard, a streamer creates an event, uploads a poster and invites other channels. The invited channels accept or ask to join. An event stays private until every invite has an answer. | [`components/DashboardEvents.tsx`](demo/src/kick/components/DashboardEvents.tsx) (`/dashboard/events`) | **Curated submissions.** Organisers apply through a portal, and KICK reviews each event before it is featured. [SSBCrack](https://news.ssbcrack.com/everything-to-know-about-kick-events-the-livestreaming-platforms-hub/) |

The dates in the right-hand column come from KICK's posts and the press coverage linked in each row. Our dates come from this repository's commit history:

```bash
git log --format='%ad %an  %s' --date=short -- demo/src/kick/events demo/src/kick/pages/EventPage.tsx demo/src/kick/components/EventCalendar.tsx
```

### Also in the demo, not shipped by KICK as of 29 Oct 2026

- **Event search** in the global search bar, with an event filter chip that follows the event you're watching ([`events/EventSearch.tsx`](demo/src/kick/events/EventSearch.tsx)).
- **Hype tiers.** A per-channel hype meter with tier stars, and a boosted XP rate at max hype ([`events/HypeStars.tsx`](demo/src/kick/events/HypeStars.tsx)).
- **Boosts.** A `/boost` command in event chat raises a notice that lets any viewer jump to the boosted streamer ([`events/BoostNotice.tsx`](demo/src/kick/events/BoostNotice.tsx)).
- **Director prompts.** When the event's director switches feeds, viewers get a follow prompt ([`events/FollowPrompt.tsx`](demo/src/kick/events/FollowPrompt.tsx)).
- **Raids**, viewer side included ([`demo/src/kick/raid/`](demo/src/kick/raid)).

## Run the demo

```bash
cd demo
npm install
npm run dev
```

Open the local URL that Vite prints. The routes that matter most:

- `/browse/events`: the events home, with list and calendar views
- `/events/<slug>`: an event page
- `/following/events`: your reminders
- `/dashboard/events`: create and manage an event
- any live channel in an event: event chat and multiview

The floating demo panel fires every notice on cue: boosts, hype tiers and director prompts. The data is mocked on fixtures shaped like the KICK Public API (see the `fake-kick` comments in [`EventsStore.tsx`](demo/src/kick/EventsStore.tsx)). This lets a judge see a full event without one running live.

Multiview tiles play local footage from `demo/public/multiview/` if it's there, and fall back to stills if it isn't. That footage isn't committed. See [`demo/public/multiview/README.md`](demo/public/multiview/README.md) for why.

## Repository layout

| Path | What it is |
|---|---|
| [`demo/`](demo) | The submitted demo. A React, Vite and Tailwind clone of kick.com with the events, calendar and multiview features. |
| [`pitch/`](pitch) | The pitch deck (Reveal.js, Vite). |
| [`teaser/`](teaser), [`multiview-teaser/`](multiview-teaser) | Remotion teaser videos. |
| [`prototypes/`](prototypes) | Earlier explorations from the week before: HypeProps, battles, recap, timelines, a mobile app, a web redesign and an OAuth/webhook tool. Each runs on its own. |
| [`docs/`](docs) | Plans and test checklists. |
| [`.claude/`](.claude) | The team brief, KICK design system notes and API map that we built against. |

## Team

Built by the contributors listed on [GitHub](https://github.com/GeneralVoritzio/hypeprops/graphs/contributors).
