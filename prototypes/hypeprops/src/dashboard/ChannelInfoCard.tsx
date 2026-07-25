import type { KickUser } from '../auth/authStore'
import type { CreatorProfile } from '../data/creatorStats'
import { avatarGradient, avatarInitials } from '../auth/avatar'
import DashboardCard from './DashboardCard'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[13px]">
      <span className="shrink-0 text-kick-muted">{label}</span>
      <span className="min-w-0 truncate text-right font-semibold text-kick-text">{value}</span>
    </div>
  )
}

/** read-only channel summary — editing comes in a later round */
export default function ChannelInfoCard({ user, profile }: { user: KickUser; profile: CreatorProfile | null }) {
  return (
    <DashboardCard title="Channel">
      <div className="mb-3 flex items-center gap-3">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[13px] font-black text-black"
          style={{ backgroundImage: avatarGradient(user.name) }}
        >
          {avatarInitials(user.name)}
        </span>
        <div className="min-w-0 leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[15px] font-bold text-kick-text">{user.name}</span>
            {user.is_verified && (
              <span className="shrink-0 text-[13px] text-kick" title="Verified">
                ✓
              </span>
            )}
          </div>
          <div className="truncate text-[12px] text-kick-muted">kick.com/{profile?.channel_slug ?? user.name.toLowerCase()}</div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Row label="Followers" value={(profile?.follower_count ?? 0).toLocaleString()} />
        <Row label="Category" value={profile ? profile.sessions[0].category : '—'} />
        <Row label="Title" value={profile ? profile.sessions[0].title : '—'} />
        <Row label="Language" value="English" />
        <Row label="Lifetime streamed" value={profile ? `${profile.lifetime_hours_streamed.toLocaleString()}h` : '0h'} />
        <Row
          label="Watch time (30d)"
          value={profile ? `${Math.round(profile.watch_time_minutes_30d / 60).toLocaleString()}h` : '0h'}
        />
      </div>
    </DashboardCard>
  )
}
