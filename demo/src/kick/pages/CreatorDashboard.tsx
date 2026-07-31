import { useState } from "react";
import { Link, NavLink, useParams } from "react-router-dom";
import { Icon, type KickIconName } from "../Icon";
import { ProfileMenu } from "../components/ProfileMenu";
import kickLogo from "../brand/kick-logo.svg";
import { currentUser, streamInfo } from "../mock/api";
import { ChatFeed } from "../components/ChannelChat";
import { DashboardEvents } from "../components/DashboardEvents";
import { IconButton, Pane, Panel, PanelHeader } from "../components/DashboardPanel";
import { Toggle } from "../components/Toggle";
import { GoLiveDialog } from "../components/GoLiveDialog";
import { useEvents } from "../EventsStore";

const streamItem = "/dashboard/stream";
const eventsItem = "/dashboard/events";
const routedItems = new Set([streamItem, eventsItem]);

const navItems: { label: string; to: string; icon: KickIconName; expandable?: boolean }[] = [
  { label: "Stream", to: streamItem, icon: "dash-stream" },
  { label: "Events", to: eventsItem, icon: "event" },
  { label: "Stream URL & Key", to: "/dashboard/channel/stream", icon: "dash-stream-key" },
  { label: "Revenue", to: "/dashboard/revenue", icon: "dash-revenue" },
  { label: "Achievements", to: "/dashboard/achievements", icon: "dash-achievements" },
  { label: "Studio", to: "/dashboard/studio", icon: "dash-studio", expandable: true },
  { label: "Moderation", to: "/dashboard/moderation", icon: "dash-moderation" },
  { label: "Community", to: "/dashboard/community", icon: "dash-community", expandable: true },
  { label: "Drops & rewards", to: "/dashboard/drops", icon: "dash-drops" },
];

const railTools: { icon: KickIconName; label: string }[] = [
  { icon: "dash-webcam", label: "Camera" },
  { icon: "dash-activity", label: "Alerts" },
  { icon: "dash-mod-actions", label: "Labels" },
  { icon: "dash-chat", label: "Chat widget" },
  { icon: "dash-broadcast", label: "Broadcast" },
  { icon: "dash-overlays", label: "Overlays" },
  { icon: "dash-moderation", label: "Settings" },
];

function Stat({ label, value, badge }: { label: string; value?: string; badge?: string }) {
  return (
    <div className="flex w-full flex-col items-start gap-3 px-3 py-4">
      {badge ? (
        <div className="w-fit rounded-sm border border-transparent bg-surfaceInverse-base p-1 text-xs font-semibold uppercase text-surfaceInverse-onInverse">
          {badge}
        </div>
      ) : (
        <span className="text-sm font-semibold text-white">{value}</span>
      )}
      <span className="text-sm font-semibold text-subtle">{label}</span>
    </div>
  );
}

function ActionRow({
  label,
  value,
  external,
  disabled,
}: {
  label: string;
  value?: string;
  external?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="flex min-h-11 w-full items-center justify-between gap-4 py-2 text-left text-sm font-normal disabled:text-neutral-600"
    >
      <div className="min-w-0 shrink grow">
        <span className="line-clamp-1 leading-tight">{label}</span>
      </div>
      <div className="flex items-center gap-4">
        {value && <span className="text-sm leading-none text-surface-onSurfaceSecondary">{value}</span>}
        {external && <Icon name="dash-external" className="size-4 shrink-0" />}
        {!external && !disabled && <Icon name="chevron-right" className="size-3 shrink-0" />}
      </div>
    </button>
  );
}

function ToggleRow({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex min-h-11 w-full items-center justify-between gap-4 py-2 text-left text-sm font-normal">
      <span className="line-clamp-1 leading-tight">{label}</span>
      <Toggle on={on} onChange={onChange} label={label} />
    </div>
  );
}

function ActionGroup({
  title,
  divider,
  children,
}: {
  title: string;
  divider?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <span className="pb-2 text-base font-bold text-surface-onSurface">{title}</span>
      <div className="flex flex-col">{children}</div>
      {divider && <div className="h-px min-h-px w-full bg-outline-decorative" />}
    </div>
  );
}

function ReadyStrip({ onChange }: { onChange: () => void }) {
  const { events, goLiveEventId } = useEvents();
  const picked = events.find((e) => e.event_id === goLiveEventId);
  if (!picked) return null;

  return (
    <div
      data-testid="ready-strip"
      className="flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold"
    >
      <Icon name="event" className="size-4 shrink-0 fill-primary-base" />
      <span className="min-w-0 truncate text-white">
        Ready to go live. Event: <span className="text-primary-base">{picked.title}</span>
      </span>
      <button
        type="button"
        onClick={onChange}
        className="ml-auto shrink-0 rounded bg-secondary-base px-2 py-1 text-sm font-semibold text-white state-layer-surface"
      >
        Change
      </button>
    </div>
  );
}

