import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { profileFor, liveStreamFor } from "../mock/api";
import { MULTIVIEW_CAP } from "./events";

export type ChatMode = "stream" | "event";

type Multiview = {
  active: boolean;
  slots: string[];
};

type EventContextValue = {
  multiview: Multiview;
  chatMode: ChatMode;
  setChatMode: (mode: ChatMode) => void;
  openMultiview: (slug: string) => void;
  closeMultiview: () => void;
  pin: (slug: string) => void;
  unpin: (slug: string) => void;
  reorder: (from: number, to: number) => void;
};

const EventContext = createContext<EventContextValue | null>(null);

export function useEvent() {
  const value = useContext(EventContext);
  if (!value) throw new Error("useEvent needs EventProvider");
  return value;
}

const pages = new Set([
  "",
  "browse",
  "following",
  "settings",
  "drops",
  "dashboard",
  "demo",
  "events",
]);

function channelSlugOf(pathname: string): string | undefined {
  const first = pathname.split("/")[1] ?? "";
  if (pages.has(first)) return undefined;
  return profileFor(first) ? first : undefined;
}

type Guard =
  | { kind: "channel"; slug: string }
  | { kind: "page"; backTo: string };

export function EventProvider({ children }: { children: ReactNode }) {
  const [multiview, setMultiview] = useState<Multiview>({ active: false, slots: [] });
  const [chatMode, setChatMode] = useState<ChatMode>("stream");
  const [guard, setGuard] = useState<Guard | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const lastAllowed = useRef(location.pathname);

  // The leave guard from the spec: while multiview runs, any navigation away
  // prompts to leave or to add the streamer. A slot switch passes through.
  useEffect(() => {
    if (!multiview.active) {
      lastAllowed.current = location.pathname;
      return;
    }
    const slug = channelSlugOf(location.pathname);
    if (slug && multiview.slots.includes(slug)) {
      lastAllowed.current = location.pathname;
      setGuard(null);
      return;
    }
    if (slug && liveStreamFor(slug)) {
      setGuard({ kind: "channel", slug });
      return;
    }
    setGuard({ kind: "page", backTo: lastAllowed.current });
  }, [location.pathname, multiview]);

  const value = useMemo<EventContextValue>(
    () => ({
      multiview,
      chatMode,
      setChatMode,
      openMultiview: (slug) => setMultiview({ active: true, slots: [slug] }),
      closeMultiview: () => setMultiview({ active: false, slots: [] }),
      pin: (slug) =>
        setMultiview((m) =>
          m.slots.includes(slug) || m.slots.length >= MULTIVIEW_CAP
            ? m
            : { ...m, slots: [...m.slots, slug] },
        ),
      unpin: (slug) => setMultiview((m) => ({ ...m, slots: m.slots.filter((s) => s !== slug) })),
      reorder: (from, to) =>
        setMultiview((m) => {
          const slots = [...m.slots];
          const [moved] = slots.splice(from, 1);
          slots.splice(to, 0, moved);
          return { ...m, slots };
        }),
    }),
    [multiview, chatMode],
  );

  function addAndWatch(slug: string) {
    setMultiview((m) =>
      m.slots.length >= MULTIVIEW_CAP ? m : { ...m, slots: [...m.slots, slug] },
    );
    setGuard(null);
    navigate(`/${slug}`);
  }

  function leaveMultiview() {
    setMultiview({ active: false, slots: [] });
    setGuard(null);
  }

  return (
    <EventContext.Provider value={value}>
      {children}
      {guard && (
        <div className="z-popover fixed inset-0 flex items-center justify-center bg-surfaceOverlay-base p-4">
          <div className="w-full max-w-sm rounded bg-surface-base p-4">
            <span className="block text-base font-bold text-white">
              {guard.kind === "channel"
                ? `Add ${liveStreamFor(guard.slug)?.channel.username ?? guard.slug} to multiview?`
                : "Leave multiview?"}
            </span>
            <span className="mt-1 block text-sm text-surface-onSurfaceSecondary">
              {guard.kind === "channel"
                ? "You are in a multiview. They can join your grid, or you can leave the multiview and watch them alone."
                : "You are in a multiview. This page closes it."}
            </span>
            <div className="mt-4 flex gap-2">
              {guard.kind === "channel" ? (
                <>
                  <button
                    type="button"
                    onClick={() => addAndWatch(guard.slug)}
                    disabled={multiview.slots.length >= MULTIVIEW_CAP}
                    className="state-layer-base h-9 flex-1 rounded bg-primary-base text-sm font-semibold text-primary-onPrimary disabled:bg-disabled-base disabled:text-disabled-onSurface"
                  >
                    Add to multiview
                  </button>
                  <button
                    type="button"
                    onClick={leaveMultiview}
                    className="h-9 flex-1 rounded bg-secondary-base text-sm font-semibold text-secondary-onSecondary"
                  >
                    Leave multiview
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setGuard(null);
                      navigate(guard.backTo);
                    }}
                    className="state-layer-base h-9 flex-1 rounded bg-primary-base text-sm font-semibold text-primary-onPrimary"
                  >
                    Stay in multiview
                  </button>
                  <button
                    type="button"
                    onClick={leaveMultiview}
                    className="h-9 flex-1 rounded bg-secondary-base text-sm font-semibold text-secondary-onSecondary"
                  >
                    Leave multiview
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </EventContext.Provider>
  );
}
