// Multiview and the boost live here. The event itself comes from the events store, so there is one
// event model in the app and not two.
//   fake-kick POST /public/v1/events/{event_id}/boosts
//   fake-kick events.boost.created, events.boost.expired

export const MULTIVIEW_CAP = 9;
export const BOOST_MINUTES = 10;

export function formatBoostLeft(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
