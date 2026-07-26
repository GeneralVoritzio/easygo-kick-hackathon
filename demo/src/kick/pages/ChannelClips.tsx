import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../Icon";
import { PageShell } from "../components/Layout";
import { ClipGrid } from "../components/ClipCard";
import { evscape, formatFollowers, bannerFor } from "../mock/api";
import { CLIPS_NOW, clips } from "../mock/clips";

const banner = bannerFor("evscape");

const tabs = [
  { label: "Videos", to: `/${evscape.slug}` },
  { label: "Clips", to: `/${evscape.slug}/clips` },
  { label: "Chat", to: `/${evscape.slug}/chat` },
  { label: "About", to: `/${evscape.slug}/about` },
];

type SortValue = "most-viewed" | "most-recent";
type RangeValue = "all-time" | "7-days" | "30-days";

const sortOptions: { value: SortValue; label: string }[] = [
  { value: "most-viewed", label: "Most viewed" },
  { value: "most-recent", label: "Most recent" },
];

const rangeOptions: { value: RangeValue; label: string; days: number | null }[] = [
  { value: "all-time", label: "All time", days: null },
  { value: "7-days", label: "Last 7 days", days: 7 },
  { value: "30-days", label: "Last 30 days", days: 30 },
];

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="relative flex h-9 items-center rounded bg-surface-highest py-1 pl-3 pr-8 text-sm font-semibold leading-[1.2] text-white">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        aria-label={label}
        className="appearance-none bg-transparent text-white outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-surface-highest text-white">
            {option.label}
          </option>
        ))}
      </select>
      <Icon
        name="icon-10"
        className="pointer-events-none absolute right-3 size-2.5 text-surface-onSurfaceSecondary"
      />
    </div>
  );
}

export function ChannelClips() {
  const [following, setFollowing] = useState(false);
  const [sort, setSort] = useState<SortValue>("most-viewed");
  const [range, setRange] = useState<RangeValue>("all-time");

  const visibleClips = useMemo(() => {
    const rangeDef = rangeOptions.find((option) => option.value === range)!;
    const filtered = clips.filter((clip) => {
      if (rangeDef.days === null) return true;
      const ageDays = (CLIPS_NOW.getTime() - new Date(clip.created_at).getTime()) / 86_400_000;
      return ageDays <= rangeDef.days;
    });
    return [...filtered].sort((a, b) =>
      sort === "most-viewed"
        ? b.view_count - a.view_count
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [sort, range]);

  return (
    <PageShell>
      <div className="flex flex-col gap-4">
        <div className="h-[var(--channel-desktop-banner-height)] w-full overflow-hidden rounded">
          <img src={banner} alt="" className="h-full w-full object-cover" />
        </div>

        <div className="-mt-10 flex flex-col gap-4 px-1 lg:-mt-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-end gap-4">
            <img
              src={evscape.avatar}
              alt={evscape.username}
              className="size-20 shrink-0 rounded-full ring-4 ring-surface-lowest lg:size-24"
            />
            <div className="flex flex-col gap-1 pb-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-bold leading-[1.2] text-white lg:text-2xl">
                  {evscape.username}
                </h1>
                {evscape.verified && (
                  <Icon name="verified" className="size-4 shrink-0 text-surface-onSurfacePrimary" />
                )}
              </div>
              <span className="text-sm font-semibold leading-[1.2] text-surface-onSurfaceSecondary">
                {formatFollowers(evscape.followers)} Followers
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 pb-1">
            <button
              type="button"
              onClick={() => setFollowing((v) => !v)}
              className={`inline-flex h-10 items-center justify-center whitespace-nowrap rounded px-4 text-sm font-semibold transition-all select-none betterhover:active:scale-[0.98] ${
                following ? "bg-surface-highest text-white" : "bg-primary-base text-primary-onPrimary"
              }`}
            >
              {following ? "Following" : "Follow"}
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded bg-secondary-base px-4 text-sm font-semibold text-white transition-all select-none betterhover:active:scale-[0.98]"
            >
              Subscribe
            </button>
          </div>
        </div>

        <nav className="flex w-full items-center gap-6 shadow-[inset_0px_-2px_0] shadow-outline-decorative">
          {tabs.map((tab) => {
            const active = tab.label === "Clips";
            return (
              <Link
                key={tab.label}
                to={tab.to}
                className={`relative flex h-11 items-center text-sm font-semibold leading-[1.2] ${
                  active ? "text-white" : "text-surface-onSurfaceSecondary betterhover:hover:text-white"
                }`}
              >
                {tab.label}
                {active && (
                  <span className="absolute inset-x-0 bottom-[-2px] h-0.5 rounded-full bg-surface-onSurfacePrimary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 py-1">
          <FilterSelect label="Sort by" value={sort} options={sortOptions} onChange={setSort} />
          <FilterSelect label="Time range" value={range} options={rangeOptions} onChange={setRange} />
        </div>

        <ClipGrid clips={visibleClips} />
      </div>
    </PageShell>
  );
}
