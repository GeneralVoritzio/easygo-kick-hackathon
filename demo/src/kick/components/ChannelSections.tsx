import { Icon } from "../Icon";
import { CornerMarks, Pill, ThumbBadge } from "./CardBits";
import { ClipGrid } from "./ClipCard";
import {
  formatDuration,
  formatFollowers,
  formatViewers,
  timeAgo,
  type ChannelProfile,
  type ChannelVideo,
} from "../mock/api";
import { clips } from "../mock/clips";

function VideoCard({
  video,
  channelName,
  avatar,
}: {
  video: ChannelVideo;
  channelName: string;
  avatar: string;
}) {
  return (
    <div className="group/card relative flex w-full min-w-0 shrink-0 grow-0 flex-col gap-2 lg:gap-0">
      <div className="relative aspect-video w-full select-none overflow-hidden rounded">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="aspect-video w-full object-cover brightness-110 contrast-[110%] saturate-[110%]"
        />
        <ThumbBadge corner="top-left">{formatDuration(video.duration_seconds)}</ThumbBadge>
        <ThumbBadge corner="bottom-left">
          <span>{formatViewers(video.view_count)}</span> views
        </ThumbBadge>
      </div>
      <div className="flex w-full flex-row gap-2 lg:px-1.5 lg:py-2">
        <img src={avatar} alt={channelName} className="size-11 shrink-0 rounded-full" />
        <div className="flex w-full min-w-0 flex-col items-start">
          <span className="max-w-full truncate text-sm font-semibold leading-5 text-white">
            {channelName}
          </span>
          <span className="max-w-full truncate text-base font-normal leading-6 text-surface-onSurfaceSecondary">
            {video.title}
          </span>
          <div className="mt-2 flex max-h-[22px] w-full min-w-0 flex-row items-center gap-1 overflow-hidden">
            <Pill>{video.category.name}</Pill>
            <span className="shrink-0 text-sm font-normal leading-5 text-surface-onSurfaceSecondary">
              · {timeAgo(video.created_at)}
            </span>
          </div>
        </div>
      </div>
      <CornerMarks />
    </div>
  );
}

const videoColumns =
  "grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-y-6 3xl:grid-cols-5";

