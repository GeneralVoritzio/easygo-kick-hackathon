import { useEffect, useRef } from "react";
import { embedUrlFor } from "./embeds";
import { useEvent } from "./EventProvider";

// The embeds live in one fixed layer that never unmounts, and the player and the
// tiles only mark where a frame should sit. Every slot keeps an always muted
// frame whose URL never changes, so nothing visible reloads on open, close or
// switch. One unmuted main frame overlays the selected stream and carries the
// audio. It is visible and interactive, so the sound survives autoplay rules,
// and it is the only frame that reloads when the selection changes.
export function EmbedLayer({
  targets,
  slots,
  audible,
  liveEmbeds,
}: {
  targets: Map<string, HTMLElement>;
  slots: string[];
  audible?: string;
  liveEmbeds: boolean;
}) {
  const wrappers = useRef(new Map<string, HTMLDivElement>());
  const mainRef = useRef<HTMLDivElement>(null);
  const slugs = liveEmbeds
    ? [...new Set([...slots, ...targets.keys()])].filter((slug) => embedUrlFor(slug, true))
    : [];
  const mainSlug = liveEmbeds && audible && embedUrlFor(audible, false) ? audible : undefined;

  useEffect(() => {
    // A frame with no place on screen parks inside the sidebar's footprint:
    // still in the viewport, so Chrome and the player keep it playing, and
    // covered by the sidebar, so nobody sees it.
    const park = (el: HTMLElement) => {
      el.style.left = "8px";
      el.style.top = `${window.innerHeight - 98}px`;
      el.style.width = "160px";
      el.style.height = "90px";
    };
    const placeAt = (el: HTMLElement, anchor: HTMLElement) => {
      const r = anchor.getBoundingClientRect();
      el.style.left = `${r.left}px`;
      el.style.top = `${r.top}px`;
      el.style.width = `${r.width}px`;
      el.style.height = `${r.height}px`;
    };

    let raf = 0;
    const tick = () => {
      for (const [slug, wrapper] of wrappers.current) {
        const anchor = targets.get(slug);
        if (anchor && anchor.isConnected) placeAt(wrapper, anchor);
        else park(wrapper);
      }
      if (mainRef.current) {
        const anchor = audible ? targets.get(audible) : undefined;
        if (anchor && anchor.isConnected) placeAt(mainRef.current, anchor);
        else park(mainRef.current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targets, audible]);

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
          style={{ left: 8, top: 0, width: 160, height: 90 }}
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
      {mainSlug && (
        <div
          key="main"
          ref={mainRef}
          className="pointer-events-auto absolute"
          style={{ left: 8, top: 0, width: 160, height: 90 }}
        >
          <iframe
            src={embedUrlFor(mainSlug, false)}
            title="Selected stream"
            allow="autoplay; fullscreen"
            allowFullScreen
            className="h-full w-full bg-black"
          />
        </div>
      )}
    </div>
  );
}

export function useEmbedTarget(slug: string | undefined) {
  const { registerEmbedTarget } = useEvent();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug || !ref.current) return;
    return registerEmbedTarget(slug, ref.current);
  }, [slug, registerEmbedTarget]);

  return ref;
}

export function useAudibleEmbed(slug: string | undefined) {
  const { claimAudible } = useEvent();

  useEffect(() => {
    if (!slug) return;
    return claimAudible(slug);
  }, [slug, claimAudible]);
}
