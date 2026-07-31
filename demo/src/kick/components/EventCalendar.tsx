import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import { EventCard } from "./EventBits";
import { useEvents } from "../EventsStore";
import { byStartAt, EVENTS_NOW, type KickEvent } from "../mock/events";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const startOfMonth = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));

const monthFormat = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const dayFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

// An event that crosses midnight belongs to both days it touches.
const runsOn = (event: KickEvent, key: string) =>
  event.start_at.slice(0, 10) === key || event.end_at.slice(0, 10) === key;

export function EventCalendar({ onClose }: { onClose: () => void }) {
  const { events } = useEvents();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [cursor, setCursor] = useState(() => startOfMonth(EVENTS_NOW));
  const [selected, setSelected] = useState(() => dayKey(EVENTS_NOW));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const shiftMonth = (delta: number) =>
    setCursor((c) => new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + delta, 1)));

  const year = cursor.getUTCFullYear();
  const month = cursor.getUTCMonth();
  const firstWeekday = cursor.getUTCDay();
  const dayCount = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const todayKey = dayKey(EVENTS_NOW);
  const selectedEvents = events.filter((e) => runsOn(e, selected)).sort(byStartAt);

  return (
    <dialog
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      aria-label="Events calendar"
      className="m-auto w-[calc(100vw-32px)] max-w-[720px] rounded-lg bg-surface-base p-0 text-white backdrop:bg-black/75"
    >
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold lg:text-xl">
            <Icon name="calendar" className="size-5 shrink-0 fill-current" />
            All events
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded text-white state-layer-surface [&_svg]:size-4 [&_svg]:fill-current"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => shiftMonth(-1)}
            className="flex size-9 items-center justify-center rounded text-white state-layer-surface [&_svg]:size-4 [&_svg]:fill-current"
          >
            <Icon name="chevron-left" />
          </button>
          <span data-testid="calendar-month" className="text-base font-bold">
            {monthFormat.format(cursor)}
          </span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
            className="flex size-9 items-center justify-center rounded text-white state-layer-surface [&_svg]:size-4 [&_svg]:fill-current"
          >
            <Icon name="chevron-right" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((day) => (
            <span key={day} className="py-1 text-center text-xs font-semibold text-subtle">
              {day}
            </span>
          ))}
          {Array.from({ length: firstWeekday }, (_, i) => (
            <span key={`blank-${i}`} />
          ))}
          {Array.from({ length: dayCount }, (_, i) => {
            const date = new Date(Date.UTC(year, month, i + 1));
            const key = dayKey(date);
            const onThisDay = events.filter((e) => runsOn(e, key));
            const isToday = key === todayKey;

            return (
              <button
                key={key}
                type="button"
                disabled={onThisDay.length === 0}
                data-testid={`calendar-day-${key}`}
                aria-label={`${dayFormat.format(date)}, ${onThisDay.length} events`}
                aria-pressed={key === selected}
                onClick={() => setSelected(key)}
                className={`flex h-12 flex-col items-start gap-1 rounded p-1.5 text-sm font-semibold lg:h-14 lg:p-2 ${
                  onThisDay.length === 0 ? "text-subtle" : "text-white state-layer-surface"
                } ${key === selected ? "bg-secondary-base" : ""} ${
                  isToday ? "ring-1 ring-outline-decorative" : ""
                }`}
              >
                {i + 1}
                <span className="flex items-center gap-0.5">
                  {onThisDay.slice(0, 3).map((e) => (
                    <span
                      key={e.event_id}
                      className="size-1.5 rounded-full bg-primary-base"
                      data-testid="calendar-marker"
                    />
                  ))}
                  {onThisDay.length > 3 && (
                    <span className="text-[10px] leading-none text-subtle">
                      +{onThisDay.length - 3}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-subtle">
            {dayFormat.format(new Date(`${selected}T00:00:00Z`))}
          </h3>
          {selectedEvents.length === 0 ? (
            <p className="text-sm font-normal text-surface-onSurfaceSecondary">
              No events on this day.
            </p>
          ) : (
            <ul className="flex flex-col gap-4 sm:flex-row" data-testid="calendar-day-events">
              {selectedEvents.map((event) => (
                <li key={event.event_id} className="w-full sm:w-[268px]">
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </dialog>
  );
}
