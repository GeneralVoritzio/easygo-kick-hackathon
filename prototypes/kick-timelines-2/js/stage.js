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

  function resize() {
    var box = canvas.getBoundingClientRect();
    var ratio = Math.min(global.devicePixelRatio || 1, 2);
    width = box.width;
    height = box.height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function drawSky(p, horizon) {
    var grad = ctx.createLinearGradient(0, 0, 0, horizon);
    grad.addColorStop(0, p.sky[0]);
    grad.addColorStop(1, p.sky[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, horizon);
  }

  function drawSun(p, t, horizon) {
    var x = width * (0.5 + Math.sin(t / 240) * 0.28);
    var y = horizon - height * 0.16;
    var glow = ctx.createRadialGradient(x, y, 0, x, y, height * 0.34);
    glow.addColorStop(0, p.sun);
    glow.addColorStop(0.18, p.accent);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.5;
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

  function draw(t) {
    if (!width || !height) return;
    var p = palette(t);
    var hype = KT2.moments.bucketAt(t).hype_score / 100;
    var horizon = height * 0.62;

    ctx.clearRect(0, 0, width, height);
    drawSky(p, horizon);
    drawSun(p, t, horizon);
    drawSkyline(p, t, horizon);
    drawGround(p, t, horizon);

    if (hype > 0.5) {
      ctx.globalAlpha = (hype - 0.5) * 0.5;
      ctx.fillStyle = p.sun;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;
    }

    drawGrain(t);
    drawVignette();
  }

  KT2.stage = {
    mount: function () {
      canvas = document.getElementById('frameCanvas');
      ctx = canvas.getContext('2d');
      resize();
      global.addEventListener('resize', function () { resize(); draw(KT2.player.state.t); });
      KT2.player.on(function (state) { draw(state.t); });
    }
  };
})(window);
