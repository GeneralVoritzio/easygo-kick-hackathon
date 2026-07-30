import { Link } from "react-router-dom";
import { Icon } from "../Icon";
import { currentUser, formatViewers, liveStreamFor } from "../mock/api";
import { useRaid } from "../raid/RaidProvider";
import { TIMING } from "../raid/machine";
import { inviteIsDecided, type ShowdownInvite as Invite } from "../raid/invite";

const TOTAL: Record<Invite["phase"], number> = {
  pending: TIMING.accept,
  waiting: TIMING.accept,
  pitching: TIMING.pitch,
  won: 10,
  lost: 10,
  declined: 10,
};

function Ring({ seconds, total }: { seconds: number; total: number }) {
  const size = 44;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(1, seconds / total)));

  return (
    <div className="relative grid size-11 shrink-0 place-items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none" className="stroke-surface-highest" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-primary-base transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      <span className="text-sm font-bold tabular-nums text-white">{seconds}</span>
    </div>
  );
}

function ChannelLine({ slug, note }: { slug: string; note: string }) {
  const stream = liveStreamFor(slug);
  if (!stream) return null;
  return (
    <div className="flex items-center gap-2">
      <img src={stream.channel.avatar} alt="" className="size-8 shrink-0 rounded-full" />
      <div className="min-w-0 leading-tight">
        <div className="flex items-center gap-1 truncate text-sm font-bold text-white">
          {stream.channel.username}
          {stream.channel.verified && <Icon name="verified" className="size-3.5 shrink-0" />}
        </div>
        <div className="truncate text-xs text-surface-onSurfaceSecondary">{note}</div>
      </div>
    </div>
  );
}

// Section 4.4 from the other side. A streamer who is put in a showdown decides here, and nowhere
// else: the host's room runs the vote, this room only answers the invite and hears the result.
export function ShowdownInvite() {
  const { invite, answerInvite, clearInvite } = useRaid();
  if (!invite) return null;

  const host = liveStreamFor(invite.hostSlug);
  const hostName = host?.channel.username ?? invite.hostSlug;
  const opponent = liveStreamFor(invite.opponentSlug);
  const opponentName = opponent?.channel.username ?? invite.opponentSlug;
  const decided = inviteIsDecided(invite);

  const title =
    invite.phase === "pending"
      ? `${hostName} put you in a showdown`
      : invite.phase === "waiting"
        ? "You are in the showdown"
        : invite.phase === "pitching"
          ? "Your pitch is live"
          : invite.phase === "won"
            ? "You won the showdown"
            : invite.phase === "lost"
              ? `${opponentName} won the showdown`
              : invite.timedOut
                ? "The invite ran out"
                : "You turned it down";

  const body =
    invite.phase === "pending" ? (
      <>
        Their chat votes between you and {opponentName}. Win it and{" "}
        <span className="font-semibold text-white">
          {formatViewers(invite.hostViewers)} viewers
        </span>{" "}
        land on {currentUser.username}. You get {TIMING.pitch} seconds to say why you deserve them.
      </>
    ) : invite.phase === "waiting" ? (
      <>
        {hostName} is lining the pitches up. Keep streaming: their chat is about to meet you, and
        your own room carries on either way.
      </>
    ) : invite.phase === "pitching" ? (
      <>
        Say why this room should come to you. {hostName} shows you next to their own stream, so talk
        to their chat, not to yours.
      </>
    ) : invite.phase === "won" ? (
      <>
        {hostName} is sending {formatViewers(invite.hostViewers)} viewers your way. They arrive when
        the countdown in their room ends.
      </>
    ) : invite.phase === "lost" ? (
      <>Their chat went with {opponentName}. Nothing changes here, and your stream carries on.</>
    ) : invite.timedOut ? (
      <>
        Nobody was put on the spot: an invite with no answer lapses, so {hostName} carried on without
        you.
      </>
    ) : (
      <>
        {hostName} carried on without you. Turn showdowns off in{" "}
        <Link to="/settings/preferences" className="text-primary-base underline-offset-2 hover:underline">
          Settings
        </Link>{" "}
        if you would rather not be asked again.
      </>
    );

  return (
    <div className="z-popover fixed right-4 top-[calc(var(--navbar-height)+1rem)] flex w-[360px] flex-col gap-3 rounded-lg border border-outline-decorative bg-surface-base p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-primary-base">
            <span className="size-1.5 animate-pulse-fast rounded-full bg-primary-base" />
            Showdown
          </div>
          <h2 className="truncate text-base font-bold leading-6 text-white">{title}</h2>
        </div>
        {decided ? (
          <button
            type="button"
            onClick={clearInvite}
            aria-label="Dismiss"
            className="state-layer-surface grid size-8 shrink-0 place-items-center rounded text-surface-onSurfaceSecondary"
          >
            <Icon name="close" className="size-3" />
          </button>
        ) : (
          <Ring seconds={invite.seconds} total={TOTAL[invite.phase]} />
        )}
      </div>

      {invite.phase === "pending" && (
        <div className="flex flex-col gap-2 rounded border border-outline-decorative bg-surface-highest p-3">
          <ChannelLine slug={invite.hostSlug} note={`${formatViewers(invite.hostViewers)} watching`} />
          <div className="flex items-center gap-2 pl-2 text-xs font-semibold text-surface-onSurfaceSecondary">
            <Icon name="chevron-right" className="size-3 shrink-0 rotate-90" />
            you against
          </div>
          <ChannelLine
            slug={invite.opponentSlug}
            note={opponent ? `${formatViewers(opponent.viewer_count)} watching` : ""}
          />
        </div>
      )}

      <p className="text-xs leading-relaxed text-surface-onSurfaceSecondary">{body}</p>

      {invite.phase === "pending" && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => answerInvite(true)}
            className="state-layer-base h-9 flex-1 rounded bg-primary-base text-sm font-semibold text-primary-onPrimary"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => answerInvite(false)}
            className="state-layer-surface h-9 flex-1 rounded border border-outline-decorative text-sm font-semibold text-white"
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
}