export function VideoGrid({ profile }: { profile: ChannelProfile }) {
  return (
    <div className={videoColumns}>
      {profile.videos.map((v) => (
        <VideoCard
          key={v.id}
          video={v}
          channelName={profile.channel.username}
          avatar={profile.channel.avatar}
        />
      ))}
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <p className="py-16 text-center text-sm font-normal text-surface-onSurfaceSecondary">
      {message}
    </p>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold leading-8 text-white">{children}</h2>;
}

export function ChannelHome({ profile }: { profile: ChannelProfile }) {
  const channelClips = clips.filter((c) => c.channel.slug === profile.channel.slug);

  return (
    <div className="flex w-full flex-col gap-8 px-4 py-6">
      {profile.videos.length > 0 && (
        <section className="flex w-full flex-col gap-3">
          <Heading>Stream Videos</Heading>
          <VideoGrid profile={profile} />
        </section>
      )}

      {channelClips.length > 0 && (
        <section className="flex w-full flex-col gap-3">
          <Heading>Popular Clips</Heading>
          <ClipGrid clips={[...channelClips].sort((a, b) => b.view_count - a.view_count)} />
        </section>
      )}

      {profile.recent_categories.length > 0 && (
        <section className="flex w-full flex-col gap-3">
          <Heading>Recently Streamed Categories</Heading>
          <div className="flex flex-row flex-wrap gap-4">
            {profile.recent_categories.map((c) => (
              <button key={c.slug} type="button" className="flex w-[132px] flex-col gap-2">
                <img
                  src={c.thumbnail}
                  alt={c.name}
                  className="aspect-[3/4] w-full rounded-lg object-cover"
                />
                <span className="w-full truncate text-left text-sm font-semibold leading-[1.2] text-white">
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export function ChannelVideos({ profile }: { profile: ChannelProfile }) {
  return (
    <div className="flex w-full flex-col gap-3 px-4 py-6">
      <Heading>Stream Videos</Heading>
      {profile.videos.length === 0 ? (
        <Empty message={`${profile.channel.username} has no past broadcasts yet.`} />
      ) : (
        <VideoGrid profile={profile} />
      )}
    </div>
  );
}

export function ChannelClips({ profile }: { profile: ChannelProfile }) {
  const channelClips = clips
    .filter((c) => c.channel.slug === profile.channel.slug)
    .sort((a, b) => b.view_count - a.view_count);

  return (
    <div className="flex w-full flex-col gap-3 px-4 py-6">
      <Heading>Clips</Heading>
      {channelClips.length === 0 ? (
        <Empty message={`Nobody has clipped ${profile.channel.username} yet.`} />
      ) : (
        <ClipGrid clips={channelClips} />
      )}
    </div>
  );
}

// KICK sizes a panel by width and lets the uploaded image set the height. Ours are one shape,
// so the row stays even: 340 wide, the same 340 by 420 box as the panel art.
const panelBox = "h-[420px] w-full max-w-[340px] shrink-0";

export function ChannelAboutCard({ profile }: { profile: ChannelProfile }) {
  const { channel, bio, socials, panels } = profile;

  return (
    <div className="flex flex-col gap-4">
      <section className="flex h-fit grow flex-col gap-2 rounded-lg bg-surface-base p-4 lg:p-6">
        <div className="flex grow items-center justify-between gap-3">
          <div className="flex shrink-0 grow flex-row items-center gap-x-3">
            <div className="flex items-center gap-1 text-base font-bold text-surface-onSurface">
              About {channel.username}
              {channel.verified && (
                <Icon name="verified" className="size-4 shrink-0 text-surface-onSurfacePrimary" />
              )}
            </div>
            <span className="text-sm font-semibold text-surface-onSurfaceSecondary">
              <span className="text-surface-onSurfacePrimary">
                {formatFollowers(channel.followers)}
              </span>{" "}
              Followers
            </span>
          </div>
        </div>

        {socials.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 lg:gap-x-4 lg:gap-y-2">
            {socials.map((s) => (
              <button
                key={s.icon + s.handle}
                type="button"
                className="state-layer-surface flex min-h-9 max-w-[200px] shrink-0 items-center gap-1.5 rounded px-2 text-sm font-semibold text-surface-onSurface"
              >
                <Icon name={s.icon} className="size-4 shrink-0 fill-current" />
                <span className="truncate">{s.handle}</span>
              </button>
            ))}
          </div>
        )}

        <p className="text-sm font-normal leading-5 text-surface-onSurfaceSecondary">{bio}</p>
      </section>

      {panels.length > 0 && (
        <div className="flex flex-row flex-wrap justify-center gap-3">
          {panels.map((p) =>
            p.kind === "image" ? (
              <button key={p.alt} type="button" className={panelBox}>
                <img src={p.art} alt={p.alt} className="h-full w-full rounded-lg object-cover" />
              </button>
            ) : (
              <div
                key={p.title}
                className={`${panelBox} flex flex-col gap-3 overflow-hidden rounded-lg bg-surface-base p-5`}
              >
                <span className="text-sm font-bold uppercase leading-5 tracking-wide text-surface-onSurfacePrimary">
                  {p.title}
                </span>
                <p className="text-base font-normal leading-6 text-surface-onSurfaceSecondary">
                  {p.body}
                </p>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export function ChannelAbout({ profile }: { profile: ChannelProfile }) {
  const { channel, bio, recent_categories } = profile;

  return (
    <div className="flex w-full max-w-[824px] flex-col gap-6 px-4 py-6">
      <section className="flex flex-col gap-3">
        <Heading>About {channel.username}</Heading>
        <p className="text-base font-normal leading-6 text-surface-onSurfaceSecondary">{bio}</p>
        <span className="text-sm font-semibold leading-5 text-white">
          {formatFollowers(channel.followers)} followers
        </span>
      </section>

      {recent_categories.length > 0 && (
        <section className="flex flex-col gap-3">
          <Heading>Categories</Heading>
          <div className="flex flex-row flex-wrap gap-1">
            {recent_categories.map((c) => (
              <Pill key={c.slug}>{c.name}</Pill>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
