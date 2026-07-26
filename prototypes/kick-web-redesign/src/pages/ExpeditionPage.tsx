import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { AnimatePresence } from 'framer-motion';
import { Compass, Gift, Heart, History, LogOut, Share2, UserPlus } from 'lucide-react';
import { useExpeditions } from '../context/ExpeditionContext';
import { usePinnedStreams } from '../context/PinnedStreamsContext';
import { useKickBoss } from '../context/KickBossContext';
import { useSettings } from '../context/SettingsContext';
import { useExplorerChat } from '../hooks/useExplorerChat';
import { useReactionBurst } from '../hooks/useReactionBurst';
import { shouldIgnoreShortcut } from '../keyboard';
import { DAMAGE } from '../mock/kickBoss';
import { KICK_VOTE_DURATION_SECONDS, randomKickVoteTarget } from '../mock/expeditions';
import { StreamSurface } from '../components/StreamSurface';
import { AudioFocusButton } from '../components/AudioFocusButton';
import { StreamVideoActions } from '../components/StreamVideoActions';
import { DonatePanel } from '../components/DonatePanel';
import { QuickActionsWidget, type QuickAction } from '../components/QuickActionsWidget';
import { SharePanel } from '../components/SharePanel';
import { ExpeditionRecapPanel } from '../components/ExpeditionRecapPanel';
import { KickBossGlow } from '../components/KickBossGlow';
import { KickBossPanel } from '../components/KickBossPanel';
import { KickVotePanel } from '../components/KickVotePanel';
import { ReactionBurstOverlay } from '../components/ReactionBurstOverlay';

const EXPEDITION_QUICK_ACTIONS: QuickAction[] = [
  { id: 'share', label: 'Share', Icon: Share2 },
  { id: 'recap', label: 'Recap', Icon: History },
];

interface KickVoteState {
  targetName: string;
  yes: number;
  no: number;
  endsAt: number;
  myVote: 'yes' | 'no' | null;
  resolved: boolean;
}

/** The ride itself. Boarding shows the departure countdown and the first
 *  stop as a preview, not yet playing — matching the lobby tab's "Departs
 *  in Xs." Once under way, every stop gets a real ~1-minute watch with its
 *  own countdown to the next one, and every departure holds on a transit
 *  screen for a couple of seconds rather than cutting straight to the next
 *  video. "Stay here" hops off the expedition and lands on that streamer's
 *  own watch page and main chat, per the brief. */
