/*
  The Highlights panel. It lives in the chat column now, css/kick.css's
  .chat__panel and this panel sharing one flex slot in <aside class="chat">
  — only one of the two ever shows at a time (is-highlights-open, toggled
  on that aside below). Three shapes came before this one: a pane over the
  video, a docked column beside it that shrank the video to make room, and
  a drawer below it that needed scrolling away from the video to read. This
  one touches neither the video's box nor its width, in either direction.

  Living at chat's width (280-460px) means a single column of compact rows
  (tileHtml, below), not a multi-column grid — there is no room for a grid
  to read as one here. Hype no longer sizes a tile, since there is no room
  for that to read at a glance either; the loudest moments simply sort
  first within whatever filter is active.

  No hype curve here: the rail already draws that (js/scrubber.js's
  rail__spark), so repeating it here would just be the same graph twice.

  Two filters are not moment groups: Bookmarks lists what the viewer saved,
  Search lists the live query. Both come back shaped like a moment (see
  search.js and bookmarks.js), so they render with the same row code every
  other group already uses.

  Every row opens the clip viewer on a press, a recorded clip or not
  (KT2.clip.fromPoint builds one on the spot for the rest, the same as the
  rail's own hover card), and never closes the panel: the viewer is still
  browsing it. Only the X does. Unlike the Expedition panel, this one does
  not hide the floating widget: it never sits on top of the frame the
  widget lives on, so there is nothing to cover.
*/
(function (global) {
  'use strict';
  var KT2 = global.KT2 = global.KT2 || {};
  var player = KT2.player, moments = KT2.moments;
  var api = global.KT.api;

  var MISSED_LIMIT = 3;

  var root, chatAside, playerEl, cardHost, missedBox, missedHost;
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
    A row, not a tile: this column is 280-460px wide, chat's own range, so
    a grid never had room to read as one. Each row's thumbnail is a live
    picture-in-the-frame still, js/stage.js's own drawing at that second
    (drawTilePreviews, below, paints it once the markup lands) — the same
    frame the rail's hover card and the clip viewer already show, not a
    flat category-coloured box.
  */
  function tileHtml(m) {
    var icon = moments.iconFor(m.group);
    return '<article class="hltile" data-id="' + m.id + '">' +
      '<button class="hltile__go" data-seek="' + m.t + '" data-id="' + m.id + '">' +
      '<span class="hltile__thumb">' +
      '<canvas class="hltile__canvas" data-t="' + m.t + '"></canvas>' +
      '<span class="hltile__badge hltile__badge--' + m.group + '">' + (icon ? KT2.icons.get(icon, 11) : '') + '</span>' +
      '</span>' +
      '<span class="hltile__text">' +
      '<strong class="hltile__title">' + m.title + '</strong>' +
      '<span class="hltile__byline">' + m.byline + '</span>' +
      '<span class="hltile__meta tabular">' + moments.hms(m.t) + ' · ' +
      moments.abbreviate(m.viewer_count) + '</span>' +
      '</span>' +
      '</button>' +
      '<span class="hltile__actions">' +
      '<button class="hltilereact' + (m.has_reacted ? ' is-on' : '') + '" data-react="' + m.id + '" ' +
      'aria-pressed="' + (m.has_reacted ? 'true' : 'false') + '">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 20s-7-4.5-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.5-7 9-7 9Z"/></svg>' +
      '<span class="tabular">' + m.reactions_count.toLocaleString() + '</span></button>' +
      '</span>' +
      '</article>';
  }

  // Canvases cannot draw from a template string, so the list paints them
  // once the markup already has real layout to size against.
  function drawTilePreviews() {
    cardHost.querySelectorAll('.hltile__canvas').forEach(function (canvas) {
      KT2.stage.preview(canvas, { thumbnail: true })(+canvas.dataset.t);
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

  /*
    Loudest first, not chronological: moments.missed and listFor both hand
    back a time-ordered list, but a single narrow column reads top to
    bottom, one at a time, so the order itself is what says "this one
    mattered most" now that a tile's size no longer can.
  */
  function renderCards() {
    var list = listFor(filter).slice().sort(function (a, b) { return b.hype - a.hype; });
    cardHost.innerHTML = list.map(tileHtml).join('');
    momentsHead.textContent = headingFor(filter, list);
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
      chatAside = document.getElementById('chatAside');
      playerEl = document.getElementById('player');
      cardHost = document.getElementById('momentCards');
      missedBox = document.getElementById('missed');
      missedHost = document.getElementById('missedCards');
      momentsHead = document.getElementById('momentsHead');
      sub = document.getElementById('overlaySub');
      searchInput = document.getElementById('overlaySearchInput');
      searchClear = document.getElementById('overlaySearchClear');

      sub.textContent = 'You joined at ' + moments.hms(player.state.joinedAt);

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

    /*
      Opening or closing this never touches the video's own box, or its
      width, at all — it only swaps which of chat's two panels is showing
      (css/kick.css's .chat.is-highlights-open) — so unlike the shapes this
      went through before, nothing here needs to dispatch a `resize` event
      for js/stage.js's canvas to stay correct. It does force the control
      bar up (css/player.css's .player.is-highlights-open) so the rail and
      its glowing notches are on screen the whole time a viewer is
      browsing this panel, not only while they also happen to be
      hovering the video.
    */
    open: function () {
      root.hidden = false;
      chatAside.classList.add('is-highlights-open');
      playerEl.classList.add('is-highlights-open');
      renderCards();
      renderMissed();
      document.getElementById('overlayClose').focus();
    },

    close: function () {
      root.hidden = true;
      chatAside.classList.remove('is-highlights-open');
      playerEl.classList.remove('is-highlights-open');
      KT2.scrubber.unhighlight();
    },

    toggle: function () { KT2.overlay.isOpen() ? KT2.overlay.close() : KT2.overlay.open(); },

    openSearch: function () {
      KT2.overlay.open();
      setFilter('search');
      searchInput.focus();
    },

    /*
      Re-renders the cards and the recap tile in place, without touching
      is-highlights-open or the dock's width: something about a moment
      changed (a bookmark toggled, a like landed) somewhere the panel
      itself was not the one that changed it — the rail's hover card, or
      the clip viewer.
    */
    refresh: function () {
      renderCards();
      renderMissed();
    }
  };
})(window);
