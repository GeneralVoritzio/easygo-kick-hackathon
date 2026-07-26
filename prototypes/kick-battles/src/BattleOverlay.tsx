import { useState } from 'react';
import { useBattle } from '@shared/hooks/useBattle';
import { Countdown } from '@shared/components/Countdown';
import { useScoreHistory } from './useScoreHistory';
import { useBattleFlags } from './useBattleFlags';
import { BattleBar } from './BattleBar';
import { PreviewBackground } from './PreviewBackground';

const GHOST_LOOKBACK_MS = 30_000;

/** TEMPORARY: ?bg=1 shows a placeholder backdrop, ?bg=<channel-slug> embeds
 *  that real, currently-live Kick channel instead — both for demoing to
 *  teammates. See PreviewBackground.tsx. Never affects the real transparent
 *  OBS embed unless that query param is explicitly added. */
function previewBgParam(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('bg');
}

/** Animated versus scoreboard for a multi-streamer Kick battle: WS-fed
 *  running scores, per-contribution flying labels, and match-state-driven
 *  visual states (close/blowout/comeback/final-minute). `p-16` (64px) on
 *  every wrapper is the design spec's overlay safe margin — streamers crop
 *  edges and platform UI sits in the corners, so nothing here can sit flush
 *  against the canvas edge. */
export function BattleOverlay() {
  const { battle, events, status } = useBattle();
  const history = useScoreHistory(battle?.sides);
  const flags = useBattleFlags(battle, history);
  const [finalStretch, setFinalStretch] = useState(false);
  const bgParam = previewBgParam();
  const previewBg = bgParam !== null;
  const previewChannelSlug = bgParam && bgParam !== '1' ? bgParam : undefined;

  if (!battle) {
    return (
      <>
        {previewBg && <PreviewBackground channelSlug={previewChannelSlug} />}
        <div className="p-16 font-mono text-xs uppercase tracking-wide text-ink-muted">
          {status === 'connecting' ? '' : 'Waiting for battle…'}
        </div>
      </>
    );
  }

  if (battle.status === 'starting') {
    return (
      <>
        {previewBg && <PreviewBackground channelSlug={previewChannelSlug} />}
        <div className="inline-flex flex-col items-end gap-2 p-16 font-display">
          <div className="flex items-center gap-2 rounded-lg border border-line bg-surface/90 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-kick animate-live-pulse" />
            <span className="font-mono text-xs font-bold uppercase tracking-wide text-ink-bright">
              Battle starting — {battle.sides.map((side) => side.name).join(' vs ')}
            </span>
          </div>
        </div>
      </>
    );
  }

  const ghostSnapshot = history.hasHistoryFor(GHOST_LOOKBACK_MS) ? history.getSnapshotAt(GHOST_LOOKBACK_MS) : null;

  return (
    <>
      {previewBg && <PreviewBackground channelSlug={previewChannelSlug} />}
      <div className="inline-flex flex-col items-end gap-2 p-4 font-display">
        <Countdown endsAt={battle.endsAt} onFinalStretchChange={setFinalStretch} />
        <BattleBar
          sides={battle.sides}
          order={flags.order}
          percents={flags.percents}
          leaderId={flags.leaderId}
          isClose={flags.isClose}
          isBlowout={flags.isBlowout}
          glowDurationSec={flags.glowDurationSec}
          comebackPulseKey={flags.comebackPulseKey}
          finalStretch={finalStretch}
          events={events}
          ghostSnapshot={ghostSnapshot}
        />
      </div>
    </>
  );
}
