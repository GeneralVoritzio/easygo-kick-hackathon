/*
  The picture in the frame.

  KICK gives no video frames, so there is nothing to play. This draws our own
  scene instead. Every element is a function of the playhead, so the picture is
  exact at any point: scrubbing shows the frame for that second, and it moves
  while the stream plays.

  The scene reads the hype curve, so a loud moment is a brighter frame.
*/
(function (global) {
  'use strict';
  var KT2 = global.KT2 = global.KT2 || {};
  var api = global.KT.api;

  var PALETTES = {
    15: { sky: ['#241a2e', '#0d0a12'], ground: '#17121d', accent: '#8f6ad6', sun: '#c9a6ff' },
    28: { sky: ['#12222b', '#070d11'], ground: '#0d171d', accent: '#3fa7c4', sun: '#7fe3ff' },
    8: { sky: ['#3a2418', '#0f0a07'], ground: '#1c130c', accent: '#e08b3a', sun: '#ffc46b' },
    3: { sky: ['#2b1020', '#0e050a'], ground: '#1b0a14', accent: '#e0407f', sun: '#ff8fc0' }
  };

  var canvas, ctx, width = 0, height = 0;

  function palette(t) {
    return PALETTES[api.categoryAt(t).id] || PALETTES[15];
  }

  /*
    A thumbnail is small and sits under a bottom scrim, so the same moody,
    full-frame palette reads as a near-black smudge at 150 by 100. Lighten
    every colour toward white by a fixed amount for that context only —
    the main frame and the clip viewer, both large enough to hold the
    original mood, never pass this in.
  */
  function lighten(hex, amount) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(r + (255 - r) * amount);
    g = Math.round(g + (255 - g) * amount);
    b = Math.round(b + (255 - b) * amount);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function thumbnailPalette(t) {
    var p = palette(t);
    return {
      sky: [lighten(p.sky[0], 0.32), lighten(p.sky[1], 0.16)],
      ground: lighten(p.ground, 0.22),
      accent: lighten(p.accent, 0.15),
      sun: lighten(p.sun, 0.1)
    };
  }

  /*
    Sizing a canvas clears it, so it happens once per target and never per frame.
    A view is the three things every draw function reads.
  */
  function sizeTo(target) {
    var box = target.getBoundingClientRect();
    var ratio = Math.min(global.devicePixelRatio || 1, 2);
    target.width = Math.round(box.width * ratio);
    target.height = Math.round(box.height * ratio);
    var context = target.getContext('2d');
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { ctx: context, width: box.width, height: box.height };
  }

  function use(view) {
    ctx = view.ctx;
    width = view.width;
    height = view.height;
  }

  function resize() { use(sizeTo(canvas)); }

  function drawSky(p, horizon) {
    var grad = ctx.createLinearGradient(0, 0, 0, horizon);
    grad.addColorStop(0, p.sky[0]);
    grad.addColorStop(1, p.sky[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, horizon);
  }

  function drawSun(p, t, horizon, alpha) {
    var x = width * (0.5 + Math.sin(t / 240) * 0.28);
    var y = horizon - height * 0.16;
    var glow = ctx.createRadialGradient(x, y, 0, x, y, height * 0.34);
    glow.addColorStop(0, p.sun);
    glow.addColorStop(0.18, p.accent);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, horizon);
    ctx.globalAlpha = 1;
  }

  /*
    Three bands of blocks at different speeds. The far band barely moves, the
    near band moves fast, which is what makes the frame read as a moving camera.
  */
  function drawSkyline(p, t, horizon) {
    var bands = [
      { speed: 6, scale: 0.30, alpha: 0.30, step: 74 },
      { speed: 17, scale: 0.44, alpha: 0.48, step: 96 },
      { speed: 41, scale: 0.62, alpha: 0.74, step: 128 }
    ];
    bands.forEach(function (band, layer) {
      ctx.fillStyle = p.ground;
      ctx.globalAlpha = band.alpha;
      var offset = (t * band.speed) % band.step;
      for (var i = -1; i * band.step - offset < width + band.step; i++) {
        var x = i * band.step - offset;
        var seed = Math.sin((i + layer * 31) * 12.9898) * 43758.5453;
        var tall = (seed - Math.floor(seed));
        var h = height * band.scale * (0.45 + tall * 0.55);
        ctx.fillRect(x, horizon - h, band.step * 0.72, h);
      }
    });
    ctx.globalAlpha = 1;
  }

  function drawGround(p, t, horizon) {
    ctx.fillStyle = p.ground;
    ctx.fillRect(0, horizon, width, height - horizon);

    ctx.strokeStyle = p.accent;
    ctx.globalAlpha = 0.16;
    ctx.lineWidth = 1;
    for (var i = -8; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(width / 2 + i * 26, horizon);
      ctx.lineTo(width / 2 + i * width * 0.16, height);
      ctx.stroke();
    }
    var travel = (t * 34) % 60;
    for (var row = 0; row < 9; row++) {
      var depth = (row * 60 + travel) / 540;
      var y = horizon + Math.pow(depth, 2.4) * (height - horizon);
      if (y > height) continue;
      ctx.globalAlpha = 0.1 + depth * 0.18;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawGrain(t) {
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = '#ffffff';
    for (var i = 0; i < 90; i++) {
      var seed = Math.sin((i + Math.floor(t * 12)) * 78.233) * 43758.5453;
      var r = seed - Math.floor(seed);
      var seed2 = Math.sin((i + Math.floor(t * 12)) * 12.9898) * 43758.5453;
      var r2 = seed2 - Math.floor(seed2);
      ctx.fillRect(r * width, r2 * height, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  function drawVignette() {
    var v = ctx.createRadialGradient(width / 2, height / 2, height * 0.25, width / 2, height / 2, height * 0.85);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,.62)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, width, height);
  }

  function draw(t, opts) {
    if (!width || !height) return;
    var thumbnail = !!(opts && opts.thumbnail);
    var p = thumbnail ? thumbnailPalette(t) : palette(t);
    var hype = KT2.moments.bucketAt(t).hype_score / 100;
    var horizon = height * 0.62;

    ctx.clearRect(0, 0, width, height);
    drawSky(p, horizon);
    drawSun(p, t, horizon, thumbnail ? 0.8 : 0.5);
    drawSkyline(p, t, horizon);
    drawGround(p, t, horizon);

    if (hype > 0.5) {
      ctx.globalAlpha = (hype - 0.5) * 0.5;
      ctx.fillStyle = p.sun;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;
    }

    drawGrain(t);
    // A thumbnail is small and sits under a bottom scrim already: the
    // vignette's own edge-darkening on top of that is what read as a
    // near-black card, so a thumbnail skips it.
    if (!thumbnail) drawVignette();
  }

  KT2.stage = {
    mount: function () {
      canvas = document.getElementById('frameCanvas');
      resize();
      global.addEventListener('resize', function () { resize(); draw(KT2.player.state.t); });
      KT2.player.on(function (state) { draw(state.t); });
    },

    /*
      The scene is a function of the playhead, so a thumbnail is the same scene
      at a smaller size. Returns a function that draws one second into the
      target. The target must be laid out before this runs, or it measures zero.
      `opts.thumbnail` lightens the palette and drops the vignette, for a
      small preview sitting under its own text scrim (js/overlay.js's grid) —
      omit it for a preview meant to keep the main frame's full mood (the
      rail's hover card, the clip viewer).
    */
    preview: function (target, opts) {
      var view = sizeTo(target);
      return function (t) {
        var frame = { ctx: ctx, width: width, height: height };
        use(view);
        draw(t, opts);
        use(frame);
      };
    }
  };
})(window);
