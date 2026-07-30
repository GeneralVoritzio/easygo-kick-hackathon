import type { Candidate } from "../mock/raids";
import type { Raid } from "../raid/machine";
import { CountdownRing } from "./RaidChat";
import { Frame, frameFor } from "./RaidStage";

// Shared by chat pick's preview and a showdown tile once picked off the grid, so both land the
// same way: host left, the pick right, a timer on the pick. Section 5.1.
export function RaidPreviewSplit({ raid, candidate, total }: { raid: Raid; candidate: Candidate; total: number }) {
  const hostFrame = frameFor(raid, raid.hostSlug);
  const previewFrame = frameFor(raid, candidate.stream.channel.slug);

  return (
    <div className="animate-pick-reveal z-controls absolute inset-0 bg-black">
      <div className="grid h-full w-full grid-cols-2 gap-0.5">
        <div className="relative overflow-hidden">{hostFrame && <Frame frame={hostFrame} />}</div>

        <div className="relative overflow-hidden">
          {previewFrame && <Frame frame={previewFrame} />}

          <span className="pointer-events-none absolute left-2 top-2 size-5 border-l-[3px] border-t-[3px] border-primary-base" />
          <span className="pointer-events-none absolute right-2 top-2 size-5 border-r-[3px] border-t-[3px] border-primary-base" />
          <span className="pointer-events-none absolute bottom-2 left-2 size-5 border-b-[3px] border-l-[3px] border-primary-base" />
          <span className="pointer-events-none absolute bottom-2 right-2 size-5 border-b-[3px] border-r-[3px] border-primary-base" />

          <div className="pointer-events-none absolute left-1/2 top-2 flex size-9 shrink-0 -translate-x-1/2 items-center justify-center">
            <CountdownRing seconds={raid.seconds} total={total} size={36} />
            <span className="relative text-[11px] font-black tabular-nums text-white">{raid.seconds}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
