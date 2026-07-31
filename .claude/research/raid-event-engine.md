# Raid mock event engine, ideas

Working notes, 29 July 2026. This is not a source of truth. It holds ideas for the raid event
engine on branch `mock-event-engine`.

---

## 1. The problem

The raid runs on timers in `demo/src/kick/raid/RaidProvider.tsx`.

| Problem | Where |
|---|---|
| A 1 second `setInterval` drives the phase clock | `RaidProvider.tsx` line 86 |
| A 800ms interval adds votes as a number | `RaidProvider.tsx` line 62 |
| Four `setTimeout` calls hold the demo script | `RaidProvider.tsx` lines 101 to 132 |
| `Math.random` makes each run different | `RaidProvider.tsx`, `machine.ts` |

Four faults follow from this:

1. **No event is data.** `machine.ts` is a pure reducer, but function calls drive it. You cannot
   log a raid, replay a raid, or show a raid to a judge.
2. **No run repeats.** The deck and the demo share one fixture, so they can disagree.
3. **The script and the rules mix.** `r.rerolls === 0 ? declineEntry : acceptEntry` is timing
   logic inside the provider.
4. **Chat votes, but chat says nothing.** The poll is a counter. No message is sent.

---

## 2. The core idea

One queue of events. The raid reduces over the queue. React subscribes to the result.

```
type Emission = {
  at: number
  name: "kick chat.message.sent" | "kick channel.followed"
      | "kick kicks.gifted" | "kick livestream.status.updated"
      | "fake-kick raid.vote.opened" | "fake-kick raid.tank.entry.declined"
  payload: unknown
}
```

The `kick` names are real. See `.claude/KICK-API-MAP.md` lines 537 to 546. The `fake-kick` names
are ours. See the header of `demo/src/kick/raid/machine.ts` lines 4 to 12.

---

## 3. The ten ideas

| # | Idea | What it does |
|---|---|---|
| 1 | **Chat votes by typing** | Chatters send real `kick chat.message.sent` messages that hold `1`, `2` or `3`. The poll counts the message text |
| 2 | **One clock, one seed** | Virtual time and a seeded random number generator. Pause, speed up, skip a phase, and repeat a run |
| 3 | **Rates from the data** | `mock/raids.ts` holds message counts for 30 minutes. Use the same counts for the chat volume |
| 4 | **Hype envelope** | A rate multiplier per phase. Chat increases on a vote, on a reveal and on a countdown |
| 5 | **Named chatters** | About 40 personas with a message rate and a vote bias. The room reads as real |
| 6 | **Script as data** | The accept and decline beats become events in a file, not `setTimeout` calls |
| 7 | **Record and replay** | Run the generator once. Commit the event log. The demo replays the file |
| 8 | **Dev console** | Scrub the timeline, read the event log, inject a fault such as "the target goes offline" |
| 9 | **Webhook shim** | The engine reads a file today and a webhook body tomorrow. `prototypes/kicktool` receives real webhooks |
| 10 | **Tests** | A seeded engine gives repeatable results. `mock/score.check.ts` shows the pattern |

---

## 4. Idea 1 is the strongest

Today the poll is a number that increases. The judges must trust it.

If chat types the vote, the judges see the messages and the bar together. They know
`chat.message.sent` carries `content`, because it is their own API. A tally you read from a real
payload needs no trust.

---

## 5. What to build first

Ideas 2, 6 and then 1. About 250 lines.

| File | Job |
|---|---|
| `demo/src/kick/raid/clock.ts` | Virtual time and one queue. Pause and speed |
| `demo/src/kick/raid/rng.ts` | mulberry32, seeded. About 5 lines |
| `demo/src/kick/mock/events.ts` | The emission type, the generator and the personas |
| `demo/src/kick/mock/script.ts` | The authored beats for the demo raid |

`RaidProvider.tsx` then holds a subscription and a `useReducer`. The five `useEffect` blocks go.

**Start with the clock.** Everything depends on it, and it changes nothing on screen. Do not start
with idea 1, because it needs the queue below it.

Ideas 3, 4 and 5 are polish. Ideas 7 and 8 are demo day insurance. Ideas 9 and 10 answer the
question "can this ship?".

---

## 6. Keep it small

The full engine must stay below about 400 lines. The first coding rule is the most obvious version
that works. An event engine attracts a plugin system that nobody asked for.

---

## 7. The date matters

The hackathon is Saturday 1 August 2026. The detailed spec arrives on the morning. See
`.claude/KICK-HACKATHON-BRIEF.md` Section 1.

So prefer work that transfers to a different brief. A seeded clock and an event queue transfer to
any real time challenge. A tank raid script does not.

If time is short, build ideas 2 and 6 only. Then rehearse.
