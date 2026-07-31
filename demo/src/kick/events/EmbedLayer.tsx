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
  const slugs = liveEmbeds
    ? [...new Set([...slots, ...targets.keys()])].filter((slug) => embedUrlFor(slug, true))
    : [];

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      for (const [slug, wrapper] of wrappers.current) {
        const target = targets.get(slug);
        if (target && target.el.isConnected) {
          const r = target.el.getBoundingClientRect();
          wrapper.style.left = `${r.left}px`;
          wrapper.style.top = `${r.top}px`;
          wrapper.style.width = `${r.width}px`;
          wrapper.style.height = `${r.height}px`;
        } else {
          // Off screen, never display none, so a warm frame keeps playing.
          wrapper.style.left = "-10000px";
          wrapper.style.top = "0px";
          wrapper.style.width = "320px";
          wrapper.style.height = "180px";
        }
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
      {slugs.map((slug) => (
        <div
          key={slug}
          ref={(el) => {
            if (el) wrappers.current.set(slug, el);
            else wrappers.current.delete(slug);
          }}
          className="absolute"
          style={{ left: -10000, top: 0, width: 320, height: 180 }}
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
      {audible && (
        <iframe
          key="audio"
          src={embedUrlFor(audible, false)}
          title="Stream audio"
          allow="autoplay"
          className="absolute"
          style={{ left: -10000, top: 200, width: 320, height: 180 }}
        />
      )}
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
