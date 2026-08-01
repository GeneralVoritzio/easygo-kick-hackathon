import { useEffect, useRef, useState } from "react";
import type { Livestream } from "../mock/api";

// A stream loops public/multiview/<slug>.mp4. That footage is third-party, so Brand Identity
// Section 7 keeps it out of the repository: a machine without the file falls back to the mock
// still. See demo/public/multiview/README.md.
export function StreamFootage({
  stream,
  paused,
  muted,
  className,
}: {
  stream: Livestream;
  paused: boolean;
  muted: boolean;
  className: string;
}) {
  const [hasFootage, setHasFootage] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
    if (paused) {
      video.pause();
      return;
    }
    // Chrome blocks an unmuted autoplay until the page has a user gesture. Motion matters more
    // than sound here, so a blocked play retries muted instead of leaving a still frame. Only
    // NotAllowedError means blocked: a new src aborts the pending play, and that must not mute.
    video.play().catch((error: DOMException) => {
      if (error.name !== "NotAllowedError") return;
      video.muted = true;
      video.play().catch(() => {});
    });
  }, [paused, muted, hasFootage]);

  if (!hasFootage) {
    return <img src={stream.thumbnail} alt={stream.session_title} className={className} />;
  }

  return (
    <video
      ref={videoRef}
      src={`/multiview/${stream.channel.slug}.mp4`}
      loop
      autoPlay
      playsInline
      onError={() => setHasFootage(false)}
      className={className}
    />
  );
}
