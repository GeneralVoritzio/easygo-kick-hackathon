/*
  Text search over the timeline. A plain query searches the moment log (the
  same rows the overlay already lists: peaks, clips, raids, gifts, polls,
  category changes). `@chat <query>` (or `/chat <query>`, same thing) searches
  the chat log instead (js/mock-api.js's chatLog). Either way, a hit comes back shaped exactly
  like a moment, so scrubber.js and overlay.js can render it with the same
  notch, pin and card code they already have. Never a claim of a real
  transcript search: KICK gives no audio/video access, so a "moment" is
  always a marker or a peak, not a caption.

  KICK's public API has no search surface over a timeline or a chat log, so
  this endpoint is invented, named to KICK-API-CONVENTIONS.md Part 2.
*/
(function (global) {
  'use strict';
  var KT2 = global.KT2 = global.KT2 || {};
  var api = global.KT.api;
  var moments = KT2.moments;

  var FAKE_SOURCES = {
    search: 'fake-kick GET /public/v1/timelines/{livestream_id}/search'
  };

  var MIN_GAP_SECONDS = 120;
  var RESULT_LIMIT = 12;
  var CHAT_PREFIX = /^[@/]chat\b\s*/i;
  var STOPWORDS = { the: 1, and: 1, for: 1, are: 1, was: 1, with: 1, that: 1, this: 1 };

  var state = { query: '', scope: 'moments', results: [] };

  function parse(raw) {
    var trimmed = raw.trim();
    if (CHAT_PREFIX.test(trimmed)) return { scope: 'chat', query: trimmed.replace(CHAT_PREFIX, '').trim() };
    return { scope: 'moments', query: trimmed };
  }

  /*
    A viewer types a phrase ("streamer dies"), not necessarily one that
    appears verbatim in a title or a chat line ("Dies to a wallbang" has no
    literal substring "streamer dies"). This splits the query into words and
    keeps whichever ones carry meaning, so a hit only needs one of them,
    the way a real search box behaves rather than requiring an exact phrase.
  */
  function keywords(query) {
    var words = query.toLowerCase().split(/\s+/).filter(function (w) {
      return w.length > 2 && !STOPWORDS[w];
    });
    return words.length ? words : [query.toLowerCase().trim()];
  }

  /*
    A light plural/tense fallback ("dies" also tries "die", "raids" also
    tries "raid"), so a query in one form still catches content written in
    another. English is irregular enough that this will not catch every
    pair (dies/died/dying share no common stem this simple), which is why
    the mock chat and clip titles below deliberately cover more than one
    form of the same word, not just this rule.
  */
  function stemVariants(word) {
    var variants = [word];
    if (word.length > 4) {
      if (/ies$/.test(word)) variants.push(word.slice(0, -3) + 'y');
      else if (/s$/.test(word)) variants.push(word.slice(0, -1));
      if (/ed$/.test(word)) variants.push(word.slice(0, -2));
      if (/ing$/.test(word)) variants.push(word.slice(0, -3));
    }
    return variants;
  }

  function matchesAny(haystack, words) {
    return words.some(function (w) {
      return stemVariants(w).some(function (variant) { return haystack.indexOf(variant) !== -1; });
    });
  }

  function dedupe(hits) {
    var sorted = hits.slice().sort(function (a, b) { return a.t - b.t; });
    var kept = [];
    sorted.forEach(function (h) {
      var last = kept[kept.length - 1];
      if (last && h.t - last.t < MIN_GAP_SECONDS) return;
      kept.push(h);
    });
    return kept.slice(0, RESULT_LIMIT);
  }

  function matchMoments(query) {
    var words = keywords(query);
    return moments.all().filter(function (m) {
      return matchesAny(m.title.toLowerCase() + ' ' + m.byline.toLowerCase(), words);
    }).map(function (m) {
      var row = moments.bucketAt(m.t);
      return {
        id: 'search_moment_' + m.id,
        group: 'search_moment',
        label: 'Search',
        t: m.t,
        title: m.title,
        byline: m.byline,
        viewer_count: row.viewer_count,
        hype: row.hype_score,
        reactions_count: 0,
        has_reacted: false,
        source_event: FAKE_SOURCES.search
      };
    });
  }

  function matchChat(query) {
    var words = keywords(query);
    return api.getChatLog().filter(function (msg) {
      return matchesAny(msg.content.toLowerCase(), words);
    }).map(function (msg) {
      var row = moments.bucketAt(msg.t);
      return {
        id: 'search_chat_' + msg.id,
        group: 'search_chat',
        label: 'Chat',
        t: msg.t,
        title: msg.sender.username,
        byline: '"' + msg.content + '"',
        viewer_count: row.viewer_count,
        hype: row.hype_score,
        reactions_count: 0,
        has_reacted: false,
        source_event: api.KICK_SOURCES.chat_message_sent
      };
    });
  }

  KT2.search = {
    FAKE_SOURCES: FAKE_SOURCES,

    run: function (raw) {
      var parsed = parse(raw);
      state.query = parsed.query;
      state.scope = parsed.scope;
      state.results = parsed.query
        ? dedupe(parsed.scope === 'chat' ? matchChat(parsed.query) : matchMoments(parsed.query))
        : [];
      return state.results;
    },

    current: function () { return state.results; },
    query: function () { return state.query; },
    scope: function () { return state.scope; },
    hasRun: function () { return state.query !== ''; },

    clear: function () {
      state.query = '';
      state.results = [];
    },

    react: function (id) {
      var m = state.results.filter(function (x) { return x.id === id; })[0];
      if (!m || m.has_reacted) return m;
      m.reactions_count += 1;
      m.has_reacted = true;
      return m;
    },

    find: function (id) {
      return state.results.filter(function (x) { return x.id === id; })[0];
    }
  };
})(window);
