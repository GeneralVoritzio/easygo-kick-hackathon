/*
  Viewer bookmarks. A viewer marks a point on the timeline, from the rail's
  hover card or from the bookmark toggle on any card. Each one comes back
  shaped like a moment, same as search.js, so it drops straight into the
  existing notch, pin and card rendering.

  KICK has no bookmarking surface, so this is invented, named to
  KICK-API-CONVENTIONS.md Part 2, modelled on the same
  `/public/v1/timelines/...` family the recorder's own markers use.
*/
(function (global) {
  'use strict';
  var KT2 = global.KT2 = global.KT2 || {};
  var moments = KT2.moments;

  var FAKE_SOURCES = {
    create: 'fake-kick POST /public/v1/timelines/bookmarks',
    created_event: 'fake-kick timeline.bookmark.created'
  };

  var NEAR_SECONDS = 90;
  var SAME_POINT_SECONDS = 1;

  var list = [];
  var seq = 0;

  function labelFor(t) {
    var near = moments.nearest(t, NEAR_SECONDS);
    return near ? near.title : 'Bookmarked moment';
  }

  KT2.bookmarks = {
    FAKE_SOURCES: FAKE_SOURCES,

    all: function () { return list; },

    at: function (t) {
      return list.filter(function (b) { return Math.abs(b.t - t) < SAME_POINT_SECONDS; })[0];
    },

    add: function (t, title) {
      var row = moments.bucketAt(t);
      var made = {
        id: 'bookmark_' + (seq++),
        group: 'bookmark',
        label: 'Bookmark',
        t: t,
        title: title || labelFor(t),
        byline: 'Bookmarked at ' + moments.hms(t),
        viewer_count: row.viewer_count,
        hype: row.hype_score,
        reactions_count: 0,
        has_reacted: false,
        source_event: FAKE_SOURCES.created_event
      };
      list.push(made);
      list.sort(function (a, b) { return a.t - b.t; });
      return made;
    },

    remove: function (id) {
      list = list.filter(function (b) { return b.id !== id; });
    },

    /*
      One button, one model: toggling a point that is already bookmarked
      removes it, toggling one that is not adds it. This is what every
      bookmark button on the page calls, whether it sits on a search hit,
      a moment card or the rail's own hover preview.
    */
    toggle: function (t, title) {
      var existing = KT2.bookmarks.at(t);
      if (existing) { KT2.bookmarks.remove(existing.id); return null; }
      return KT2.bookmarks.add(t, title);
    },

    react: function (id) {
      var m = list.filter(function (x) { return x.id === id; })[0];
      if (!m || m.has_reacted) return m;
      m.reactions_count += 1;
      m.has_reacted = true;
      return m;
    },

    find: function (id) {
      return list.filter(function (x) { return x.id === id; })[0];
    }
  };
})(window);
