import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import { buttonClass, inputClass, labelClass } from "./FormBits";
import { Toggle } from "./Toggle";
import { useEvents } from "../EventsStore";
import { currentUser, streamInfo } from "../mock/api";
import { formatEventTime, isLiveWindow, takesPart } from "../mock/events";

const NO_EVENT = "none";

export function GoLiveDialog({ onClose }: { onClose: () => void }) {
  const { events, goLiveEventId, selectGoLiveEvent } = useEvents();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState(streamInfo.session_title);
  const [mature, setMature] = useState(streamInfo.is_mature);

  const selectable = events.filter(
    (e) => isLiveWindow(e) && takesPart(e, currentUser.username),
  );
  const [eventId, setEventId] = useState(
    goLiveEventId ?? selectable[0]?.event_id ?? NO_EVENT,
  );
  const picked = selectable.find((e) => e.event_id === eventId);

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

  return (
    <dialog
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      aria-label="Check your stream info"
      className="m-auto w-[calc(100vw-32px)] max-w-[520px] rounded-lg bg-surface-base p-0 text-white backdrop:bg-black/75"
    >
      <form
        className="flex flex-col gap-4 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          selectGoLiveEvent(eventId === NO_EVENT ? null : eventId);
          onClose();
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Check your stream info</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded text-white state-layer-surface [&_svg]:size-4 [&_svg]:fill-current"
          >
            <Icon name="close" />
          </button>
        </div>

        <div>
          <label className={labelClass} htmlFor="golive-title">
            Stream title
          </label>
          <input
            id="golive-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className={labelClass}>Category and language</span>
          <div className="flex items-center gap-2">
            <img
              src={streamInfo.category.thumbnail}
              alt=""
              className="aspect-[164/219] h-[46px] shrink-0 rounded object-cover"
            />
            <div className="flex flex-col gap-1">
              <span className="text-sm text-white">{streamInfo.category.name}</span>
              <span className="w-fit rounded-full bg-secondary-base px-2 py-1 text-sm leading-none text-secondary-onSecondary">
                {streamInfo.language}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className={labelClass}>Mature content</span>
          <Toggle on={mature} onChange={setMature} label="Mature content" />
        </div>

        {selectable.length > 0 && (
          <div data-testid="golive-event-field">
            <label className={labelClass} htmlFor="golive-event">
              Event
            </label>
            <select
              id="golive-event"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className={inputClass}
            >
              <option value={NO_EVENT}>No event</option>
              {selectable.map((e) => (
                <option key={e.event_id} value={e.event_id}>
                  {e.title}
                </option>
              ))}
            </select>
            {picked && (
              <p className="mt-2 text-sm font-normal text-surface-onSurfaceSecondary">
                This event runs until {formatEventTime(picked.end_at)} UTC.
              </p>
            )}
          </div>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={`${buttonClass.ghost} h-9`}>
            Cancel
          </button>
          <button type="submit" className={`${buttonClass.primary} h-9`}>
            <Icon name="kick-mark" className="size-4" />
            Go live
          </button>
        </div>
      </form>
    </dialog>
  );
}
