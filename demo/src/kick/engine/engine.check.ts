// Run with: node --experimental-strip-types src/kick/engine/engine.check.ts
import assert from "node:assert/strict";
import { createEngine, type EngineHost } from "./engine.ts";
import type { EngineEvent } from "./events.ts";

const host: EngineHost = {
  username: "IronVow",
  verified: true,
  viewers: 4187,
  raiders: [{ username: "FlickGremlin", verified: false, viewers: 2600 }],
};

function run(steps: (engine: ReturnType<typeof createEngine>) => void) {
  const engine = createEngine(host);
  const events: EngineEvent[] = [];
  engine.listen({ onEvent: (event) => events.push(event) });
  steps(engine);
  return { engine, events };
}

const names = (events: EngineEvent[]) => events.map((event) => event.name);
const chat = (events: EngineEvent[]) => events.filter((e) => e.name === "kick chat.message.sent");

const quiet = run((engine) => engine.advance(60));
assert.ok(chat(quiet.events).length > 0, "a quiet minute still produces chat");
assert.ok(
  names(quiet.events).every((name) => name.startsWith("kick ")),
  "nothing invented fires on its own",
);

// The seed is the whole point: two engines given the same steps agree message for message.
const repeat = run((engine) => engine.advance(60));
assert.deepEqual(
  chat(repeat.events).map((e) => e.payload.content),
  chat(quiet.events).map((e) => e.payload.content),
  "the same seed replays the same stream",
);

const raided = run((engine) => {
  engine.advance(30);
  engine.fire("raid");
  engine.advance(30);
});
assert.ok(names(raided.events).includes("fake-kick raid.started"), "a raid announces itself");
assert.ok(
  raided.engine.state().viewers > quiet.engine.state().viewers,
  "a raid adds viewers",
);
assert.ok(
  chat(raided.events).length > chat(quiet.events).length,
  "a raid makes the room louder over the same minute",
);

const whale = run((engine) => {
  engine.fire("whale");
  engine.advance(1);
});
const gift = whale.events.find((event) => event.name === "kick kicks.gifted");
assert.ok(gift && gift.name === "kick kicks.gifted");
assert.equal(gift.payload.gift.amount, 5000);
assert.equal(gift.payload.gift.tier, "legendary");

const train = run((engine) => {
  engine.fire("subtrain");
  engine.advance(1);
});
const gifts = train.events.find((event) => event.name === "kick channel.subscription.gifts");
assert.ok(gifts && gifts.name === "kick channel.subscription.gifts");
assert.equal(gifts.payload.giftees.length, 18);

// The surge decays, so the room returns to its own size and the demo can run twice.
const settled = run((engine) => {
  engine.fire("raid");
  engine.advance(600);
});
assert.ok(
  Math.abs(settled.engine.state().viewers - host.viewers) < host.viewers * 0.2,
  `the room settles back, got ${settled.engine.state().viewers}`,
);
assert.ok(settled.engine.state().multiplier < 1.1, "the chat rate settles back");

console.log("engine.check.ts: all assertions passed");
