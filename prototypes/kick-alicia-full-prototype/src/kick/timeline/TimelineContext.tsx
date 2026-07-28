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
import { formatDuration, type Livestream } from "../mock/api";
import { getTimeline, type Moment, type MomentGroup, type Timeline } from "./data";

/*
  Shared state for one watch session: the playhead (live edge grows on a real clock, the
  viewer's own seek follows it until they scrub away), bookmarks, search, which panel is open,
  the rail<->Highlights-panel hover link, and the clip viewer. Ported from kick-timeline-with-
  recap's js/player.js, js/bookmarks.js, js/search.js, js/scrubber.js's link state and
  js/app.js's keyboard handler, minus every Expedition-widget line.
*/

const MIN_GAP_SECONDS = 120;
const RESULT_LIMIT = 12;
const CHAT_PREFIX = /^[@/]chat\b\s*/i;
const STOPWORDS = new Set(["the", "and", "for", "are", "was", "with", "that", "this"]);

function keywords(query: string) {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return words.length ? words : [query.toLowerCase().trim()];
}

function stemVariants(word: string) {
  const variants = [word];
  if (word.length > 4) {
    if (/ies$/.test(word)) variants.push(word.slice(0, -3) + "y");
    else if (/s$/.test(word)) variants.push(word.slice(0, -1));
    if (/ed$/.test(word)) variants.push(word.slice(0, -2));
    if (/ing$/.test(word)) variants.push(word.slice(0, -3));
  }
  return variants;
}

function matchesAny(haystack: string, words: string[]) {
  return words.some((w) => stemVariants(w).some((variant) => haystack.includes(variant)));
}

function dedupe(hits: Moment[]) {
  const sorted = hits.slice().sort((a, b) => a.t - b.t);
  const kept: Moment[] = [];
  for (const h of sorted) {
    const last = kept[kept.length - 1];
    if (last && h.t - last.t < MIN_GAP_SECONDS) continue;
    kept.push(h);
  }
  return kept.slice(0, RESULT_LIMIT);
}

type PlayheadState = {
  t: number;
  liveEdge: number;
  isPlaying: boolean;
  isFollowingLive: boolean;
};

type ClipView = { kind: "single"; moment: Moment } | { kind: "sequence"; moments: Moment[] } | null;

type SearchState = { query: string; scope: "moments" | "chat"; results: Moment[] };

export type TimelineValue = {
  stream: Livestream;
  timeline: Timeline;

  t: number;
  liveEdge: number;
  isPlaying: boolean;
  isFollowingLive: boolean;
  joinedAt: number;
  secondsBehindLive: number;
  seek: (t: number) => void;
  togglePlay: () => void;
  goLive: () => void;

  volume: number;
  setVolume: (v: number) => void;
  muted: boolean;
  setMuted: (m: boolean) => void;

  bookmarks: Moment[];
  toggleBookmark: (t: number, title?: string | null) => void;
  bookmarkAt: (t: number) => Moment | undefined;

  search: SearchState & { run: (raw: string) => void; clear: () => void; hasRun: boolean };

  highlightsOpen: boolean;
  toggleHighlights: () => void;
  openHighlights: () => void;
  closeHighlights: () => void;
  openSearch: () => void;
  searchFocusToken: number;

  linkedId: string | null;
  linkedGroup: MomentGroup | "all" | null;
  searchActive: boolean;
  highlightMoment: (id: string) => void;
  highlightGroupNotches: (group: MomentGroup | "all") => void;
  clearHighlight: () => void;
  setSearchNotchesActive: (active: boolean) => void;

  react: (id: string) => void;
  hasReacted: (id: string) => boolean;
  reactionsFor: (m: Moment) => number;

  clipView: ClipView;
  openClip: (m: Moment) => void;
  openClipSequence: (list: Moment[]) => void;
  closeClip: () => void;
};

const TimelineCtx = createContext<TimelineValue | null>(null);

export function useTimeline() {
  const value = useContext(TimelineCtx);
  if (!value) throw new Error("useTimeline must be used inside a TimelineProvider");
  return value;
}

