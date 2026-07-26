interface PreviewBackgroundProps {
  /** A Kick channel slug (from `?bg=<slug>`) to embed live via Kick's public
   *  player (https://player.kick.com/<slug> — see
   *  https://help.kick.com/en/articles/8010826-how-to-embed-your-kick-livestream)
   *  instead of the CSS placeholder. Falls back to the placeholder if unset. */
  channelSlug?: string;
}

/** TEMPORARY: a backdrop so the transparent overlay can be previewed
 *  composited over something other than a blank browser tab when showing
 *  teammates. Enabled only via `?bg=1` (CSS placeholder) or `?bg=<channel>`
 *  (a real, currently-live Kick channel embedded via Kick's own player) in
 *  the URL — safe to delete this file (and its one call site in
 *  BattleOverlay) along with the `.animate-bg-pan` keyframes in
 *  src/index.css once it's no longer needed; it never renders in the real
 *  OBS-composited overlay. */
export function PreviewBackground({ channelSlug }: PreviewBackgroundProps) {
  if (channelSlug) {
    return (
      <iframe
        className="fixed inset-0 -z-10 h-full w-full border-0"
        src={`https://player.kick.com/${channelSlug}?muted=true&autoplay=true`}
        allow="autoplay; fullscreen"
        title={`${channelSlug} — live preview background`}
      />
    );
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-page">
      <div className="animate-bg-pan absolute inset-0 bg-[length:200%_200%] bg-gradient-to-br from-surface via-page to-raised" />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 40px)',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="rounded-lg border border-line bg-page/60 px-4 py-2 font-mono text-xs uppercase tracking-widest text-ink-muted">
          Placeholder stream · demo preview only
        </span>
      </div>
    </div>
  );
}