export function ExpeditionPage() {
  const { id } = useParams<{ id: string }>();
  const { expeditions, riderExpeditionId, join, hopOff, currentStop } = useExpeditions();
  const { isPinned, togglePin, canPinMore } = usePinnedStreams();
  const { activeBoss, engage } = useKickBoss();
  const { bossAlertsEnabled } = useSettings();
  const navigate = useNavigate();

  const expedition = expeditions.find((e) => e.id === id);
  const stops = expedition?.stops ?? [];
  const status = expedition?.status ?? 'boarding';
  const stopIndex = expedition?.stopIndex ?? 0;
  const current = expedition ? currentStop(expedition) : undefined;
  const displayName = status === 'boarding' ? (stops[0]?.name ?? '') : (current?.name ?? '');
  const stageKey = status === 'boarding' ? 'boarding' : `stop-${stopIndex}`;

  const { messages, sendMessage, sendSystemMessage } = useExplorerChat(id ?? '', stageKey, displayName);
  const { reactions, spawnReaction, fireworks, spawnFirework } = useReactionBurst();

  const [muted, setMuted] = useState(true);
  const [likedStopIds, setLikedStopIds] = useState<Set<string>>(new Set());
  const [subscribedIds, setSubscribedIds] = useState<Set<string>>(new Set());
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [sharedIds, setSharedIds] = useState<Set<string>>(new Set());
  const [donateOpen, setDonateOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [kickVote, setKickVoteState] = useState<KickVoteState | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const kickVoteRef = useRef<KickVoteState | null>(null);

  const boss = bossAlertsEnabled && activeBoss && current && activeBoss.streamerId === current.id ? activeBoss : null;

  /** Same ref-plus-state pattern `KickBossContext` uses for the same
   *  reason: the vote's tick and its resolution both need to read the
   *  latest value from inside a `setInterval` callback, and calling
   *  `sendSystemMessage` from inside a `setState` updater (instead of the
   *  interval body directly) is exactly the impurity that duplicated a
   *  chat line the first time this bit us. */
  const setKickVote = (vote: KickVoteState | null) => {
    kickVoteRef.current = vote;
    setKickVoteState(vote);
  };

  /** The one place "becoming subscribed" happens for the current stop —
   *  see the identical note in `WatchPage`. Reachable from the video's own
   *  Star toggle, the boss panel's Subscribe button, and the "S" shortcut,
   *  all sharing the same `subscribedIds` set, so exactly one of them may
   *  own the message + damage side effects. Gets a firework instead of the
   *  usual bubble, same reasoning as `WatchPage`. */
  const subscribeNow = () => {
    if (!current || subscribedIds.has(current.id)) return;
    setSubscribedIds((prev) => new Set(prev).add(current.id));
    sendSystemMessage(`you subscribed to ${current.name}`);
    spawnFirework();
    if (boss?.status === 'active') engage(current.id, DAMAGE.subscribe);
  };

  /** Switching your vote moves your one tally from the old choice to the
   *  new one instead of being blocked outright — you can change your mind
   *  as many times as you like before the clock runs out. */
  const castVote = (choice: 'yes' | 'no') => {
    const currentVote = kickVoteRef.current;
    if (!currentVote || currentVote.resolved || currentVote.myVote === choice) return;
    let { yes, no } = currentVote;
    if (currentVote.myVote === 'yes') yes -= 1;
    else if (currentVote.myVote === 'no') no -= 1;
    if (choice === 'yes') yes += 1;
    else no += 1;
    setKickVote({ ...currentVote, myVote: choice, yes, no });
  };

  /** Announces the outcome — called either when the clock genuinely runs
   *  out, or when a stop change is about to replace the vote early. A vote
   *  that never posts a result would leave whoever just clicked "Vote to
   *  kick" with no feedback at all, so every vote gets one. A "kicked"
   *  outcome names a real destination pulled from this same expedition's
   *  own stops, so it reads as an actual consequence rather than a line
   *  that changes nothing. */
  const resolveVote = (vote: KickVoteState) => {
    const kicked = vote.yes > vote.no;
    if (kicked) {
      const destination = stops[Math.floor(Math.random() * stops.length)];
      sendSystemMessage(`🥾 ${vote.targetName} has been kicked off the expedition and dropped into ${destination.name}'s stream!`);
    } else {
      sendSystemMessage(`${vote.targetName} survives the vote.`);
    }
  };

  /** `resolveVote` closes over `sendSystemMessage`, which `useExplorerChat`
   *  returns as a new function every render — Explorer Chat itself re-renders
   *  every 1-3s from the ambient message generator. The resolution interval
   *  below must survive across those renders without being torn down, so it
   *  reaches into this ref for the latest `resolveVote` instead of taking it
   *  as a dependency. */
  const resolveVoteRef = useRef(resolveVote);
  resolveVoteRef.current = resolveVote;

  /** A fresh Kick Vote starts the moment a new stop begins (never while
   *  boarding — there's no crowd to vote yet). If the previous vote hadn't
   *  resolved yet — the stop can end before `KICK_VOTE_DURATION_SECONDS`
   *  does — it's resolved right now instead of silently discarded. */
  useEffect(() => {
    const previous = kickVoteRef.current;
    if (previous && !previous.resolved) resolveVote(previous);

    if (status === 'boarding') {
      setKickVote(null);
      return;
    }
    setKickVote({
      targetName: randomKickVoteTarget(),
      yes: 1 + Math.floor(Math.random() * 3),
      no: 1 + Math.floor(Math.random() * 3),
      endsAt: Date.now() + KICK_VOTE_DURATION_SECONDS * 1000,
      myVote: null,
      resolved: false,
    });
  }, [stageKey]);

  /** The mocked crowd keeps voting until time's up, then the vote resolves
   *  into a line in Explorer Chat — a joke, not a real removal. Empty deps:
   *  this must keep running on the same 1s tick for the vote's whole
   *  lifetime, not get torn down and restarted by Explorer Chat's own
   *  frequent re-renders (see the note on `resolveVoteRef` above). */
  useEffect(() => {
    const timer = window.setInterval(() => {
      const currentVote = kickVoteRef.current;
      if (!currentVote || currentVote.resolved) return;
      const now = Date.now();

      if (now >= currentVote.endsAt) {
        resolveVoteRef.current(currentVote);
        setKickVote({ ...currentVote, resolved: true });
      } else {
        const yes = currentVote.yes + (Math.random() < 0.35 ? 1 : 0);
        const no = currentVote.no + (Math.random() < 0.25 ? 1 : 0);
        if (yes !== currentVote.yes || no !== currentVote.no) {
          setKickVote({ ...currentVote, yes, no });
        }
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (id && riderExpeditionId !== id) join(id);
  }, [id, riderExpeditionId, join]);

  useEffect(() => {
    setMuted(true);
  }, [current?.id]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    if (!current) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (shouldIgnoreShortcut(e)) return;
      if (boss?.status !== 'active') return;
      if (e.key === 'l' || e.key === 'L') {
        engage(current!.id, DAMAGE.like);
      } else if (e.key === 'f' || e.key === 'F') {
        if (!followedIds.has(current!.id)) {
          setFollowedIds((prev) => new Set(prev).add(current!.id));
          engage(current!.id, DAMAGE.follow);
        }
      } else if (e.key === 's' || e.key === 'S') {
        subscribeNow();
      } else if (e.key === 'g' || e.key === 'G') {
        setDonateOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [current, boss, followedIds, subscribedIds, engage, sendSystemMessage]);

  if (!expedition || !current) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-ink-muted">That expedition has already sailed.</p>
        <Link to="/expeditions" className="text-sm font-semibold text-kick">
          Back to Expeditions
        </Link>
      </div>
    );
  }

  const isTransitioning = expedition.transitionUntil !== null && Date.now() < expedition.transitionUntil;
  const isBoarding = status === 'boarding';
  const next = stops[(stopIndex + 1) % stops.length];

  const handleStayHere = () => {
    hopOff();
    navigate(`/watch/${current.id}`);
  };

  const bossHpPercent = boss ? boss.hp / boss.maxHp : 1;
  const bossGlowVariant = boss?.status === 'defeated' ? 'victory' : bossHpPercent <= 0.25 ? 'critical' : 'active';

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {boss && boss.status !== 'escaped' && <KickBossGlow variant={bossGlowVariant} />}

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative aspect-video w-full shrink-0 bg-surface lg:aspect-auto lg:flex-1">
          {isBoarding || isTransitioning ? (
            <div className="relative h-full w-full overflow-hidden" style={{ backgroundImage: (isBoarding ? stops[0] : current).gradient }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-page/50 text-center">
                <Compass size={28} strokeWidth={2} className="animate-live-pulse text-ink-bright" />
                <p className="text-sm font-bold text-ink-bright">
                  {isBoarding ? `Boarding · ${expedition.name}` : `Departing to ${current.name}...`}
                </p>
                {isBoarding && <p className="text-xs text-ink-muted">First stop: {stops[0].name}</p>}
              </div>
            </div>
          ) : (
            <StreamSurface card={current} muted={muted} size="player" interactive playing />
          )}
          <ReactionBurstOverlay reactions={reactions} fireworks={fireworks} />

          {!isBoarding && !isTransitioning && (
            <>
              <AudioFocusButton
                isAudioActive={!muted}
                streamName={current.name}
                onFocus={() => setMuted((m) => !m)}
                className="absolute bottom-3 right-3"
              />
              <StreamVideoActions
                current={current}
                liked={likedStopIds.has(current.id)}
                onToggleLike={() => {
                  const alreadyLiked = likedStopIds.has(current.id);
                  if (!alreadyLiked) spawnReaction(Heart, 'text-kick');
                  setLikedStopIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(current.id)) next.delete(current.id);
                    else next.add(current.id);
                    return next;
                  });
                }}
                subscribed={subscribedIds.has(current.id)}
                onToggleSubscribe={() =>
                  subscribedIds.has(current.id)
                    ? setSubscribedIds((prev) => {
                        const next = new Set(prev);
                        next.delete(current.id);
                        return next;
                      })
                    : subscribeNow()
                }
                pinned={isPinned(current.id)}
                canPinMore={canPinMore}
                onTogglePin={() => togglePin(current.id)}
                onOpenDonate={() => setDonateOpen(true)}
              />
              <QuickActionsWidget
                actions={EXPEDITION_QUICK_ACTIONS}
                renderPanel={(actionId, close) =>
                  actionId === 'share' ? (
                    <SharePanel
                      key="share"
                      title="Share this expedition"
                      url={`https://kick.com/expeditions/${expedition.id}`}
                      onClose={close}
                      onCopied={() => spawnReaction(Share2, 'text-info')}
                    />
                  ) : (
                    <ExpeditionRecapPanel key="recap" expedition={expedition} onClose={close} />
                  )
                }
              />
            </>
          )}

          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-line bg-page/70 px-2.5 py-1 text-[11px] font-bold text-ink-bright backdrop-blur-sm">
            <Compass size={12} strokeWidth={2.5} className="text-kick" />
            {expedition.name}
            {!isBoarding && (
              <span className="tabular text-ink-muted">
                · Stop {stopIndex + 1}/{stops.length}
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-line p-3 sm:p-4">
          <div className="min-w-0">
            <p className="tabular text-xs font-semibold text-ink-bright">
              {isBoarding ? `Departing in ${expedition.secondsRemaining}s` : `Next stop in ${expedition.secondsRemaining}s`}
            </p>
            <p className="truncate text-xs text-ink-muted">
              Next: <span className="font-semibold text-ink">{isBoarding ? stops[0].name : next.name}</span>
            </p>
          </div>
          {!isBoarding && (
            <button
              type="button"
              onClick={handleStayHere}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-raised px-3 py-2 text-xs font-bold text-ink-bright transition-colors hover:bg-overlay"
            >
              <LogOut size={14} strokeWidth={2.25} />
              Stay and watch {current.name}
            </button>
          )}
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col border-line lg:h-full lg:w-80 lg:border-l">
        {boss && (
          <KickBossPanel
            boss={boss}
            onEngage={(damage) => engage(current.id, damage)}
            onLike={() => spawnReaction(Heart, 'text-kick')}
            onOpenDonate={() => setDonateOpen(true)}
            followed={followedIds.has(current.id)}
            onFollow={() => {
              setFollowedIds((prev) => new Set(prev).add(current.id));
              spawnReaction(UserPlus, 'text-kick');
            }}
            subscribed={subscribedIds.has(current.id)}
            onSubscribe={subscribeNow}
            shared={sharedIds.has(current.id)}
            onShare={() => {
              setSharedIds((prev) => new Set(prev).add(current.id));
              spawnReaction(Share2, 'text-info');
            }}
          />
        )}
        {kickVote && !kickVote.resolved && (
          <KickVotePanel
            targetName={kickVote.targetName}
            yes={kickVote.yes}
            no={kickVote.no}
            endsAt={kickVote.endsAt}
            myVote={kickVote.myVote}
            onVote={castVote}
          />
        )}
        <div className="border-b border-line px-3 py-2">
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">Explorer Chat</h2>
        </div>
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
            if (boss?.status === 'active' && draft.trim()) engage(current.id, DAMAGE.chat);
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
            streamerName={current.name}
            onDonate={(amount) => {
              sendSystemMessage(`you gifted ${amount} Kicks to ${current.name}`);
              spawnReaction(Gift, 'text-kick');
              if (boss?.status === 'active') engage(current.id, DAMAGE.donate(amount));
            }}
            onClose={() => setDonateOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
