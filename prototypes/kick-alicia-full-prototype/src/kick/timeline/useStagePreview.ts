import { useCallback, useEffect, useRef, type RefObject } from "react";
import { categoryAt, type Timeline } from "./data";

/*
  The picture in the frame. KICK gives no video frames for a mocked stream, so this draws a
  procedural scene instead, a function of the playhead alone: scrubbing shows the exact frame
  for that second, and it moves while the stream plays. The palette follows the category, and
  brightness follows the hype curve. Ported from kick-timeline-with-recap/js/stage.js, with
  palettes keyed by category slug (this site's categories carry no numeric KICK id) rather
  than the source's KICK category ids.
*/

type Palette = { sky: [string, string]; ground: string; accent: string; sun: string };

const PALETTES: Record<string, Palette> = {
  "just-chatting": { sky: ["#241a2e", "#0d0a12"], ground: "#17121d", accent: "#8f6ad6", sun: "#c9a6ff" },
  "counter-strike-2": { sky: ["#12222b", "#070d11"], ground: "#0d171d", accent: "#3fa7c4", sun: "#7fe3ff" },
  "grand-theft-auto-v": { sky: ["#3a2418", "#0f0a07"], ground: "#1c130c", accent: "#e08b3a", sun: "#ffc46b" },
  "slots-casino": { sky: ["#2b1020", "#0e050a"], ground: "#1b0a14", accent: "#e0407f", sun: "#ff8fc0" },
};

const DEFAULT_PALETTE = PALETTES["just-chatting"];

function paletteFor(slug: string) {
  return PALETTES[slug] || DEFAULT_PALETTE;
}

function lighten(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  r = Math.round(r + (255 - r) * amount);
  g = Math.round(g + (255 - g) * amount);
  b = Math.round(b + (255 - b) * amount);
  return `rgb(${r},${g},${b})`;
}

function thumbnailPalette(p: Palette): Palette {
  return {
    sky: [lighten(p.sky[0], 0.32), lighten(p.sky[1], 0.16)],
    ground: lighten(p.ground, 0.22),
    accent: lighten(p.accent, 0.15),
    sun: lighten(p.sun, 0.1),
  };
}

function drawSky(ctx: CanvasRenderingContext2D, p: Palette, width: number, horizon: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, horizon);
  grad.addColorStop(0, p.sky[0]);
  grad.addColorStop(1, p.sky[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, horizon);
}

function drawSun(
  ctx: CanvasRenderingContext2D,
  p: Palette,
  t: number,
  width: number,
  height: number,
  horizon: number,
  alpha: number,
) {
  const x = width * (0.5 + Math.sin(t / 240) * 0.28);
  const y = horizon - height * 0.16;
  const glow = ctx.createRadialGradient(x, y, 0, x, y, height * 0.34);
  glow.addColorStop(0, p.sun);
  glow.addColorStop(0.18, p.accent);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = alpha;
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, horizon);
  ctx.globalAlpha = 1;
}

function drawSkyline(
  ctx: CanvasRenderingContext2D,
  p: Palette,
  t: number,
  width: number,
  height: number,
  horizon: number,
) {
  const bands = [
    { speed: 6, scale: 0.3, alpha: 0.3, step: 74 },
    { speed: 17, scale: 0.44, alpha: 0.48, step: 96 },
    { speed: 41, scale: 0.62, alpha: 0.74, step: 128 },
  ];
  bands.forEach((band, layer) => {
    ctx.fillStyle = p.ground;
    ctx.globalAlpha = band.alpha;
    const offset = (t * band.speed) % band.step;
    for (let i = -1; i * band.step - offset < width + band.step; i++) {
      const x = i * band.step - offset;
      const seed = Math.sin((i + layer * 31) * 12.9898) * 43758.5453;
      const tall = seed - Math.floor(seed);
      const h = height * band.scale * (0.45 + tall * 0.55);
      ctx.fillRect(x, horizon - h, band.step * 0.72, h);
    }
  });
  ctx.globalAlpha = 1;
}

function drawGround(ctx: CanvasRenderingContext2D, p: Palette, t: number, width: number, height: number, horizon: number) {
  ctx.fillStyle = p.ground;
  ctx.fillRect(0, horizon, width, height - horizon);

  ctx.strokeStyle = p.accent;
  ctx.globalAlpha = 0.16;
  ctx.lineWidth = 1;
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(width / 2 + i * 26, horizon);
    ctx.lineTo(width / 2 + i * width * 0.16, height);
    ctx.stroke();
  }
  const travel = (t * 34) % 60;
  for (let row = 0; row < 9; row++) {
    const depth = (row * 60 + travel) / 540;
    const y = horizon + Math.pow(depth, 2.4) * (height - horizon);
    if (y > height) continue;
    ctx.globalAlpha = 0.1 + depth * 0.18;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawGrain(ctx: CanvasRenderingContext2D, t: number, width: number, height: number) {
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 90; i++) {
    const seed = Math.sin((i + Math.floor(t * 12)) * 78.233) * 43758.5453;
    const r = seed - Math.floor(seed);
    const seed2 = Math.sin((i + Math.floor(t * 12)) * 12.9898) * 43758.5453;
    const r2 = seed2 - Math.floor(seed2);
    ctx.fillRect(r * width, r2 * height, 2, 2);
  }
  ctx.globalAlpha = 1;
}

function drawVignette(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const v = ctx.createRadialGradient(
    width / 2,
    height / 2,
    height * 0.25,
    width / 2,
    height / 2,
    height * 0.85,
  );
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,.62)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, width, height);
}

function draw(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeline: Timeline,
  t: number,
  thumbnail: boolean,
) {
  if (!width || !height) return;
  const category = categoryAt(timeline, t);
  const base = paletteFor(category.slug);
  const p = thumbnail ? thumbnailPalette(base) : base;
  const hype = timeline.bucketAt(t).hype_score / 100;
  const horizon = height * 0.62;

  ctx.clearRect(0, 0, width, height);
  drawSky(ctx, p, width, horizon);
  drawSun(ctx, p, t, width, height, horizon, thumbnail ? 0.8 : 0.5);
  drawSkyline(ctx, p, t, width, height, horizon);
  drawGround(ctx, p, t, width, height, horizon);

  if (hype > 0.5) {
    ctx.globalAlpha = (hype - 0.5) * 0.5;
    ctx.fillStyle = p.sun;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;
  }

  drawGrain(ctx, t, width, height);
  if (!thumbnail) drawVignette(ctx, width, height);
}

/*
  Sizes a canvas ref once it has real layout, draws the scene for `t` on every change, and
  resizes (only, never redraws mid-resize) on a window resize. Sizing a canvas clears it, so
  that only ever happens on mount and on resize, never per frame.
*/
export function useStagePreview(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  timeline: Timeline,
  t: number,
  opts?: { thumbnail?: boolean },
) {
  const thumbnail = Boolean(opts?.thumbnail);
  const viewRef = useRef<{ ctx: CanvasRenderingContext2D; width: number; height: number } | null>(
    null,
  );

  const size = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const box = canvas.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(box.width * ratio);
    canvas.height = Math.round(box.height * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    viewRef.current = { ctx, width: box.width, height: box.height };
  }, [canvasRef]);

  useEffect(() => {
    size();
    window.addEventListener("resize", size);
    return () => window.removeEventListener("resize", size);
  }, [size]);

  useEffect(() => {
    if (!viewRef.current) size();
    const view = viewRef.current;
    if (!view) return;
    draw(view.ctx, view.width, view.height, timeline, t, thumbnail);
  }, [t, timeline, thumbnail, size]);
}