function StreamPanels({ onOpenGoLive }: { onOpenGoLive: () => void }) {
  const [subsOnly, setSubsOnly] = useState(false);
  const [emotesOnly, setEmotesOnly] = useState(false);
  const [showViewCount, setShowViewCount] = useState(true);

  return (
    <div className="flex h-full w-full flex-row">
      <div className="flex flex-col" style={{ width: "50%" }}>
        <Pane style={{ height: "22%" }}>
          <Panel title="Session Info" icon="dash-stream" bodyClassName="flex-col">
            <div className="flex w-full gap-1">
              <Stat label="Session" badge="Offline" />
              <div className="h-full w-px shrink-0 bg-outline-decorative" />
              <Stat label="Viewers" value="-" />
              <div className="h-full w-px shrink-0 bg-outline-decorative" />
              <Stat label="Followers" value={String(currentUser.followers)} />
              <div className="h-full w-px shrink-0 bg-outline-decorative" />
              <Stat label="Sub Counts" value="-" />
              <div className="h-full w-px shrink-0 bg-outline-decorative" />
              <Stat label="Time Live" value="-" />
            </div>
            <div className="w-full border-t border-outline-decorative" />
            <ReadyStrip onChange={onOpenGoLive} />
          </Panel>
        </Pane>

        <Pane style={{ height: "50%" }}>
          <div className="flex h-full w-full flex-col">
            <PanelHeader title="Stream Preview" icon="dash-studio" />
            <div className="flex min-h-0 flex-1 grow overflow-hidden rounded-b bg-black">
              <div className="flex h-full w-full items-center justify-center">
                <div className="flex h-fit w-fit items-center gap-4 rounded bg-surface-base p-5 font-bold leading-[1.2]">
                  <div className="flex items-center justify-center rounded-sm bg-[#F4F5F6] px-1.5 py-1 text-[10px] uppercase text-[#070809]">
                    Offline
                  </div>
                  <h2 className="text-base font-bold leading-[1.2] text-white lg:text-2xl">
                    {currentUser.username} is offline
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </Pane>

        <div className="flex flex-row" style={{ height: "28%" }}>
          <Pane style={{ width: "50%" }}>
            <Panel
              title="Activity Feed"
              icon="dash-activity"
              actions={<IconButton icon="dash-filter" label="Filter Activity Feed" className="size-8 text-sm leading-none" />}
            />
          </Pane>
          <Pane style={{ width: "50%" }}>
            <Panel
              title="Mod Actions"
              icon="dash-mod-actions"
              actions={<IconButton icon="dash-filter" label="Filter Mod Actions" className="size-8 text-sm leading-none" />}
            />
          </Pane>
        </div>
      </div>

      <Pane style={{ width: "30%" }}>
        <Panel title="Chat" icon="dash-chat">
          <ChatFeed dashboard />
        </Panel>
      </Pane>

      <div className="flex flex-col" style={{ width: "20%" }}>
        <Pane style={{ height: "30%" }}>
          <Panel
            title="Stream info"
            icon="dash-moderation"
            bodyClassName="p-4"
            actions={<IconButton icon="dash-edit" label="Edit stream info" className="size-8 text-sm leading-none" />}
          >
            <div className="flex w-full max-w-full flex-col gap-2 text-sm">
              <span className="line-clamp-2 font-semibold text-white">{streamInfo.session_title}</span>
              <div className="no-scrollbar flex w-full max-w-full items-center gap-2 overflow-x-auto">
                <img
                  src={streamInfo.category.thumbnail}
                  alt=""
                  className="aspect-[164/219] h-[46px] shrink-0 overflow-hidden rounded object-cover"
                />
                <div className="flex flex-col gap-1">
                  <span className="text-white">{streamInfo.category.name}</span>
                  <div className="flex min-w-0 gap-2">
                    <span className="rounded-full bg-secondary-base px-2 py-1 text-sm leading-none text-secondary-onSecondary">
                      {streamInfo.language}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </Pane>

        <Pane style={{ height: "70%" }}>
          <Panel title="Channel Actions" icon="dash-overlays" bigPopout>
            <div className="no-scrollbar h-full min-h-0 w-full overflow-y-auto py-2">
              <div className="flex w-full flex-col gap-4 px-4 pt-2 text-white">
                <ActionGroup title="Chat access" divider>
                  <ActionRow label="Account age" value="Off" />
                  <ActionRow label="Followers only" value="Off" />
                  <ToggleRow label="Subscribers only" on={subsOnly} onChange={setSubsOnly} />
                </ActionGroup>
                <ActionGroup title="Chat options" divider>
                  <ToggleRow label="Emotes only" on={emotesOnly} onChange={setEmotesOnly} />
                  <ActionRow label="Slow mode" value="Off" />
                  <ActionRow label="Banned words" />
                  <ActionRow label="AI Chat Moderation" external />
                </ActionGroup>
                <ActionGroup title="Channel options">
                  <ToggleRow label="Show view count" on={showViewCount} onChange={setShowViewCount} />
                  <ActionRow label="Raid Channel" disabled />
                  <ActionRow label="Set goals" />
                </ActionGroup>
              </div>
            </div>
          </Panel>
        </Pane>
      </div>
    </div>
  );
}

