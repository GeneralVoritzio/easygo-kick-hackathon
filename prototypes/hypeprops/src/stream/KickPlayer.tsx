/**
 * The one Kick Player embed for the whole app — the stream page (via
 * FaceStage) and every Discovery preview/confirm surface mount this instead of
 * hand-rolling iframes. Autoplay stays muted to satisfy browser policy.
 */
export default function KickPlayer({ channel, className = '' }: { channel: string; className?: string }) {
  return (
    <iframe
      src={`https://player.kick.com/${channel}?autoplay=true&muted=true`}
      title={`${channel} live on Kick`}
      className={`h-full w-full border-0 ${className}`}
      allow="autoplay; fullscreen; encrypted-media"
      allowFullScreen
      scrolling="no"
    />
  )
}