export function TimelineProvider({ stream, children }: { stream: Livestream; children: ReactNode }) {
  const timeline = useMemo(() => getTimeline(stream), [stream]);

  const [playhead, setPlayhead] = useState<PlayheadState>(() => ({
    t: timeline.windowLen,
    liveEdge: timeline.windowLen,
    isPlaying: true,
    isFollowingLive: true,
  }));
  const playheadRef = useRef(playhead);
  useEffect(() => {
    playheadRef.current = playhead;
  }, [playhead]);

  useEffect(() => {
    let raf = 0;
    let last = Date.now();
    function frame() {
      const now = Date.now();
      const elapsed = (now - last) / 1000;
      last = now;
      setPlayhead((prev) => {
        const liveEdge = prev.liveEdge + elapsed;
        const t = prev.isFollowingLive
          ? liveEdge
          : prev.isPlaying
            ? Math.max(0, Math.min(liveEdge, prev.t + elapsed))
            : prev.t;
        const isFollowingLive = prev.isFollowingLive || t >= liveEdge - 1;
        return { t, liveEdge, isPlaying: prev.isPlaying, isFollowingLive };
      });
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const seek = useCallback((t: number) => {
    setPlayhead((prev) => {
      const next = Math.max(0, Math.min(prev.liveEdge, t));
      return { ...prev, t: next, isFollowingLive: next >= prev.liveEdge - 1 };
    });
  }, []);

  const seekBy = useCallback((delta: number) => {
    setPlayhead((prev) => {
      const next = Math.max(0, Math.min(prev.liveEdge, prev.t + delta));
      return { ...prev, t: next, isFollowingLive: next >= prev.liveEdge - 1 };
    });
  }, []);

  const togglePlay = useCallback(() => {
    setPlayhead((prev) => {
      const isPlaying = !prev.isPlaying;
      return { ...prev, isPlaying, isFollowingLive: isPlaying ? prev.isFollowingLive : false };
    });
  }, []);

  const goLive = useCallback(() => {
    setPlayhead((prev) => ({ ...prev, isFollowingLive: true, isPlaying: true, t: prev.liveEdge }));
  }, []);

  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(muted);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const [bookmarks, setBookmarks] = useState<Moment[]>([]);
  const bookmarkSeq = useRef(0);

  const toggleBookmark = useCallback(
    (rawT: number, title?: string | null) => {
      const t = Math.round(rawT);
      setBookmarks((prev) => {
        const existing = prev.find((b) => Math.abs(b.t - t) < 1);
        if (existing) return prev.filter((b) => b.id !== existing.id);
        const row = timeline.bucketAt(t);
        const near = timeline.nearest(t, 90);
        const made: Moment = {
          id: `bookmark_${bookmarkSeq.current++}`,
          group: "bookmark",
          label: "Bookmark",
          t,
          title: title || near?.title || "Bookmarked moment",
          byline: `Bookmarked at ${formatDuration(t)}`,
          viewer_count: row.viewer_count,
          hype: row.hype_score,
          reactions_count: 0,
        };
        return [...prev, made].sort((a, b) => a.t - b.t);
      });
    },
    [timeline],
  );

  const bookmarkAt = useCallback(
    (t: number) => bookmarks.find((b) => Math.abs(b.t - t) < 1),
    [bookmarks],
  );

  const [searchState, setSearchState] = useState<SearchState>({
    query: "",
    scope: "moments",
    results: [],
  });

  const run = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      const isChat = CHAT_PREFIX.test(trimmed);
      const query = isChat ? trimmed.replace(CHAT_PREFIX, "").trim() : trimmed;
      const scope: "moments" | "chat" = isChat ? "chat" : "moments";

      if (!query) {
        setSearchState({ query: "", scope, results: [] });
        return;
      }

      const words = keywords(query);
      let results: Moment[];
      if (scope === "chat") {
        results = timeline.chatLog
          .filter((msg) => matchesAny(msg.content.toLowerCase(), words))
          .map((msg) => {
            const row = timeline.bucketAt(msg.t);
            return {
              id: `search_chat_${msg.id}`,
              group: "search_chat" as const,
              label: "Chat",
              t: msg.t,
              title: msg.username,
              byline: `"${msg.content}"`,
              viewer_count: row.viewer_count,
              hype: row.hype_score,
              reactions_count: 0,
            };
          });
      } else {
        results = timeline.moments
          .filter((m) => matchesAny(`${m.title.toLowerCase()} ${m.byline.toLowerCase()}`, words))
          .map((m) => {
            const row = timeline.bucketAt(m.t);
            return {
              id: `search_moment_${m.id}`,
              group: "search_moment" as const,
              label: "Search",
              t: m.t,
              title: m.title,
              byline: m.byline,
              viewer_count: row.viewer_count,
              hype: row.hype_score,
              reactions_count: 0,
            };
          });
      }
      setSearchState({ query, scope, results: dedupe(results) });
    },
    [timeline],
  );

  const clear = useCallback(() => {
    setSearchState({ query: "", scope: "moments", results: [] });
  }, []);

  const [highlightsOpen, setHighlightsOpen] = useState(false);
  const [searchFocusToken, setSearchFocusToken] = useState(0);
  const [linkedId, setLinkedId] = useState<string | null>(null);
  const [linkedGroup, setLinkedGroup] = useState<MomentGroup | "all" | null>(null);
  const [searchActive, setSearchActive] = useState(false);

  const clearHighlight = useCallback(() => {
    setLinkedId(null);
    setLinkedGroup(null);
  }, []);

  const highlightMoment = useCallback((id: string) => {
    setLinkedId(id);
    setLinkedGroup(null);
  }, []);

  const highlightGroupNotches = useCallback((group: MomentGroup | "all") => {
    setLinkedId(null);
    setLinkedGroup(group);
  }, []);

  const toggleHighlights = useCallback(() => {
    setHighlightsOpen((v) => {
      if (v) {
        clearHighlight();
        setSearchActive(false);
      }
      return !v;
    });
  }, [clearHighlight]);

  const openHighlights = useCallback(() => setHighlightsOpen(true), []);
  const closeHighlights = useCallback(() => {
    setHighlightsOpen(false);
    clearHighlight();
    setSearchActive(false);
  }, [clearHighlight]);

  const openSearch = useCallback(() => {
    setHighlightsOpen(true);
    setSearchFocusToken((x) => x + 1);
  }, []);

  const [reactedIds, setReactedIds] = useState<Set<string>>(new Set());
  const react = useCallback((id: string) => {
    setReactedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const hasReacted = useCallback((id: string) => reactedIds.has(id), [reactedIds]);
  const reactionsFor = useCallback(
    (m: Moment) => m.reactions_count + (reactedIds.has(m.id) ? 1 : 0),
    [reactedIds],
  );

  const [clipView, setClipView] = useState<ClipView>(null);
  const mutedBeforeClip = useRef(false);

  const openClip = useCallback((m: Moment) => {
    setClipView((prev) => {
      if (!prev) mutedBeforeClip.current = mutedRef.current;
      return { kind: "single", moment: m };
    });
    setMuted(false);
  }, []);

  const openClipSequence = useCallback((list: Moment[]) => {
    if (!list.length) return;
    setClipView((prev) => {
      if (!prev) mutedBeforeClip.current = mutedRef.current;
      return { kind: "sequence", moments: list };
    });
    setMuted(false);
  }, []);

  const closeClip = useCallback(() => {
    setClipView(null);
    setMuted(mutedBeforeClip.current);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const key = e.key.toLowerCase();

      if (key === "escape" && clipView) {
        closeClip();
        return;
      }
      if (clipView) return;

      if (key === "escape" && highlightsOpen) {
        closeHighlights();
        return;
      }
      if (key === "t") {
        toggleHighlights();
        return;
      }
      if (key === "/") {
        e.preventDefault();
        openSearch();
        return;
      }
      if (key === "b") {
        toggleBookmark(playheadRef.current.t);
        return;
      }
      if (key === "l") {
        goLive();
        return;
      }
      if (key === " ") {
        e.preventDefault();
        togglePlay();
        return;
      }
      const step = e.shiftKey ? 300 : 30;
      if (key === "arrowleft") {
        e.preventDefault();
        seekBy(-step);
      }
      if (key === "arrowright") {
        e.preventDefault();
        seekBy(step);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    clipView,
    highlightsOpen,
    closeClip,
    closeHighlights,
    toggleHighlights,
    openSearch,
    toggleBookmark,
    goLive,
    togglePlay,
    seekBy,
  ]);

  const value: TimelineValue = {
    stream,
    timeline,
    t: playhead.t,
    liveEdge: playhead.liveEdge,
    isPlaying: playhead.isPlaying,
    isFollowingLive: playhead.isFollowingLive,
    joinedAt: timeline.joinedAt,
    secondsBehindLive: Math.max(0, playhead.liveEdge - playhead.t),
    seek,
    togglePlay,
    goLive,
    volume,
    setVolume,
    muted,
    setMuted,
    bookmarks,
    toggleBookmark,
    bookmarkAt,
    search: { ...searchState, run, clear, hasRun: searchState.query !== "" },
    highlightsOpen,
    toggleHighlights,
    openHighlights,
    closeHighlights,
    openSearch,
    searchFocusToken,
    linkedId,
    linkedGroup,
    searchActive,
    highlightMoment,
    highlightGroupNotches,
    clearHighlight,
    setSearchNotchesActive: setSearchActive,
    react,
    hasReacted,
    reactionsFor,
    clipView,
    openClip,
    openClipSequence,
    closeClip,
  };

  return <TimelineCtx.Provider value={value}>{children}</TimelineCtx.Provider>;
}
