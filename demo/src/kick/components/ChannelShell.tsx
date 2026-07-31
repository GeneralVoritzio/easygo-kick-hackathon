import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../Icon";
import { useEvent } from "../events/EventProvider";
import { MultiviewGrid } from "../events/Multiview";
import type { ChannelProfile, Livestream } from "../mock/api";
import { ChannelPlayer } from "./ChannelPlayer";
import { ChannelLivePreview } from "./ChannelLivePreview";
import { ChannelBar } from "./ChannelBar";
import { ChannelChat } from "./ChannelChat";
import { ChannelOffline } from "./ChannelOffline";
import { ChannelAboutCard } from "./ChannelSections";
import { useEvents } from "../EventsStore";
import { eventForChannel } from "../mock/events";

const MIN_CHAT_WIDTH = 260;
const MAX_CHAT_WIDTH = 480;
const DEFAULT_CHAT_WIDTH = 340;

export type ChannelTab = "home" | "videos" | "clips" | "about";

const tabs: { id: ChannelTab; label: string; path: string }[] = [
  { id: "home", label: "Home", path: "" },
  { id: "about", label: "About", path: "/about" },
  { id: "videos", label: "Videos", path: "/videos" },
  { id: "clips", label: "Clips", path: "/clips" },
];

// KICK points Home at /slug, which is the player. We send a live channel to /slug/home instead,
// so the Home tab is a content page and the player is only entered by Watch now.
function ChannelTabs({ slug, active, live }: { slug: string; active: ChannelTab; live: boolean }) {
  return (
    <nav
      aria-label="Channel"
      className="relative flex flex-nowrap overflow-x-auto bg-surface-lowest px-4 shadow-[inset_0px_-2px_0] shadow-outline-decorative scroll-smooth md:no-scrollbar"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            to={tab.id === "home" && live ? `/${slug}/home` : `/${slug}${tab.path}`}
            data-testid={`channel-${tab.id}-tab`}
            className={`state-layer-surface relative flex h-12 shrink-0 cursor-pointer items-center overflow-hidden whitespace-nowrap rounded-t-sm border-b px-2 text-base font-semibold transition-all ${
              isActive
                ? "border-surface-onSurfacePrimary text-surface-onSurfacePrimary"
                : "border-transparent text-white"
            }`}
          >
            {isActive && (
              <div className="absolute inset-x-0 bottom-[-2px] h-0.5 rounded-full bg-surface-onSurfacePrimary" />
            )}
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ChannelShell({
  profile,
  stream,
  active,
  watch,
  children,
}: {
  profile: ChannelProfile;
  stream?: Livestream;
  active: ChannelTab;
  watch?: boolean;
  children?: ReactNode;
}) {
  const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH);
  const [chatOpen, setChatOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const { multiview } = useEvent();
  const { events } = useEvents();
  const event = eventForChannel(events, profile.channel.slug);

  useEffect(() => {
    if (!isDragging) return;

    function onMove(e: MouseEvent) {
      if (!rowRef.current) return;
      const rect = rowRef.current.getBoundingClientRect();
      const next = Math.round(rect.right - e.clientX);
      setChatWidth(Math.min(MAX_CHAT_WIDTH, Math.max(MIN_CHAT_WIDTH, next)));
    }
    function onUp() {
      setIsDragging(false);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={rowRef}
      data-chat={chatOpen}
      className={`group/main -mb-6 flex h-[calc(100vh-var(--navbar-height))] w-full overflow-hidden bg-surface-lowest ${
        isDragging ? "select-none" : ""
      }`}
    >
      <div
        id="channel-content"
        className="no-scrollbar relative flex h-full min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden"
      >
        {/* KICK puts the expand button over the player, not in the page flow. */}
        {!chatOpen && (
          <div className="z-controls absolute right-7 top-7 transition-opacity">
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded bg-surface-base px-3 py-2 text-base font-semibold text-white transition-all betterhover:hover:bg-surface-highest betterhover:active:scale-[0.98]"
            >
              <Icon name="expand-chat" className="size-4 fill-current" />
              Chat
            </button>
          </div>
        )}
        {stream ? (
          <>
            {watch && multiview.active ? (
              <MultiviewGrid stream={stream} />
            ) : watch ? (
              <ChannelPlayer stream={stream} />
            ) : (
              <ChannelLivePreview stream={stream} />
            )}
            <div className="flex flex-col gap-6 px-4 py-5 lg:px-7">
              <ChannelBar stream={stream} showFollowers={!watch} event={event} />
              {watch && <ChannelAboutCard profile={profile} />}
            </div>
          </>
        ) : (
          <ChannelOffline profile={profile} />
        )}
        {/* KICK shows no tabs while the player is up. The player is the page. */}
        {!watch && (
          <ChannelTabs slug={profile.channel.slug} active={active} live={Boolean(stream)} />
        )}
        {children}
      </div>

      <div className="relative hidden h-full shrink-0 lg:flex">
        <div
          role="separator"
          aria-label="Resize chatroom"
          aria-orientation="vertical"
          onMouseDown={() => setIsDragging(true)}
          className={`absolute inset-y-0 left-0 z-10 w-1 cursor-col-resize transition-colors ${
            chatOpen ? "" : "hidden"
          } ${
            isDragging ? "bg-primary-base" : "bg-transparent betterhover:hover:bg-primary-base"
          }`}
        />
        <div
          id="channel-chatroom"
          style={{ width: chatOpen ? chatWidth : 0, opacity: chatOpen ? 1 : 0 }}
          className="h-full max-h-full min-w-0 shrink-0 grow-0 overflow-hidden transition-[width,opacity] duration-300 ease-out"
        >
          <ChannelChat
            onCollapse={() => setChatOpen(false)}
            event={event}
            slug={profile.channel.slug}
          />
        </div>
      </div>
    </div>
  );
}
