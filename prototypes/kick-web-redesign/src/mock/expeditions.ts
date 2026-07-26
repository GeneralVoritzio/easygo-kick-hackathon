import type { ChatMessage, Expedition, StreamCard } from '../types';

export const STOP_DURATION_SECONDS = 60;
export const MAX_EXPEDITION_VIEWERS = 20;
const STOPS_PER_EXPEDITION = 6;

/** Themed rosters, not a generic "Expedition 1" — same reasoning as every
 *  other mock name in this app: a judge reads our fixtures, so they carry
 *  personality instead of a placeholder. */
const EXPEDITION_NAMES = ['Late Night Wander', 'Variety Roulette', 'Rising Talent Run', 'Just Chatting Marathon', 'Slots & Chill'];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Half the roster is already under way — a viewer catching one mid-journey
 *  is the "raid you can hop onto" case the idle nudge offers. The other half
 *  is still boarding, with a real departure to count down to — the lobby
 *  tab's case. Every expedition draws its stops from the same catalog the
 *  rest of the site uses, so a name might already be familiar from a rail. */
export function createExpeditions(catalog: StreamCard[]): Expedition[] {
  return EXPEDITION_NAMES.map((name, i) => {
    const boarding = i % 2 === 0;
    const stops = shuffle(catalog).slice(0, STOPS_PER_EXPEDITION);

    return {
      id: `expedition-${i}`,
      name,
      stops,
      viewerCount: 4 + Math.floor(Math.random() * 15),
      maxViewers: MAX_EXPEDITION_VIEWERS,
      status: boarding ? 'boarding' : 'in-progress',
      stopIndex: boarding ? 0 : Math.floor(Math.random() * stops.length),
      secondsRemaining: boarding
        ? 20 + Math.floor(Math.random() * 45)
        : 8 + Math.floor(Math.random() * (STOP_DURATION_SECONDS - 8)),
      transitionUntil: null,
    };
  });
}

const EXPLORER_MESSAGE_TEMPLATES = [
  'where are we headed next', 'captain take us somewhere good this time', 'this is actually so fun',
  'expedition gang rise up', '1 min stops go brutal', 'bring back the guy from 2 stops ago',
  'left my own stream open for this lol worth it', 'who else is riding all night', 'never been to this one before',
  'okay this stop is actually kind of fire', 'vote we stay here', 'next stop better be good',
  'the random hop energy is unmatched', 'is it always this fast', 'day 3 of never leaving an expedition',
];

const EXPLORER_VIEWER_NAMES = [
  'SuperBunny551', 'xXNightRaverXx', 'toastedGG', 'lurkmaster99', 'clipfarm3r', 'kekw_enjoyer',
  'ratioed_again', 'vibecheckerr', 'sleepygoose204', 'TurboRaccoon_', 'notacop_promise', 'mid_diff_andy',
  'crispymoth42', 'pogchampion',
];

export function createExplorerMessage(): ChatMessage {
  return {
    id: `explorer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    viewerName: EXPLORER_VIEWER_NAMES[Math.floor(Math.random() * EXPLORER_VIEWER_NAMES.length)],
    text: EXPLORER_MESSAGE_TEMPLATES[Math.floor(Math.random() * EXPLORER_MESSAGE_TEMPLATES.length)],
  };
}

export function createExplorerMessages(count = 10) {
  return Array.from({ length: count }, () => createExplorerMessage());
}

/** How long the crowd gets to vote before a Kick Vote resolves — has to
 *  fit well inside one stop's `STOP_DURATION_SECONDS`, since a new vote
 *  starts fresh at every stop. */
export const KICK_VOTE_DURATION_SECONDS = 25;

/** The target is always one of the mocked crowd, never "you" — this is a
 *  running joke the group plays on a fellow rider, not a real removal of
 *  anyone from anything. */
export function randomKickVoteTarget(): string {
  return EXPLORER_VIEWER_NAMES[Math.floor(Math.random() * EXPLORER_VIEWER_NAMES.length)];
}
