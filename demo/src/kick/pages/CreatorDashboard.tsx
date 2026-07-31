import { useState } from "react";
import { Link, NavLink, useParams } from "react-router-dom";
import { Icon, type KickIconName } from "../Icon";
import { ProfileMenu } from "../components/ProfileMenu";
import kickLogo from "../brand/kick-logo.svg";
import { categories, currentSession, currentUser, formatFollowers, formatViewers } from "../mock/api";
import { ChatFeed } from "../components/ChannelChat";
import { RaidStage } from "../components/RaidStage";
import { RaidDevControls } from "../components/RaidChat";
import { PitchOverlay } from "../components/PitchOverlay";
import { ShowdownInvite } from "../components/ShowdownInvite";
import { BackFromBreakToast } from "../components/BackFromBreakToast";
import { useRaid } from "../raid/RaidProvider";
import { usePrefs } from "../prefs";
import { announceInChat } from "../announce";

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

// Section 4.1: catches a streamer ending without raiding, before the stream actually ends.
// Raid a channel opens the same picker "End stream" always opened. End without raiding just
// closes the popup, it never starts a raid on its own. The checkbox reads and writes the live
// raidReminder pref directly, not a local draft, so checking it here turns the reminder off
// everywhere, the same instant, same as the dashboard toggle.
function RaidReminder({
  raidReminder,
  onRaidReminderChange,
  onRaid,
  onEndAnyway,
  onClose,
}: {
  raidReminder: boolean;
  onRaidReminderChange: (on: boolean) => void;
  onRaid: () => void;
  onEndAnyway: () => void;
  onClose: () => void;
}) {
  return (
    <div className="z-popover fixed inset-0 flex items-center justify-center bg-surfaceOverlay-base p-4">
      <div className="animate-pick-reveal relative flex w-full max-w-sm flex-col gap-5 overflow-hidden rounded-xl bg-surface-base p-6 shadow-2xl">
        <div className="animate-pick-glow pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(ellipse_at_top,rgba(83,252,24,0.35),transparent_70%)]" />

        <div className="absolute right-3 top-3 z-10">
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="state-layer-surface flex size-8 items-center justify-center rounded text-white"
          >
            <Icon name="close" className="size-3.5" />
          </button>
        </div>

        <div className="relative flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-base/15 ring-2 ring-primary-base/40">
            <Icon name="kick-mark" className="size-6 text-primary-base" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-bold leading-6 text-white">Hold up! You have not raided.</h2>
            <p className="text-sm leading-5 text-surface-onSurfaceSecondary">
              Send your viewers to a live creator before you go. It takes a second.
            </p>
          </div>
        </div>

        <div className="relative flex flex-col gap-2">
          <button
            type="button"
            onClick={onRaid}
            className="state-layer-base h-11 w-full rounded-md bg-primary-base text-base font-semibold text-primary-onPrimary"
          >
            Raid a channel
          </button>
          <button
            type="button"
            onClick={onEndAnyway}
            className="h-9 w-full rounded-md text-sm font-semibold text-surface-onSurfaceSecondary betterhover:hover:text-white"
          >
            End without raiding
          </button>
        </div>

        <label className="relative flex w-fit cursor-pointer select-none items-center gap-2 self-center text-xs text-surface-onSurfaceSecondary betterhover:hover:text-white">
          <input
            type="checkbox"
            checked={!raidReminder}
            onChange={(e) => onRaidReminderChange(!e.target.checked)}
            className="peer sr-only"
          />
          <span className="flex size-4 shrink-0 items-center justify-center rounded border border-outline-decorative bg-surface-lowest text-[10px] font-bold leading-none text-transparent transition-colors peer-checked:border-primary-base peer-checked:bg-primary-base peer-checked:text-primary-onPrimary">
            &#10003;
          </span>
          Do not remind me again
        </label>
      </div>
    </div>
  );
}

