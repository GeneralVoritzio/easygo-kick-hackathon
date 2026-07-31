import { PageTabs } from "./PageTabs";

export type BrowseTab = "livestreams" | "categories" | "clips" | "events";

const paths: Record<BrowseTab, string> = {
  livestreams: "/browse",
  categories: "/browse/categories",
  clips: "/browse/clips",
  events: "/browse/events",
};

const tabs = [
  { label: "Livestreams", to: paths.livestreams },
  { label: "Categories", to: paths.categories },
  { label: "Clips", to: paths.clips },
  { label: "Events", to: paths.events },
];

export function BrowseTabs({ active }: { active: BrowseTab }) {
  return <PageTabs label="Browse" tabs={tabs} active={paths[active]} />;
}
