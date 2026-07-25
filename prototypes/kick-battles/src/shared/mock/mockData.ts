import type { BattleState, ContributionEvent, ContributionType } from '../types';

interface TournamentEntrant {
  id: string;
  name: string;
  streamerNames: string[];
}

/** The "Kick World Cup" roster the mock battle seats a subset of against
 *  each other. An entrant's `id` doubles as its `sideId`. */
const TOURNAMENT_ENTRANTS: TournamentEntrant[] = [
  { id: 'side-vortex', name: 'Team Vortex', streamerNames: ['VortexKing', 'NovaBlitz'] },
  { id: 'side-blaze', name: 'Team Blaze', streamerNames: ['BlazeRunner', 'PixelPhantom'] },
  { id: 'side-ghost', name: 'GhostWolf', streamerNames: ['GhostWolf'] },
];

const BATTLE_DURATION_MS = 90_000;

function streamer(streamerId: string, name: string) {
  return { streamerId, name, score: 20 + Math.floor(Math.random() * 30) };
}

/** Mixed demo: two 2-streamer teams plus one solo streamer, so a single mock
 *  run exercises duel-style scoring, a multi-way (3-side) bar, and team
 *  score aggregation all at once. Starts in `'starting'` — `useBattle` flips
 *  it to `'live'` after a short delay, mirroring the brief window between an
 *  accepted battle request and the bar actually going live. */
export function createMockBattle(): BattleState {
  return {
    battleId: 'battle-1',
    status: 'starting',
    endsAt: new Date(Date.now() + BATTLE_DURATION_MS).toISOString(),
    sides: TOURNAMENT_ENTRANTS.map((entrant) => ({
      sideId: entrant.id,
      name: entrant.name,
      streamers: entrant.streamerNames.map((name, i) => streamer(`${entrant.id}-streamer-${i}`, name)),
    })),
  };
}

function sideTotal(side: BattleState['sides'][number]): number {
  return side.streamers.reduce((sum, s) => sum + s.score, 0);
}

/** Random-walks each streamer's score, with occasional momentum swings on a
 *  whole side (a random member gets the bonus) so close matches, blowouts,
 *  and comebacks all naturally occur over the course of a battle. */
export function tickMockBattleScores(battle: BattleState): BattleState {
  const sortedSides = [...battle.sides].sort((a, b) => sideTotal(a) - sideTotal(b));
  const laggerSideId = sortedSides[0].sideId;
  const leaderSideId = sortedSides[sortedSides.length - 1].sideId;
  const comebackRoll = Math.random();
  const blowoutRoll = Math.random();

  return {
    ...battle,
    sides: battle.sides.map((side) => {
      const bonusRecipientIndex = Math.floor(Math.random() * side.streamers.length);
      return {
        ...side,
        streamers: side.streamers.map((s, i) => {
          let bonus = 0;
          if (i === bonusRecipientIndex) {
            if (side.sideId === laggerSideId && comebackRoll < 0.12) bonus += 40 + Math.random() * 50;
            if (side.sideId === leaderSideId && blowoutRoll < 0.08) bonus += 60 + Math.random() * 60;
          }
          return { ...s, score: s.score + Math.floor(Math.random() * 15 + bonus) };
        }),
      };
    }),
  };
}

const CONTRIBUTION_TYPES: ContributionType[] = ['tip', 'follow', 'sub', 'chat_burst'];
const VIEWER_NAMES = [
  'nightowl22', 'xX_Raven_Xx', 'lurkmaster', 'sodapop', 'ghostie', 'kelpy_dev',
  'quietstorm', 'BunsenBurner', 'triple_axel', 'mango.tv', 'zerocool', 'flickerbulb',
];

function randomAmountFor(type: ContributionType): number {
  switch (type) {
    case 'tip':
      return Math.round((5 + Math.random() * 95) * 100) / 100;
    case 'sub':
      return Math.random() < 0.15 ? 3 : Math.random() < 0.4 ? 2 : 1;
    case 'chat_burst':
      return Math.floor(5 + Math.random() * 35);
    case 'follow':
      return 1;
  }
}

export function createMockContributionEvent(streamerIds: string[]): ContributionEvent {
  const streamerId = streamerIds[Math.floor(Math.random() * streamerIds.length)];
  const type = CONTRIBUTION_TYPES[Math.floor(Math.random() * CONTRIBUTION_TYPES.length)];
  return {
    streamerId,
    viewerName: VIEWER_NAMES[Math.floor(Math.random() * VIEWER_NAMES.length)],
    amount: randomAmountFor(type),
    type,
    timestamp: new Date().toISOString(),
  };
}
