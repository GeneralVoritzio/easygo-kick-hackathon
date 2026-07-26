/*
  A moment is one row the viewer can jump to. Two things become a moment: a
  marker our recorder wrote, and a peak in the hype curve that no marker
  already covers.

  KICK publishes no timeline resource, so every endpoint named here is surface
  we invented. Each one carries a fake-kick label.
*/
(function (global) {
  'use strict';
  var KT2 = global.KT2 = global.KT2 || {};
  var api = global.KT.api;

  KT2.FAKE_SOURCES = {
    markers: 'fake-kick GET /public/v1/timelines/{livestream_id}/markers',
    window: 'fake-kick GET /public/v1/timelines/{livestream_id}/window',
    reactions: 'fake-kick POST /public/v1/timelines/markers/{marker_id}/reactions',
    marker_created: 'fake-kick timeline.marker.created'
  };

  var GROUPS = {
    clip: 'clip', raid: 'raid', kicks: 'kicks', milestone: 'kicks',
    poll: 'poll', category_change: 'category_change'
  };

  var LABELS = {
    peak: 'Peak', clip: 'Clip', raid: 'Raid', kicks: 'Gift',
    poll: 'Poll', category_change: 'Category'
  };

  var buckets = api.getBuckets();

  function bucketAt(t) {
    var i = Math.max(0, Math.min(buckets.length - 1, Math.round(t / api.BUCKET_SECONDS)));
    return buckets[i];
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function hms(t) {
    var s = Math.max(0, Math.floor(t));
    return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor((s % 3600) / 60)) + ':' + pad(s % 60);
  }

  // A clip length and a replay stamp read as minutes and seconds, never hours.
  function mmss(t) {
    var s = Math.max(0, Math.floor(t));
    return pad(Math.floor(s / 60)) + ':' + pad(s % 60);
  }

  function abbreviate(n) {
    return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K' : String(n);
  }

  /*
    A KICK handle is camel case as often as it is split by a separator, so
    ClutchGoblin has to read as CG and not CL. A capital after the first letter
    wins, then a separator, then the first two letters.
  */
  function initials(name) {
    var letters = name.replace(/[^A-Za-z]/g, '');
    if (!letters) return '??';
    var capital = letters.slice(1).match(/[A-Z]/);
    if (capital) return (letters[0] + capital[0]).toUpperCase();
    var words = name.split(/[^A-Za-z]+/).filter(Boolean);
    if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
    return letters.slice(0, 2).toUpperCase();
  }

  function findPeaks(minGap, limit) {
    var values = buckets.map(function (r) { return r.hype_score; });
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var cut = sorted[Math.floor(sorted.length * 0.9)] || 0;
    var found = [];
    for (var i = 2; i < values.length - 2; i++) {
      if (values[i] <= cut) continue;
      if (values[i] >= values[i - 1] && values[i] >= values[i + 1] &&
        values[i] > values[i - 2] && values[i] > values[i + 2]) {
        found.push({ t: i * api.BUCKET_SECONDS, value: values[i] });
      }
    }
    found.sort(function (a, b) { return b.value - a.value; });
    var out = [];
    found.forEach(function (c) {
      for (var k = 0; k < out.length; k++) if (Math.abs(out[k].t - c.t) < minGap) return;
      if (out.length < limit) out.push(c);
    });
    return out;
  }

  function reactionsAt(t) {
    var row = bucketAt(t);
    return Math.round(row.viewer_count * (row.hype_score / 100) * 0.12);
  }

  function bylineFor(m) {
    var d = m.detail || {};
    if (m.type === 'clip') return 'Clipped by ' + d.flagged_by.username;
    if (m.type === 'raid') return d.viewer_count_gained.toLocaleString() + ' viewers arrived';
    if (m.type === 'kicks') return '"' + d.gift.message + '"';
    if (m.type === 'milestone') return d.giftees_count + ' subs gifted by ' + d.gifter.username;
    if (m.type === 'poll') {
      var win = d.options.filter(function (o) { return o.is_winner; })[0];
      return 'Chat picked: ' + win.label;
    }
    if (m.type === 'category_change') {
      var impact = api.impactAt(m.offset_seconds, 600);
      if (!impact) return 'Left ' + d.category_from.name;
      var pct = impact.viewer_count_delta_pct;
      return (pct < 0 ? 'Viewers down ' + Math.abs(pct) : 'Viewers up ' + pct) +
        '% in the next 10 minutes';
    }
    return '';
  }

  function titleFor(m) {
    if (m.type === 'category_change') return 'Switched to ' + m.detail.category_to.name;
    return m.title;
  }

  function fromMarker(m) {
    return {
      id: m.id,
      group: GROUPS[m.type],
      label: LABELS[GROUPS[m.type]],
      t: m.offset_seconds,
      duration: (m.detail || {}).duration_seconds || 0,
      view_count: (m.detail || {}).view_count || 0,
      title: titleFor(m),
      byline: bylineFor(m),
      source_event: m.source_event,
      hype: bucketAt(m.offset_seconds).hype_score,
      viewer_count: bucketAt(m.offset_seconds).viewer_count,
      reactions_count: reactionsAt(m.offset_seconds)
    };
  }

  function fromPeak(p) {
    var row = bucketAt(p.t);
    return {
      id: 'peak_' + p.t,
      group: 'peak',
      label: LABELS.peak,
      t: p.t,
      title: 'Chat went off',
      byline: Math.round(row.messages_count * (60 / api.BUCKET_SECONDS)).toLocaleString() + ' messages a minute',
      source_event: api.KICK_SOURCES.chat_message_sent,
      hype: row.hype_score,
      viewer_count: row.viewer_count,
      reactions_count: reactionsAt(p.t)
    };
  }

  var moments = api.getMarkers()
    .filter(function (m) { return GROUPS[m.type]; })
    .map(fromMarker);

  findPeaks(240, 10).forEach(function (p) {
    var covered = moments.some(function (m) { return Math.abs(m.t - p.t) < 180; });
    if (!covered) moments.push(fromPeak(p));
  });

  moments.sort(function (a, b) { return a.t - b.t; });

  /*
    The rail must stay quiet, so only the loudest few moments get a notch.
    A category change is a streamer decision, not a moment to rewatch, so it
    never takes one of the slots.
  */
  function railPicks(limit, minGap) {
    var ranked = moments
      .filter(function (m) { return m.group !== 'category_change'; })
      .slice()
      .sort(function (a, b) { return b.hype - a.hype; });
    var out = [];
    ranked.forEach(function (m) {
      for (var i = 0; i < out.length; i++) if (Math.abs(out[i].t - m.t) < minGap) return;
      if (out.length < limit) out.push(m);
    });
    return out.sort(function (a, b) { return a.t - b.t; });
  }

  KT2.moments = {
    all: function () { return moments; },
    byGroup: function (group) {
      if (group === 'all') return moments;
      return moments.filter(function (m) { return m.group === group; });
    },
    railPicks: railPicks,
    missed: function (joinedAt, limit) {
      return moments
        .filter(function (m) { return m.t < joinedAt && m.group !== 'category_change'; })
        .sort(function (a, b) { return b.hype - a.hype; })
        .slice(0, limit)
        .sort(function (a, b) { return a.t - b.t; });
    },
    nearest: function (t, windowSeconds) {
      var best = null;
      moments.forEach(function (m) {
        var gap = Math.abs(m.t - t);
        if (gap <= windowSeconds && (!best || gap < Math.abs(best.t - t))) best = m;
      });
      return best;
    },
    react: function (id) {
      var m = moments.filter(function (x) { return x.id === id; })[0];
      if (!m || m.has_reacted) return m;
      m.reactions_count += 1;
      m.has_reacted = true;
      return m;
    },
    bucketAt: bucketAt,
    hms: hms,
    mmss: mmss,
    abbreviate: abbreviate,
    initials: initials
  };
})(window);
