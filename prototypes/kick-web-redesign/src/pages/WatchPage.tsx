import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { AnimatePresence } from 'framer-motion';
import { Gift, Heart, Share2, UserPlus, Zap } from 'lucide-react';
import type { StreamCard } from '../types';
import { usePinnedStreams } from '../context/PinnedStreamsContext';
import { useKickBoss } from '../context/KickBossContext';
import { useSettings } from '../context/SettingsContext';
import { useLiveChat } from '../hooks/useLiveChat';
import { useReactionBurst } from '../hooks/useReactionBurst';
import { shouldIgnoreShortcut } from '../keyboard';
import { partyMatesOf } from '../mock/catalog';
import { DAMAGE, BOOST_VIEWER_MULTIPLIER } from '../mock/kickBoss';
import { StreamSurface } from '../components/StreamSurface';
import { AudioFocusButton } from '../components/AudioFocusButton';
import { StreamVideoActions } from '../components/StreamVideoActions';
import { DonatePanel } from '../components/DonatePanel';
import { QuickActionsWidget, type QuickAction } from '../components/QuickActionsWidget';
import { SharePanel } from '../components/SharePanel';
import { PartyMatesPanel } from '../components/PartyMatesPanel';
import { KickBossGlow } from '../components/KickBossGlow';
import { KickBossPanel } from '../components/KickBossPanel';
import { ReactionBurstOverlay } from '../components/ReactionBurstOverlay';
import { Switch } from '../components/Switch';

interface WatchPageProps {
  catalog: StreamCard[];
}

const WATCH_QUICK_ACTIONS: QuickAction[] = [{ id: 'share', label: 'Share', Icon: Share2 }];

