import { useKickPassport } from '@shared/hooks/useKickPassport';
import { CardCabinet } from './CardCabinet';

/** The user's profile — a record of communities joined and moments
 *  collected, a passport rather than just a follow list. Reached by
 *  clicking the profile avatar in the site header. */
export function ProfilePage() {
  const { passport, loading } = useKickPassport();

  if (loading || !passport) {
    return <p className="text-sm text-ink">Loading profile…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-xl border border-line bg-surface p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-kick/10 text-2xl font-extrabold text-kick">
          {passport.handle.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Kick Passport</span>
          <h2 className="text-lg font-extrabold text-ink-bright">@{passport.handle}</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            <span className="tabular-score font-bold text-ink-bright">{passport.communitiesJoined}</span> communities ·{' '}
            <span className="tabular-score font-bold text-ink-bright">{passport.cards.length}</span> cards earned
          </p>
        </div>
      </div>

      <CardCabinet cards={passport.cards} />
    </div>
  );
}
