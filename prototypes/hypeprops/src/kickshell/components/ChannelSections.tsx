import { Icon } from "../Icon";
import { formatFollowers, type ChannelProfile } from "../mock/api";

// Trimmed from demo/src/kick/components/ChannelSections.tsx: only ChannelAboutCard is
// needed by ChannelShell for the watch page. ChannelHome/Videos/Clips/About pull in
// ClipCard.tsx and mock/clips.ts, which nothing on /plays uses.

// KICK sizes a panel by width and lets the uploaded image set the height. Ours are one shape,
// so the row stays even: 340 wide, the same 340 by 420 box as the panel art.
const panelBox = "h-[420px] w-full max-w-[340px] shrink-0";

export function ChannelAboutCard({ profile }: { profile: ChannelProfile }) {
  const { channel, bio, socials, panels } = profile;

  return (
    <div className="flex flex-col gap-4">
      <section className="flex h-fit grow flex-col gap-2 rounded-lg bg-surface-base p-4 lg:p-6">
        <div className="flex grow items-center justify-between gap-3">
          <div className="flex shrink-0 grow flex-row items-center gap-x-3">
            <div className="flex items-center gap-1 text-base font-bold text-surface-onSurface">
              About {channel.username}
              {channel.verified && (
                <Icon name="verified" className="size-4 shrink-0 text-surface-onSurfacePrimary" />
              )}
            </div>
            <span className="text-sm font-semibold text-surface-onSurfaceSecondary">
              <span className="text-surface-onSurfacePrimary">
                {formatFollowers(channel.followers)}
              </span>{" "}
              Followers
            </span>
          </div>
        </div>

        {socials.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 lg:gap-x-4 lg:gap-y-2">
            {socials.map((s) => (
              <button
                key={s.icon + s.handle}
                type="button"
                className="state-layer-surface flex min-h-9 max-w-[200px] shrink-0 items-center gap-1.5 rounded px-2 text-sm font-semibold text-surface-onSurface"
              >
                <Icon name={s.icon} className="size-4 shrink-0 fill-current" />
                <span className="truncate">{s.handle}</span>
              </button>
            ))}
          </div>
        )}

        <p className="text-sm font-normal leading-5 text-surface-onSurfaceSecondary">{bio}</p>
      </section>

      {panels.length > 0 && (
        <div className="flex flex-row flex-wrap justify-center gap-3">
          {panels.map((p) =>
            p.kind === "image" ? (
              <button key={p.alt} type="button" className={panelBox}>
                <img src={p.art} alt={p.alt} className="h-full w-full rounded-lg object-cover" />
              </button>
            ) : (
              <div
                key={p.title}
                className={`${panelBox} flex flex-col gap-3 overflow-hidden rounded-lg bg-surface-base p-5`}
              >
                <span className="text-sm font-bold uppercase leading-5 tracking-wide text-surface-onSurfacePrimary">
                  {p.title}
                </span>
                <p className="text-base font-normal leading-6 text-surface-onSurfaceSecondary">
                  {p.body}
                </p>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