function formatViewers(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${count}`;
}

/** The classic streaming-site watch layout: video left, chat right (stacks
 *  on narrow screens). Reached by clicking any stream card, anywhere.
 *
 *  "M" toggles audio and "P" toggles the pin, from anywhere on the page —
 *  except while the chat input has focus, so typing "please" doesn't pin
 *  and unmute the stream mid-sentence. Muting here means remounting the
 *  embed with a new `muted` param (see `StreamSurface`); there's no other
 *  way to reach into a cross-origin player's own volume control.
 *
 *  Donate, Pin, Like and Subscribe sit on the video via `StreamVideoActions`,
 *  and Share fans out from `QuickActionsWidget` — the same components the
 *  Kick Expedition ride uses, so a viewer who hops off an expedition onto a
 *  streamer's own watch page finds the same controls in the same place. */
export function WatchPage({ catalog }: WatchPageProps) {
  const { id } = useParams<{ id: string }>();
  const card = catalog.find((c) => c.id === id);
  const { isPinned, togglePin, canPinMore } = usePinnedStreams();
  const { activeBoss, engage, reportWatching, isBoosted } = useKickBoss();
  const { bossAlertsEnabled, isStreamerOptedOutOfBoss, toggleStreamerBossOptOut } = useSettings();
  const { messages, sendMessage, sendSystemMessage } = useLiveChat(id ?? '');
  const { reactions, spawnReaction, fireworks, spawnFirework } = useReactionBurst();
  const [draft, setDraft] = useState('');
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [shared, setShared] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  /** Disabling Kick Boss alerts opts a viewer out of the feature entirely,
   *  not just the Home nudge — seeing the glow and panel on a stream they
   *  visited for an unrelated reason would still be "getting involved"
   *  unwillingly, per the brief. */
  const boss = bossAlertsEnabled && activeBoss && activeBoss.streamerId === id ? activeBoss : null;

  useEffect(() => {
    if (id) reportWatching(id);
  }, [id, reportWatching]);

  /** The one place "becoming subscribed" happens — reachable from the
   *  video's own Star toggle, the boss panel's Subscribe button, and the
   *  "S" shortcut. All three flip the same `subscribed` flag, so if each
   *  ran its own copy of this logic, whichever fired first would leave the
   *  other two silently unable to ever deal boss damage (their own
   *  `if (subscribed) return` guard would already be true). Routing all
   *  three through this one function means the message and the damage
   *  happen exactly once, regardless of which control the viewer used.
   *  Gets a firework instead of the usual bubble — subscribing is a bigger
   *  commitment than a like or a follow, so it earns a bigger moment. */
  const subscribeNow = () => {
    if (!card || subscribed) return;
    setSubscribed(true);
    sendSystemMessage(`you subscribed to ${card.name}`);
    spawnFirework();
    if (boss?.status === 'active') engage(card.id, DAMAGE.subscribe);
  };

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    setMuted(true);
    setLiked(false);
    setSubscribed(false);
    setFollowed(false);
    setShared(false);
  }, [id]);

  useEffect(() => {
    if (!card) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (shouldIgnoreShortcut(e)) return;
      if (e.key === 'm' || e.key === 'M') {
        setMuted((m) => !m);
      } else if (e.key === 'p' || e.key === 'P') {
        togglePin(card!.id);
      } else if (boss?.status === 'active' && (e.key === 'l' || e.key === 'L')) {
        engage(card!.id, DAMAGE.like);
      } else if (boss?.status === 'active' && (e.key === 'f' || e.key === 'F')) {
        if (!followed) {
          setFollowed(true);
          engage(card!.id, DAMAGE.follow);
        }
      } else if (boss?.status === 'active' && (e.key === 's' || e.key === 'S')) {
        subscribeNow();
      } else if (boss?.status === 'active' && (e.key === 'g' || e.key === 'G')) {
        setDonateOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [card, togglePin, boss, followed, subscribed, engage, sendSystemMessage]);

  if (!card) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-ink-muted">That stream doesn't exist.</p>
        <Link to="/" className="text-sm font-semibold text-kick">
          Back to Home
        </Link>
      </div>
    );
  }

  const partyMates = partyMatesOf(card, catalog);
  const bossHpPercent = boss ? boss.hp / boss.maxHp : 1;
  const bossGlowVariant = boss?.status === 'defeated' ? 'victory' : bossHpPercent <= 0.25 ? 'critical' : 'active';
  const boosted = isBoosted(card.id);
  const displayedViewerCount = boosted ? Math.round(card.viewerCount * BOOST_VIEWER_MULTIPLIER) : card.viewerCount;

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {boss && boss.status !== 'escaped' && <KickBossGlow variant={bossGlowVariant} />}

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative aspect-video w-full shrink-0 bg-surface lg:aspect-auto lg:flex-1">
          <StreamSurface card={card} muted={muted} size="player" interactive playing />
          <ReactionBurstOverlay reactions={reactions} fireworks={fireworks} />
          <AudioFocusButton
            isAudioActive={!muted}
            streamName={card.name}
            onFocus={() => setMuted((m) => !m)}
            className="absolute bottom-3 right-3"
          />
          <StreamVideoActions
            current={card}
            liked={liked}
            onToggleLike={() => {
              if (!liked) spawnReaction(Heart, 'text-kick');
              setLiked((l) => !l);
            }}
            subscribed={subscribed}
            onToggleSubscribe={() => (subscribed ? setSubscribed(false) : subscribeNow())}
            pinned={isPinned(card.id)}
            canPinMore={canPinMore}
            onTogglePin={() => togglePin(card.id)}
            onOpenDonate={() => setDonateOpen(true)}
          />
          <QuickActionsWidget
            actions={WATCH_QUICK_ACTIONS}
            renderPanel={(actionId, close) =>
              actionId === 'share' ? (
                <SharePanel
                  key="share"
                  title="Share this stream"
                  url={`https://kick.com/${card.id}`}
                  onClose={close}
                  onCopied={() => spawnReaction(Share2, 'text-info')}
                />
              ) : null
            }
          />
        </div>

        <div className="flex items-start justify-between gap-3 border-b border-line p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-black text-page"
              style={{ backgroundImage: card.gradient }}
            >
              {card.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-extrabold text-ink-bright">{card.name}</h1>
              <p className="truncate text-xs text-ink-muted">
                {card.category} · <span className="tabular">{formatViewers(displayedViewerCount)} viewers</span>
                {boosted && (
                  <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-kick/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-kick">
                    <Zap size={10} strokeWidth={2.5} />
                    Boosted
                  </span>
                )}
              </p>
            </div>
          </div>

          <label className="flex shrink-0 items-center gap-2 text-[11px] text-ink-muted">
            Kick Boss on this channel
            <Switch
              checked={!isStreamerOptedOutOfBoss(card.id)}
              onChange={() => toggleStreamerBossOptOut(card.id)}
              label="Allow Kick Boss on this channel"
            />
          </label>
        </div>

        {boosted && (
          <p className="border-b border-line bg-kick/5 px-4 py-2 text-[11px] text-ink-muted">
            <Zap size={11} strokeWidth={2.5} className="mr-1 inline text-kick" />
            This stream is getting a temporary visibility boost — a viewer left to help fight a boss elsewhere.
          </p>
        )}

        {partyMates.length > 0 && (
          <div className="border-b border-line p-4">
            <PartyMatesPanel card={card} mates={partyMates} />
          </div>
        )}
      </div>

      <div className="flex w-full shrink-0 flex-col border-line lg:h-full lg:w-80 lg:border-l">
        {boss && (
          <KickBossPanel
            boss={boss}
            onEngage={(damage) => engage(card.id, damage)}
            onLike={() => spawnReaction(Heart, 'text-kick')}
            onOpenDonate={() => setDonateOpen(true)}
            followed={followed}
            onFollow={() => {
              setFollowed(true);
              spawnReaction(UserPlus, 'text-kick');
            }}
            subscribed={subscribed}
            onSubscribe={subscribeNow}
            shared={shared}
            onShare={() => {
              setShared(true);
              spawnReaction(Share2, 'text-info');
            }}
          />
        )}
        <div ref={listRef} className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3">
          {messages.map((m) =>
            m.system ? (
              <div key={m.id} className="text-center text-[11px] italic text-ink-muted">
                {m.text}
              </div>
            ) : (
              <div key={m.id} className="text-xs leading-relaxed">
                <span className={`font-bold ${m.viewerName === 'you' ? 'text-kick' : 'text-ink'}`}>{m.viewerName}</span>
                <span className="text-ink-muted">: </span>
                <span className="text-ink-bright">{m.text}</span>
              </div>
            )
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(draft);
            if (boss?.status === 'active' && draft.trim()) engage(card.id, DAMAGE.chat);
            setDraft('');
          }}
          className="flex shrink-0 items-center gap-2 border-t border-line p-2"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Send a message"
            className="min-w-0 flex-1 rounded-full border border-line bg-surface px-3 py-2 text-xs text-ink-bright placeholder:text-ink-muted focus:border-kick focus:outline-none"
          />
          <button type="submit" className="shrink-0 rounded-full bg-kick px-3 py-2 text-xs font-bold text-page">
            Send
          </button>
        </form>
      </div>

      <AnimatePresence>
        {donateOpen && (
          <DonatePanel
            key="donate"
            streamerName={card.name}
            onDonate={(amount) => {
              sendSystemMessage(`you gifted ${amount} Kicks to ${card.name}`);
              spawnReaction(Gift, 'text-kick');
              if (boss?.status === 'active') engage(card.id, DAMAGE.donate(amount));
            }}
            onClose={() => setDonateOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
