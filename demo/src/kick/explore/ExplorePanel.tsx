import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../Icon";
import { FilterSelect } from "../components/BrowseFilters";
import { HeroChatFeed } from "../components/ChannelChat";
import { formatViewers } from "../mock/api";
import { INTERACTION_BADGES } from "./badges";
import { isLocationHidden } from "./bodyView";
import { useExplore } from "./exploreStore";
import type { ExploreChannel, ExploreCluster } from "./types";

// The one channel whose privacy setting this demo lets you change. It is the streamer side of the
// map, so it must sit on a channel the demo already treats as its own.
const STREAMER_CONTROL_SLUG = "ironvow";

const cardClass =
  "flex flex-col gap-1 rounded border border-outline-decorative bg-surface-highest p-3";

// The same three options, and the same meaning, that the Browse page offers.
const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "recommended", label: "Recommended" },
  { value: "viewers-desc", label: "Viewers (High to Low)" },
];

function sortChannels(channels: ExploreChannel[], sort: string): ExploreChannel[] {
  if (sort === "viewers-desc") {
    return [...channels].sort((a, b) => b.stream.viewer_count - a.stream.viewer_count);
  }
  if (sort === "featured") {
    return [...channels].sort(
      (a, b) => Date.parse(b.stream.started_at) - Date.parse(a.stream.started_at),
    );
  }
  return channels;
}

const iconButtonClass =
  "state-layer-surface grid size-8 shrink-0 place-items-center rounded text-surface-onSurfaceSecondary";

function ChannelRow({ channel, onOpen }: { channel: ExploreChannel; onOpen: () => void }) {
  const { stream } = channel;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="state-layer-surface flex w-full items-center gap-3 rounded p-2 text-left"
    >
      <div className="relative aspect-video w-[104px] shrink-0 overflow-hidden rounded bg-surface-lowest">
        <img
          src={stream.thumbnail}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">
            {stream.channel.username}
          </span>
          {stream.channel.verified && <Icon name="verified" className="size-3.5 shrink-0" />}
          <span className="shrink-0 text-xs font-semibold text-white">
            {formatViewers(stream.viewer_count)}
          </span>
        </div>
        <div className="truncate text-xs text-surface-onSurfaceSecondary">
          {stream.session_title}
        </div>
        <div className="truncate text-[11px] text-subtle">
          {channel.relay ? `${channel.relay.agency} relay` : stream.category.name}, replies 1 in{" "}
          {channel.interaction.odds_denominator}
        </div>
      </div>
    </button>
  );
}

function ChannelDetail({
  channel,
  cluster,
}: {
  channel: ExploreChannel;
  cluster?: ExploreCluster;
}) {
  const hiddenOverrides = useExplore((s) => s.hiddenOverrides);
  const toggleLocationHidden = useExplore((s) => s.toggleLocationHidden);
  const setActiveBody = useExplore((s) => s.setActiveBody);
  const { stream } = channel;
  const hidden = isLocationHidden(channel, hiddenOverrides);
  const streamerControl = stream.channel.slug === STREAMER_CONTROL_SLUG;
  const badges = channel.interaction.badges;

  return (
    <>
      <div className="relative mx-4 aspect-video max-h-[30%] shrink-0 overflow-hidden rounded-lg bg-black ring-1 ring-outline-decorative">
        <img
          src={stream.thumbnail}
          alt={`${stream.channel.username} stream preview`}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-surface-lowest/80 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          <span className="size-1.5 animate-pulse-fast rounded-full bg-red-500" />
          LIVE
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          <img src={stream.channel.avatar} alt="" className="size-12 shrink-0 rounded-full" />
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-1 truncate text-base font-bold text-white">
              {stream.channel.username}
              {stream.channel.verified && <Icon name="verified" className="size-4 shrink-0" />}
            </div>
            <div className="truncate text-sm text-surface-onSurfaceSecondary">
              {stream.category.name}, {stream.language}
              {hidden ? ", location private" : cluster ? `, ${cluster.place}` : ""}
            </div>
            <div className="flex min-h-[1.375rem] items-center gap-1 text-sm font-bold">
              <Icon name="chatters" className="size-4 shrink-0 fill-white" />
              <span className="text-subtle">
                <span className="text-primary-base tabular-nums">
                  {stream.viewer_count.toLocaleString("en-US")}
                </span>{" "}
                watching
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm leading-snug text-white">{stream.session_title}</p>

        {!hidden && !channel.relay && (
          <p className="text-[11px] leading-relaxed text-surface-onSurfaceSecondary">
            The map holds a country, and nothing finer. KICK never asks a streamer for a city or a
            coordinate.
          </p>
        )}

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
              This streamer opted out of the map. No coordinates, no country. You find them on the
              Sun with everybody else who prefers to be watched only.
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
    </>
  );
}

