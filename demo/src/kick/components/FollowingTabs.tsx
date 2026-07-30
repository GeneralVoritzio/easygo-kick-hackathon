import { useLocation } from "react-router-dom";
import { PageTabs } from "./PageTabs";

const tabs = [
  { label: "Live Channels", to: "/following" },
  { label: "Categories", to: "/following/categories" },
  { label: "Channels", to: "/following/channels" },
];

export function FollowingTabs() {
  return <PageTabs label="Following" tabs={tabs} active={useLocation().pathname} />;
}
