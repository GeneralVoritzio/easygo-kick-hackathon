/*
  The timeline. Three layers share one track: the metric curve, peak pins on
  the curve, and event markers along the bottom. Hover shows a preview.
  Click moves the playhead.
*/
(function (global) {
  'use strict';
  var KT = global.KT = global.KT || {};
  var api = KT.api;

  var METRICS = {
    hype_score: { label: 'Hype', colour: 'var(--m-hype)', window: 2, mode: 'avg', unit: '', fmt: function (v) { return v.toFixed(1); } },
    viewer_count: { label: 'Viewers', colour: 'var(--m-viewers)', window: 3, mode: 'avg', unit: 'viewers', fmt: fmtInt },
    messages_count: { label: 'Chat', colour: 'var(--m-chat)', window: 4, mode: 'sum', unit: 'msgs/min', fmt: fmtInt },
    follows_count: { label: 'Follows', colour: 'var(--m-follows)', window: 12, mode: 'sum', unit: 'per 3min', fmt: fmtInt },
    subscriptions_count: { label: 'Subs', colour: 'var(--m-subs)', window: 12, mode: 'sum', unit: 'per 3min', fmt: fmtInt },
    kicks_amount: { label: 'Kicks', colour: 'var(--m-kicks)', window: 12, mode: 'sum', unit: 'per 3min', fmt: fmtInt }
  };

  var CATEGORY_COLOUR = { 15: '#3EA6FF', 28: '#FFB020', 8: '#B76BFF', 3: '#FF6BA9' };

  var ICONS = {
    clip: '<path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>',
    poll: '<path d="M18 20V10M12 20V4M6 20v-6"/>',
    category_change: '<path d="M4 17h6l4-10h6"/><path d="m17 4 3 3-3 3"/><path d="M4 7h3"/>',
    raid: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m19 8 2 2 2-2"/>',
    kicks: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
    milestone: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    livestream_status: '<circle cx="12" cy="12" r="3"/><path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 16.5a6.4 6.4 0 0 0 0-9"/>',
    peak: '<path d="m3 20 6-12 4 7 3-5 5 10Z"/>'
  };

  var el = {}, opts = {}, metric = 'hype_score';
  var display = [], peaks = [], geometry = {}, openKey = null;

  function fmtInt(v) { return Math.round(v).toLocaleString('en-AU'); }

  function hms(s) {
    s = Math.max(0, Math.floor(s));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }

  function icon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.peak) + '</svg>';
  }

  function tag(text, cls) { return '<span class="tag ' + (cls || '') + '">' + esc(text) + '</span>'; }

  /*
    Sparse counts (follows, subs, kicks) are rolled up over a window, so the
    curve reads as a mountain range and not a barcode. Continuous values are
    smoothed instead.
  */
  function buildSeries() {
    var rows = api.getBuckets(), cfg = METRICS[metric], w = cfg.window, out = [];
    for (var i = 0; i < rows.length; i++) {
      var lo = Math.max(0, i - Math.floor(w / 2)), hi = Math.min(rows.length - 1, lo + w - 1);
      var acc = 0, n = 0;
      for (var j = lo; j <= hi; j++) { acc += rows[j][metric] || 0; n++; }
      out.push(cfg.mode === 'sum' ? acc : acc / n);
    }
    display = out;
  }

  function findPeaks(values, minGap, limit) {
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var cut = sorted[Math.floor(sorted.length * 0.86)] || 0;
    var found = [];
    for (var i = 2; i < values.length - 2; i++) {
      if (values[i] <= cut) continue;
      if (values[i] >= values[i - 1] && values[i] >= values[i + 1] &&
        values[i] > values[i - 2] && values[i] > values[i + 2]) {
        found.push({ index: i, value: values[i], t: i * api.BUCKET_SECONDS });
      }
    }
    found.sort(function (a, b) { return b.value - a.value; });
    var out = [];
    found.forEach(function (c) {
      for (var k = 0; k < out.length; k++) if (Math.abs(out[k].index - c.index) < minGap) return;
      if (out.length < limit) { c.rank = out.length + 1; out.push(c); }
    });
    return out;
  }

  function paintCurve() {
    var n = display.length;
    if (!n) return;
    var max = 1;
    for (var i = 0; i < n; i++) if (display[i] > max) max = display[i];

    var W = 1000, H = 132, TOP = 10, BOT = 6, pts = [];
    for (var k = 0; k < n; k++) {
      pts.push([(k / (n - 1)) * W, H - BOT - (display[k] / max) * (H - TOP - BOT)]);
    }
    var line = 'M' + pts.map(function (p) { return p[0].toFixed(2) + ' ' + p[1].toFixed(2); }).join('L');
    var area = line + 'L' + W + ' ' + H + 'L0 ' + H + 'Z';

    document.getElementById('lineLit').setAttribute('d', line);
    document.getElementById('lineDim').setAttribute('d', line);
    document.getElementById('areaLit').setAttribute('d', area);
    document.getElementById('areaDim').setAttribute('d', area);
    el.track.style.setProperty('--m-active', METRICS[metric].colour);
    geometry = { max: max, H: H, TOP: TOP, BOT: BOT };
  }

  function paintSegments() {
    var segs = api.SEGMENTS, dur = opts.duration(), html = '';
    for (var i = 0; i < segs.length; i++) {
      var start = segs[i].at, end = (i + 1 < segs.length ? segs[i + 1].at : dur);
      if (start >= dur) break;
      html += '<i style="width:' + (((Math.min(end, dur) - start) / dur) * 100).toFixed(3) + '%;background:' +
        (CATEGORY_COLOUR[segs[i].category.id] || 'var(--border-strong)') + '" title="' + esc(segs[i].category.name) + '"></i>';
    }
    el.segments.innerHTML = html;
  }

  function paintMarkers() {
    var dur = opts.duration(), layers = opts.layers(), html = '';

    api.getMarkers().forEach(function (m) {
      if (m.offset_seconds > dur) return;
      var group = ['raid', 'kicks', 'milestone', 'livestream_status'].indexOf(m.type) !== -1 ? 'peak' : m.type;
      if (layers.indexOf(group) === -1) return;
      html += '<button class="mk mk--' + m.type + (m.is_new ? ' mk--new' : '') + '" data-marker="' + m.id + '"' +
        ' style="left:' + ((m.offset_seconds / dur) * 100).toFixed(3) + '%"' +
        ' aria-label="' + esc(m.title) + ' at ' + hms(m.offset_seconds) + '"' +
        ' title="' + esc(m.title) + '">' + icon(m.type) + '</button>';
      m.is_new = false;
    });

    if (layers.indexOf('peak') !== -1) {
      peaks.forEach(function (p) {
        var y = geometry.H - geometry.BOT - (p.value / geometry.max) * (geometry.H - geometry.TOP - geometry.BOT);
        html += '<button class="pk" data-peak="' + p.index + '" style="left:' +
          ((p.t / dur) * 100).toFixed(3) + '%;top:' + ((y / geometry.H) * 100).toFixed(2) + '%"' +
          ' aria-label="Peak number ' + p.rank + ' at ' + hms(p.t) + '" title="Peak ' + p.rank + '">' +
          (p.rank <= 3 ? '<span class="pk__rank">' + p.rank + '</span>' : '') + '</button>';
      });
    }
    el.markers.innerHTML = html;
  }

  function paintRuler() {
    var dur = opts.duration(), step = dur > 7200 ? 1800 : dur > 1800 ? 600 : 120, html = '';
    for (var t = 0; t <= dur; t += step) {
      html += '<span style="left:' + ((t / dur) * 100).toFixed(3) + '%">' + hms(t).replace(/^00:/, '') + '</span>';
    }
    el.ruler.innerHTML = html;
  }

  function render() {
    buildSeries();
    peaks = findPeaks(display, Math.floor(240 / api.BUCKET_SECONDS), 8);
    paintCurve();
    paintSegments();
    paintMarkers();
    paintRuler();
    setPlayhead(opts.playhead());
  }

  function setPlayhead(t) {
    var dur = opts.duration(), pct = Math.max(0, Math.min(1, t / dur));
    el.playhead.style.left = (pct * 100).toFixed(4) + '%';
    document.getElementById('clipRect').setAttribute('width', (pct * 1000).toFixed(2));
    el.track.setAttribute('aria-valuenow', Math.round(t));
    el.track.setAttribute('aria-valuemax', Math.round(dur));
    el.track.setAttribute('aria-valuetext', hms(t) + ' of ' + hms(dur));
  }

  function scenePaint(t) {
    var colour = CATEGORY_COLOUR[api.categoryAt(t).id] || '#3A4245';
    return 'background:radial-gradient(120% 120% at 30% 20%,' + colour + '38,transparent 60%),' +
      'linear-gradient(160deg,#101416,#0B0E0F 70%)';
  }

  function previewShell(t, kicker, title, sub, body, source) {
    return '<div class="preview__thumb" style="' + scenePaint(t) + '">' +
        '<div class="stage__grain"></div>' +
        '<div class="preview__thumbcat">' + esc(api.categoryAt(t).name) + '</div>' +
        '<span class="preview__play">preview</span>' +
        '<span class="preview__stamp">' + hms(t) + '</span>' +
      '</div>' +
      '<div class="preview__body">' +
        '<div class="preview__kicker">' + kicker + '</div>' +
        '<h4 class="preview__title">' + esc(title) + '</h4>' +
        (sub ? '<p class="preview__sub">' + sub + '</p>' : '') +
        body +
        '<div class="preview__hint">Click to go to this point.</div>' +
        (source ? '<div class="preview__src">' + esc(source) + '</div>' : '') +
      '</div>';
  }

  function deltaCell(v, suffix) {
    return '<b class="' + (v > 0 ? 'pos' : v < 0 ? 'neg' : '') + '">' + (v > 0 ? '+' : '') + v + (suffix || '') + '</b>';
  }

  function impactRows(t) {
    var im = api.impactAt(t);
    if (!im) return '';
    return '<div class="preview__rows">' +
      '<div class="prow"><span>Viewers after 10 min</span>' + deltaCell(im.viewer_count_delta_pct, '%') + '</div>' +
      '<div class="prow"><span>' + fmtInt(im.viewer_count_before) + ' to ' + fmtInt(im.viewer_count_after) + '</span>' +
        '<b>' + (im.viewer_count_after >= im.viewer_count_before ? 'held'
          : 'lost ' + fmtInt(im.viewer_count_before - im.viewer_count_after)) + '</b></div>' +
      '<div class="prow"><span>Follows before and after</span><b>' + im.follows_count_before + ' to ' + im.follows_count_after + '</b></div>' +
      '<div class="prow"><span>Subs before and after</span><b>' + im.subscriptions_count_before + ' to ' + im.subscriptions_count_after + '</b></div>' +
    '</div>';
  }

  function voteBars(detail) {
    var total = detail.options.reduce(function (s, o) { return s + o.votes_count; }, 0) || 1;
    return '<div class="vbar">' + detail.options.map(function (o) {
      var pct = (o.votes_count / total) * 100;
      return '<div class="vbar__row ' + (o.is_winner ? 'is-winner' : '') + '">' +
        '<div class="vbar__top"><span>' + esc(o.label) + (o.is_winner ? ' (chosen)' : '') + '</span>' +
        '<b>' + pct.toFixed(0) + '%</b></div>' +
        '<div class="vbar__track"><i class="vbar__fill" style="width:' + pct.toFixed(1) + '%"></i></div></div>';
    }).join('') + '</div>';
  }

  function markerPreview(m) {
    var d = m.detail || {};
    if (m.type === 'clip') {
      return previewShell(m.offset_seconds,
        tag('Clip') + tag(d.flagged_role === 'broadcaster' ? 'Flagged by streamer' : 'Flagged by mod'),
        m.title,
        'by <b style="color:' + d.flagged_by.identity.username_color + '">' + esc(d.flagged_by.username) + '</b>, ' +
          d.duration_seconds + 's, ' + (d.trigger === 'chat_command' ? '!clip in chat' : 'streamer hotkey'),
        '<div class="preview__rows">' +
          '<div class="prow"><span>Views</span><b>' + fmtInt(d.view_count) + '</b></div>' +
          '<div class="prow"><span>Status</span><b>' + (d.is_published ? 'Published' : 'Draft, not posted') + '</b></div>' +
        '</div>',
        'timeline.marker.created, type=clip');
    }

    if (m.type === 'poll') {
      var chance = d.resolution_mode === 'chance';
      return previewShell(m.offset_seconds,
        tag('Poll') + tag(chance ? 'Up to chance' : 'Up to viewers', chance ? '' : 'tag--good'),
        d.question,
        fmtInt(d.votes_count) + ' votes, open for ' + d.duration_seconds + 's' +
          (chance ? ', ' + (d.chance_weighting === 'even' ? 'even split' : 'weighted by votes') : ''),
        voteBars(d) + (chance ? '<div class="preview__hint" style="color:var(--m-subs)">Click to see the wheel again.</div>' : ''),
        chance ? 'poll.resolved, resolution_mode=chance' : 'poll.resolved, resolution_mode=viewer_vote');
    }

    if (m.type === 'category_change') {
      var im = api.impactAt(m.offset_seconds);
      var bad = im && im.viewer_count_delta_pct < -5;
      return previewShell(m.offset_seconds,
        tag('Decision') + tag(bad ? 'Lost viewers' : 'Held the room', bad ? 'tag--bad' : 'tag--good'),
        d.category_from.name + ' to ' + d.category_to.name,
        'The streamer changed category here.',
        impactRows(m.offset_seconds),
        'livestream.metadata.updated');
    }

    if (m.type === 'raid') {
      return previewShell(m.offset_seconds, tag('Raid'), m.title,
        'plus ' + fmtInt(d.viewer_count_gained) + ' viewers from <b>' + esc(d.raider.username) + '</b>',
        impactRows(m.offset_seconds),
        'chat.message.sent and a step change in viewer_count');
    }

    if (m.type === 'kicks') {
      return previewShell(m.offset_seconds, tag('Kicks'), m.title,
        '"' + esc(d.gift.message) + '"',
        '<div class="preview__rows">' +
          '<div class="prow"><span>Amount</span><b>' + fmtInt(d.gift.amount) + ' kicks</b></div>' +
          '<div class="prow"><span>Tier</span><b>' + esc(d.gift.tier) + '</b></div>' +
          '<div class="prow"><span>Pinned</span><b>' + d.gift.pinned_time_seconds + 's</b></div>' +
        '</div>',
        'kicks.gifted');
    }

    if (m.type === 'milestone') {
      return previewShell(m.offset_seconds, tag('Subs'), m.title,
        fmtInt(d.giftees_count) + ' gifted by <b>' + esc(d.gifter.username) + '</b>',
        impactRows(m.offset_seconds), 'channel.subscription.gifts');
    }

    return previewShell(m.offset_seconds, tag('Stream'), m.title, '', '', m.source_event);
  }

  function peakPreview(p) {
    var cfg = METRICS[metric], row = api.getBuckets()[p.index];
    var lines = api.chatAt(p.t).map(function (c) {
      return '<div><b style="color:' + c.sender.identity.username_color + '">' + esc(c.sender.username) + '</b>' +
        '<span class="msg__sep">: </span>' + esc(c.content) + '</div>';
    }).join('');

    return previewShell(p.t,
      tag('Peak ' + p.rank) + tag(cfg.label),
      cfg.label + ' peak, ' + cfg.fmt(p.value) + (cfg.unit ? ' ' + cfg.unit : ''),
      'This is one of the 8 loudest moments in the stream.',
      '<div class="preview__rows">' +
        '<div class="prow"><span>Viewers here</span><b>' + fmtInt(row.viewer_count) + '</b></div>' +
        '<div class="prow"><span>Hype score</span><b>' + row.hype_score.toFixed(1) + '</b></div>' +
        '<div class="prow"><span>Chat</span><b>' + fmtInt(row.messages_count * 4) + '/min</b></div>' +
      '</div>' +
      '<div class="preview__chat">' + lines + '</div>',
      'derived from chat.message.sent, channel.followed, kicks.gifted');
  }

  function showPreview(html, rect, key) {
    openKey = key;
    el.preview.innerHTML = html;
    el.preview.hidden = false;
    var pr = el.preview.getBoundingClientRect();
    var left = Math.max(12, Math.min(global.innerWidth - pr.width - 12, rect.left + rect.width / 2 - pr.width / 2));
    var top = rect.top - pr.height - 12;
    if (top < 12) top = rect.bottom + 12;
    el.preview.style.left = left + 'px';
    el.preview.style.top = top + 'px';
  }

  function hidePreview() {
    el.preview.hidden = true;
    openKey = null;
  }

  function timeAt(clientX) {
    var r = el.track.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * opts.duration();
  }

  function markerById(id) {
    return api.getMarkers().filter(function (x) { return x.id === id; })[0];
  }

  function peakByIndex(i) {
    return peaks.filter(function (x) { return x.index === i; })[0];
  }

  function bind() {
    el.track.addEventListener('click', function (e) {
      var mk = e.target.closest('[data-marker]'), pk = e.target.closest('[data-peak]');
      if (mk) { opts.onMarkerClick(markerById(mk.dataset.marker)); return; }
      if (pk) { opts.onSeek(peakByIndex(+pk.dataset.peak).t); return; }
      opts.onSeek(timeAt(e.clientX));
    });

    el.track.addEventListener('mousemove', function (e) {
      var mk = e.target.closest('[data-marker]'), pk = e.target.closest('[data-peak]');
      var trackRect = el.track.getBoundingClientRect();
      el.hoverline.hidden = false;
      el.hoverline.style.left = ((timeAt(e.clientX) / opts.duration()) * 100) + '%';

      if (mk) {
        if (openKey !== 'm' + mk.dataset.marker) {
          showPreview(markerPreview(markerById(mk.dataset.marker)), mk.getBoundingClientRect(), 'm' + mk.dataset.marker);
        }
        return;
      }
      if (pk) {
        if (openKey !== 'p' + pk.dataset.peak) {
          showPreview(peakPreview(peakByIndex(+pk.dataset.peak)), pk.getBoundingClientRect(), 'p' + pk.dataset.peak);
        }
        return;
      }

      var t = timeAt(e.clientX), idx = Math.min(display.length - 1, Math.round(t / api.BUCKET_SECONDS));
      var row = api.getBuckets()[idx];
      if (!row) return;
      var cfg = METRICS[metric];
      showPreview(
        previewShell(t, tag(cfg.label), cfg.fmt(display[idx]) + (cfg.unit ? ' ' + cfg.unit : ''),
          fmtInt(row.viewer_count) + ' watching, hype ' + row.hype_score.toFixed(1), '', ''),
        { left: e.clientX, width: 0, top: trackRect.top, bottom: trackRect.bottom },
        'scrub');
    });

    el.track.addEventListener('mouseleave', function () {
      el.hoverline.hidden = true;
      hidePreview();
    });

    el.track.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 300 : 30;
      if (e.key === 'ArrowRight') { opts.onSeek(opts.playhead() + step); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { opts.onSeek(opts.playhead() - step); e.preventDefault(); }
      if (e.key === 'Home') { opts.onSeek(0); e.preventDefault(); }
      if (e.key === 'End') { opts.onSeek(opts.duration()); e.preventDefault(); }
    });
  }

  function init(o) {
    opts = o;
    el.track = document.getElementById('tlTrack');
    el.markers = document.getElementById('tlMarkers');
    el.segments = document.getElementById('tlSegments');
    el.ruler = document.getElementById('tlRuler');
    el.playhead = document.getElementById('tlPlayhead');
    el.hoverline = document.getElementById('tlHoverline');
    el.preview = document.getElementById('preview');
    bind();
    render();
  }

  KT.timeline = {
    init: init,
    render: render,
    setPlayhead: setPlayhead,
    setMetric: function (m) { metric = m; render(); },
    scenePaint: scenePaint,
    icon: icon,
    hms: hms,
    fmtInt: fmtInt,
    esc: esc,
    tag: tag,
    hidePreview: hidePreview
  };
})(window);
