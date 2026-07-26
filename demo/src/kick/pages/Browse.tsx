import { useMemo, useState } from "react";
import { PageShell } from "../components/Layout";
import { StreamGrid } from "../components/StreamCard";
import { CategoryGrid } from "../components/CategoryCard";
import { BrowseTabs, type BrowseTab } from "../components/BrowseTabs";
import { BrowseFilters } from "../components/BrowseFilters";
import { livestreams, categories } from "../mock/api";

const streamSortOptions = [
  { value: "viewers-desc", label: "Viewers (High to Low)" },
  { value: "viewers-asc", label: "Viewers (Low to High)" },
  { value: "recent", label: "Recently Started" },
];

const categorySortOptions = [
  { value: "viewers-desc", label: "Viewers (High to Low)" },
  { value: "viewers-asc", label: "Viewers (Low to High)" },
  { value: "az", label: "A-Z" },
];

const languageOptions = [
  { value: "all", label: "All Languages" },
  ...Array.from(new Set(livestreams.map((stream) => stream.language))).map((language) => ({
    value: language,
    label: language,
  })),
];

export function Browse() {
  const [tab, setTab] = useState<BrowseTab>("livestreams");
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("all");
  const [streamSort, setStreamSort] = useState("viewers-desc");
  const [categorySort, setCategorySort] = useState("viewers-desc");

  const filteredStreams = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = livestreams.filter((stream) => {
      const matchesQuery =
        !query ||
        stream.session_title.toLowerCase().includes(query) ||
        stream.channel.username.toLowerCase().includes(query) ||
        stream.category.name.toLowerCase().includes(query);
      const matchesLanguage = language === "all" || stream.language === language;
      return matchesQuery && matchesLanguage;
    });
    return [...filtered].sort((a, b) => {
      if (streamSort === "viewers-asc") return a.viewer_count - b.viewer_count;
      if (streamSort === "recent") return Date.parse(b.started_at) - Date.parse(a.started_at);
      return b.viewer_count - a.viewer_count;
    });
  }, [search, language, streamSort]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = categories.filter((category) => !query || category.name.toLowerCase().includes(query));
    return [...filtered].sort((a, b) => {
      if (categorySort === "viewers-asc") return a.viewers - b.viewers;
      if (categorySort === "az") return a.name.localeCompare(b.name);
      return b.viewers - a.viewers;
    });
  }, [search, categorySort]);

  return (
    <PageShell>
      <h2 className="text-base font-bold leading-[1.2] text-white lg:text-2xl">Browse</h2>
      <div className="flex flex-col gap-y-3 lg:gap-y-6">
        <BrowseTabs active={tab} onChange={setTab} />

        {tab === "livestreams" && (
          <section className="w-full">
            <div className="flex flex-col gap-y-5 lg:gap-y-4">
              <BrowseFilters
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search live channels"
                sortValue={streamSort}
                onSortChange={setStreamSort}
                sortOptions={streamSortOptions}
                languageValue={language}
                onLanguageChange={setLanguage}
                languageOptions={languageOptions}
              />
              <div className="relative flex h-full flex-col gap-4">
                <StreamGrid streams={filteredStreams} />
              </div>
            </div>
          </section>
        )}

        {tab === "categories" && (
          <section className="w-full">
            <div className="flex flex-col gap-y-5 lg:gap-y-4">
              <BrowseFilters
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search categories"
                sortValue={categorySort}
                onSortChange={setCategorySort}
                sortOptions={categorySortOptions}
              />
              <div className="relative flex h-full flex-col gap-4">
                <CategoryGrid categories={filteredCategories} />
              </div>
            </div>
          </section>
        )}

        {(tab === "clips" || tab === "leaderboard") && (
          <section className="flex w-full flex-col items-center justify-center gap-2 py-24 text-center">
            <p className="text-base font-semibold text-white">
              {tab === "clips" ? "Clips" : "Leaderboard"} browsing is coming soon.
            </p>
            <p className="text-sm font-normal text-surface-onSurfaceSecondary">
              This tab is a placeholder for the hackathon build.
            </p>
          </section>
        )}
      </div>
    </PageShell>
  );
}
