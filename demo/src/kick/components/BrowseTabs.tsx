import { PageTabs } from "./PageTabs";

export type BrowseTab = "livestreams" | "categories" | "clips";

const paths: Record<BrowseTab, string> = {
  livestreams: "/browse",
  categories: "/browse/categories",
  clips: "/browse/clips",
};

const tabs = [
  { label: "Livestreams", to: paths.livestreams },
  { label: "Categories", to: paths.categories },
  { label: "Clips", to: paths.clips },
];

export function BrowseTabs({ active }: { active: BrowseTab }) {
  return <PageTabs label="Browse" tabs={tabs} active={paths[active]} />;
}
