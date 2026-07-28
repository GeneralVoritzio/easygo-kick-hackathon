import type { Livestream } from "../mock/api";

/*
  The video-area stand-in for an Expedition stop or a Multiview tile: the same static
  thumbnail-as-preview language ChannelLivePreview.tsx already uses for a "live" card elsewhere
  on the site, not a third video-representation style. KICK gives no way to embed a channel's
  real video outside its own player, and every stream here is one of our own mocked channels
  (no fictional-vs-real split to account for, unlike kick-web-redesign's StreamSurface).
*/
export function StopPreview({ stream, className = "" }: { stream: Livestream; className?: string }) {
  return (
    <div className={`relative h-full w-full overflow-hidden bg-black ${className}`}>
      <img
        src={stream.thumbnail}
        alt={stream.session_title}
        className="h-full w-full object-cover brightness-110"
      />
    </div>
  );
}
