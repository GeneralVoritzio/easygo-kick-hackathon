import { useEffect, useState } from 'react';
import type { LiveStream } from '@shared/types';
import { streamGradient } from '@shared/mock/mockData';

/** Same embed shape as `prototypes/hypeprops`' `/stream` route
 *  (`FaceStage.tsx`): channel slug in the path, `autoplay`/`muted` as query
 *  params, no `parent` param (Kick's player embed has no domain-restriction
 *  requirement, unlike Twitch's). */
function embedSrc(stream: LiveStream, muted: boolean): string {
  const params = new URLSearchParams({ autoplay: 'true', muted: String(muted) });
  return `https://player.kick.com/${stream.embedId}?${params.toString()}`;
}

interface StreamSurfaceProps {
  stream: LiveStream;
  muted: boolean;
}

/** A real, live Kick embed — the one place video actually renders, reused
 *  by the discovery tile, pinned-dock thumbnails, and the focus-mode
 *  mosaic. If the channel isn't currently live, Kick's own embed shows its
 *  real offline card rather than anything we fabricate (same accepted
 *  tradeoff as `prototypes/hypeprops`). Always fills its nearest positioned
 *  ancestor (every call site is already `position: relative` and sized) —
 *  deliberately hardcoded rather than taking a `className` prop for this,
 *  since every caller passed the identical `"absolute inset-0"` and
 *  combining that with a locally-hardcoded `relative` class here is exactly
 *  the kind of same-property Tailwind conflict that silently picks whichever
 *  utility happens to be declared later in the compiled stylesheet — it was
 *  `.relative`, so the whole surface was collapsing to zero size (still
 *  loading and playing audio, just invisible). `pointer-events-none` on the
 *  iframe means every gesture (swipe, hold, tap, pinch) always reaches our
 *  own handlers on the surrounding tile instead of being captured by the
 *  cross-origin embed. */
export function StreamSurface({ stream, muted }: StreamSurfaceProps) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => setLoaded(false), [stream.embedId, muted]);

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden">
      {!loaded && (
        <div
          className="animate-bg-pan absolute inset-0 bg-[length:200%_200%]"
          style={{ backgroundImage: streamGradient(stream.id) }}
        />
      )}
      <iframe
        key={`${stream.embedId}-${muted}`}
        src={embedSrc(stream, muted)}
        title={`${stream.name} live`}
        allow="autoplay; fullscreen; encrypted-media"
        className="pointer-events-none absolute inset-0 h-full w-full border-0"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
