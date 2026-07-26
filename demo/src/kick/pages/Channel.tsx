import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { livestreams } from "../mock/api";
import { ChannelPlayer } from "../components/ChannelPlayer";
import { ChannelBar } from "../components/ChannelBar";
import { ChannelChat } from "../components/ChannelChat";

const MIN_CHAT_WIDTH = 260;
const MAX_CHAT_WIDTH = 480;
const DEFAULT_CHAT_WIDTH = 340;

export function Channel() {
  const { slug } = useParams();
  const stream =
    livestreams.find((s) => s.channel.slug === slug) ??
    livestreams.find((s) => s.channel.slug === "evscape") ??
    livestreams[0];

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
      className={`-mt-3 -mb-6 flex h-[calc(100vh-var(--navbar-height))] w-full overflow-hidden bg-surface-lowest lg:-mt-6 ${
        isDragging ? "select-none" : ""
      }`}
    >
      <div className="no-scrollbar flex h-full min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <ChannelPlayer stream={stream} />
        <ChannelBar stream={stream} />
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
        <div style={{ width: chatWidth }} className="h-full shrink-0 overflow-hidden">
          <ChannelChat />
        </div>
      </div>
    </div>
  );
}
