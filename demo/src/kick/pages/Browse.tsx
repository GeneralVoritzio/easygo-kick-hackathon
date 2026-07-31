import { useMemo, useState } from "react";
import { PageShell } from "../components/Layout";
import { StreamGrid } from "../components/StreamCard";
import { CategoryGrid } from "../components/CategoryCard";
import { ClipGrid } from "../components/ClipCard";
import { BrowseTabs, type BrowseTab } from "../components/BrowseTabs";
import { BrowseFilters } from "../components/BrowseFilters";
import { Section } from "../components/CardBits";
import { EventGrid } from "../components/EventBits";
import { EventCalendar } from "../components/EventCalendar";
import { Icon } from "../Icon";
import { useEvents } from "../EventsStore";
import { livestreams, categories } from "../mock/api";
import { CLIPS_NOW, clips } from "../mock/clips";
import { eventBucket, publicUpcoming, type EventBucket } from "../mock/events";

const streamSortOptions = [
  { value: "featured", label: "Featured" },
  { value: "recommended", label: "Recommended" },
  { value: "viewers-desc", label: "Viewers (High to Low)" },
];

const languageOptions = [
  { value: "all", label: "Languages" },
  ...Array.from(new Set(livestreams.map((stream) => stream.language))).map((language) => ({
    value: language,
    label: language,
  })),
];

const clipSortOptions = [
  { value: "views", label: "Views" },
  { value: "recent", label: "Most Recent" },
];

const clipRangeOptions = [
  { value: "1", label: "Last Day" },
  { value: "7", label: "Last Week" },
  { value: "30", label: "Last Month" },
  { value: "all", label: "All Time" },
];

const eventGroups: { bucket: EventBucket; title: string }[] = [
  { bucket: "today", title: "Today" },
  { bucket: "week", title: "This week" },
  { bucket: "month", title: "This month" },
];

const eventViews = [
  { view: "upcoming", label: "Upcoming", icon: "event" },
  { view: "calendar", label: "Calendar", icon: "calendar" },
] as const;

function BrowseEvents() {
  const { events } = useEvents();
  const [view, setView] = useState<"upcoming" | "calendar">("upcoming");
  const upcoming = publicUpcoming(events);

  return (
    <section className="flex w-full flex-col gap-y-5 lg:gap-y-6">
      <div className="flex w-fit gap-0.5 rounded bg-secondary-base p-0.5">
        {eventViews.map((item) => (
          <button
            key={item.view}
            type="button"
            aria-pressed={view === item.view}
            data-testid={`events-view-${item.view}`}
            onClick={() => setView(item.view)}
            className={`flex h-9 items-center gap-1.5 rounded px-3 text-sm font-semibold ${
              view === item.view ? "bg-surface-highest text-white" : "text-subtle"
            }`}
          >
            <Icon name={item.icon} className="size-4 shrink-0 fill-current" />
            {item.label}
          </button>
        ))}
      </div>

      {view === "upcoming" ? (
        eventGroups.map(({ bucket, title }) => {
          const group = upcoming.filter((e) => eventBucket(e.start_at) === bucket);
          if (group.length === 0) return null;
          return (
            <Section key={bucket} white={title}>
              <EventGrid events={group} />
            </Section>
          );
        })
      ) : (
        <EventCalendar events={upcoming} />
      )}
    </section>
  );
}

export function Browse({ tab }: { tab: BrowseTab }) {
  const [language, setLanguage] = useState("all");
  const [streamSort, setStreamSort] = useState("recommended");
  const [clipSort, setClipSort] = useState("views");
  const [clipRange, setClipRange] = useState("7");

  const shownStreams = useMemo(() => {
    const filtered = livestreams.filter((s) => language === "all" || s.language === language);
    if (streamSort === "viewers-desc") {
      return [...filtered].sort((a, b) => b.viewer_count - a.viewer_count);
    }
    if (streamSort === "featured") {
      return [...filtered].sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at));
    }
    return filtered;
  }, [language, streamSort]);

  const shownClips = useMemo(() => {
    const cutoff =
      clipRange === "all" ? 0 : CLIPS_NOW.getTime() - Number(clipRange) * 86_400_000;
    const filtered = clips.filter((c) => Date.parse(c.created_at) >= cutoff);
    return [...filtered].sort((a, b) =>
      clipSort === "recent"
        ? Date.parse(b.created_at) - Date.parse(a.created_at)
        : b.view_count - a.view_count,
    );
  }, [clipSort, clipRange]);

  return (
    <PageShell>
      <h2 className="text-base font-bold leading-8 text-white lg:text-2xl">Browse</h2>
      <div className="flex flex-col gap-y-3 lg:gap-y-6">
        <BrowseTabs active={tab} />

        {tab === "livestreams" && (
          <section className="flex w-full flex-col gap-y-5 lg:gap-y-4">
            <BrowseFilters
              left={{
                id: "livestream_filter_by",
                label: "Filter by:",
                value: language,
                onChange: setLanguage,
                options: languageOptions,
              }}
              right={{
                id: "livestream_sort_by",
                label: "Sort by:",
                value: streamSort,
                onChange: setStreamSort,
                options: streamSortOptions,
              }}
            />
            <StreamGrid streams={shownStreams} />
          </section>
        )}

        {tab === "categories" && <CategoryGrid categories={categories} />}

        {tab === "events" && <BrowseEvents />}

        {tab === "clips" && (
          <section className="flex w-full flex-col gap-y-5 lg:gap-y-4">
            <BrowseFilters
              left={{
                id: "clips_sort_by",
                label: "Sort by:",
                value: clipSort,
                onChange: setClipSort,
                options: clipSortOptions,
              }}
              right={{
                id: "clips_filter_by",
                label: "Filter by:",
                value: clipRange,
                onChange: setClipRange,
                options: clipRangeOptions,
              }}
            />
            <ClipGrid clips={shownClips} />
          </section>
        )}
      </div>
    </PageShell>
  );
}