export function CreatorDashboard() {
  const { section } = useParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [goLiveOpen, setGoLiveOpen] = useState(false);
  const { notifications } = useEvents();
  const unread = notifications.filter((n) => !n.is_read).length;
  const active = `/dashboard/${section ?? "stream"}`;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-lowest">
      <nav className="flex h-[var(--navbar-height)] shrink-0 items-center justify-between bg-surface-lowest pl-3 pr-10">
        <div className="flex grow-0 items-center gap-2.5">
          <IconButton icon="menu" label="Collapse sidebar" className="size-10 text-base leading-none" />
          <Link to="/" title="Home" className="shrink-0">
            <img src={kickLogo} alt="Kick Logo" width={97} height={26} />
          </Link>
        </div>
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => setGoLiveOpen(true)}
            className="state-layer-base inline-flex h-9 items-center justify-center gap-1.5 rounded bg-primary-base px-2 text-sm font-semibold text-primary-onPrimary"
          >
            <Icon name="kick-mark" className="size-[1em]" />
            Go live
          </button>
          <button
            type="button"
            aria-label={currentUser.username}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="shrink-0 rounded"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.username}
              className="size-8 rounded-full lg:box-content"
            />
          </button>
          {menuOpen && <ProfileMenu dashboard onClose={() => setMenuOpen(false)} />}
          {goLiveOpen && <GoLiveDialog onClose={() => setGoLiveOpen(false)} />}
        </div>
      </nav>

      <div className="flex min-h-0 flex-1">
        <div className="hidden w-[var(--sidebar-expanded-width)] shrink-0 flex-col overflow-hidden bg-surface-lowest xl:flex">
          <ul className="flex w-full flex-col px-2">
            {navItems.map((item) => {
              const content = (
                <>
                  <Icon name={item.icon} className="size-4 shrink-0" />
                  <span className="grow text-left">{item.label}</span>
                  {item.to === eventsItem && unread > 0 && (
                    <span
                      data-testid="events-nav-badge"
                      className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-base text-xs font-bold text-primary-onPrimary"
                    >
                      {unread}
                    </span>
                  )}
                  {item.expandable && <Icon name="chevron-right" className="size-3 shrink-0 rotate-90" />}
                </>
              );
              const rowClass =
                "flex h-12 w-full items-center justify-start gap-x-4 rounded px-4 py-1 text-base font-semibold text-white";
              return (
                <li key={item.to}>
                  {routedItems.has(item.to) ? (
                    <NavLink
                      to={item.to}
                      data-state={item.to === active ? "active" : "inactive"}
                      className={`state-layer-surface ${rowClass} ${
                        item.to === active ? "!bg-secondary-base" : "bg-transparent"
                      }`}
                    >
                      {content}
                    </NavLink>
                  ) : (
                    <span className={`${rowClass} cursor-default bg-transparent`}>{content}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex w-full min-w-0 max-w-full overflow-hidden">
          <div className="grow overflow-hidden bg-black p-0.5">
            {section === "events" ? (
              <DashboardEvents />
            ) : (
              <StreamPanels onOpenGoLive={() => setGoLiveOpen(true)} />
            )}
          </div>

          <div className="flex h-full shrink-0 grow-0 flex-col items-center gap-y-4 rounded-l bg-surface-base px-3 py-2.5">
            <IconButton icon="dash-info" label="About the dashboard" className="size-10 text-base leading-none" />
            <div className="flex flex-col items-center gap-2 overflow-hidden">
              <button
                type="button"
                aria-label="Edit layout"
                className="flex size-10 shrink-0 items-center justify-center rounded bg-secondary-base/20 font-semibold text-white"
              >
                <Icon name="dash-edit" className="size-4" />
              </button>
            </div>
            <div className="h-px w-6 bg-surface-base" />
            {railTools.map((tool) => (
              <IconButton
                key={tool.icon}
                icon={tool.icon}
                label={tool.label}
                className="size-10 border border-primary-base"
              />
            ))}
            <IconButton icon="dash-tools" label="More tools" className="size-10 text-base leading-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
