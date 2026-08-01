import { useState } from "react";
import { Icon } from "../Icon";
import { formatViewers } from "../mock/api";
import { findHandle, recommendationsFor, tankCandidates, type Candidate } from "../mock/raids";
import { useRaid } from "../raid/RaidProvider";
import { MIN_HOST_VIEWERS, type RaidMode } from "../raid/machine";

const modes: { id: RaidMode; label: string; blurb: string; action: string }[] = [
  {
    id: "random",
    label: "Random",
    blurb: "One channel, rolled from your recommendations. No preview, no vote, straight to the countdown.",
    action: "Roll and raid",
  },
  {
    id: "pick",
    label: "Pick",
    blurb: "Take one of the top three, or type an exact handle. Chat is not involved.",
    action: "Raid",
  },
  {
    id: "chat",
    label: "Let chat pick",
    blurb: "The top three play in the player, 30 seconds each. The poll opens when the last preview ends.",
    action: "Let chat pick",
  },
  {
    id: "tank",
    label: "Raid tank",
    blurb: "Chat picks two of your top ten, both creators pitch for 60 seconds, then chat votes the winner.",
    action: "Open the raid tank",
  },
];

function Row({
  candidate,
  selected,
  onSelect,
}: {
  candidate: Candidate;
  selected: boolean;
  onSelect: () => void;
}) {
  const { channel, viewer_count, category } = candidate.stream;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded border p-2 text-left transition-colors ${
        selected
          ? "border-primary-base bg-surface-highest"
          : "border-outline-decorative betterhover:hover:bg-surface-highest"
      }`}
    >
      <img src={channel.avatar} alt="" className="size-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold text-white">{channel.username}</span>
          {channel.verified && <Icon name="verified" className="size-3.5 shrink-0" />}
        </div>
        <span className="block truncate text-sm text-surface-onSurfaceSecondary">
          {candidate.reason}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="flex items-center gap-1 text-sm font-semibold text-white">
          <span className="size-2 rounded-full bg-red-500" />
          {formatViewers(viewer_count)}
        </span>
        <span className="text-xs text-surface-onSurfaceSecondary">{category.name}</span>
      </div>
    </button>
  );
}

function PickBody({
  candidates,
  picked,
  onPick,
}: {
  candidates: Candidate[];
  picked: string | null;
  onPick: (slug: string | null) => void;
}) {
  const [handle, setHandle] = useState("");
  const result = handle.trim() ? findHandle(handle) : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {candidates.slice(0, 3).map((c) => (
          <Row
            key={c.stream.channel.slug}
            candidate={c}
            selected={picked === c.stream.channel.slug}
            onSelect={() => onPick(c.stream.channel.slug)}
          />
        ))}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-surface-onSurfaceSecondary">
          Or type an exact handle
        </span>
        <input
          value={handle}
          onChange={(e) => {
            setHandle(e.target.value);
            const found = findHandle(e.target.value);
            onPick(found.found && found.live ? found.stream.channel.slug : null);
          }}
          placeholder="username"
          className="h-10 rounded border-2 border-neutral-700 bg-surface-lowest px-3 text-sm text-white outline-none focus:border-primary-base"
        />
      </label>

      {result?.found === false && (
        <span className="text-sm text-surface-onSurfaceSecondary">No channel with that handle.</span>
      )}
      {result?.found && !result.live && (
        <div className="flex items-center gap-3 rounded border border-outline-decorative p-2">
          <img src={result.avatar} alt="" className="size-10 shrink-0 rounded-full grayscale" />
          <span className="flex-1 text-sm font-bold text-white">{result.username}</span>
          <span className="rounded-full bg-secondary-base px-2 py-1 text-xs font-semibold uppercase text-secondary-onSecondary">
            Offline
          </span>
        </div>
      )}
    </div>
  );
}

export function RaidDialog() {
  const { dialog, dismissDialog, start, hostViewers, hostSlug, preview, setPreview } = useRaid();
  const [mode, setMode] = useState<RaidMode>("pick");
  const [picked, setPicked] = useState<string | null>(null);

  if (!dialog) return null;

  const all = recommendationsFor(hostSlug, hostViewers);
  const candidates = mode === "tank" ? tankCandidates(all) : all;
  const enough = hostViewers >= MIN_HOST_VIEWERS;
  const current = modes.find((m) => m.id === mode)!;
  const pickedCandidate = candidates.find((c) => c.stream.channel.slug === picked);
  const ready = enough && (mode !== "pick" || Boolean(picked));
  const action =
    mode === "pick" && pickedCandidate
      ? `Raid ${pickedCandidate.stream.channel.username}`
      : current.action;

  function choose(slug: string | null) {
    setPicked(slug);
    setPreview(slug);
  }

  return (
    <div className="z-popover fixed inset-0 flex items-center justify-center bg-surfaceOverlay-base p-4">
      <div className="flex max-h-full w-full max-w-[520px] flex-col overflow-hidden rounded-lg bg-surface-base">
        <div className="flex items-start justify-between gap-4 border-b-2 border-outline-decorative p-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold leading-5 text-white">
              {dialog === "end" ? "Send your viewers somewhere" : "Raid another channel"}
            </h2>
            <span className="text-sm text-surface-onSurfaceSecondary">
              {dialog === "end"
                ? "Your stream is ending. Hand your chat to a live creator."
                : "Hand your chat to a live creator without ending your stream."}
            </span>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={dismissDialog}
            className="state-layer-surface flex size-8 shrink-0 items-center justify-center rounded text-white"
          >
            <Icon name="close" className="size-3.5" />
          </button>
        </div>

        <div className="flex gap-1 p-4 pb-0">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={!enough}
              onClick={() => setMode(m.id)}
              className={`h-9 flex-1 rounded text-sm font-semibold transition-colors disabled:text-disabled-onSurface ${
                m.id === mode
                  ? "bg-secondary-base text-white"
                  : "bg-transparent text-surface-onSurfaceSecondary betterhover:hover:bg-surface-highest"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto p-4">
          {!enough ? (
            <p className="text-sm leading-6 text-surface-onSurfaceSecondary">
              A raid needs at least {MIN_HOST_VIEWERS} viewers. You have{" "}
              {formatViewers(hostViewers)}, so the raid controls stay off until more people
              arrive.
            </p>
          ) : (
            <>
              <p className="text-sm leading-6 text-surface-onSurfaceSecondary">{current.blurb}</p>
              {mode === "pick" && (
                <PickBody candidates={candidates} picked={picked} onPick={choose} />
              )}
              {mode === "chat" && (
                <div className="flex flex-col gap-2">
                  {candidates.slice(0, 3).map((c) => (
                    <Row
                      key={c.stream.channel.slug}
                      candidate={c}
                      selected={preview === c.stream.channel.slug}
                      onSelect={() => setPreview(c.stream.channel.slug)}
                    />
                  ))}
                </div>
              )}
              {mode === "tank" && (
                <div className="flex flex-col gap-2">
                  {candidates.slice(0, 10).map((c) => (
                    <Row
                      key={c.stream.channel.slug}
                      candidate={c}
                      selected={false}
                      onSelect={() => setPreview(c.stream.channel.slug)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t-2 border-outline-decorative p-4">
          <button
            type="button"
            disabled={!ready}
            onClick={() => {
              setPreview(null);
              start(mode, picked ?? undefined);
            }}
            className="state-layer-base h-11 w-full rounded bg-primary-base text-base font-semibold text-primary-onPrimary disabled:bg-disabled-base disabled:text-disabled-onSurface"
          >
            {action}
          </button>
          <button
            type="button"
            onClick={dismissDialog}
            className="h-9 w-full rounded text-sm font-semibold text-surface-onSurfaceSecondary betterhover:hover:text-white"
          >
            {dialog === "end" ? "End without raiding" : "Not now"}
          </button>
        </div>
      </div>
    </div>
  );
}
