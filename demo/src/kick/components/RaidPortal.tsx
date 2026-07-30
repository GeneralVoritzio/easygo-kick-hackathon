import { useEffect, useState, type CSSProperties } from "react";
import { useRaid } from "../raid/RaidProvider";
import { candidateFor, TIMING, type Raid } from "../raid/machine";
import { Frame, frameFor, Stage } from "./RaidStage";

const SHADES = ["#dafecd", "#96fd73", "#53fc18", "#3ad903", "#2ba202"];

function seededRand(i: number, salt: number) {
  const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

// A bullseye of pixel rings, a black hole at the core and brighter with every ring out to a
// glowing rim, styled after the classic pixel-art "dimensional portal" sprite (concentric
// rings, a deep centre, a luminous edge). A few cells run one shade brighter than their ring,
// a fixed jitter rather than noise, so the rings read as charged, not flat-printed.
const TUNNEL_GRID = 20;
const TUNNEL_CENTER = (TUNNEL_GRID - 1) / 2;
const TUNNEL_MAX_R = TUNNEL_CENTER + 0.4;
const RING_SHADES = [
  "#000000",
  "#020a00",
  "#0e3301",
  "#1d6a01",
  "#2ba202",
  "#3ad903",
  "#53fc18",
  "#75fd45",
  "#96fd73",
];
// The brightness curve is shaped, not linear, so the black hole dominates the disc and the
// green only shows as a thin glowing rim at the very edge, not a thick painted ring.
const RING_CURVE = 2.6;

type TunnelCell = { x: number; y: number; color: string };

const TUNNEL_CELLS: TunnelCell[] = (() => {
  const cells: TunnelCell[] = [];
  for (let y = 0; y < TUNNEL_GRID; y++) {
    for (let x = 0; x < TUNNEL_GRID; x++) {
      const dx = x - TUNNEL_CENTER;
      const dy = y - TUNNEL_CENTER;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > TUNNEL_MAX_R) continue;
      const t = Math.pow(dist / TUNNEL_MAX_R, RING_CURVE);
      const ring = Math.min(RING_SHADES.length - 1, Math.floor(t * RING_SHADES.length));
      const sparkle = seededRand(x, y * 53) > 0.9 ? 1 : 0;
      const idx = Math.min(RING_SHADES.length - 1, ring + sparkle);
      cells.push({ x, y, color: RING_SHADES[idx] });
    }
  }
  return cells;
})();

