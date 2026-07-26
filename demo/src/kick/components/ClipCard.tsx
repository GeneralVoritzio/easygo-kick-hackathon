import { Link } from "react-router-dom";
import { Icon } from "../Icon";
import { formatViewers } from "../mock/api";
import { CLIPS_NOW, type Clip } from "../mock/clips";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatClipAge(createdAt: string): string {
  const diffMs = CLIPS_NOW.getTime() - new Date(createdAt).getTime();
  const diffHours = Math.floor(diffMs / 3_600_000);
  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

export function ClipCard({ clip }: { clip: Clip }) {
  return (
    <div className="group/card flex w-full shrink-0 grow-0 flex-col gap-2">
      <div className="relative aspect-video w-full overflow-hidden rounded">
        <img
          src={clip.thumbnail}
          alt={clip.title}
          className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover/card:scale-[1.03]"
        />
        <span className="absolute bottom-2 left-2 rounded-sm bg-surfaceOverlay-base px-1 py-0.5 text-xs font-semibold leading-none text-white">
          {formatDuration(clip.duration_seconds)}
        </span>
        <span className="absolute bottom-2 right-2 rounded-sm bg-surfaceOverlay-base px-1 py-0.5 text-xs font-semibold leading-none text-white">
          {formatViewers(clip.view_count)} views
        </span>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-200 ease-out group-hover/card:-translate-y-1 group-hover/card:opacity-100">
          <div className="flex size-11 items-center justify-center rounded-full bg-surfaceOverlay-base">
            <Icon name="play" className="size-4 text-white" />
          </div>
        </div>
      </div>
      <div className="flex w-full min-w-0 flex-col items-start gap-0.5">
        <span className="line-clamp-2 w-full text-sm font-semibold leading-[1.2] text-white">
          {clip.title}
        </span>
        <span className="truncate text-sm font-semibold leading-[1.2] text-surface-onSurfaceSecondary">
          {clip.creator_username}
        </span>
        <Link
          to={`/browse/${clip.category.slug}`}
          className="truncate text-sm font-normal leading-[1.2] text-surface-onSurfacePrimary betterhover:hover:underline"
        >
          {clip.category.name}
        </Link>
        <span className="text-xs font-normal leading-[1.2] text-surface-onSurfaceSecondary">
          {formatClipAge(clip.created_at)}
        </span>
      </div>
    </div>
  );
}

export function ClipGrid({ clips }: { clips: Clip[] }) {
  return (
    <section className="grid h-full grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-y-6 3xl:grid-cols-6">
      {clips.map((clip) => (
        <ClipCard key={clip.id} clip={clip} />
      ))}
    </section>
  );
}
