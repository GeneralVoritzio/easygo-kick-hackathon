import { useState } from "react";
import { Link, NavLink, useParams } from "react-router-dom";
import { Icon, type KickIconName } from "../Icon";
import kickLogo from "../brand/kick-logo.svg";
import { currentUser } from "../mock/api";

const navItems: { label: string; to: string; icon: KickIconName; expandable?: boolean }[] = [
  { label: "Stream", to: "/dashboard/stream", icon: "dash-stream" },
  { label: "Stream URL & Key", to: "/dashboard/channel/stream", icon: "dash-stream-key" },
  { label: "Revenue", to: "/dashboard/revenue", icon: "dash-revenue" },
  { label: "Achievements", to: "/dashboard/achievements", icon: "dash-achievements" },
  { label: "Studio", to: "/dashboard/studio", icon: "dash-studio", expandable: true },
  { label: "Moderation", to: "/dashboard/moderation", icon: "dash-moderation" },
  { label: "Community", to: "/dashboard/community", icon: "dash-community", expandable: true },
  { label: "Drops & rewards", to: "/dashboard/drops", icon: "dash-drops" },
];

function Panel({
  title,
  icon,
  className,
  children,
}: {
  title: string;
  icon: KickIconName;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <section
      className={`flex min-w-0 flex-col rounded border border-outline-decorative bg-surface-lowest ${className ?? ""}`}
    >
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-outline-decorative px-4">
        <Icon name={icon} className="size-4 shrink-0 text-white" />
        <h2 className="text-lg font-bold leading-none text-white">{title}</h2>
        <button
          type="button"
          aria-label={`Open ${title} in a new window`}
          className="ml-auto flex size-6 items-center justify-center rounded state-layer-surface"
        >
          <Icon name="share" className="size-3.5 text-subtle" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </section>
  );
}

function Stat({ label, value, badge }: { label: string; value?: string; badge?: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1 border-r border-outline-decorative px-4 py-3 last:border-r-0">
      {badge ? (
        <span className="w-fit rounded-[2px] bg-white px-1 py-0.5 text-xs font-bold uppercase leading-5 text-surface-lowest">
          Offline
        </span>
      ) : (
        <span className="text-base font-bold leading-5 text-white">{value}</span>
      )}
      <span className="text-sm font-semibold leading-5 text-subtle">{label}</span>
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      data-state={on ? "checked" : "unchecked"}
      onClick={() => onChange(!on)}
      className="flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors data-[state=checked]:bg-primary-base data-[state=unchecked]:bg-neutral-700"
    >
      <span
        data-state={on ? "checked" : "unchecked"}
        className="size-4 rounded-full bg-white transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
      />
    </button>
  );
}

function ActionRow({
  label,
  value,
  chevron,
  disabled,
  children,
}: {
  label: string;
  value?: string;
  chevron?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`flex h-10 items-center gap-2 px-4 text-sm ${
        disabled ? "text-neutral-600" : "text-white"
      }`}
    >
      <span className="min-w-0 truncate font-normal">{label}</span>
      <span className="ml-auto flex shrink-0 items-center gap-2">
        {value && <span className="text-xs font-semibold text-neutral-600">{value}</span>}
        {children}
        {chevron && <Icon name="chevron-right" className="size-3 text-subtle" />}
      </span>
    </div>
  );
}

function GroupTitle({ children }: { children: React.ReactNode }) {
  return <div className="px-4 pb-1 pt-3 text-sm font-bold text-white">{children}</div>;
}

