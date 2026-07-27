import { Link, useParams } from "react-router-dom";
import { liveStreamFor, profileFor } from "../mock/api";
import { ChannelShell, type ChannelTab } from "../components/ChannelShell";
import {
  ChannelAbout,
  ChannelClips,
  ChannelHome,
  ChannelVideos,
} from "../components/ChannelSections";

function ChannelNotFound({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-32 text-center">
      <p className="text-2xl font-bold leading-8 text-white">This channel does not exist</p>
      <p className="text-sm font-normal text-surface-onSurfaceSecondary">
        Nobody streams at kick.com/{slug}.
      </p>
      <Link
        to="/browse"
        className="mt-2 flex h-9 items-center rounded bg-primary-base px-3 text-sm font-semibold text-primary-onPrimary"
      >
        Browse channels
      </Link>
    </div>
  );
}

export function Channel({ tab = "home", watch }: { tab?: ChannelTab; watch?: boolean }) {
  const { slug = "" } = useParams();
  const profile = profileFor(slug);

  if (!profile) return <ChannelNotFound slug={slug} />;

  const stream = liveStreamFor(slug);
  const inPlayer = Boolean(watch && stream);

  return (
    <ChannelShell profile={profile} stream={stream} active={tab} watch={inPlayer}>
      {!inPlayer && tab === "home" && <ChannelHome profile={profile} />}
      {tab === "about" && <ChannelAbout profile={profile} />}
      {tab === "videos" && <ChannelVideos profile={profile} />}
      {tab === "clips" && <ChannelClips profile={profile} />}
    </ChannelShell>
  );
}
