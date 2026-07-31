import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../Icon";
import { chatLines, chatters, colorFor } from "../engine/chat";
import { formatViewers, liveStreamFor } from "../mock/api";
import { formatClipAge, formatDuration, type Clip } from "../mock/clips";

const controlButtonClass =
  "tooltip-top flex size-11 shrink-0 items-center justify-center rounded bg-transparent text-white [&_svg]:size-5 [&_svg]:fill-current";

const railButtonClass =
  "flex h-10 shrink-0 items-center justify-center gap-1.5 rounded bg-secondary-base/20 px-3 py-2 text-base font-semibold text-white outline outline-2 outline-offset-2 outline-transparent transition-all select-none betterhover:hover:bg-secondary-base/40 betterhover:active:scale-[0.98] focus-visible:outline-outline-decorative";

function replayFor(clip: Clip) {
  return Array.from({ length: 24 }, (_, i) => {
    const chatter = chatters[(clip.id * 7 + i * 5) % chatters.length];
    return {
      id: i,
      at: Math.floor((i / 24) * clip.duration_seconds),
      username: chatter.username,
      body: chatLines[(clip.id * 3 + i * 11) % chatLines.length],
    };
  });
}

function ClipChat({ clip, onCollapse }: { clip: Clip; onCollapse: () => void }) {
  const [following, setFollowing] = useState(false);

  return (
    <div className="flex min-h-0 w-[var(--chat-width)] shrink-0 flex-col bg-surface-base">
      <div className="relative flex min-h-[38px] shrink-0 items-center justify-between border-b-2 border-[#24272c] px-3 py-1.5">
        <button
          type="button"
          aria-label="Collapse chat"
          onClick={onCollapse}
          className="state-layer-surface flex size-9 shrink-0 items-center justify-center rounded text-white"
        >
          <Icon name="collapse-chat" className="size-4" />
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-sm font-bold lg:text-base">
          Chat
        </span>
      </div>

      <div className="flex min-h-0 grow flex-col gap-4 px-3.5 py-4">
        <div className="flex shrink-0 flex-row gap-4">
          <Link to={`/${clip.channel.slug}/home`} className="shrink-0">
            <img
              src={clip.channel.avatar}
              alt={clip.channel.username}
              className="size-16 rounded-full"
            />
          </Link>
          <div className="flex min-w-0 flex-col justify-center gap-1">
            <Link
              to={`/${clip.channel.slug}/home`}
              className="flex items-center gap-1.5 betterhover:hover:underline"
            >
              <h1 className="truncate text-xl font-bold leading-7 text-white">
                {clip.channel.username}
              </h1>
              {clip.channel.verified && <Icon name="verified" className="size-5 shrink-0" />}
            </Link>
            <button
              type="button"
              className="flex min-w-0 items-center gap-1 text-left text-sm font-semibold leading-6 text-white"
            >
              <span className="truncate">
                {liveStreamFor(clip.channel.slug)?.session_title ?? clip.title}
              </span>
              <Icon name="icon-10" className="size-3 shrink-0 opacity-75" />
            </button>
          </div>
        </div>

        <div className="flex shrink-0 flex-row flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={following}
            onClick={() => setFollowing((v) => !v)}
            className={`flex h-10 grow items-center justify-center gap-1.5 whitespace-nowrap rounded px-3 py-2 text-base font-semibold transition-all select-none betterhover:active:scale-[0.98] ${
              following ? "bg-secondary-base text-white" : "bg-primary-base text-primary-onPrimary"
            }`}
          >
            <Icon name={following ? "heart-filled" : "heart"} className="size-4" />
            {following ? "Following" : "Follow"}
          </button>
          <button type="button" aria-label="Share via" className={`${railButtonClass} size-10 px-0`}>
            <Icon name="share" className="size-4 fill-current" />
          </button>
          <button
            type="button"
            aria-label="Download clip"
            className={`${railButtonClass} size-10 px-0`}
          >
            <Icon name="download" className="size-4 fill-current" />
          </button>
          <button
            type="button"
            aria-label="More actions"
            className={`${railButtonClass} size-10 px-0`}
          >
            <Icon name="more-actions" className="size-4 fill-current" />
          </button>
        </div>

        <div className="flex shrink-0 flex-col gap-4">
          <hr className="w-full border-t-2 border-t-[#24272C]" />
          {/* KICK opens the VOD at /{slug}/videos/{video_id}?t=. We hold no VOD, so we open the stream at the same point. */}
          <Link
            to={`/${clip.channel.slug}?t=${clip.start_time}`}
            className={`${railButtonClass} w-full`}
          >
            Watch full video
            <Icon name="dash-external" className="size-4 shrink-0 fill-current" />
          </Link>
          <hr className="w-full border-t-2 border-t-[#24272C]" />
        </div>

        <div className="no-scrollbar flex min-h-0 grow flex-col overflow-y-auto bg-neutral-950 py-2 text-sm leading-[21px]">
          {replayFor(clip).map((message) => (
            <div
              key={message.id}
              className="w-full break-words rounded-lg px-2 py-1 betterhover:hover:bg-surface-highest"
            >
              <span className="pr-1 font-semibold tabular-nums">{formatDuration(message.at)}</span>
              <button type="button" className="font-bold" style={{ color: colorFor(message.username) }}>
                {message.username}
              </button>
              <span className="font-bold">: </span>
              <span className="font-normal">{message.body}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ClipModal({ clip, onClose }: { clip: Clip; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [chatOpen, setChatOpen] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    if (elapsed >= clip.duration_seconds) setPlaying(false);
  }, [elapsed, clip.duration_seconds]);

  const progress = (elapsed / clip.duration_seconds) * 100;

  const seek = (e: ReactPointerEvent<HTMLSpanElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setElapsed(Math.round(percent * clip.duration_seconds));
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="m-auto max-w-none overflow-visible rounded-lg bg-surface-base p-0 text-white backdrop:bg-black/75"
    >
      <div className="relative flex h-[calc(80vh-var(--channel-info-height))] max-h-[calc((70vw-48px)*9/16)]">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className={`absolute top-0 z-controls flex size-10 items-center justify-center rounded text-white transition-colors duration-150 betterhover:hover:bg-stateLayer-surfaceHover active:bg-stateLayer-surfacePress [&_svg]:size-4 [&_svg]:fill-current ${
            chatOpen ? "right-[var(--chat-width)]" : "right-0 mr-[105px] mt-[13px]"
          }`}
        >
          <Icon name="close" />
        </button>

        <div className="group/player relative h-full w-[70vw] max-w-[calc((80vh-var(--channel-info-height))*16/9)] overflow-hidden bg-black">
          <div className="relative m-auto aspect-video h-full">
            <img
              src={clip.thumbnail}
              alt={clip.title}
              className="h-full w-full object-cover brightness-110"
            />

            <div
              onClick={() => setPlaying((p) => !p)}
              className="absolute inset-0 z-player cursor-pointer"
            />

            {!chatOpen && (
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="absolute right-5 top-3 z-controls flex h-9 items-center gap-1.5 rounded px-2 text-sm font-semibold text-white [&_svg]:size-4 [&_svg]:fill-current"
              >
                <Icon name="expand-chat" />
                Chat
              </button>
            )}

            <div className="absolute inset-x-0 top-0 z-controls flex flex-row flex-nowrap justify-between bg-gradient-to-b from-black/80 to-transparent px-5 py-3">
              <div className="flex flex-col gap-1.5 font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="leading-[1.2]">{clip.title}</span>
                  <span>•</span>
                  <Link to="/browse/categories" className="betterhover:hover:underline">
                    {clip.category.name}
                  </Link>
                </div>
                <span className="text-sm leading-none">
                  Clipped by{" "}
                  <button type="button" className="betterhover:hover:underline">
                    {clip.clipper}
                  </button>{" "}
                  • {formatViewers(clip.view_count)} Views • {formatClipAge(clip.created_at)}
                </span>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-controls flex flex-row flex-nowrap justify-between bg-gradient-to-b from-transparent to-black/80 px-5">
              <div className="group/seekbar absolute -top-7 left-0 flex h-5 w-full items-end">
                <span
                  role="slider"
                  aria-label="Seek"
                  aria-valuenow={Math.round(progress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    seek(e);
                  }}
                  onPointerMove={(e) => {
                    if (e.buttons === 1) seek(e);
                  }}
                  className="relative flex h-5 w-full cursor-pointer touch-none select-none items-end"
                >
                  <span className="absolute bottom-0 left-0 h-1 w-full bg-subtle/50 lg:betterhover:group-hover/seekbar:h-1.5">
                    <span
                      className="absolute h-full bg-green-500"
                      style={{ width: `${progress}%` }}
                    />
                  </span>
                  <span
                    className="absolute bottom-0 hidden size-4 -translate-x-1/2 translate-y-1.5 rounded-full bg-primary-base lg:betterhover:group-hover/seekbar:block"
                    style={{ left: `${progress}%` }}
                  />
                </span>
              </div>

              <div className="flex flex-row items-center gap-2 lg:gap-0">
                <button
                  type="button"
                  aria-label={playing ? "Pause (space)" : "Play (space)"}
                  onClick={() => setPlaying((p) => !p)}
                  className={`tooltip-start ${controlButtonClass}`}
                >
                  <Icon name={playing ? "pause" : "play"} />
                </button>
                <button
                  type="button"
                  aria-label={muted ? "Unmute (m)" : "Mute (m)"}
                  onClick={() => setMuted((m) => !m)}
                  className={controlButtonClass}
                >
                  <Icon name={muted ? "mute" : "volume"} />
                </button>
                <span className="px-1 text-sm font-semibold tabular-nums lg:px-2">
                  {formatDuration(elapsed)} / {formatDuration(clip.duration_seconds)}
                </span>
              </div>

              <div className="flex flex-row items-center gap-2 lg:gap-0">
                <button
                  type="button"
                  aria-label="Fullscreen (f)"
                  className={`tooltip-end ${controlButtonClass}`}
                >
                  <Icon name="fullscreen" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {chatOpen && <ClipChat clip={clip} onCollapse={() => setChatOpen(false)} />}
      </div>
    </dialog>
  );
}
