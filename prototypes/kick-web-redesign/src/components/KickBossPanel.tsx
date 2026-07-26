import { useEffect, useState } from 'react';
import { Flame, Gift, Heart, Share2, Skull, Star, UserPlus } from 'lucide-react';
import type { KickBoss } from '../types';
import { DAMAGE } from '../mock/kickBoss';

interface KickBossPanelProps {
  boss: KickBoss;
  onEngage: (damage: number) => void;
  /** Purely cosmetic — the reaction-burst animation. Separate from
   *  `onEngage` because Like has no other hook point: it deals damage
   *  directly on every tap, with nothing upstream to piggyback a visual
   *  effect on the way `subscribeNow` or the Donate picker do. */
  onLike?: () => void;
  onOpenDonate: () => void;
  followed: boolean;
  onFollow: () => void;
  subscribed: boolean;
  /** Unlike `onFollow`/`onShare`, this is the *only* thing to call — it
   *  must already deal the boss damage itself. Subscribe is reachable from
   *  more than one control (this panel, and the stream's own Star toggle),
   *  so the page owns one shared "you just subscribed" handler that both
   *  go through, rather than each dealing damage separately and risking a
   *  double hit. */
  onSubscribe: () => void;
  shared: boolean;
  onShare: () => void;
}

const LIKE_COOLDOWN_MS = 1200;

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="tabular ml-1 rounded border border-line-strong bg-page/60 px-1 text-[9px] font-semibold text-ink-muted">
      {children}
    </kbd>
  );
}

/** The special control panel that appears above chat the moment a Kick
 *  Boss or Kick Monster is live on this streamer — every button here is
 *  also reachable by keyboard (see the shortcut hints, wired in
 *  `WatchPage`/`ExpeditionPage`), since the brief asks for both. Like is a
 *  repeatable smash button on its own short cooldown; Follow, Subscribe
 *  and Share are one-shot per fight, same as the real actions they stand
 *  in for. Chat isn't a button here at all — every message sent in the
 *  regular chat box already counts, so fighting never competes with
 *  talking. */
export function KickBossPanel({
  boss,
  onEngage,
  onLike,
  onOpenDonate,
  followed,
  onFollow,
  subscribed,
  onSubscribe,
  shared,
  onShare,
}: KickBossPanelProps) {
  const [likeReady, setLikeReady] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.ceil((boss.expiresAt - Date.now()) / 1000)));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((boss.expiresAt - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [boss.expiresAt]);

  const Icon = boss.kind === 'boss' ? Skull : Flame;
  const hpPercent = Math.max(0, Math.round((boss.hp / boss.maxHp) * 100));

  const handleLike = () => {
    if (!likeReady) return;
    onEngage(DAMAGE.like);
    onLike?.();
    setLikeReady(false);
    window.setTimeout(() => setLikeReady(true), LIKE_COOLDOWN_MS);
  };

  const handleFollow = () => {
    if (followed) return;
    onFollow();
    onEngage(DAMAGE.follow);
  };

  const handleSubscribe = () => {
    if (subscribed) return;
    onSubscribe();
  };

  const handleShare = () => {
    if (shared) return;
    onShare();
    onEngage(DAMAGE.share);
  };

  if (boss.status !== 'active') {
    return (
      <div className="border-b border-line bg-live/5 p-3 text-center">
        <p className={`text-sm font-bold ${boss.status === 'defeated' ? 'text-kick' : 'text-ink-muted'}`}>
          {boss.status === 'defeated' ? `${boss.name} defeated!` : `${boss.name} escaped.`}
        </p>
      </div>
    );
  }

  return (
    <div className="border-b border-line bg-live/10 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-live">
          <Icon size={14} strokeWidth={2.5} />
          {boss.name}
        </span>
        <span className="tabular text-[11px] font-semibold text-ink-muted">Escaping in {secondsLeft}s</span>
      </div>

      <div className="mb-3 h-2.5 overflow-hidden rounded-full bg-raised">
        <div className="h-full rounded-full bg-live transition-[width] duration-500" style={{ width: `${hpPercent}%` }} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={handleLike}
          disabled={!likeReady}
          className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-colors ${
            likeReady ? 'border-line bg-raised text-ink-bright hover:bg-overlay' : 'border-line bg-raised text-ink-disabled'
          }`}
        >
          <Heart size={12} strokeWidth={2.5} />
          Like
          <Kbd>L</Kbd>
        </button>

        <button
          type="button"
          onClick={handleFollow}
          disabled={followed}
          className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-colors ${
            followed ? 'border-live/50 bg-live/15 text-live' : 'border-line bg-raised text-ink-bright hover:bg-overlay'
          }`}
        >
          <UserPlus size={12} strokeWidth={2.5} />
          {followed ? 'Followed' : 'Follow'}
          <Kbd>F</Kbd>
        </button>

        <button
          type="button"
          onClick={handleSubscribe}
          disabled={subscribed}
          className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-colors ${
            subscribed ? 'border-live/50 bg-live/15 text-live' : 'border-line bg-raised text-ink-bright hover:bg-overlay'
          }`}
        >
          <Star size={12} strokeWidth={2.5} />
          {subscribed ? 'Subscribed' : 'Subscribe'}
          <Kbd>S</Kbd>
        </button>

        <button
          type="button"
          onClick={onOpenDonate}
          className="flex items-center gap-1 rounded-lg border border-line bg-raised px-2 py-1.5 text-[11px] font-bold text-ink-bright transition-colors hover:bg-overlay"
        >
          <Gift size={12} strokeWidth={2.5} />
          Donate
          <Kbd>G</Kbd>
        </button>

        <button
          type="button"
          onClick={handleShare}
          disabled={shared}
          className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-colors ${
            shared ? 'border-live/50 bg-live/15 text-live' : 'border-line bg-raised text-ink-bright hover:bg-overlay'
          }`}
        >
          <Share2 size={12} strokeWidth={2.5} />
          {shared ? 'Shared' : 'Share'}
        </button>
      </div>

      <p className="mt-2 text-[11px] text-ink-muted">Every chat message helps too.</p>
    </div>
  );
}
