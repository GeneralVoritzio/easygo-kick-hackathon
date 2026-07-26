import { Link } from "react-router-dom";
import { Icon } from "../Icon";
import { formatViewers, type Livestream } from "../mock/api";

function CornerMarks() {
  return (
    <>
      <div className="absolute bottom-0 left-0 flex items-baseline opacity-0 transition-opacity betterhover:group-hover/card:opacity-100">
        <div className="h-3 w-1 bg-green-500" />
        <div className="h-1 w-2 bg-green-500" />
      </div>
      <div className="absolute bottom-0 right-0 flex items-baseline opacity-0 transition-opacity betterhover:group-hover/card:opacity-100">
        <div className="h-1 w-2 bg-green-500" />
        <div className="h-3 w-1 bg-green-500" />
      </div>
    </>
  );
}

export function StreamCard({ stream }: { stream: Livestream }) {
  return (
    <div className="group/card relative flex w-full shrink-0 grow-0 flex-col gap-2 will-change-transform lg:gap-0">
      <Link to={`/${stream.channel.slug}`} className="relative block w-full">
        <img
          src={stream.thumbnail}
          alt={stream.session_title}
          className="aspect-video w-full rounded object-cover"
        />
        <span className="absolute left-2 top-2 rounded-sm bg-negative-base px-1 py-0.5 text-[11px] font-bold uppercase leading-none text-white">
          Live
        </span>
        <span className="absolute bottom-2 left-2 rounded-sm bg-surfaceOverlay-base px-1 py-0.5 text-xs font-semibold leading-none text-white">
          {formatViewers(stream.viewer_count)} watching
        </span>
      </Link>

      <div className="flex w-full flex-row flex-nowrap gap-2 lg:px-1.5 lg:py-2 tv:py-4 fhd:py-5">
        <Link to={`/${stream.channel.slug}`} className="shrink-0">
          <img
            src={stream.channel.avatar}
            alt={stream.channel.username}
            className="size-11 shrink-0 rounded-full"
          />
        </Link>
        <div className="flex w-full min-w-0 flex-col items-start tv:gap-1 fhd:gap-1.5">
          <Link
            to={`/${stream.channel.slug}`}
            className="flex w-full items-center gap-1 truncate text-sm font-semibold leading-[1.2] text-white"
          >
            <span className="truncate">{stream.session_title}</span>
          </Link>
          <Link
            to={`/${stream.channel.slug}`}
            className="flex items-center gap-1 text-sm font-semibold leading-[1.2] text-surface-onSurfaceSecondary betterhover:hover:text-white"
          >
            {stream.channel.username}
            {stream.channel.verified && (
              <Icon name="verified" className="size-3.5 shrink-0 text-surface-onSurfacePrimary" />
            )}
          </Link>
          <button
            type="button"
            className="max-w-full truncate text-left text-sm font-normal leading-[1.2] text-surface-onSurfacePrimary betterhover:hover:underline"
          >
            {stream.category.name}
          </button>
          <div className="mt-1 flex max-h-[22px] w-full flex-row flex-wrap gap-x-1 overflow-hidden">
            {stream.tags.map((t) => (
              <button
                key={t}
                type="button"
                className="flex h-[22px] items-center rounded-full bg-surface-highest px-2 text-xs font-semibold leading-none text-surface-onSurfaceSecondary transition-colors betterhover:hover:bg-neutral-700 betterhover:hover:text-white"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
      <CornerMarks />
    </div>
  );
}

import { oneRowGrid } from "./Layout";

const streamColumns =
  "h-full grid-cols-1 gap-x-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 group-data-[sidebar=false]/main:xl:grid-cols-5 group-data-[sidebar=false]/main:2xl:grid-cols-6 group-data-[sidebar=false]/main:3xl:grid-cols-7";

export function StreamGrid({ streams, oneRow }: { streams: Livestream[]; oneRow?: boolean }) {
  return (
    <section className={`${streamColumns} ${oneRow ? `${oneRowGrid} [&>div]:w-[268px]` : "grid gap-y-5 lg:gap-y-6"}`}>
      {streams.map((s) => (
        <StreamCard key={s.id} stream={s} />
      ))}
    </section>
  );
}