export function CreatorDashboard() {
  const { section } = useParams();
  const [subsOnly, setSubsOnly] = useState(false);
  const [emotesOnly, setEmotesOnly] = useState(false);
  const [showViewCount, setShowViewCount] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showRaidReminder, setShowRaidReminder] = useState(false);
  const [breakToast, setBreakToast] = useState<string | null>(null);
  const { openDialog, endStream } = useRaid();
  const [prefs, updatePrefs] = usePrefs();
  const active = `/dashboard/${section ?? "stream"}`;

  function handleEndStream() {
    if (prefs.raidReminder) setShowRaidReminder(true);
    else endStream();
  }

  // fake-kick POST /public/v1/livestreams/{broadcaster_user_id}/announcements
  function handleBackFromBreak() {
    const message = `${currentUser.username} is back!`;
    announceInChat(message);
    setBreakToast(message);
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-lowest">
      <RaidDevControls />
      <ShowdownInvite />
      <PitchOverlay />
      {showRaidReminder && (
        <RaidReminder
          raidReminder={prefs.raidReminder}
          onRaidReminderChange={(on) => updatePrefs({ raidReminder: on })}
          onRaid={() => {
            setShowRaidReminder(false);
            openDialog("end");
          }}
          onEndAnyway={() => {
            setShowRaidReminder(false);
            endStream();
          }}
          onClose={() => setShowRaidReminder(false)}
        />
      )}
      {breakToast && (
        <BackFromBreakToast
          message={breakToast}
          slug={currentUser.slug}
          onDone={() => setBreakToast(null)}
        />
      )}
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
            onClick={handleBackFromBreak}
            className="state-layer-surface inline-flex h-9 items-center justify-center gap-1.5 rounded bg-secondary-base px-2 text-sm font-semibold text-secondary-onSecondary"
          >
            <Icon name="play" className="size-[1em]" />
            Back from break
          </button>
          {/* Section 6: the two entry points open the same dialog. Only the heading and the
              escape wording differ. */}
          <button
            type="button"
            onClick={handleEndStream}
            className="state-layer-base inline-flex h-9 items-center justify-center gap-1.5 rounded bg-primary-base px-2 text-sm font-semibold text-primary-onPrimary"
          >
            <Icon name="kick-mark" className="size-[1em]" />
            End stream
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
                      <Stat label="Session" badge="Live" />
                      <div className="h-full w-px shrink-0 bg-outline-decorative" />
                      <Stat label="Viewers" value={formatViewers(currentSession.viewer_count)} />
                      <div className="h-full w-px shrink-0 bg-outline-decorative" />
                      <Stat label="Followers" value={formatFollowers(currentUser.followers)} />
                      <div className="h-full w-px shrink-0 bg-outline-decorative" />
                      <Stat label="Sub Counts" value={String(currentSession.subscriber_count)} />
                      <div className="h-full w-px shrink-0 bg-outline-decorative" />
                      <Stat label="Time Live" value={currentSession.time_live} />
                    </div>
                    <div className="w-full border-t border-outline-decorative" />
                  </Panel>
                </Pane>

                <Pane style={{ height: "50%" }}>
                  <div className="flex h-full w-full flex-col">
                    <PanelHeader title="Stream Preview" icon="dash-studio" />
                    <div className="relative flex min-h-0 flex-1 grow overflow-hidden rounded-b bg-black">
                      <img
                        src={currentSession.thumbnail}
                        alt={currentSession.title}
                        className="h-full w-full object-contain brightness-125"
                      />
                      {/* Section 5.1: every raid preview plays here, never in the chat column. */}
                      <RaidStage />
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
                      <span className="line-clamp-2 font-semibold text-white">
                        {currentSession.title}
                      </span>
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
                          <ToggleRow
                            label="Showdown raids"
                            on={prefs.showdownRaids}
                            onChange={(v) => updatePrefs({ showdownRaids: v })}
                          />
                          <ToggleRow
                            label="Raid reminder"
                            on={prefs.raidReminder}
                            onChange={(v) => updatePrefs({ raidReminder: v })}
                          />
                          <ActionRow label="Raid Channel" onClick={() => openDialog("raid")} />
                          <ActionRow label="Set goals" />
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
    </div>
  );
}
