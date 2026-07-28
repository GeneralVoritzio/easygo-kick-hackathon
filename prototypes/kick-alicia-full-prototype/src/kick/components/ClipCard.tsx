import { useState } from "react";
import { Link } from "react-router-dom";
import { CornerMarks, Pill, ThumbBadge } from "./CardBits";
import { ClipModal } from "./ClipModal";
import { streamColumns } from "./StreamCard";
import { oneRowGrid } from "./Layout";
import { formatViewers } from "../mock/api";
import { formatClipAge, formatDuration, type Clip } from "../mock/clips";

export function ClipCard({ clip }: { clip: Clip }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="group/card relative flex w-full shrink-0 grow-0 flex-col gap-2 will-change-transform lg:gap-0">
      {open && <ClipModal clip={clip} onClose={() => setOpen(false)} />}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative block aspect-video w-full cursor-pointer select-none overflow-hidden rounded"
      >
        <img
          src={clip.thumbnail}
          alt={clip.title}
          className="aspect-video w-full object-cover brightness-110 contrast-[110%] saturate-[110%]"
        />
        <ThumbBadge corner="top-left">{formatDuration(clip.duration_seconds)}</ThumbBadge>
        <ThumbBadge corner="bottom-left">
          <span>{formatViewers(clip.view_count)}</span> views
        </ThumbBadge>
      </button>

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
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="line-clamp-1 max-w-full cursor-pointer text-left text-base font-normal leading-6 text-surface-onSurfaceSecondary"
          >
            {clip.title}
          </button>
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

export function ClipGrid({ clips, oneRow }: { clips: Clip[]; oneRow?: boolean }) {
  return (
    <section
      className={`${streamColumns} ${oneRow ? `${oneRowGrid} [&>div]:w-[268px]` : "grid gap-y-5 lg:gap-y-6"}`}
    >
      {clips.map((clip) => (
        <ClipCard key={clip.id} clip={clip} />
      ))}
    </section>
  );
}
