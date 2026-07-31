import { useEffect, useRef } from "react";
import { embedUrlFor } from "./embeds";
import { useEvent, type EmbedTarget } from "./EventProvider";

// The embeds live in one fixed layer that never unmounts, and the player and the
// tiles only mark where a frame should sit. A remount reloads an iframe, so the
// frames move by position only, and the sound never cuts on open or close. The
// mute flag sits in the URL, so only a stream switch reloads its two frames.
export function EmbedLayer({
  targets,
  slots,
  liveEmbeds,
}: {
  targets: Map<string, EmbedTarget>;
  slots: string[];
  liveEmbeds: boolean;
}) {
  const wrappers = useRef(new Map<string, HTMLDivElement>());
  const audioRef = useRef<HTMLIFrameElement>(null);
  const slugs = liveEmbeds
    ? [...new Set([...slots, ...targets.keys()])].filter((slug) => embedUrlFor(slug, true))
    : [];

  useEffect(() => {
    // Chrome pauses media in iframes that leave the viewport, and a paused kick
    // player stays frozen behind our pointer-events-none layer. So a frame with
    // no place on screen parks as a 2px sliver at the left edge, in the
    // viewport but behind the sidebar, and playback never stops.
    const park = (el: HTMLElement) => {
      el.style.left = "-158px";
      el.style.top = `${window.innerHeight - 92}px`;
      el.style.width = "160px";
      el.style.height = "90px";
    };
    const place = (el: HTMLElement, target: EmbedTarget) => {
      const r = target.el.getBoundingClientRect();
      el.style.left = `${r.left}px`;
      el.style.top = `${r.top}px`;
      el.style.width = `${r.width}px`;
      el.style.height = `${r.height}px`;
    };

    let raf = 0;
    const tick = () => {
      for (const [slug, wrapper] of wrappers.current) {
        const target = targets.get(slug);
        if (target && target.el.isConnected) place(wrapper, target);
        else park(wrapper);
      }
      if (audioRef.current) {
        // The audio frame sits exactly under the audible video frame, on screen
        // so autoplay is allowed, and occluded so nobody sees it.
        const audible = [...targets.values()].find((t) => !t.muted);
        if (audible && audible.el.isConnected) place(audioRef.current, audible);
        else park(audioRef.current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targets]);

  // The video frames stay muted forever, so their URLs never change and a
  // stream switch reloads nothing on screen. One hidden frame carries the
  // audio, and only that frame reloads when the selected stream changes.
  const audible = [...targets.entries()].find(([, t]) => !t.muted)?.[0];

  return (
    <div className="pointer-events-none fixed inset-0 z-[1]">
      {audible && (
        <iframe
          key="audio"
          ref={audioRef}
          src={embedUrlFor(audible, false)}
          title="Stream audio"
          allow="autoplay"
          className="absolute"
          style={{ left: -158, top: 0, width: 160, height: 90 }}
        />
      )}
      {slugs.map((slug) => (
        <div
          key={slug}
          ref={(el) => {
            if (el) wrappers.current.set(slug, el);
            else wrappers.current.delete(slug);
          }}
          className="absolute"
          style={{ left: -158, top: 0, width: 160, height: 90 }}
        >
          <iframe
            src={embedUrlFor(slug, true)}
            title={slug}
            allow="autoplay; fullscreen"
            allowFullScreen
            className="h-full w-full bg-black"
          />
        </div>
      ))}
    </div>
  );
}

export function useEmbedTarget(slug: string | undefined, muted: boolean) {
  const { registerEmbedTarget } = useEvent();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug || !ref.current) return;
    return registerEmbedTarget(slug, ref.current, muted);
  }, [slug, muted, registerEmbedTarget]);

  return ref;
}
