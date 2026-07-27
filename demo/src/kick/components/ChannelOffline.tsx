import { useState } from "react";
import { Icon } from "../Icon";
import { formatFollowers, timeAgo, type ChannelProfile } from "../mock/api";

export function ChannelOffline({ profile }: { profile: ChannelProfile }) {
  const { channel, banner, last_live_at } = profile;
  const [following, setFollowing] = useState(false);

  return (
    <div className="flex w-full flex-col">
      <div className="relative block h-[var(--channel-desktop-banner-height)] w-full shrink-0 overflow-hidden bg-black">
        {banner && (
          <img
            src={banner}
            alt={`${channel.username} banner`}
            className="absolute inset-x-0 top-0 h-full w-full object-cover"
          />
        )}
        <div className="z-player absolute left-7 top-7 flex h-fit w-fit items-center gap-4 rounded bg-surface-base p-5 font-bold leading-[1.2]">
          <span className="rounded-[2px] bg-white p-1 text-sm font-bold uppercase leading-5 text-surface-lowest">
            Offline
          </span>
          <h2 className="text-2xl font-bold leading-8 text-white">{channel.username} is offline</h2>
        </div>
      </div>

      <div className="flex w-full flex-row items-start justify-between gap-4 px-4 py-4">
        <div className="flex min-w-0 flex-row items-center gap-3">
          <img
            src={channel.avatar}
            alt={channel.username}
            className="size-16 shrink-0 rounded-full"
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <h1 className="truncate text-xl font-bold leading-[1.4] text-white">
                {channel.username}
              </h1>
              {channel.verified && (
                <Icon name="verified" className="size-4 shrink-0 text-surface-onSurfacePrimary" />
              )}
            </div>
            <span className="text-sm font-semibold leading-[1.2] text-subtle">
              {formatFollowers(channel.followers)} followers
            </span>
            <span className="text-sm font-bold leading-[1.2] text-white">
              Last live {timeAgo(last_live_at)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex flex-row items-center gap-2">
            <button
              type="button"
              aria-label={following ? "Unfollow" : "Follow"}
              aria-pressed={following}
              onClick={() => setFollowing((v) => !v)}
              className="flex size-10 items-center justify-center rounded state-layer-surface"
            >
              <Icon
                name={following ? "heart-filled" : "heart"}
                className={`size-5 ${following ? "text-primary-base" : "text-white"}`}
              />
            </button>
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded bg-secondary-base px-3 text-base font-semibold text-white transition-all select-none betterhover:active:scale-[0.98]"
            >
              <Icon name="gift" className="size-4" />
              Gift Subs
            </button>
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded bg-primary-base px-3 text-base font-semibold text-primary-onPrimary transition-all select-none betterhover:active:scale-[0.98]"
            >
              Subscribe
            </button>
          </div>
          <button
            type="button"
            aria-label="Share"
            className="flex size-10 items-center justify-center rounded state-layer-surface"
          >
            <Icon name="share" className="size-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
