import { useLocation } from "react-router-dom";
import { PageTabs } from "./PageTabs";

const tabs = [
  { label: "Live Channels", to: "/following" },
  { label: "Categories", to: "/following/categories" },
  { label: "Channels", to: "/following/channels" },
  { label: "Events", to: "/following/events" },
];

export function FollowingTabs() {
  return <PageTabs label="Following" tabs={tabs} active={useLocation().pathname} />;
}
