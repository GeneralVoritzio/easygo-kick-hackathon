import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../Icon";
import { PinnedCard } from "../components/PinnedCard";
import { liveStreamFor } from "../mock/api";
import { useEvents } from "../EventsStore";
import { BOOST_NOTICE_SECONDS, formatBoostLeft, MULTIVIEW_CAP } from "./events";
import { useEvent, type BoostNotice } from "./EventProvider";
import { PixelStar } from "./HypeStars";

// The notice's own countdown ticks independently of the provider's expiry sweep, which only
// re-renders when a notice actually drops out of the list, not every second.
function useTick() {
  const [, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
}

function BoostNoticeCard({ notice }: { notice: BoostNotice }) {
  useTick();
  const navigate = useNavigate();
  const { events } = useEvents();
  const { multiview, pin, dismissBoostNotice } = useEvent();
  const stream = liveStreamFor(notice.slug);
  const event = events.find((e) => e.event_id === notice.eventId);

  if (!stream || !event) return null;

  const elapsed = Math.floor((Date.now() - notice.createdAt) / 1000);
  const remaining = Math.max(0, BOOST_NOTICE_SECONDS - elapsed);
  const pinned = multiview.slots.includes(notice.slug);
  const full = multiview.slots.length >= MULTIVIEW_CAP;

  const timeColor =
    remaining > BOOST_NOTICE_SECONDS / 2
      ? "#53fc18"
      : remaining > BOOST_NOTICE_SECONDS / 4
        ? "#ffd700"
        : "#ff5050";

  return (
    <PinnedCard borderColor={timeColor}>
      <div className="flex items-center gap-1.5">
        <PixelStar size="size-4" fillClass="fill-[#ffd700]" />
        <span className="hype-shimmer hype-tier-3 whitespace-nowrap font-[KickFont] text-base leading-none text-white">
          MAX HYPE
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span
            aria-label="Channel Points Multiplier: 2x"
            className="tooltip-bottom cursor-default font-[KickFont] text-sm leading-none text-primary-base"
          >
            2x CP
          </span>
          <span
            aria-label="Boosted XP Rate: 2x"
            className="tooltip-bottom tooltip-end cursor-default font-[KickFont] text-sm leading-none text-[#ff5050]"
          >
            2x XP
          </span>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => dismissBoostNotice(notice.id)}
          className="state-layer-surface flex size-7 shrink-0 items-center justify-center rounded text-white"
        >
          <Icon name="close" className="size-3.5" />
        </button>
      </div>
      <div className="min-w-0">
        <span className="block truncate text-sm font-bold text-white">
          {stream.channel.username}
        </span>
        <span className="block truncate text-xs text-surface-onSurfaceSecondary">
          {event.title}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span
          aria-label={`${formatBoostLeft(remaining)} left`}
          className="tooltip-top cursor-default text-sm leading-none"
        >
          🐌
        </span>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            disabled={pinned || full}
            onClick={() => {
              pin(notice.slug);
              dismissBoostNotice(notice.id);
            }}
            className="h-7 rounded bg-secondary-base px-2 text-xs font-semibold text-secondary-onSecondary disabled:bg-disabled-base disabled:text-disabled-onSurface"
          >
            {pinned ? "Pinned" : "Pin"}
          </button>
          <button
            type="button"
            onClick={() => {
              dismissBoostNotice(notice.id);
              navigate(`/${notice.slug}`);
            }}
            className="h-7 rounded bg-primary-base px-2 text-xs font-semibold text-primary-onPrimary"
          >
            Watch
          </button>
        </div>
      </div>
    </PinnedCard>
  );
}

// Pinned at the top of whichever chat panel is open, same shell as every other notice
// docked there (HypeDemoRow). Not global any more: the chat panel is the surface for
// this, so a viewer sees it exactly where the rest of the event's system notices live.
export function BoostNoticeCards({ currentSlug }: { currentSlug?: string }) {
  const { boostNotices } = useEvent();
  const notices = boostNotices.filter((n) => n.slug !== currentSlug);

  if (notices.length === 0) return null;

  return (
    <>
      {notices.map((n) => (
        <BoostNoticeCard key={n.id} notice={n} />
      ))}
    </>
  );
}
