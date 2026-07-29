import { Link } from "react-router-dom";
import { Icon } from "../Icon";
import { HeroChatFeed } from "../components/ChannelChat";
import { formatViewers } from "../mock/api";
import { isLocationHidden } from "./bodyView";
import { INTERACTION_BADGES } from "./badges";
import { useExplore } from "./exploreStore";
import type { ExploreChannel, ExploreCluster } from "./types";

// The one channel whose privacy setting this demo lets you change. It is the streamer side of the
// map, so it must sit on a channel the demo already treats as its own.
const STREAMER_CONTROL_SLUG = "ironvow";

const cardClass = "flex flex-col gap-1 rounded border border-outline-decorative bg-surface-highest p-3";

type Props = {
  channel: ExploreChannel;
  cluster?: ExploreCluster;
};

// The confirm layer over the map: a right panel on desktop, a bottom sheet on a small screen. Watch
// live commits to the channel page, and Keep exploring drops back to the untouched camera.
export function StreamPreviewPanel({ channel, cluster }: Props) {
  const setSelectedChannel = useExplore((s) => s.setSelectedChannel);
  const hiddenOverrides = useExplore((s) => s.hiddenOverrides);
  const toggleLocationHidden = useExplore((s) => s.toggleLocationHidden);
  const setActiveBody = useExplore((s) => s.setActiveBody);
  const { stream } = channel;
  const hidden = isLocationHidden(channel, hiddenOverrides);
  const streamerControl = stream.channel.slug === STREAMER_CONTROL_SLUG;
  const badges = channel.interaction.badges;
  const close = () => setSelectedChannel(null);

  return (
    <>
      <div className="z-absolute absolute inset-0 bg-dark-40" onClick={close} aria-hidden="true" />

      <section
        aria-label={`${stream.channel.username} live channel details`}
        className="absolute inset-x-0 bottom-0 z-[102] flex h-[70%] animate-slide-up flex-col overflow-hidden rounded-t-lg border-t border-outline-decorative bg-surface-base lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:w-[46%] lg:max-w-[620px] lg:rounded-none lg:border-l lg:border-t-0"
      >
        <header className="flex shrink-0 items-center justify-between px-4 py-3">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-primary-base">
            <span className="h-1.5 w-1.5 animate-pulse-fast rounded-full bg-primary-base" />
            Live now
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="state-layer-surface grid size-8 place-items-center rounded text-surface-onSurfaceSecondary"
          >
            <Icon name="close" className="size-3" />
          </button>
        </header>

        {/* One scroller, so the actions below it can never be pushed off the panel. The scrollbar
            stays visible here, because a short window really does cut the content off. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* The preview is capped, not 16 by 9, so the live chat below it gets the spare height.
            object-cover crops the frame instead of letterboxing it. */}
        <div className="relative mx-4 aspect-video max-h-[30%] shrink-0 overflow-hidden rounded-lg bg-black ring-1 ring-outline-decorative">
          <img
            src={stream.thumbnail}
            alt={`${stream.channel.username} stream preview`}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span className="absolute bottom-2 left-2 rounded bg-surface-lowest/80 px-2 py-1 text-[11px] text-surface-onSurfaceSecondary backdrop-blur-sm">
            {formatViewers(stream.viewer_count)} watching
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
          <div className="flex items-center gap-3">
            <img
              src={stream.channel.avatar}
              alt=""
              className="size-12 shrink-0 rounded-full"
            />
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-1 truncate text-base font-bold text-white">
                {stream.channel.username}
                {stream.channel.verified && <Icon name="verified" className="size-4 shrink-0" />}
              </div>
              <div className="truncate text-sm text-surface-onSurfaceSecondary">
                {stream.category.name}, {stream.language}
                {/* A private streamer has no place to name, and a relay names its site. */}
                {hidden
                  ? ", location private"
                  : cluster
                    ? `, ${cluster.city}, ${cluster.country}`
                    : ""}
              </div>
            </div>
          </div>

          <p className="text-sm leading-snug text-white">{stream.session_title}</p>

          {channel.relay && (
            <div className={cardClass}>
              <div className="flex items-center gap-1.5">
                <span className="rounded border border-outline-decorative bg-dark-40 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-surface-onSurfaceSecondary">
                  Relay
                </span>
                <span className="text-xs font-semibold text-white">{channel.relay.agency}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-surface-onSurfaceSecondary">
                This channel restreams published{" "}
                <span className="text-white">{channel.relay.instrument}</span> imagery. A viewer runs
                it. It is not an official {channel.relay.agency} broadcast.
              </p>
            </div>
          )}

          {hidden && (
            <div className="flex flex-col gap-1 rounded border border-primary-base/30 bg-primary-base/[0.06] p-3">
              <div className="text-xs font-semibold text-primary-base">Location private</div>
              <p className="text-[11px] leading-relaxed text-surface-onSurfaceSecondary">
                This streamer opted out of the map. No coordinates, no city, no country. You find
                them on the Sun with everybody else who prefers to be watched only.
              </p>
            </div>
          )}

          {streamerControl && (
            <label className={`${cardClass} cursor-pointer flex-row items-start gap-3`}>
              <input
                type="checkbox"
                checked={hidden}
                onChange={(e) => {
                  const next = e.target.checked;
                  toggleLocationHidden(channel.id, next);
                  // Follow the channel to wherever it just went.
                  setActiveBody(next ? "sun" : channel.body);
                }}
                className="mt-0.5 size-4 shrink-0 accent-primary-base"
              />
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-white">
                  Streamer control: hide this location
                </span>
                <span className="block text-[11px] leading-relaxed text-surface-onSurfaceSecondary">
                  This takes {stream.channel.username} off the map. The stream stays exactly as
                  discoverable, and only the pin moves.
                </span>
              </span>
            </label>
          )}

          <div className={cardClass}>
            <div className="text-[11px] leading-snug text-surface-onSurfaceSecondary">
              <span className="font-bold text-primary-base">
                replies 1 in {channel.interaction.odds_denominator}
              </span>
              , the chance your message gets a response
            </div>
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {badges.map((key) => (
                  <span
                    key={key}
                    title={INTERACTION_BADGES[key].blurb}
                    className="inline-flex items-center gap-1 rounded-full border border-primary-base/50 bg-primary-base/10 px-2 py-0.5 text-[11px] font-semibold text-primary-base"
                  >
                    {INTERACTION_BADGES[key].label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* The chat takes the space the rest of the panel leaves, and no more. flex-1 with a min
              height gives it every spare pixel on a tall screen, and stops it from growing with each
              new line on a short one, where the middle scrolls instead. */}
          <div className="flex min-h-[220px] flex-1 flex-col gap-1.5 rounded border border-outline-decorative bg-surface-highest p-3">
            <div className="flex shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-surface-onSurfaceSecondary">
              <span className="h-1.5 w-1.5 animate-pulse-fast rounded-full bg-primary-base" />
              Live chat
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <HeroChatFeed />
            </div>
          </div>
        </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-outline-decorative p-4">
          <Link
            to={`/${stream.channel.slug}`}
            className="rounded bg-primary-base px-4 py-3 text-center text-sm font-bold text-primary-onPrimary transition-colors betterhover:hover:bg-green-600"
          >
            Watch live
          </Link>
          <button
            type="button"
            onClick={close}
            className="state-layer-surface rounded border border-outline-decorative px-4 py-3 text-sm font-semibold text-white"
          >
            Keep exploring
          </button>
        </div>
      </section>
    </>
  );
}