// The right hand panel over the map. It has two levels: the channels of one country, then one
// channel. A country holds up to twelve channels, so a list reads better than a burst of cards
// around the hotspot, and it never runs off the edge of the map.
export function ExplorePanel({
  cluster,
  channel,
}: {
  cluster?: ExploreCluster;
  channel?: ExploreChannel;
}) {
  const setSelectedCluster = useExplore((s) => s.setSelectedCluster);
  const setSelectedChannel = useExplore((s) => s.setSelectedChannel);
  const [sort, setSort] = useState("recommended");
  const rows = useMemo(() => sortChannels(cluster?.channels ?? [], sort), [cluster, sort]);
  const close = () => setSelectedCluster(null);
  const back = () => setSelectedChannel(null);

  const label = channel
    ? `${channel.stream.channel.username} live channel details`
    : `${cluster?.place ?? "Live"} channel list`;

  return (
    <>
      <div className="z-absolute absolute inset-0 bg-dark-40" onClick={close} aria-hidden="true" />

      <section
        aria-label={label}
        className="absolute inset-x-0 bottom-0 z-[102] flex h-[70%] animate-slide-up flex-col overflow-hidden rounded-t-lg border-t border-outline-decorative bg-surface-base lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:w-[46%] lg:max-w-[620px] lg:rounded-none lg:border-l lg:border-t-0"
      >
        <header className="flex shrink-0 items-center gap-2 px-3 py-3">
          {channel && (
            <button type="button" onClick={back} aria-label="Back to the channel list" className={iconButtonClass}>
              <Icon name="chevron-left" className="size-3.5" />
            </button>
          )}
          <div className="min-w-0 flex-1 leading-tight">
            {channel ? (
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-primary-base">
                <span className="h-1.5 w-1.5 animate-pulse-fast rounded-full bg-primary-base" />
                Live now
              </span>
            ) : (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="truncate text-base font-bold text-white">{cluster?.place}</span>
                  <span className="truncate text-xs text-surface-onSurfaceSecondary">
                    {cluster?.region}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-primary-base">
                  {cluster?.channels.length ?? 0} channels live
                </span>
              </>
            )}
          </div>
          <button type="button" onClick={close} aria-label="Close" className={iconButtonClass}>
            <Icon name="close" className="size-3" />
          </button>
        </header>

        {/* One scroller, so the actions below it can never be pushed off the panel. The scrollbar
            stays visible here, because a short window really does cut the content off. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto border-t border-outline-decorative">
          {channel ? (
            <ChannelDetail channel={channel} cluster={cluster} />
          ) : (
            <>
              <div className="flex shrink-0 justify-end px-3 pt-3">
                <FilterSelect
                  id="explore_sort_by"
                  label="Sort by:"
                  value={sort}
                  onChange={setSort}
                  options={SORT_OPTIONS}
                  align="right"
                />
              </div>
              <div className="flex flex-col gap-1 p-2">
                {rows.map((row) => (
                  <ChannelRow
                    key={row.id}
                    channel={row}
                    onOpen={() => setSelectedChannel(row.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {channel && (
          <div className="flex shrink-0 flex-col gap-2 border-t border-outline-decorative p-4">
            <Link
              to={`/${channel.stream.channel.slug}`}
              className="rounded bg-primary-base px-4 py-3 text-center text-sm font-bold text-primary-onPrimary transition-colors betterhover:hover:bg-green-600"
            >
              Watch live
            </Link>
            <button
              type="button"
              onClick={back}
              className="state-layer-surface rounded border border-outline-decorative px-4 py-3 text-sm font-semibold text-white"
            >
              Back to {cluster?.place ?? "the list"}
            </button>
          </div>
        )}
      </section>
    </>
  );
}
