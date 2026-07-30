import { Link } from "react-router-dom";
import { SettingsLayout } from "../components/SettingsLayout";
import { ThumbBadge } from "../components/CardBits";
import { formatDuration, formatViewers, timeAgo, watchHistory } from "../mock/api";

export function SettingsWatchHistory() {
  return (
    <SettingsLayout title="Watch History">
      {watchHistory.length === 0 ? (
        <p className="py-16 text-center text-sm font-normal text-surface-onSurfaceSecondary">
          You haven't watched any streams or VODs yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {watchHistory.map((entry) => (
            <Link
              key={`${entry.channelSlug}-${entry.video.id}`}
              to={`/${entry.channelSlug}/videos`}
              className="group/card flex w-full min-w-0 flex-col gap-2"
            >
              <div className="relative aspect-video w-full select-none overflow-hidden rounded">
                <img
                  src={entry.video.thumbnail}
                  alt={entry.video.title}
                  className="aspect-video w-full object-cover brightness-110 contrast-[110%] saturate-[110%]"
                />
                <ThumbBadge corner="top-left">{formatDuration(entry.video.duration_seconds)}</ThumbBadge>
                <ThumbBadge corner="bottom-left">
                  <span>{formatViewers(entry.video.view_count)}</span> views
                </ThumbBadge>
              </div>
              <div className="flex w-full flex-row gap-2">
                <img src={entry.channelAvatar} alt={entry.channelUsername} className="size-11 shrink-0 rounded-full" />
                <div className="flex w-full min-w-0 flex-col items-start">
                  <span className="max-w-full truncate text-sm font-semibold leading-5 text-white">
                    {entry.channelUsername}
                  </span>
                  <span className="max-w-full truncate text-base font-normal leading-6 text-surface-onSurfaceSecondary">
                    {entry.video.title}
                  </span>
                  <span className="mt-1 text-sm font-normal leading-5 text-surface-onSurfaceSecondary">
                    Watched {timeAgo(entry.watchedAt)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </SettingsLayout>
  );
}
