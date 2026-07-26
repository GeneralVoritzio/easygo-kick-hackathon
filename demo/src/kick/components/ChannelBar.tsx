import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../Icon";
import { formatViewers, type Livestream } from "../mock/api";

export function ChannelBar({ stream }: { stream: Livestream }) {
  const [following, setFollowing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const { channel } = stream;

  return (
    <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-start lg:justify-between lg:gap-8 lg:px-7 lg:py-5">
      <div className="flex min-w-0 gap-3 lg:gap-4">
        <div className="relative shrink-0">
          <img src={channel.avatar} alt={channel.username} className="size-14 rounded-full" />
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-primary-base px-1 py-0.5 text-[10px] font-bold leading-none text-primary-onPrimary">
            LIVE
          </span>
        </div>

        <div className="flex min-w-0 flex-col gap-1 pt-0.5">
          <h1 className="flex items-center gap-1 text-xl font-bold leading-[1.2] text-white">
            {channel.username}
            {channel.verified && <Icon name="verified" className="size-4 shrink-0" />}
          </h1>
          <p className="truncate text-sm font-semibold leading-[1.2] text-white">{stream.session_title}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Link
              to={`/browse/${stream.category.slug}`}
              className="text-sm font-normal leading-[1.2] text-surface-onSurfacePrimary betterhover:hover:underline"
            >
              {stream.category.name}
            </Link>
            {stream.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="rounded-full bg-surface-highest px-2 py-0.5 text-sm font-normal leading-[1.2] text-white state-layer-surface"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFollowing((f) => !f)}
            className={`flex h-10 items-center rounded px-3 text-base font-semibold leading-none transition-colors ${
              following ? "bg-surface-highest text-white" : "bg-primary-base text-primary-onPrimary"
            }`}
          >
            {following ? "Following" : "Follow"}
          </button>
          <button
            type="button"
            onClick={() => setSubscribed((s) => !s)}
            className="flex h-10 items-center rounded bg-secondary-base px-3 text-base font-semibold leading-none text-white"
          >
            {subscribed ? "Subscribed" : "Subscribe"}
          </button>
          <button
            type="button"
            aria-label="Share channel"
            className="flex size-10 shrink-0 items-center justify-center rounded bg-secondary-base text-white state-layer-surface"
          >
            <Icon name="share" className="size-4 fill-current" />
          </button>
        </div>

        <div className="text-sm font-bold leading-[1.2] text-primary-base">
          {formatViewers(stream.viewer_count)} viewers
        </div>
      </div>
    </div>
  );
}
