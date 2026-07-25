import type { EngagementPoint, RecapSegment, StreamHighlight, StreamSession } from '@shared/types';

const BASELINE_WINDOW_POINTS = 5;
const SPIKE_MULTIPLIER = 1.6;
const MIN_SEPARATION_SEC = 90;
const MAX_HIGHLIGHTS = 5;

const HIGHLIGHT_CAPTIONS = [
  'Engagement spiked here.',
  'Chat went wild around this point.',
  'A clear jump in activity.',
  'This moment pulled everyone in.',
  'Viewers reacted hard here.',
];

/** Local maxima in `points` that clear their trailing baseline by
 *  `SPIKE_MULTIPLIER`, deduped so two spikes never sit within
 *  `MIN_SEPARATION_SEC` of each other (the stronger one wins), capped at
 *  `MAX_HIGHLIGHTS` and returned in chronological order. We only know
 *  engagement jumped, not why, so the caption stays generic. */
export function detectHighlights(points: EngagementPoint[]): StreamHighlight[] {
  const rawSpikes: EngagementPoint[] = [];

  for (let i = 1; i < points.length - 1; i++) {
    const windowStart = Math.max(0, i - BASELINE_WINDOW_POINTS);
    const window = points.slice(windowStart, i);
    const baseline = window.reduce((sum, p) => sum + p.value, 0) / (window.length || 1);
    const isLocalMax = points[i].value >= points[i - 1].value && points[i].value >= points[i + 1].value;
    if (isLocalMax && points[i].value > baseline * SPIKE_MULTIPLIER) {
      rawSpikes.push(points[i]);
    }
  }

  const deduped: EngagementPoint[] = [];
  for (const spike of rawSpikes) {
    const last = deduped[deduped.length - 1];
    if (last && spike.t - last.t < MIN_SEPARATION_SEC) {
      if (spike.value > last.value) deduped[deduped.length - 1] = spike;
    } else {
      deduped.push(spike);
    }
  }

  return deduped
    .sort((a, b) => b.value - a.value)
    .slice(0, MAX_HIGHLIGHTS)
    .sort((a, b) => a.t - b.t)
    .map((spike, i) => ({
      id: `highlight-${spike.t}`,
      t: spike.t,
      intensity: spike.value,
      caption: HIGHLIGHT_CAPTIONS[i % HIGHLIGHT_CAPTIONS.length],
    }));
}

const OPENING_DURATION_SEC = 20;
const CLOSING_DURATION_SEC = 20;
const HIGHLIGHT_PADDING_BEFORE_SEC = 5;
const HIGHLIGHT_PADDING_AFTER_SEC = 12;

export function secondsBetween(fromIso: string, toIso: string): number {
  return Math.max(0, Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 1000));
}

/** Assembles the recap: the stream's opening seconds, each detected
 *  highlight (skipping any inside the opening/closing windows so segments
 *  never overlap), then the seconds right before the viewer joined. */
export function buildRecap(session: StreamSession): RecapSegment[] {
  const joinedAtSec = secondsBetween(session.streamStartedAt, session.viewerJoinedAt);
  const highlights = detectHighlights(session.engagement).filter(
    (h) => h.t > OPENING_DURATION_SEC && h.t < joinedAtSec - CLOSING_DURATION_SEC
  );

  const segments: RecapSegment[] = [
    {
      id: 'opening',
      kind: 'opening',
      startSec: 0,
      endSec: Math.min(OPENING_DURATION_SEC, joinedAtSec),
      title: 'Stream kicks off',
      caption: `${session.streamerName} went live — here's how it started.`,
    },
    ...highlights.map((h, i) => ({
      id: h.id,
      kind: 'highlight' as const,
      startSec: Math.max(0, h.t - HIGHLIGHT_PADDING_BEFORE_SEC),
      endSec: Math.min(joinedAtSec, h.t + HIGHLIGHT_PADDING_AFTER_SEC),
      title: `Highlight ${i + 1}`,
      caption: h.caption,
    })),
    {
      id: 'closing',
      kind: 'closing',
      startSec: Math.max(0, joinedAtSec - CLOSING_DURATION_SEC),
      endSec: joinedAtSec,
      title: 'Right before you joined',
      caption: "You're all caught up — here's what just happened.",
    },
  ];

  return segments;
}

export function formatElapsed(sec: number): string {
  const mm = Math.floor(sec / 60);
  const ss = Math.round(sec % 60);
  return `${mm}:${ss.toString().padStart(2, '0')} in`;
}
