import { useNavigate } from 'react-router';
import { Compass, Users } from 'lucide-react';
import { useExpeditions } from '../context/ExpeditionContext';

/** The Kick Expedition tab: every expedition on the platform right now,
 *  boarding or already under way. Joining a boarding one drops you into its
 *  waiting room to watch the departure timer count down; joining one that's
 *  `in-progress` drops you straight into the current stop, mid-journey. */
export function ExpeditionsPage() {
  const { expeditions, join } = useExpeditions();
  const navigate = useNavigate();

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-kick/15 text-kick">
          <Compass size={18} strokeWidth={2.25} />
        </span>
        <div>
          <h1 className="text-lg font-extrabold text-ink-bright">Kick Expeditions</h1>
          <p className="text-xs text-ink-muted">Ride along with other viewers to a new random live streamer every minute.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {expeditions.map((exp) => {
          const full = exp.viewerCount >= exp.maxViewers;
          const firstStop = exp.stops[0];

          return (
            <div
              key={exp.id}
              className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="truncate text-sm font-bold text-ink-bright">{exp.name}</h2>
                {exp.status === 'in-progress' ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-live/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-live">
                    <span className="h-1.5 w-1.5 animate-live-pulse rounded-full bg-live" />
                    Under way
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full border border-line-strong px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-muted">
                    Boarding
                  </span>
                )}
              </div>

              <div className="flex -space-x-2">
                {exp.stops.slice(0, 6).map((card) => (
                  <div
                    key={card.id}
                    title={card.name}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-surface text-[9px] font-black text-page"
                    style={{ backgroundImage: card.gradient }}
                  >
                    {card.name.slice(0, 2).toUpperCase()}
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-ink-muted">
                {exp.status === 'boarding' ? (
                  <>First stop: <span className="font-semibold text-ink">{firstStop.name}</span></>
                ) : (
                  <>Now at: <span className="font-semibold text-ink">{exp.stops[exp.stopIndex].name}</span></>
                )}
              </p>

              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span className="tabular flex items-center gap-1">
                  <Users size={12} strokeWidth={2.5} />
                  {exp.viewerCount}/{exp.maxViewers}
                </span>
                <span className="tabular">
                  {exp.status === 'boarding' ? `Departs in ${exp.secondsRemaining}s` : `Next stop in ${exp.secondsRemaining}s`}
                </span>
              </div>

              <button
                type="button"
                disabled={full}
                onClick={() => {
                  join(exp.id);
                  navigate(`/expedition/${exp.id}`);
                }}
                className={`mt-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                  full ? 'cursor-not-allowed bg-raised text-ink-disabled' : 'bg-kick text-page hover:bg-kick-hover'
                }`}
              >
                {full ? 'Expedition full' : exp.status === 'boarding' ? 'Join expedition' : 'Jump in now'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
