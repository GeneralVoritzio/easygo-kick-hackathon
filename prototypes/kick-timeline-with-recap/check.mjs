/*
  Two checks, both for faults a reader cannot see on the screen.

  1. Type off the KICK scale. Design System Section 2: the scale is 12 14 16 18
     20 24 28 32 36 48, and there is no 11 and no 13. 10px is allowed only where
     Site Reference Section 5 measured it.
  2. The clip preview. It draws about 60 times a second, so it must size each
     canvas once and leave the player frame alone. Sizing a canvas clears it, and
     a preview that measures zero draws nothing. Both look like an empty box.
*/
import { readFileSync } from 'node:fs';
import { runInThisContext } from 'node:vm';

const read = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
const faults = [];

function typeScale() {
  const SCALE = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48];
  const TEN_PX_ALLOWED = ['.avatar__live'];

  for (const file of ['css/kick.css', 'css/player.css', 'css/clip.css', 'css/expedition.css']) {
    let selector = '';
    read(file).split('\n').forEach((line, i) => {
      if (line.includes('{')) selector = line.slice(0, line.indexOf('{')).trim() || selector;
      for (const match of line.matchAll(/font-size:\s*(\d+)px/g)) {
        const size = Number(match[1]);
        if (SCALE.includes(size)) continue;
        if (size === 10 && TEN_PX_ALLOWED.some((s) => selector.includes(s))) continue;
        faults.push(`${file}:${i + 1} ${size}px on ${selector}`);
      }
    });
  }
}

function clipPreview() {
  const rects = { frame: 0, preview: 0 };

  // A context belongs to one canvas, so each stub counts only its own draws.
  function canvasNamed(name, w, h) {
    let backing = 0;
    const context2d = {
      setTransform() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
      fillRect() { rects[name]++; },
      createLinearGradient: () => ({ addColorStop() {} }),
      createRadialGradient: () => ({ addColorStop() {} })
    };
    const target = {
      height: 0, sizings: 0,
      getBoundingClientRect: () => ({ width: w, height: h }),
      getContext: () => context2d
    };
    Object.defineProperty(target, 'width', {
      get: () => backing,
      set: (v) => { backing = v; target.sizings++; }
    });
    return target;
  }

  const frame = canvasNamed('frame', 1000, 562);
  const clip = canvasNamed('preview', 268, 151);

  let tick = null;
  globalThis.window = globalThis;
  globalThis.document = { getElementById: () => frame };
  globalThis.addEventListener = () => {};
  globalThis.devicePixelRatio = 2;

  for (const f of ['js/mock-api.js', 'js/moments.js', 'js/stage.js']) {
    runInThisContext(read(f), { filename: f });
  }
  globalThis.KT2.player = { state: { t: 600 }, on: (fn) => { tick = fn; } };
  globalThis.KT2.stage.mount();

  const drawAt = globalThis.KT2.stage.preview(clip);
  rects.frame = 0;
  rects.preview = 0;
  drawAt(3948);
  drawAt(3949);
  drawAt(3950);

  if (!rects.preview) faults.push('the clip preview drew nothing');
  if (rects.frame) faults.push('the clip preview repaints the player frame every frame');
  if (clip.sizings !== 1) faults.push(`the preview is sized ${clip.sizings} times, which clears it`);
  if (frame.sizings !== 1) faults.push(`the player frame is sized ${frame.sizings} times, which clears it`);
  if (frame.width !== 2000) faults.push(`the player frame took the preview size, ${frame.width}`);

  rects.frame = 0;
  tick({ t: 600 });
  if (!rects.frame) faults.push('the player frame stopped drawing after a preview');
}

typeScale();
clipPreview();

if (faults.length) {
  console.error(`${faults.length} found:`);
  faults.forEach((f) => console.error('  ' + f));
  process.exit(1);
}

console.log("Type scale clean. The clip preview plays.");
