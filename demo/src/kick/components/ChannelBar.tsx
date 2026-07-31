import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../Icon";
import { useEvent } from "../events/EventProvider";
import { Pill } from "./CardBits";
import { formatFollowers, type Livestream } from "../mock/api";
import type { KickEvent } from "../mock/events";

export function ChannelBar({
  stream,
  showFollowers,
  event,
}: {
  stream: Livestream;
  showFollowers?: boolean;
  event?: KickEvent;
}) {
  const { hypeTiers } = useEvent();
  const hypeTier = hypeTiers[stream.channel.slug] ?? 0;
  const [following, setFollowing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const { channel } = stream;

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col justify-between gap-3 pb-3 pt-2 lg:flex-row lg:gap-12 lg:pb-0 lg:pt-0">
      <div className="flex min-w-0 gap-3 lg:gap-4">
        <Link to={`/${channel.slug}/home`} className="relative flex size-12 shrink-0 items-center lg:size-16">
          <div
            className={`aspect-square w-full overflow-hidden rounded-full border-2 border-green-500 lg:border-4${
              hypeTier > 0 ? ` hype-shimmer hype-shimmer-round hype-tier-${hypeTier}` : ""
            }`}
          >
            <img
              src={channel.avatar}
              alt={channel.username}
              className="aspect-square w-full select-none transition-transform duration-300 ease-in-out betterhover:group-hover:scale-110"
            />
          </div>
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 transform whitespace-nowrap rounded-[2px] bg-green-500 px-1.5 py-1 text-[10px] font-bold uppercase leading-3 text-[#171A1C]">
            Live
          </span>
        </Link>

        <div className="flex min-w-0 grow flex-col gap-1 overflow-hidden">
          <h1 className="flex items-center gap-2 text-xl font-bold leading-[1.2] text-white">
            <Link to={`/${channel.slug}/home`} className="truncate betterhover:hover:underline">
              {channel.username}
            </Link>
            {channel.verified && <Icon name="verified" className="size-5 shrink-0" />}
          </h1>
          {showFollowers ? (
            <span className="truncate text-sm font-bold leading-[1.2] text-subtle">
              <span className="text-primary-base lg:text-[unset]">
                {formatFollowers(channel.followers)}
              </span>{" "}
              followers
            </span>
          ) : (
            <p className="truncate text-sm font-semibold leading-[1.2] text-white">
              {stream.session_title}
            </p>
          )}
          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2 overflow-hidden">
            {event && (
              <Link
                to={`/events/${event.slug}`}
                data-testid="channel-event-chip"
                title={event.title}
                className="flex h-[22px] max-w-full shrink-0 items-center gap-1 truncate whitespace-nowrap rounded-full bg-secondary-base px-2 text-sm font-semibold leading-none text-surface-onSurfacePrimary transition-colors betterhover:hover:bg-neutral-700"
              >
                <Icon name="event" className="size-3.5 shrink-0 fill-current" />
                <span className="truncate">{event.title}</span>
              </Link>
            )}
            <button
              type="button"
              className="text-sm font-normal leading-[1.2] text-surface-onSurfacePrimary betterhover:hover:underline"
            >
              {stream.category.name}
            </button>
            <Pill>{stream.language}</Pill>
            {stream.is_mature && <Pill>18+</Pill>}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="flex grow gap-2 lg:grow-0">
          <button
            type="button"
            aria-pressed={following}
            onClick={() => setFollowing((v) => !v)}
            className={`flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded px-3 py-2 text-base font-semibold transition-all select-none betterhover:active:scale-[0.98] ${
              following ? "bg-secondary-base text-white" : "bg-primary-base text-primary-onPrimary"
            }`}
          >
            <Icon name={following ? "heart-filled" : "heart"} className="size-4" />
            {following ? "Following" : "Follow"}
          </button>
          <button
            type="button"
            className="flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded bg-secondary-base px-3 py-2 text-base font-semibold text-white transition-all select-none betterhover:active:scale-[0.98]"
          >
            <Icon name="gift" className="size-4" />
            Gift Subs
          </button>
          <button
            type="button"
            onClick={() => setSubscribed((v) => !v)}
            className={`flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded px-3 py-2 text-base font-semibold transition-all select-none betterhover:active:scale-[0.98] ${
              subscribed ? "bg-primary-base text-primary-onPrimary" : "bg-secondary-base text-white"
            }`}
          >
            <Icon name="subscriptions" className="size-4" />
            {subscribed ? "Subscribed" : "Subscribe"}
          </button>
        </div>

        <div className="flex items-center gap-2 self-end py-0.5">
          <div className="flex min-h-[1.375rem] items-center gap-1 text-sm font-bold">
            <Icon name="chatters" className="size-4 shrink-0 fill-white" />
            <span className="text-subtle">
              <span className="text-primary-base tabular-nums">
                {stream.viewer_count.toLocaleString("en-US")}
              </span>{" "}
              watching
            </span>
          </div>
          <button
            type="button"
            aria-label="Share"
            className="tooltip-top flex size-10 shrink-0 items-center justify-center rounded text-white transition-colors duration-150 betterhover:hover:bg-stateLayer-surfaceHover active:bg-stateLayer-surfacePress"
          >
            <Icon name="share" className="size-4 fill-current" />
          </button>
          <button
            type="button"
            aria-label="Report"
            className="tooltip-top flex size-10 shrink-0 items-center justify-center rounded text-white transition-colors duration-150 betterhover:hover:bg-stateLayer-surfaceHover active:bg-stateLayer-surfacePress"
          >
            <Icon name="report" className="size-4 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
