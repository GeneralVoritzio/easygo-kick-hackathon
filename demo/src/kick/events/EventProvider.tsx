import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { profileFor, liveStreamFor } from "../mock/api";
import { EmbedLayer } from "./EmbedLayer";
import { BOOST_MINUTES, MULTIVIEW_CAP } from "./events";

export type ChatMode = "stream" | "event";

type Multiview = {
  active: boolean;
  slots: string[];
};

type EventContextValue = {
  multiview: Multiview;
  chatMode: ChatMode;
  setChatMode: (mode: ChatMode) => void;
  liveEmbeds: boolean;
  setLiveEmbeds: (on: boolean) => void;
  registerEmbedTarget: (slug: string, el: HTMLElement) => () => void;
  claimAudible: (slug: string) => () => void;
  boosts: Record<string, number>;
  boost: (slug: string) => void;
  hypeTiers: Record<string, number>;
  setHypeTier: (slug: string, tier: number) => void;
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

// Pins survive a close and a reload, so a viewer's grid is one click away.
const SLOTS_KEY = "multiview-slots";

function storedSlots(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(SLOTS_KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((slug): slug is string => typeof slug === "string" && Boolean(liveStreamFor(slug)));
  } catch {
    return [];
  }
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
  const [multiview, setMultiview] = useState<Multiview>(() => ({
    active: false,
    slots: storedSlots(),
  }));
  const [chatMode, setChatMode] = useState<ChatMode>("stream");
  const [liveEmbeds, setLiveEmbeds] = useState(
    // Off unless somebody turns it on by hand: the demo runs on the mock
    // stills, and the live embeds stay behind this flag as a fallback.
    () => localStorage.getItem("multiview-live-embeds") === "1",
  );
  const [embedTargets, setEmbedTargets] = useState<Map<string, HTMLElement>>(new Map());
  const [audibleSlug, setAudibleSlug] = useState<string>();

  const registerEmbedTarget = useCallback((slug: string, el: HTMLElement) => {
    setEmbedTargets((prev) => new Map(prev).set(slug, el));
    return () => {
      setEmbedTargets((prev) => {
        if (prev.get(slug) !== el) return prev;
        const next = new Map(prev);
        next.delete(slug);
        return next;
      });
    };
  }, []);

  const claimAudible = useCallback((slug: string) => {
    setAudibleSlug(slug);
    return () => setAudibleSlug((current) => (current === slug ? undefined : current));
  }, []);

  const [boosts, setBoosts] = useState<Record<string, number>>({});

  const boost = useCallback((slug: string) => {
    setBoosts((prev) => ({ ...prev, [slug]: Date.now() + BOOST_MINUTES * 60_000 }));
  }, []);

  const [hypeTiers, setHypeTiers] = useState<Record<string, number>>({});

  const setHypeTier = useCallback((slug: string, tier: number) => {
    setHypeTiers((prev) => ({ ...prev, [slug]: tier }));
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setBoosts((prev) => {
        const now = Date.now();
        const live = Object.entries(prev).filter(([, until]) => until > now);
        return live.length === Object.keys(prev).length ? prev : Object.fromEntries(live);
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem(SLOTS_KEY, JSON.stringify(multiview.slots));
  }, [multiview.slots]);

  useEffect(() => {
    localStorage.setItem("multiview-live-embeds", liveEmbeds ? "1" : "0");
  }, [liveEmbeds]);
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
      liveEmbeds,
      setLiveEmbeds,
      registerEmbedTarget,
      claimAudible,
      boosts,
      boost,
      hypeTiers,
      setHypeTier,
      openMultiview: (slug) =>
        setMultiview((m) => ({
          active: true,
          slots: m.slots.includes(slug) ? m.slots : [slug, ...m.slots].slice(0, MULTIVIEW_CAP),
        })),
      closeMultiview: () => setMultiview((m) => ({ ...m, active: false })),
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
    [multiview, chatMode, liveEmbeds, registerEmbedTarget, claimAudible, boosts, boost, hypeTiers, setHypeTier],
  );

  function addAndWatch(slug: string) {
    setMultiview((m) =>
      m.slots.length >= MULTIVIEW_CAP ? m : { ...m, slots: [...m.slots, slug] },
    );
    setGuard(null);
    navigate(`/${slug}`);
  }

  function leaveMultiview() {
    setMultiview((m) => ({ ...m, active: false }));
    setGuard(null);
  }

  return (
    <EventContext.Provider value={value}>
      {children}
      <EmbedLayer
        targets={embedTargets}
        slots={multiview.slots}
        audible={audibleSlug}
        liveEmbeds={liveEmbeds}
      />
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

export function useBoostLeft(slug: string): number | null {
  const { boosts } = useEvent();
  const until = boosts[slug];
  const [, tick] = useState(0);

  useEffect(() => {
    if (!until) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [until]);

  if (!until) return null;
  const left = Math.floor((until - Date.now()) / 1000);
  return left > 0 ? left : null;
}