function PortalTunnelDisc() {
  return (
    <div
      className="absolute inset-0"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${TUNNEL_GRID}, 1fr)`,
        gridTemplateRows: `repeat(${TUNNEL_GRID}, 1fr)`,
      }}
    >
      {TUNNEL_CELLS.map(({ x, y, color }) => (
        <div key={`${x}-${y}`} style={{ gridColumn: x + 1, gridRow: y + 1, background: color }} />
      ))}
    </div>
  );
}

// Three copies of the same bullseye, launched a beat apart, each shrinking and fading toward
// the centre. Overlapping, that reads as rings pulling inward on a loop, the tunnel-travel
// effect the reference sprite animates, not a flat static target. Each copy also spins on its
// own axis, so the whole thing reads as a turning vortex, not a still target that happens to
// pulse.
function PortalTunnel() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-portal-tunnel absolute inset-0" style={{ animationDelay: `${i * 1.1}s` }}>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: "16s" }}>
            <PortalTunnelDisc />
          </div>
        </div>
      ))}
    </>
  );
}

type EruptVars = CSSProperties & {
  "--erupt-land-x": string;
  "--erupt-land-y": string;
  "--erupt-float-x": string;
  "--erupt-float-y": string;
};

type EruptMote = {
  originX: number;
  originY: number;
  landX: number;
  landY: number;
  floatX: number;
  floatY: number;
  size: number;
  launchDelay: number;
  launchDuration: number;
  floatDuration: number;
  color: string;
};

// Motes launched from the portal's outer edge, not its dark centre, the same way a volcano
// spits rock from its rim, not its throat. Each one fires once, lands, then just keeps
// floating in place, the same small jitter the ambient field outside already has, rather than
// fading back out and repeating. Launches are staggered across most of the countdown (not just
// the first few seconds), so the portal keeps visibly spewing for the whole time it is open
// instead of firing one wave early and going quiet. The travel is in real pixels, not percent
// (a transform's percentage resolves against the mote's own tiny box, not its container, so
// percent here would barely move at all).
const ERUPT_MOTES: EruptMote[] = Array.from({ length: 34 }, (_, i) => {
  const angle = seededRand(i, 91) * Math.PI * 2;
  const originR = 60 + seededRand(i, 92) * 40;
  const landR = originR + 90 + seededRand(i, 97) * 160;
  const floatAngle = seededRand(i, 99) * Math.PI * 2;
  const floatAmp = 10 + seededRand(i, 98) * 14;
  const launchDuration = 1 + seededRand(i, 95) * 0.8;
  return {
    originX: Math.cos(angle) * originR,
    originY: Math.sin(angle) * originR,
    landX: Math.cos(angle) * landR,
    landY: Math.sin(angle) * landR,
    floatX: Math.cos(floatAngle) * floatAmp,
    floatY: Math.sin(floatAngle) * floatAmp,
    size: 3 + Math.round(seededRand(i, 93) * 2),
    launchDelay: seededRand(i, 94) * 13,
    launchDuration,
    floatDuration: 3 + seededRand(i, 100) * 3,
    color: SHADES[Math.floor(seededRand(i, 96) * SHADES.length)],
  };
});

// Sits alongside the ambient particle field, not inside the portal's own scaled box, so the
// burst's reach stays constant instead of shrinking with the portal early in the countdown.
function PortalEruption() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {ERUPT_MOTES.map((m, i) => (
        <span
          key={i}
          className="animate-portal-erupt absolute rounded-[1px]"
          style={
            {
              left: `calc(50% + ${m.originX}px)`,
              top: `calc(50% + ${m.originY}px)`,
              width: m.size,
              height: m.size,
              background: m.color,
              boxShadow: "0 0 7px rgba(83,252,24,0.95)",
              animationDuration: `${m.launchDuration}s, ${m.floatDuration}s`,
              animationDelay: `${m.launchDelay}s, ${m.launchDelay + m.launchDuration}s`,
              "--erupt-land-x": `${m.landX}px`,
              "--erupt-land-y": `${m.landY}px`,
              "--erupt-float-x": `${m.floatX}px`,
              "--erupt-float-y": `${m.floatY}px`,
            } as EruptVars
          }
        />
      ))}
    </div>
  );
}

type PullVars = CSSProperties & { "--pull-x": string; "--pull-y": string };

type PullMote = { x: number; y: number; size: number; delay: number; duration: number; color: string };

// Motes closing in on the doorway from every side, not drifting near it, so the room reads as
// already being drawn toward the gate. That is the invitation: others are going in. Travel is
// in real pixels for the same reason the eruption's is: a transform's percentage resolves
// against the mote's own box, not its container, so percent would barely move it.
const PULL_MOTES: PullMote[] = Array.from({ length: 18 }, (_, i) => {
  const angle = seededRand(i, 71) * Math.PI * 2;
  const dist = 70 + seededRand(i, 72) * 60;
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
    size: 2 + Math.round(seededRand(i, 73) * 2),
    delay: seededRand(i, 74) * -3,
    duration: 1.6 + seededRand(i, 75) * 1.4,
    color: SHADES[Math.floor(seededRand(i, 76) * SHADES.length)],
  };
});

function PortalPull() {
  return (
    <div className="pointer-events-none absolute -inset-[25%]">
      {PULL_MOTES.map((m, i) => (
        <span
          key={i}
          className="animate-portal-pull absolute left-1/2 top-1/2 rounded-[1px]"
          style={
            {
              width: m.size,
              height: m.size,
              background: m.color,
              animationDelay: `${m.delay}s`,
              animationDuration: `${m.duration}s`,
              "--pull-x": `${m.x}px`,
              "--pull-y": `${m.y}px`,
            } as PullVars
          }
        />
      ))}
    </div>
  );
}

const TICKS = 16;
const TICK_SIZE = 96;

// A ring of pixel ticks going dark one by one, not a smooth stroke depleting, so the clock
// reads as one more charged part of the portal instead of a plain widget bolted on top of it.
function PixelTimerTicks({ seconds, total }: { seconds: number; total: number }) {
  const remaining = Math.max(0, Math.min(1, seconds / total));
  const active = Math.round(remaining * TICKS);
  const radius = TICK_SIZE / 2 - 5;
  return (
    <div className="absolute inset-0">
      {Array.from({ length: TICKS }, (_, i) => {
        const angle = (i / TICKS) * Math.PI * 2 - Math.PI / 2;
        const cx = TICK_SIZE / 2 + Math.cos(angle) * radius;
        const cy = TICK_SIZE / 2 + Math.sin(angle) * radius;
        const lit = i < active;
        return (
          <span
            key={i}
            className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-[1px] transition-all duration-300"
            style={{
              left: cx,
              top: cy,
              background: lit ? "#53fc18" : "rgba(255,255,255,0.2)",
              boxShadow: lit ? "0 0 6px 1px rgba(83,252,24,0.85)" : "none",
            }}
          />
        );
      })}
    </div>
  );
}

type ParticleVars = CSSProperties & { "--portal-dx": string; "--portal-dy": string };

type Particle = {
  left: number;
  top: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  dx: number;
  dy: number;
};

// Scattered across the whole player, not just the portal's own box, so the pull feels like it
// is gathering the room rather than sitting in one tidy clump. Seeded so the field is stable
// across renders instead of reshuffling every tick.
const PARTICLES: Particle[] = Array.from({ length: 46 }, (_, i) => ({
  left: seededRand(i, 1) * 100,
  top: seededRand(i, 2) * 100,
  size: 3 + Math.round(seededRand(i, 3) * 2),
  color: SHADES[Math.floor(seededRand(i, 4) * SHADES.length)],
  duration: 5 + seededRand(i, 5) * 6,
  delay: seededRand(i, 6) * -9,
  dx: (seededRand(i, 7) - 0.5) * 30,
  dy: (seededRand(i, 8) - 0.5) * 30,
}));

function PortalParticles({ opacity }: { opacity: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-1000"
      style={{ opacity }}
    >
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="animate-portal-drift absolute rounded-[1px]"
          style={
            {
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              boxShadow: "0 0 4px rgba(83,252,24,0.8)",
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              "--portal-dx": `${p.dx}px`,
              "--portal-dy": `${p.dy}px`,
            } as ParticleVars
          }
        />
      ))}
    </div>
  );
}

type Stage2 = "open" | "closing" | "sucking" | "arrived" | "closed";

// The countdown, the growing portal, and the raid landing are all one overlay so the raid
// reads as pulling chat through a rift rather than the page cutting to a new screen. Leave
// closes the rift early; Enter just locks the choice in, the portal still runs the clock out.
export function RaidPortal({ raid }: { raid: Raid }) {
  const { targetIsHidden, joined, join, leave } = useRaid();
  const target = candidateFor(raid, raid.targetSlug ?? "");
  const [stage, setStage] = useState<Stage2>("open");
  const swept = joined ?? !targetIsHidden;

  useEffect(() => {
    if (raid.phase !== "landed") return;
    setStage((s) => (s === "open" ? (swept ? "sucking" : "closed") : s));
  }, [raid.phase, swept]);

  useEffect(() => {
    if (stage === "sucking") {
      const id = setTimeout(() => setStage("arrived"), 700);
      return () => clearTimeout(id);
    }
    if (stage === "closing") {
      const id = setTimeout(() => setStage("closed"), 900);
      return () => clearTimeout(id);
    }
  }, [stage]);

  if (!target) return null;

  if (stage === "arrived") {
    const frame = frameFor(raid, raid.targetSlug!);
    return frame ? (
      <Stage caption="Raid landed">
        <Frame frame={frame} />
      </Stage>
    ) : null;
  }

  if (stage === "closed") return null;

  const progress = Math.max(0, Math.min(1, 1 - raid.seconds / TIMING.countdown));
  const scale = stage === "closing" ? 0 : stage === "sucking" ? 2.6 : 0.18 + progress * 0.82;
  const portalOpacity = stage === "closing" ? 0 : stage === "sucking" ? 0 : 1;
  const backdropOpacity = stage === "closing" || stage === "sucking" ? 0 : 0.15 + progress * 0.35;
  const showButtons = stage === "open" && joined === null;

  const handleLeave = () => {
    leave();
    setStage("closing");
  };

  return (
    <div className="z-controls absolute inset-0 flex items-center justify-center overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-black transition-opacity duration-1000"
        style={{ opacity: backdropOpacity }}
      />

      <PortalParticles opacity={stage === "closing" || stage === "sucking" ? 0 : 1} />

      <div
        className="transition-opacity duration-1000"
        style={{ opacity: stage === "closing" || stage === "sucking" ? 0 : 1 }}
      >
        <PortalEruption />
      </div>

      {stage === "sucking" && (
        <div className="animate-portal-flash pointer-events-none absolute inset-0 bg-green-500" />
      )}

      <div
        className="pointer-events-none absolute aspect-square w-[64%] max-w-72 ease-out"
        style={{
          transform: `scale(${scale})`,
          opacity: portalOpacity,
          transitionProperty: "transform, opacity",
          transitionDuration: stage === "sucking" ? "650ms" : stage === "closing" ? "900ms" : "1000ms",
          filter: `drop-shadow(0 0 ${10 + progress * 26}px rgba(83,252,24,0.6))`,
        }}
      >
        <div
          className="animate-pick-glow pointer-events-none absolute -inset-[30%] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(83,252,24,0.55), transparent 70%)" }}
        />
        <PortalPull />
        <PortalTunnel />
      </div>

      <div
        className="pointer-events-none absolute flex flex-col items-center gap-2 text-center transition-opacity duration-500"
        style={{ opacity: stage === "open" ? 1 : 0 }}
      >
        <div className="relative flex size-24 shrink-0 items-center justify-center">
          <PixelTimerTicks seconds={raid.seconds} total={TIMING.countdown} />
          <span className="relative translate-y-1 text-3xl font-black tabular-nums text-white [text-shadow:0_0_16px_rgba(83,252,24,0.9)]">
            {raid.seconds}
          </span>
        </div>
        <span className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
          Raiding {target.stream.channel.username}
        </span>
      </div>

      {showButtons && !targetIsHidden && (
        <div className="pointer-events-auto absolute bottom-20 flex gap-3">
          <button
            type="button"
            onClick={handleLeave}
            className="h-10 rounded bg-secondary-base px-6 text-sm font-semibold text-secondary-onSecondary"
          >
            Leave
          </button>
          <button
            type="button"
            onClick={join}
            className="state-layer-base animate-cta-pulse h-10 rounded bg-primary-base px-6 text-sm font-semibold text-primary-onPrimary transition-transform betterhover:hover:scale-105"
          >
            Enter
          </button>
        </div>
      )}

      {showButtons && targetIsHidden && (
        <div className="pointer-events-auto absolute bottom-20">
          <button
            type="button"
            onClick={join}
            className="state-layer-base animate-cta-pulse h-10 rounded bg-primary-base px-6 text-sm font-semibold text-primary-onPrimary transition-transform betterhover:hover:scale-105"
          >
            Join the raid
          </button>
        </div>
      )}
    </div>
  );
}
