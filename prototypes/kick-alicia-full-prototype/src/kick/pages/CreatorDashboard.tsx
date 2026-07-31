import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { Icon, type KickIconName } from "../Icon";
import { ProfileMenu } from "../components/ProfileMenu";
import kickLogo from "../brand/kick-logo.svg";
import { categories, currentUser, livestreams } from "../mock/api";
import { colorFor } from "../mock/chatIdentities";
import { ChatFeed } from "../components/ChannelChat";
import { useExpeditions } from "../expedition/ExpeditionContext";
import { createKickBreak } from "../expedition/data";

const streamItem = "/dashboard/stream";

const navItems: { label: string; to: string; icon: KickIconName; expandable?: boolean }[] = [
  { label: "Stream", to: streamItem, icon: "dash-stream" },
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

const justChatting = categories.find((c) => c.slug === "just-chatting")!;

function IconButton({
  icon,
  label,
  className,
}: {
  icon: KickIconName;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`state-layer-surface flex shrink-0 items-center justify-center rounded bg-transparent font-semibold text-white [&_svg]:size-[1em] ${className ?? ""}`}
    >
      <Icon name={icon} />
    </button>
  );
}

function PanelHeader({
  title,
  icon,
  actions,
}: {
  title: string;
  icon: KickIconName;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex h-[52px] shrink-0 items-center justify-between rounded-t border-b border-outline-decorative bg-surface-base py-2 pl-6 pr-4 text-sm font-bold">
      <div className="flex items-center gap-4 text-lg leading-none text-white">
        <Icon name={icon} className="size-4 shrink-0" />
        <span>{title}</span>
      </div>
      <div className="flex items-center gap-1">{actions}</div>
    </div>
  );
}

function Panel({
  title,
  icon,
  actions,
  bodyClassName,
  bigPopout,
  children,
}: {
  title: string;
  icon: KickIconName;
  actions?: React.ReactNode;
  bodyClassName?: string;
  bigPopout?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full flex-col">
      <PanelHeader
        title={title}
        icon={icon}
        actions={
          <>
            {actions}
            <IconButton
              icon="dash-popout"
              label={`Open ${title} in a new window`}
              className={`size-8 leading-none ${bigPopout ? "text-base" : "text-sm"}`}
            />
          </>
        }
      />
      <div
        className={`flex min-h-0 flex-1 grow overflow-hidden rounded-b bg-surface-base ${bodyClassName ?? ""}`}
      >
        {children}
      </div>
    </div>
  );
}

function Pane({ style, children }: { style: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden p-0.5" style={style}>
      {children}
    </div>
  );
}

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

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  const state = on ? "checked" : "unchecked";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      data-state={state}
      onClick={() => onChange(!on)}
      className="h-5 w-[2.25rem] shrink-0 cursor-pointer rounded-full bg-secondary-base transition-colors data-[state=checked]:bg-primary-base"
    >
      <span
        data-state={state}
        className="block h-[0.875rem] w-[0.875rem] translate-x-[0.25rem] rounded-full bg-white transition-transform data-[state=checked]:translate-x-[calc(2.25rem-0.25rem-0.875rem)] data-[state=checked]:bg-surface-base"
      />
    </button>
  );
}

