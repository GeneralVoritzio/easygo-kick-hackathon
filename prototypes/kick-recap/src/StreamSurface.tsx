import { useState } from 'react';

interface StreamSurfaceProps {
  channel: string;
}

/** The real Kick embed the widget sits on top of. Same embed shape as
 *  `prototypes/hypeprops` (`FaceStage.tsx`) and `prototypes/kick-battles`:
 *  channel slug in the path, `autoplay`/`muted` as query params, no
 *  `parent` param. Starts muted (autoplay policy); Kick's own player chrome
 *  has its own volume control for the viewer to unmute with. */
export function StreamSurface({ channel }: StreamSurfaceProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden bg-surface">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="h-3 w-3 animate-live-pulse rounded-full bg-kick" />
        </div>
      )}
      <iframe
        src={`https://player.kick.com/${channel}?autoplay=true&muted=true`}
        title={`${channel} live on Kick`}
        allow="autoplay; fullscreen"
        className="absolute inset-0 h-full w-full border-0"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
