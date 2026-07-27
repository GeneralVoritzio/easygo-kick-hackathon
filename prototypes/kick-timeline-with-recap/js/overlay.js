/*
  The highlights panel. It covers the video frame, not the page, so the
  viewer never leaves the stream. One filter row, one bento grid of live
  thumbnail tiles, cell size following hype (rankClasses, below).

  No hype curve here: the rail already draws that (js/scrubber.js's
  rail__spark), so repeating it here would just be the same graph twice.

  Two filters are not moment groups: Bookmarks lists what the viewer saved,
  Search lists the live query. Both come back shaped like a moment (see
  search.js and bookmarks.js), so they render with the same tile code every
  other group already uses.

  Every card opens the clip viewer on a press, a recorded clip or not
  (KT2.clip.fromPoint builds one on the spot for the rest, the same as the
  rail's own hover card), and never closes the panel: the viewer is still
  browsing it. Only the X does. The panel hides the floating widget while
  it is open (css/player.css), since it covers the whole frame the widget
  sits on, and the widget's own bubble is how a viewer gets back here in
  the first place.
*/
(function (global) {
  'use strict';
  var KT2 = global.KT2 = global.KT2 || {};
  var player = KT2.player, moments = KT2.moments;
  var api = global.KT.api;

  var MISSED_LIMIT = 3;

  var root, cardHost, missedBox, missedHost;
  var momentsHead, sub, searchInput, searchClear, filter = 'all';
  var lastRanQuery = '';
  var missedList = [];

  function listFor(f) {
    if (f === 'search') return KT2.search.current();
    if (f === 'bookmarks') return KT2.bookmarks.all();
    var base = moments.byGroup(f);
    if (f !== 'all') return base;
    return base.concat(KT2.bookmarks.all()).sort(function (a, b) { return a.t - b.t; });
  }

  function findAny(id) {
    return KT2.search.find(id) || KT2.bookmarks.find(id) ||
      moments.all().filter(function (m) { return m.id === id; })[0];
  }

  /*
    A bento grid, not a card grid: cell size follows hype_score (rankClass),
    so the loudest moments read as bigger tiles rather than every moment
    claiming the same footprint. Each tile's background is a live
    picture-in-the-frame thumbnail, js/stage.js's own drawing at that
    second (drawTilePreviews, below, paints it once the markup lands) — the
    same frame the rail's hover card and the clip viewer already show, not
    a flat category-coloured box. The badge, title, byline and meta sit in
    a bottom scrim over it, the way a real thumbnail grid reads.
  */
  function tileHtml(m, rankClass) {
    var isBookmarked = !!KT2.bookmarks.at(m.t);
    var icon = moments.iconFor(m.group);
    return '<article class="hltile hltile--' + rankClass + '" data-id="' + m.id + '">' +
      '<button class="hltile__go" data-seek="' + m.t + '" data-id="' + m.id + '">' +
      '<canvas class="hltile__canvas" data-t="' + m.t + '"></canvas>' +
      '<span class="hltile__scrim" aria-hidden="true"></span>' +
      '<span class="hltile__badge hltile__badge--' + m.group + '">' + (icon ? KT2.icons.get(icon, 14) : '') + '</span>' +
      '<span class="hltile__meta tabular">' + moments.hms(m.t) + ' · ' +
      moments.abbreviate(m.viewer_count) + '</span>' +
      '<span class="hltile__text">' +
      '<strong class="hltile__title">' + m.title + '</strong>' +
      '<span class="hltile__byline">' + m.byline + '</span>' +
      '</span>' +
      '</button>' +
      '<span class="hltile__actions">' +
      '<button class="hltilebookmark' + (isBookmarked ? ' is-on' : '') + '" data-bookmark="' + m.id + '" ' +
      'aria-pressed="' + (isBookmarked ? 'true' : 'false') + '" ' +
      'aria-label="' + (isBookmarked ? 'Remove bookmark' : 'Bookmark this point') + '">' +
      KT2.icons.get('bookmark', 13) + '</button>' +
      '<button class="hltileclip" data-clip="' + m.id + '" ' +
      'aria-label="Copy a shareable clip link, 20 seconds before and after">' +
      KT2.icons.get('clip', 13) + '</button>' +
      '<button class="hltilereact' + (m.has_reacted ? ' is-on' : '') + '" data-react="' + m.id + '" ' +
      'aria-pressed="' + (m.has_reacted ? 'true' : 'false') + '">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 20s-7-4.5-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.5-7 9-7 9Z"/></svg>' +
      '<span class="tabular">' + m.reactions_count.toLocaleString() + '</span></button>' +
      '</span>' +
      '</article>';
  }

  /*
    Rank by hype, not by the list's own order (moments.missed and every
    filter still read chronologically, so the loudest one is not
    necessarily first): the loudest moment in the current list gets the
    hero cell, the next couple get a wide cell, everyone else is compact.
    A short list (search down to one or two hits, a quiet filter) has
    nothing to rank against, so it skips straight to compact for all of it
    rather than blowing one lonely result up to a hero.
  */
  function rankClasses(list) {
    var byHype = list.slice().sort(function (a, b) { return b.hype - a.hype; });
    var classFor = {};
    byHype.forEach(function (m, i) {
      if (list.length >= 5 && i === 0) classFor[m.id] = 'hero';
      else if (list.length >= 3 && i < 3) classFor[m.id] = 'wide';
      else classFor[m.id] = 'compact';
    });
    return classFor;
  }

  // Canvases cannot draw from a template string, so the grid paints them
  // once the markup already has real layout to size against.
  function drawTilePreviews() {
    cardHost.querySelectorAll('.hltile__canvas').forEach(function (canvas) {
      KT2.stage.preview(canvas, { thumbnail: true })(+canvas.dataset.t);
    });
  }

  var LAYOUT_GAP = 10;
  var LAYOUT_TARGET_COL = 170;
  var LAYOUT_SPANS = { hero: 3, wide: 2, compact: 1 };

  /*
    A real masonry, not CSS grid: grid packs same-size row tracks, so a
    compact tile sitting in the same row as a hero left empty space under
    it, the row track stretched to the hero's height. This instead tracks
    each column's running height and drops every tile into whichever
    contiguous span of columns is shortest right now, the standard
    Pinterest-style placement, so tiles always pack flush against the
    shortest neighbour with nothing left over.

    Every tile is a fixed 16:9, computed here rather than left to
    aspect-ratio, since spans are in pixels once colWidth is known.
  */
  function layoutTiles(list, rankClass) {
    var containerWidth = cardHost.clientWidth;
    if (!containerWidth) return;
    var colCount = Math.max(1, Math.round((containerWidth + LAYOUT_GAP) / (LAYOUT_TARGET_COL + LAYOUT_GAP)));
    var colWidth = (containerWidth - (colCount - 1) * LAYOUT_GAP) / colCount;
    var colHeights = new Array(colCount).fill(0);
    var positions = {};

    list.forEach(function (m) {
      var span = Math.min(LAYOUT_SPANS[rankClass[m.id]] || 1, colCount);
      var bestStart = 0, bestHeight = Infinity;
      for (var s = 0; s <= colCount - span; s++) {
        var h = 0;
        for (var i = s; i < s + span; i++) h = Math.max(h, colHeights[i]);
        if (h < bestHeight) { bestHeight = h; bestStart = s; }
      }
      var tileWidth = span * colWidth + (span - 1) * LAYOUT_GAP;
      var tileHeight = tileWidth * 9 / 16;
      positions[m.id] = {
        left: bestStart * (colWidth + LAYOUT_GAP), top: bestHeight,
        width: tileWidth, height: tileHeight
      };
      for (var j = bestStart; j < bestStart + span; j++) colHeights[j] = bestHeight + tileHeight + LAYOUT_GAP;
    });

    cardHost.style.height = Math.max(0, Math.max.apply(null, colHeights) - LAYOUT_GAP) + 'px';
    cardHost.querySelectorAll('.hltile').forEach(function (tile) {
      var pos = positions[tile.dataset.id];
      if (!pos) return;
      tile.style.left = pos.left + 'px';
      tile.style.top = pos.top + 'px';
      tile.style.width = pos.width + 'px';
      tile.style.height = pos.height + 'px';
    });
  }

  /*
    A hover here narrows the glow to just this one tile's notch
    (KT2.scrubber.highlight), so a viewer sees exactly where in the stream
    it sits without having to leave the panel. Only a moment the rail put
    a notch on can glow; hovering any other tile just finds nothing to
    light and does nothing, which is fine. Leaving falls back to
    applyFilterGlow, not to nothing: on a filtered tab that means every
    notch of that kind, not just the one that was under the pointer.
  */
  function wireTileHover() {
    cardHost.querySelectorAll('.hltile').forEach(function (tile) {
      tile.addEventListener('mouseenter', function () { KT2.scrubber.highlight(tile.dataset.id); });
      tile.addEventListener('mouseleave', applyFilterGlow);
    });
  }

  // One tile, not a list: a viewer catches up with a single press, stories-style.
  function recapTileHtml(list) {
    var noun = list.length === 1 ? 'highlight' : 'highlights';
    return '<button class="recaptile" data-recap="1">' +
      '<span class="recaptile__icon">' + KT2.icons.get('play', 20) + '</span>' +
      '<span class="recaptile__text">' +
      '<strong class="recaptile__title">Catch up on what you missed</strong>' +
      '<span class="recaptile__sub">' + list.length + ' ' + noun + ' before you joined</span>' +
      '</span>' +
      '</button>';
  }

  function shareClip(button, t) {
    global.navigator.clipboard.writeText(KT2.clip.shareUrl(t)).then(function () {
      button.classList.add('is-copied');
      global.clearTimeout(button._copyTimer);
      button._copyTimer = global.setTimeout(function () { button.classList.remove('is-copied'); }, 2000);
    });
  }

  function headingFor(f, list) {
    if (f === 'all') return list.length + ' highlights so far';
    if (f === 'bookmarks') return list.length + (list.length === 1 ? ' bookmark' : ' bookmarks');
    if (f === 'search') {
      if (!KT2.search.hasRun()) return 'Type a query above to search';
      var noun = list.length === 1 ? ' match' : ' matches';
      return list.length + noun + (KT2.search.scope() === 'chat' ? ' in chat' : '');
    }
    return list.length + ' ' + f + ' highlights';
  }

  /*
    The rail's own moment.group is singular (bookmark), the Bookmarks chip's
    filter value is plural (bookmarks) — the one place the two vocabularies
    disagree. Every other filter value already equals its group.
  */
  function groupForFilter(f) { return f === 'bookmarks' ? 'bookmark' : f; }

  /*
    The rest state a hovered tile falls back to on mouseleave: nothing
    glowing on All (a glow here would mean nothing, everything is on the
    rail), every notch of the filtered kind glowing on any other filter
    (Peaks, Clips, Raids, Gifts, Polls, Bookmarks), and every search hit
    glowing on Search. Leaving Search for any other tab, including All,
    quiets a search hit's glow too — it stays on the rail, marking where it
    was found, but the panel is no longer about search results.
  */
  function applyFilterGlow() {
    KT2.scrubber.setSearchActive(filter === 'search');
    if (filter === 'all' || filter === 'search') KT2.scrubber.unhighlight();
    else KT2.scrubber.highlightGroup(groupForFilter(filter));
  }

  var lastList = [], lastRankClass = {};

  function renderCards() {
    var list = listFor(filter);
    var rankClass = rankClasses(list);
    lastList = list;
    lastRankClass = rankClass;
    cardHost.innerHTML = list.map(function (m) { return tileHtml(m, rankClass[m.id]); }).join('');
    momentsHead.textContent = headingFor(filter, list);
    layoutTiles(list, rankClass);
    drawTilePreviews();
    wireTileHover();
    applyFilterGlow();
  }

  /*
    Before you joined is a catch-up for the whole stream, not for one group,
    so it only belongs on the All tab. Every other filter, including Search
    and Bookmarks, is the viewer already narrowing to one kind of moment,
    where a recap of everything missed would be a non sequitur.
  */
  function renderMissed() {
    missedList = moments.missed(player.state.joinedAt, MISSED_LIMIT);
    missedBox.hidden = filter !== 'all' || missedList.length === 0;
    missedHost.innerHTML = missedList.length ? recapTileHtml(missedList) : '';
  }

  function setFilter(next) {
    filter = next;
    root.querySelectorAll('[data-filter]').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.filter === filter);
    });
    renderCards();
    renderMissed();
  }

  function runSearch() {
    KT2.search.run(searchInput.value);
    lastRanQuery = searchInput.value;
    searchClear.hidden = !searchInput.value;
    KT2.scrubber.refresh();
    setFilter('search');
  }

  /*
    A result on the timeline is a claim about the text in the box. The
    moment that text changes, or is deleted, the claim is stale, so the
    markers come down right away rather than waiting for a fresh Enter to
    replace them with new ones (or nothing).
  */
  function clearIfStale() {
    if (searchInput.value === lastRanQuery) return;
    lastRanQuery = searchInput.value;
    searchClear.hidden = !searchInput.value;
    if (!KT2.search.hasRun()) return;
    KT2.search.clear();
    KT2.scrubber.refresh();
    if (filter === 'search') renderCards();
  }

  KT2.overlay = {
    mount: function () {
      root = document.getElementById('overlay');
      cardHost = document.getElementById('momentCards');
      missedBox = document.getElementById('missed');
      missedHost = document.getElementById('missedCards');
      momentsHead = document.getElementById('momentsHead');
      sub = document.getElementById('overlaySub');
      searchInput = document.getElementById('overlaySearchInput');
      searchClear = document.getElementById('overlaySearchClear');

      sub.textContent = 'You joined at ' + moments.hms(player.state.joinedAt);

      // The masonry is computed in pixels off the panel's own width, so a
      // window resize while it is open needs a fresh layout pass, the same
      // way js/stage.js re-sizes its canvas on resize rather than only once.
      global.addEventListener('resize', function () {
        if (!KT2.overlay.isOpen()) return;
        layoutTiles(lastList, lastRankClass);
        drawTilePreviews();
      });

      searchInput.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        runSearch();
      });

      searchInput.addEventListener('input', clearIfStale);

      searchClear.addEventListener('click', function () {
        searchInput.value = '';
        clearIfStale();
        searchInput.focus();
      });

      root.addEventListener('click', function (e) {
        var chip = e.target.closest('[data-filter]');
        if (chip) { setFilter(chip.dataset.filter); return; }

        var recap = e.target.closest('[data-recap]');
        if (recap) { KT2.clip.openSequence(missedList); return; }

        var bookmark = e.target.closest('[data-bookmark]');
        if (bookmark) {
          var target = findAny(bookmark.dataset.bookmark);
          if (target) {
            KT2.bookmarks.toggle(target.t, target.title);
            KT2.scrubber.refresh();
            renderCards();
            renderMissed();
          }
          return;
        }

        var clipBtn = e.target.closest('[data-clip]');
        if (clipBtn) {
          var toShare = findAny(clipBtn.dataset.clip);
          if (toShare) shareClip(clipBtn, toShare.t);
          return;
        }

        var react = e.target.closest('[data-react]');
        if (react) {
          var m = moments.react(react.dataset.react) ||
            KT2.search.react(react.dataset.react) ||
            KT2.bookmarks.react(react.dataset.react);
          if (m) { renderCards(); renderMissed(); }
          return;
        }

        var go = e.target.closest('[data-seek]');
        if (!go) return;

        /*
          Every card opens the same viewer, the way the rail's own hover
          card already opens it for any point, not only a recorded clip
          (KT2.clip.fromPoint builds one on the spot for the rest). The
          panel stays open behind it — a viewer is still browsing it, and
          only the X closes it.
        */
        var toWatch = findAny(go.dataset.id);
        var clip = toWatch && toWatch.group === 'clip' ? toWatch : null;
        KT2.clip.open(clip || KT2.clip.fromPoint(+go.dataset.seek, toWatch));
      });

      document.getElementById('overlayClose').addEventListener('click', KT2.overlay.close);
    },

    isOpen: function () { return !root.hidden; },

    open: function () {
      root.hidden = false;
      document.getElementById('player').classList.add('is-panel-open');
      renderCards();
      renderMissed();
      document.getElementById('overlayClose').focus();
    },

    close: function () {
      root.hidden = true;
      document.getElementById('player').classList.remove('is-panel-open');
      KT2.scrubber.unhighlight();
    },

    toggle: function () { KT2.overlay.isOpen() ? KT2.overlay.close() : KT2.overlay.open(); },

    openSearch: function () {
      KT2.overlay.open();
      setFilter('search');
      searchInput.focus();
    },

    refreshBookmarkState: function () {
      renderCards();
      renderMissed();
    }
  };
})(window);
