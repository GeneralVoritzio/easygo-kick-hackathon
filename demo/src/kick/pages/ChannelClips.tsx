import { useMemo, useState } from "react";
import { Icon } from "../Icon";
import { ChannelShell } from "../components/ChannelShell";
import { ClipGrid } from "../components/ClipCard";
import { livestreams } from "../mock/api";
import { CLIPS_NOW, clips } from "../mock/clips";

const stream =
  livestreams.find((s) => s.channel.slug === "evscape") ?? livestreams[0];

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
    <ChannelShell stream={stream} active="clips">
      <div className="flex flex-col gap-4 px-4 py-4 lg:px-7">
        <div className="flex items-center gap-2">
          <FilterSelect label="Sort by" value={sort} options={sortOptions} onChange={setSort} />
          <FilterSelect label="Time range" value={range} options={rangeOptions} onChange={setRange} />
        </div>

        <ClipGrid clips={visibleClips} />
      </div>
    </ChannelShell>
  );
}
