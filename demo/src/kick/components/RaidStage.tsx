import type { ReactNode } from "react";
import { currentSession, currentUser, formatViewers, liveStreamFor } from "../mock/api";
import { useRaid } from "../raid/RaidProvider";
import { candidateFor, playTile, TIMING, type Raid } from "../raid/machine";

type StageFrame = { key: string; src: string; name: string; note?: string };

// The host is the current session, not a recommendation, so it never comes out of the
// candidate list.
function frameFor(raid: Raid, slug: string): StageFrame | null {
  if (slug === raid.hostSlug) {
    const host = liveStreamFor(slug);
    return {
      key: slug,
      src: host?.thumbnail ?? currentSession.thumbnail,
      name: host?.channel.username ?? currentUser.username,
      note: `${formatViewers(raid.hostViewers)} watching`,
    };
  }
  const c = candidateFor(raid, slug);
  if (!c) return null;
  return {
    key: slug,
    src: c.stream.thumbnail,
    name: c.stream.channel.username,
    note: `${formatViewers(c.stream.viewer_count)} watching`,
  };
}

function Frame({ frame }: { frame: StageFrame }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <img src={frame.src} alt="" className="h-full w-full object-cover brightness-125" />
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/90 to-transparent px-3 pb-2 pt-6">
        <span className="size-2 shrink-0 rounded-full bg-red-500" />
        <span className="min-w-0 truncate text-sm font-bold text-white">{frame.name}</span>
        {frame.note && (
          <span className="min-w-0 truncate text-xs text-surface-onSurfaceSecondary">
            {frame.note}
          </span>
        )}
      </div>
    </div>
  );
}

function Stage({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="z-controls absolute inset-0 bg-black">
      <div className="absolute inset-x-0 top-0 flex h-7 items-center justify-center bg-black/70 px-3">
        <span className="truncate text-xs font-semibold uppercase tracking-wide text-white">
          {caption}
        </span>
      </div>
      <div className="h-full w-full pt-7">{children}</div>
    </div>
  );
}

function TankGrid({ raid }: { raid: Raid }) {
  const { act } = useRaid();
  const caption = raid.viewer
    ? "The top ten are in the raid tank. The streamer is looking through them"
    : `Tap a tile to watch it for up to ${TIMING.tankTile} seconds`;

  return (
    <Stage caption={caption}>
      <div className="grid h-full w-full grid-cols-5 grid-rows-2 gap-0.5">
        {raid.candidates.slice(0, 10).map((c) => {
          const frame = frameFor(raid, c.stream.channel.slug);
          return (
            frame && (
              <button
                key={frame.key}
                type="button"
                disabled={raid.viewer}
                onClick={() => act((r) => playTile(r, c.stream.channel.slug))}
                className="relative overflow-hidden"
              >
                <Frame frame={frame} />
              </button>
            )
          );
        })}
      </div>
    </Stage>
  );
}

function TwoUp({ raid, slugs, caption }: { raid: Raid; slugs: string[]; caption: string }) {
  const frames = slugs.map((slug) => frameFor(raid, slug)).filter((f) => f !== null);
  return (
    <Stage caption={caption}>
      <div className="grid h-full w-full grid-cols-2 gap-0.5">
        {frames.map((frame) => (
          <Frame key={frame.key} frame={frame} />
        ))}
      </div>
    </Stage>
  );
}

// Section 5.1: every preview plays in the player, and a stream never renders in the chat
// column. The pitch is two player embeds side by side in the viewer's own browser, so it is
// never a co-stream and never described as one.
export function RaidStage() {
  const { raid, preview } = useRaid();

  if (!raid) {
    const stream = preview ? liveStreamFor(preview) : undefined;
    if (!stream) return null;
    return (
      <Stage caption="Preview">
        <Frame
          frame={{
            key: stream.channel.slug,
            src: stream.thumbnail,
            name: stream.channel.username,
            note: stream.session_title,
          }}
        />
      </Stage>
    );
  }

  if (raid.phase === "tank-pitch")
    return (
      <TwoUp
        raid={raid}
        slugs={[raid.hostSlug, raid.finalists[raid.pitchIndex]]}
        caption="Two players side by side, not a co-stream"
      />
    );

  if (raid.phase === "vote" && raid.poll?.round === 2)
    return <TwoUp raid={raid} slugs={raid.finalists} caption="Chat is voting" />;

  if (raid.phase === "tank-browse" && !raid.stage) return <TankGrid raid={raid} />;

  const staged = raid.stage ? candidateFor(raid, raid.stage) : undefined;
  if (staged) {
    const frame = frameFor(raid, raid.stage!);
    return (
      frame && (
        <Stage
          caption={
            raid.phase === "preview"
              ? `Preview ${raid.previewIndex + 1} of 3, ${staged.reason}`
              : staged.stream.session_title
          }
        >
          <Frame frame={frame} />
        </Stage>
      )
    );
  }

  if (raid.phase === "landed" && raid.targetSlug) {
    const frame = frameFor(raid, raid.targetSlug);
    return frame && <Stage caption="Raid landed"><Frame frame={frame} /></Stage>;
  }

  return null;
}
