// Multiview and the boost live here. The event itself comes from the events store, so there is one
// event model in the app and not two.
//   fake-kick POST /public/v1/events/{event_id}/boosts
//   fake-kick events.boost.created, events.boost.expired
//   fake-kick GET /public/v1/channels/{broadcaster_user_id}/hype, tier 0 to 3
//   fake-kick channel.hype.updated

export const MULTIVIEW_CAP = 9;
export const BOOST_MINUTES = 10;
export const HYPE_TIER_MAX = 3;
// How long the global boost notice stays up before it auto dismisses. Short and on its own
// clock, separate from BOOST_MINUTES, which is how long the fire badge itself keeps showing.
export const BOOST_NOTICE_SECONDS = 12;
// The director-follow prompt gets a little longer, since it asks for a choice between
// three options rather than just naming a streamer to jump to.
export const FOLLOW_PROMPT_SECONDS = 15;

export function formatBoostLeft(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