function ActionRow({
  label,
  value,
  external,
  disabled,
  onClick,
}: {
  label: string;
  value?: string;
  external?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
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

const DEFAULT_KICK_BREAK_DURATION_MINUTES = 1;

/*
  What the streamer configures before a Kick Break goes live: which streamers, in what order, and
  how long each stream plays before hopping to the next. Everything else about a Kick Break
  (unlisted, origin-only chat, no Kick Vote, fixed order) is decided already — see createKickBreak.
*/
function KickBreakModal({
  onClose,
  onStart,
  onPreview,
}: {
  onClose: () => void;
  onStart: (input: { selectedSlugs: string[]; durationSeconds: number }) => void;
  onPreview: (input: { selectedSlugs: string[]; durationSeconds: number }) => void;
}) {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(() =>
    livestreams.slice(0, 3).map((s) => s.channel.slug),
  );
  const [streamerQuery, setStreamerQuery] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(DEFAULT_KICK_BREAK_DURATION_MINUTES);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const filteredStreamers = streamerQuery.trim()
    ? livestreams.filter((s) => s.channel.username.toLowerCase().includes(streamerQuery.trim().toLowerCase()))
    : livestreams;

  function toggleSlug(slug: string) {
    setSelectedSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  function reorder(from: number, to: number) {
    setSelectedSlugs((prev) => {
      if (to < 0 || to >= prev.length || from === to) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-xl border border-outline-decorative bg-surface-highest p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Configure Kick Break</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-subtle transition-colors betterhover:hover:text-white"
          >
            <Icon name="close" className="size-4" />
          </button>
        </div>
        <p className="text-xs text-subtle">
          Sends your viewers on a rotation through other streams while you're away. Your own chat
          stays open the whole time — no Kick Vote, no move-on votes, and viewers can still follow,
          sub and donate to whoever's on screen.
        </p>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-subtle">Streamers</span>
          <input
            value={streamerQuery}
            onChange={(e) => setStreamerQuery(e.target.value)}
            placeholder="Search streamers"
            className="h-9 w-full rounded border border-outline-region bg-surface-lowest px-3 text-sm text-white outline-none focus:border-primary-base"
          />
          <div className="grid max-h-40 grid-cols-2 gap-1 overflow-y-auto">
            {filteredStreamers.map((s) => {
              const checked = selectedSlugs.includes(s.channel.slug);
              return (
                <button
                  key={s.channel.slug}
                  type="button"
                  onClick={() => toggleSlug(s.channel.slug)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-xs font-semibold transition-colors ${
                    checked
                      ? "border-primary-base/50 bg-primary-base/10 text-white"
                      : "border-outline-decorative text-subtle betterhover:hover:border-neutral-600"
                  }`}
                >
                  <span
                    className="grid size-5 shrink-0 place-items-center rounded-full text-[9px] font-black text-black"
                    style={{ background: colorFor(s.channel.username) }}
                  >
                    {s.channel.username.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="truncate">{s.channel.username}</span>
                </button>
              );
            })}
            {filteredStreamers.length === 0 && (
              <p className="col-span-2 py-2 text-center text-xs text-subtle">No match.</p>
            )}
          </div>
        </div>

        {selectedSlugs.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-subtle">Order — drag to reorder</span>
            <div className="flex flex-col gap-1">
              {selectedSlugs.map((slug, i) => {
                const stream = livestreams.find((s) => s.channel.slug === slug);
                if (!stream) return null;
                return (
                  <div
                    key={slug}
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragIndex !== null) reorder(dragIndex, i);
                      setDragIndex(null);
                    }}
                    onDragEnd={() => setDragIndex(null)}
                    className={`flex cursor-grab items-center gap-2 rounded-lg border border-outline-decorative px-2 py-1.5 text-xs active:cursor-grabbing ${
                      dragIndex === i ? "opacity-40" : ""
                    }`}
                  >
                    <span className="w-4 shrink-0 text-center font-bold text-subtle">{i + 1}</span>
                    <span
                      className="grid size-5 shrink-0 place-items-center rounded-full text-[9px] font-black text-black"
                      style={{ background: colorFor(stream.channel.username) }}
                    >
                      {stream.channel.username.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-semibold text-white">
                      {stream.channel.username}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <label className="flex flex-col gap-1 text-xs font-semibold text-subtle">
          Minutes per stream
          <input
            type="number"
            min={1}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Math.max(1, Number(e.target.value)))}
            className="h-9 w-32 rounded border border-outline-region bg-surface-lowest px-3 text-sm text-white outline-none focus:border-primary-base"
          />
        </label>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            disabled={selectedSlugs.length === 0}
            onClick={() => onPreview({ selectedSlugs, durationSeconds: durationMinutes * 60 })}
            className="flex-1 rounded-lg border border-outline-decorative px-4 py-2 text-sm font-bold text-white transition-colors betterhover:hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Preview as a viewer
          </button>
          <button
            type="button"
            disabled={selectedSlugs.length === 0}
            onClick={() => onStart({ selectedSlugs, durationSeconds: durationMinutes * 60 })}
            className="flex-1 rounded-lg bg-primary-base px-4 py-2 text-sm font-bold text-primary-onPrimary transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start Kick Break
          </button>
        </div>
      </div>
    </div>
  );
}

export function CreatorDashboard() {
  const { section } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { expeditions, createExpedition, endKickBreak } = useExpeditions();
  const [subsOnly, setSubsOnly] = useState(false);
  const [emotesOnly, setEmotesOnly] = useState(false);
  const [showViewCount, setShowViewCount] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  // A Kick Break can only be entered through this page's own preview button, so when its lap
  // finishes and Expedition.tsx sends the viewer back here, it asks for the same modal to reopen
  // rather than landing back on a bare dashboard.
  const [kickBreakModalOpen, setKickBreakModalOpen] = useState(
    Boolean((location.state as { reopenKickBreakModal?: boolean } | null)?.reopenKickBreakModal),
  );
  const active = `/dashboard/${section ?? "stream"}`;
  const activeKickBreak = expeditions.find((e) => e.kind === "kick-break" && e.createdByViewer);

  // Goes live either way — the only difference is whether "you" (the one persona this
  // prototype has) also ride it afterward to see the viewer side, or just stay on the
  // dashboard the way a streamer actually running a break would.
  function buildAndStartKickBreak(input: { selectedSlugs: string[]; durationSeconds: number }) {
    const exp = createKickBreak(
      { preselectedSlugs: input.selectedSlugs, stopDurationSeconds: input.durationSeconds },
      livestreams,
    );
    createExpedition(exp);
    setKickBreakModalOpen(false);
    return exp;
  }

  function startKickBreak(input: { selectedSlugs: string[]; durationSeconds: number }) {
    buildAndStartKickBreak(input);
  }

  function previewKickBreak(input: { selectedSlugs: string[]; durationSeconds: number }) {
    const exp = buildAndStartKickBreak(input);
    navigate(`/expedition/${exp.id}`);
  }

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
                  {item.expandable && <Icon name="chevron-right" className="size-3 shrink-0 rotate-90" />}
                </>
              );
              const rowClass =
                "flex h-12 w-full items-center justify-start gap-x-4 rounded px-4 py-1 text-base font-semibold text-white";
              return (
                <li key={item.to}>
                  {item.to === streamItem ? (
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
                      <span className="line-clamp-2 font-semibold text-white">My first stream.</span>
                      <div className="no-scrollbar flex w-full max-w-full items-center gap-2 overflow-x-auto">
                        <img
                          src={justChatting.thumbnail}
                          alt=""
                          className="aspect-[164/219] h-[46px] shrink-0 overflow-hidden rounded object-cover"
                        />
                        <div className="flex flex-col gap-1">
                          <span className="text-white">{justChatting.name}</span>
                          <div className="flex min-w-0 gap-2">
                            <span className="rounded-full bg-secondary-base px-2 py-1 text-sm leading-none text-secondary-onSecondary">
                              English
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
                          {activeKickBreak ? (
                            <ActionRow
                              label="End Kick Break"
                              value="Live now"
                              onClick={() => endKickBreak(activeKickBreak.id)}
                            />
                          ) : (
                            <ActionRow label="Kick Break" onClick={() => setKickBreakModalOpen(true)} />
                          )}
                        </ActionGroup>
                      </div>
                    </div>
                  </Panel>
                </Pane>
              </div>
            </div>
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

      {kickBreakModalOpen && (
        <KickBreakModal
          onClose={() => setKickBreakModalOpen(false)}
          onStart={startKickBreak}
          onPreview={previewKickBreak}
        />
      )}
    </div>
  );
}
