import { Link } from "react-router-dom";
import { CornerMarks, Pill, ThumbBadge } from "./CardBits";
import { streamColumns } from "./StreamCard";
import { formatViewers } from "../mock/api";
import { CLIPS_NOW, type Clip } from "../mock/clips";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatClipAge(createdAt: string): string {
  const diffMs = CLIPS_NOW.getTime() - new Date(createdAt).getTime();
  const diffHours = Math.floor(diffMs / 3_600_000);
  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} days ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
}

export function ClipCard({ clip }: { clip: Clip }) {
  return (
    <div className="group/card relative flex w-full shrink-0 grow-0 flex-col gap-2 will-change-transform lg:gap-0">
      <div className="relative aspect-video w-full select-none overflow-hidden rounded">
        <img
          src={clip.thumbnail}
          alt={clip.title}
          className="aspect-video w-full object-cover brightness-110 contrast-[110%] saturate-[110%]"
        />
        <ThumbBadge corner="top-left">{formatDuration(clip.duration_seconds)}</ThumbBadge>
        <ThumbBadge corner="bottom-left">
          <span>{formatViewers(clip.view_count)}</span> views
        </ThumbBadge>
      </div>

      <div className="flex w-full flex-row flex-nowrap gap-2 lg:px-1.5 lg:py-2 tv:py-4 fhd:py-5">
        <Link to={`/${clip.channel.slug}`} className="shrink-0">
          <img
            src={clip.channel.avatar}
            alt={clip.channel.username}
            className="size-11 shrink-0 rounded-full"
          />
        </Link>
        <div className="flex w-full min-w-0 flex-col items-start tv:gap-1 fhd:gap-1.5">
          <Link
            to={`/${clip.channel.slug}`}
            className="max-w-full truncate text-sm font-semibold leading-5 text-white"
          >
            {clip.channel.username}
          </Link>
          <span className="line-clamp-1 max-w-full text-base font-normal leading-6 text-surface-onSurfaceSecondary">
            {clip.title}
          </span>
          <div className="mt-2 flex max-h-[22px] w-full min-w-0 flex-row items-center gap-1 overflow-hidden">
            <Pill>{clip.category.name}</Pill>
            <span className="shrink-0 text-sm font-normal leading-5 text-surface-onSurfaceSecondary">
              · {formatClipAge(clip.created_at)}
            </span>
          </div>
        </div>
      </div>
      <CornerMarks />
    </div>
  );
}

export function ClipGrid({ clips }: { clips: Clip[] }) {
  return (
    <section className={`${streamColumns} grid gap-y-5 lg:gap-y-6`}>
      {clips.map((clip) => (
        <ClipCard key={clip.id} clip={clip} />
      ))}
    </section>
  );
}
