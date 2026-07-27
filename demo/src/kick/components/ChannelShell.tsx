import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Livestream, OfflineChannel } from "../mock/api";
import { ChannelPlayer } from "./ChannelPlayer";
import { ChannelBar } from "./ChannelBar";
import { ChannelChat } from "./ChannelChat";
import { ChannelOffline } from "./ChannelOffline";

const MIN_CHAT_WIDTH = 260;
const MAX_CHAT_WIDTH = 480;
const DEFAULT_CHAT_WIDTH = 340;

export type ChannelTab = "home" | "videos" | "clips" | "about";

const tabs: { id: ChannelTab; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "videos", label: "Videos" },
  { id: "clips", label: "Clips" },
  { id: "about", label: "About" },
];

function ChannelTabs({ slug, active }: { slug: string; active: ChannelTab }) {
  return (
    <nav
      aria-label="Channel"
      className="relative flex flex-nowrap overflow-x-auto bg-surface-lowest shadow-[inset_0px_-2px_0] shadow-outline-decorative scroll-smooth md:no-scrollbar"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const className = `state-layer-surface relative flex h-12 shrink-0 cursor-pointer items-center overflow-hidden whitespace-nowrap rounded-t-sm border-b px-2 text-base font-semibold transition-all ${
          isActive
            ? "border-surface-onSurfacePrimary text-surface-onSurfacePrimary"
            : "border-transparent text-white"
        }`;
        const testId = `channel-${tab.id}-tab`;

        if (tab.id === "home" || tab.id === "clips") {
          return (
            <Link
              key={tab.id}
              to={tab.id === "home" ? `/${slug}` : `/${slug}/clips`}
              data-testid={testId}
              className={className}
            >
              {tab.label}
            </Link>
          );
        }

        return (
          <button key={tab.id} type="button" data-testid={testId} className={className}>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export function ChannelShell({
  stream,
  active,
  offline,
  children,
}: {
  stream: Livestream;
  active: ChannelTab;
  offline?: OfflineChannel;
  children?: ReactNode;
}) {
  const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

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
      className={`-mb-6 flex h-[calc(100vh-var(--navbar-height))] w-full overflow-hidden bg-surface-lowest ${
        isDragging ? "select-none" : ""
      }`}
    >
      <div
        id="channel-content"
        className="no-scrollbar flex h-full min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden"
      >
        {offline ? (
          <ChannelOffline data={offline} />
        ) : (
          <>
            <ChannelPlayer stream={stream} />
            <ChannelBar stream={stream} />
          </>
        )}
        <ChannelTabs slug={stream.channel.slug} active={active} />
        {children}
      </div>

      <div className="hidden h-full shrink-0 lg:flex">
        <div
          role="separator"
          aria-label="Resize chatroom"
          aria-orientation="vertical"
          onMouseDown={() => setIsDragging(true)}
          className={`w-1 shrink-0 cursor-col-resize transition-colors ${
            isDragging ? "bg-primary-base" : "bg-transparent betterhover:hover:bg-primary-base"
          }`}
        />
        <div
          id="channel-chatroom"
          style={{ width: chatWidth }}
          className="h-full shrink-0 overflow-hidden"
        >
          <ChannelChat />
        </div>
      </div>
    </div>
  );
}