export function CreatorDashboard() {
  const { section } = useParams();
  const [subsOnly, setSubsOnly] = useState(false);
  const [emotesOnly, setEmotesOnly] = useState(false);
  const [showViewCount, setShowViewCount] = useState(true);
  const active = `/dashboard/${section ?? "stream"}`;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-lowest">
      <nav className="relative flex h-[var(--navbar-height)] shrink-0 items-center justify-between bg-surface-lowest pl-3 pr-10">
        <div className="flex grow-0 items-center gap-2.5">
          <button
            type="button"
            aria-label="Collapse sidebar"
            className="group flex size-10 shrink-0 items-center justify-center rounded state-layer-surface"
          >
            <Icon name="collapse-sidebar" className="size-4 fill-current" />
          </button>
          <Link to="/" title="Home" className="shrink-0">
            <img src={kickLogo} alt="Kick Logo" width={97} height={26} />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded bg-primary-base px-3 text-sm font-semibold text-primary-onPrimary transition-all select-none betterhover:active:scale-[0.98]"
          >
            <Icon name="live-dot" className="size-2" />
            Go live
          </button>
          <Link to="/" aria-label={currentUser.username} className="shrink-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.username}
              className="size-8 rounded-full"
            />
          </Link>
        </div>
      </nav>

      <div className="flex min-h-0 flex-1">
        <div className="hidden w-[var(--sidebar-expanded-width)] shrink-0 flex-col overflow-y-auto bg-surface-lowest px-2 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={`state-layer-surface flex h-12 w-full items-center gap-4 rounded px-4 py-1 text-base font-semibold ${
                item.to === active ? "!bg-secondary-base text-white" : "bg-transparent text-white"
              }`}
            >
              <Icon name={item.icon} className="size-4 shrink-0 fill-current" />
              {item.label}
              {item.expandable && (
                <Icon name="chevron-right" className="ml-auto size-3 shrink-0 rotate-90 text-subtle" />
              )}
            </NavLink>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 gap-2 overflow-hidden p-2">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Panel title="Session Info" icon="dash-stream" className="shrink-0">
              <div className="flex flex-row">
                <Stat label="Session" badge />
                <Stat label="Viewers" value="-" />
                <Stat label="Followers" value="1" />
                <Stat label="Sub Counts" value="-" />
                <Stat label="Time Live" value="-" />
              </div>
            </Panel>

            <Panel title="Stream Preview" icon="dash-studio" className="shrink-0">
              <div className="relative aspect-video w-full bg-black">
                <div className="absolute left-7 top-7 flex h-fit w-fit items-center gap-4 rounded bg-surface-base p-5 font-bold leading-[1.2]">
                  <span className="rounded-[2px] bg-white p-1 text-sm font-bold uppercase leading-5 text-surface-lowest">
                    Offline
                  </span>
                  <span className="text-2xl font-bold leading-8 text-white">
                    {currentUser.username} is offline
                  </span>
                </div>
              </div>
            </Panel>

            <div className="flex min-h-0 flex-1 gap-2">
              <Panel title="Activity Feed" icon="dash-achievements" className="min-h-[180px] flex-1" />
              <Panel title="Mod Actions" icon="dash-moderation" className="min-h-[180px] flex-1">
                <div className="flex items-start gap-2 px-4 py-3">
                  <Icon name="dash-revenue" className="mt-0.5 size-4 shrink-0 text-subtle" />
                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm">
                      <span className="font-bold text-surface-onSurfacePrimary">
                        {currentUser.username}
                      </span>{" "}
                      <span className="text-white">started a Poll</span>
                    </span>
                    <span className="text-xs font-semibold text-subtle">DAW</span>
                  </div>
                  <span className="ml-auto shrink-0 text-xs font-semibold text-subtle">1 day ago</span>
                </div>
              </Panel>
            </div>
          </div>

          <Panel title="Chat" icon="chatters" className="hidden w-[380px] shrink-0 xl:flex">
            <div className="flex h-full flex-col">
              <div className="min-h-0 flex-1" />
              <div className="shrink-0 border-t border-outline-decorative p-3">
                <div className="flex h-11 items-center gap-2 rounded border-2 border-neutral-700 px-3 transition-colors betterhover:hover:border-neutral-400">
                  <input
                    placeholder="Send a message"
                    aria-label="Send a message"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-subtle"
                  />
                </div>
                <div className="mt-2 flex items-center justify-end">
                  <button
                    type="button"
                    className="h-8 rounded bg-primary-base px-3 py-1.5 text-sm font-semibold text-primary-onPrimary"
                  >
                    Chat
                  </button>
                </div>
              </div>
            </div>
          </Panel>

          <div className="hidden w-[300px] shrink-0 flex-col gap-2 2xl:flex">
            <Panel title="Stream info" icon="dash-stream-key" className="shrink-0">
              <div className="flex flex-col gap-2 px-4 py-3">
                <span className="text-sm font-semibold text-white">My first stream.</span>
                <div className="flex items-center gap-2">
                  <img
                    src={currentUser.avatar}
                    alt=""
                    className="size-8 shrink-0 rounded"
                  />
                  <span className="text-sm text-white">Just Chatting</span>
                </div>
                <span className="w-fit rounded-full bg-surface-highest px-2 py-0.5 text-xs font-semibold text-subtle">
                  English
                </span>
              </div>
            </Panel>

            <Panel title="Channel Actions" icon="dash-moderation" className="min-h-0 flex-1">
              <GroupTitle>Chat access</GroupTitle>
              <ActionRow label="Account age" value="Off" chevron />
              <ActionRow label="Followers only" value="Off" chevron />
              <ActionRow label="Subscribers only">
                <Toggle on={subsOnly} onChange={setSubsOnly} label="Subscribers only" />
              </ActionRow>
              <GroupTitle>Chat options</GroupTitle>
              <ActionRow label="Emotes only">
                <Toggle on={emotesOnly} onChange={setEmotesOnly} label="Emotes only" />
              </ActionRow>
              <ActionRow label="Slow mode" value="Off" chevron />
              <ActionRow label="Banned words" chevron />
              <ActionRow label="AI Chat Moderation">
                <Icon name="share" className="size-3 text-subtle" />
              </ActionRow>
              <GroupTitle>Channel options</GroupTitle>
              <ActionRow label="Show view count">
                <Toggle on={showViewCount} onChange={setShowViewCount} label="Show view count" />
              </ActionRow>
              <ActionRow label="Raid Channel" disabled />
              <ActionRow label="Set goals" chevron />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
