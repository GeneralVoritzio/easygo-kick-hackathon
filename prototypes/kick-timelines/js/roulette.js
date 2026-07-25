/*
  The chance resolver for a poll.

  The winner is drawn before the animation starts. The wheel is then animated
  to land on it. The spin shows a result that already exists, so a browser
  source that reloads mid spin still lands on the same answer.
*/
(function (global) {
  'use strict';
  var KT = global.KT = global.KT || {};

  var SEGMENT_COLOURS = ['#B76BFF', '#3EA6FF', '#FF6BA9', '#FFB020', '#8AE1FF', '#7BE38A'];
  var SPIN_SECONDS = 5;

  var el = {}, state = null, rotation = 0;

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }

  function weights() {
    var opts = state.options;
    if (state.chance_weighting === 'even') return opts.map(function () { return 1 / opts.length; });
    var total = opts.reduce(function (s, o) { return s + o.votes_count; }, 0) || 1;
    return opts.map(function (o) { return o.votes_count / total; });
  }

  // Zero degrees is at the top of the wheel. Angles increase clockwise.
  function polar(r, deg) {
    var a = (deg - 90) * Math.PI / 180;
    return [r * Math.cos(a), r * Math.sin(a)];
  }

  function draw() {
    var w = weights(), start = 0, svg = '';
    state.bounds = [];

    w.forEach(function (share, i) {
      var sweep = share * 360, end = start + sweep;
      state.bounds.push({ start: start, end: end });
      var colour = SEGMENT_COLOURS[i % SEGMENT_COLOURS.length];

      if (share > 0.999) {
        svg += '<circle cx="0" cy="0" r="96" fill="' + colour + '" fill-opacity=".85"/>';
      } else {
        var a = polar(96, start), b = polar(96, end);
        svg += '<path d="M0 0 L' + a[0].toFixed(2) + ' ' + a[1].toFixed(2) +
          ' A96 96 0 ' + (sweep > 180 ? 1 : 0) + ' 1 ' + b[0].toFixed(2) + ' ' + b[1].toFixed(2) + ' Z"' +
          ' fill="' + colour + '" fill-opacity=".85" stroke="#0B0E0F" stroke-width="1.5"/>';
      }

      if (sweep > 22) {
        var m = polar(62, start + sweep / 2);
        svg += '<text x="' + m[0].toFixed(2) + '" y="' + m[1].toFixed(2) + '" fill="#0B0E0F"' +
          ' font-size="15" font-weight="800" text-anchor="middle" dominant-baseline="central">' + (i + 1) + '</text>';
      }
      start = end;
    });

    svg += '<circle cx="0" cy="0" r="22" fill="#0B0E0F" stroke="#3A4245" stroke-width="1.5"/>';
    svg += '<circle cx="0" cy="0" r="6" fill="#53FC18"/>';
    el.wheel.innerHTML = '<g id="rlSpinner" style="transform:rotate(' + rotation +
      'deg);transform-origin:0 0">' + svg + '</g>';

    el.legend.innerHTML = state.options.map(function (o, i) {
      var won = state.resolved_option_id === o.option_id;
      return '<li class="' + (won ? 'is-won' : '') + '">' +
        '<i style="background:' + SEGMENT_COLOURS[i % SEGMENT_COLOURS.length] + '"></i>' +
        '<span>' + (i + 1) + '. ' + esc(o.label) + '</span>' +
        '<b>' + (w[i] * 100).toFixed(1) + '%</b></li>';
    }).join('');
  }

  function drawWinner() {
    var w = weights(), roll = Math.random(), acc = 0;
    for (var i = 0; i < w.length; i++) {
      acc += w[i];
      if (roll <= acc) return i;
    }
    return w.length - 1;
  }

  function spin() {
    if (state.is_spinning) return;
    state.is_spinning = true;
    state.resolved_option_id = null;
    el.spin.disabled = true;
    el.result.hidden = true;
    draw();

    var idx = drawWinner(), b = state.bounds[idx], sweep = b.end - b.start;
    // Land inside the middle of the wedge, so repeat spins do not look identical.
    var landing = b.start + sweep * (0.15 + Math.random() * 0.7);
    var turns = 5 + Math.floor(Math.random() * 2);
    var target = rotation + turns * 360 + ((360 - landing) - (rotation % 360) + 360) % 360;
    var spinner = el.wheel.querySelector('#rlSpinner');
    var reduced = global.matchMedia && global.matchMedia('(prefers-reduced-motion:reduce)').matches;

    rotation = target;
    if (reduced) {
      spinner.style.transform = 'rotate(' + rotation + 'deg)';
      finish(idx);
      return;
    }

    spinner.style.transition = 'transform ' + SPIN_SECONDS + 's cubic-bezier(.12,.72,.12,1.006)';
    void spinner.getBoundingClientRect();
    spinner.style.transform = 'rotate(' + rotation + 'deg)';
    global.setTimeout(function () { finish(idx); }, SPIN_SECONDS * 1000 + 120);
  }

  function finish(idx) {
    var opt = state.options[idx], pct = (weights()[idx] * 100).toFixed(1);
    state.is_spinning = false;
    state.resolved_option_id = opt.option_id;
    el.spin.disabled = false;
    el.spin.textContent = 'Spin again';

    el.result.hidden = false;
    el.result.innerHTML = '<div class="eyebrow">poll.resolved · ' + esc(state.chance_weighting) + '</div>' +
      '<strong>' + esc(opt.label) + '</strong>' +
      '<div class="rl__foot" style="margin-top:6px">The wheel drew this option at ' + pct + '% odds.</div>';

    draw();
    var spinner = el.wheel.querySelector('#rlSpinner');
    if (spinner) spinner.style.transform = 'rotate(' + rotation + 'deg)';
    if (state.onResolved) state.onResolved(opt, state);
  }

  function open(poll) {
    state = {
      question: poll.question,
      options: poll.options.map(function (o) {
        return { option_id: o.option_id, label: o.label, votes_count: o.votes_count };
      }),
      chance_weighting: poll.chance_weighting || 'viewer_weighted',
      resolved_option_id: poll.resolved_option_id || null,
      is_spinning: false,
      onResolved: poll.onResolved
    };
    rotation = 0;
    el.title.textContent = poll.question;
    el.spin.textContent = 'Spin the wheel';
    el.spin.disabled = false;
    el.result.hidden = true;
    Array.prototype.forEach.call(document.getElementsByName('rlmode'), function (r) {
      r.checked = r.value === state.chance_weighting;
    });
    draw();
    el.modal.hidden = false;
    el.spin.focus();
  }

  function close() {
    if (state && state.is_spinning) return;
    el.modal.hidden = true;
  }

  function init() {
    el.modal = $('roulette');
    el.wheel = $('rlWheel');
    el.legend = $('rlLegend');
    el.result = $('rlResult');
    el.spin = $('rlSpin');
    el.title = $('rlTitle');
    el.close = $('rlClose');

    el.close.addEventListener('click', close);
    el.modal.addEventListener('click', function (e) { if (e.target === el.modal) close(); });
    el.spin.addEventListener('click', spin);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !el.modal.hidden) close();
    });
    Array.prototype.forEach.call(document.getElementsByName('rlmode'), function (r) {
      r.addEventListener('change', function () {
        if (!state || state.is_spinning) return;
        state.chance_weighting = r.value;
        draw();
      });
    });
  }

  KT.roulette = { init: init, open: open, close: close, SPIN_SECONDS: SPIN_SECONDS };
})(window);
