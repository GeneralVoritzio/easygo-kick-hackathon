/*
  The rail. It is the player's own seek bar, so it stays thin: a 4px track,
  with a small round badge for each of the loudest moments, every bookmark
  and every current search hit, each one popping in and bouncing on hover
  rather than sitting as a flat tick. Hover opens the rail. The track grows,
  the badges grow, and the hype curve fades in above.

  The hover card always carries the picture-in-the-frame preview, not just
  at a recorded clip: js/stage.js draws that picture as a function of the
  playhead alone, so it can draw at any second, the same way a real
  scrubbing thumbnail would. A recorded clip additionally gets its duration
  and view count on top, and is the only kind of point a press opens in the
  full clip viewer. The hover card can also bookmark the exact point under
  the pointer, whether or not a moment sits there. No clip-and-share button
  any more: the card itself opens the clip viewer on a press, which has its
  own share button once it is open.
*/
(function (global) {
  'use strict';
  var KT2 = global.KT2 = global.KT2 || {};
  var player = KT2.player, moments = KT2.moments;
  var api = global.KT.api;

  var RAIL_LIMIT = 8;
  var RAIL_GAP_SECONDS = 300;
  var HOVER_GRAB_SECONDS = 90;
  var CARD_LINGER_MS = 500;

  var rail, played, thumb, notchHost, card, cardText, sparkArea, sparkLine;
  var bookmarkButton;
  var previewBox, previewCanvas, durationBadge, viewsBadge, drawPreview;
  var notches = [], picks = [], isDragging = false, hoverT = null, shownNear = null, bookmarkPointT = null;
  var shownClip = null, lingerTimer = null;

  function pct(t) { return (t / player.state.liveEdge) * 100; }

  function timeFromEvent(e) {
    var box = rail.getBoundingClientRect();
    var ratio = (e.clientX - box.left) / box.width;
    return Math.max(0, Math.min(1, ratio)) * player.state.liveEdge;
  }

  /*
    The same "closest thing to this second" lookup moments.nearest does, but
    across the loudest moments, every bookmark and the live search hits
    together, so the hover card and the rail's badges agree on what a
    viewer sees at a given point.
  */
  function nearestAny(t, windowSeconds) {
    var candidates = moments.all().concat(KT2.bookmarks.all()).concat(KT2.search.current());
    var best = null, bestGap = Infinity;
    candidates.forEach(function (m) {
      var gap = Math.abs(m.t - t);
      if (gap <= windowSeconds && gap < bestGap) { best = m; bestGap = gap; }
    });
    return best;
  }

  function buildNotches() {
    picks = moments.railPicks(RAIL_LIMIT, RAIL_GAP_SECONDS)
      .concat(KT2.bookmarks.all())
      .concat(KT2.search.current())
      .sort(function (a, b) { return a.t - b.t; });
    notchHost.innerHTML = '';
    notches = picks.map(function (m) {
      var el = document.createElement('span');
      el.className = 'notch notch--' + m.group;
      el.title = moments.hms(m.t) + ' ' + m.title;
      el.dataset.id = m.id;
      el.dataset.group = m.group;
      var icon = moments.iconFor(m.group);
      if (icon) el.innerHTML = KT2.icons.get(icon, 8);
      notchHost.appendChild(el);
      return el;
    });
    // A flat append has nothing to transition from, so the pop-in class
    // goes on next frame: the browser paints scale(0) first, then animates
    // to scale(1) on the frame after.
    global.requestAnimationFrame(function () {
      notches.forEach(function (el) { el.classList.add('is-shown'); });
    });
  }

  function drawSpark() {
    var rows = api.getBuckets();
    var step = Math.max(1, Math.floor(rows.length / 240));
    var pts = [];
    for (var i = 0; i < rows.length; i += step) {
      pts.push([(rows[i].t / player.state.liveEdge) * 1000, 24 - (rows[i].hype_score / 100) * 22]);
    }
    if (!pts.length) return;
    var d = 'M' + pts.map(function (p) {
      return p[0].toFixed(1) + ' ' + p[1].toFixed(1);
    }).join('L');
    sparkLine.setAttribute('d', d);
    sparkArea.setAttribute('d', d + 'L' + pts[pts.length - 1][0].toFixed(1) + ' 24L0 24Z');
  }

  function cardHtml(t, near) {
    if (!near) {
      return '<b class="tabular">' + moments.hms(t) + '</b>' +
        '<span>' + moments.bucketAt(t).viewer_count.toLocaleString() + ' watching</span>';
    }
    // A clip is presented the way kick.com/browse/clips presents one.
    if (near.group === 'clip') return KT2.clip.metaHtml(near);

    return '<em class="scrubcard__label scrubcard__label--' + near.group + '">' + near.label + '</em>' +
      '<strong>' + near.title + '</strong>' +
      '<b class="tabular">' + moments.hms(t) + '</b>' +
      '<span>' + near.viewer_count.toLocaleString() + ' watching</span>';
  }

  function updateBookmarkButton(t) {
    var existing = KT2.bookmarks.at(t);
    bookmarkButton.classList.toggle('is-on', !!existing);
    bookmarkButton.setAttribute('aria-pressed', existing ? 'true' : 'false');
    bookmarkButton.setAttribute('aria-label', existing ? 'Remove bookmark' : 'Bookmark this point');
  }

  function showCard(t, clientX) {
    var box = rail.getBoundingClientRect();
    var near = nearestAny(t, HOVER_GRAB_SECONDS);
    var isClip = !!near && near.group === 'clip';

    global.clearTimeout(lingerTimer);
    cardText.innerHTML = cardHtml(t, near);
    previewBox.hidden = false;
    card.hidden = false;

    /*
      Sizing a canvas clears it, so this runs once, the first time the card
      (and so the box the canvas sits in) actually has a size to measure —
      not at mount, when everything here is still `hidden`. Every later
      call reuses the same sizing and just redraws.
    */
    if (!drawPreview) drawPreview = KT2.stage.preview(previewCanvas);

    shownClip = isClip ? near : null;
    durationBadge.hidden = !isClip;
    viewsBadge.hidden = !isClip;
    if (isClip) {
      durationBadge.textContent = KT2.clip.durationText(near);
      viewsBadge.textContent = KT2.clip.viewsText(near);
    }
    drawPreview(t);

    shownNear = near;
    bookmarkPointT = near ? near.t : t;
    updateBookmarkButton(bookmarkPointT);

    var half = card.offsetWidth / 2;
    var x = Math.max(box.left + half, Math.min(box.right - half, clientX));
    card.style.left = (x - box.left) + 'px';
  }

  function hideCard() {
    global.clearTimeout(lingerTimer);
    card.hidden = true;
    hoverT = null;
    shownClip = null;
    shownNear = null;
    bookmarkPointT = null;
  }

  /*
    The card waits, so the pointer can travel from the rail up onto it. It
    then stays while the pointer rests there. A press anywhere on it opens
    the viewer.
  */
  function releaseCard() {
    global.clearTimeout(lingerTimer);
    lingerTimer = global.setTimeout(function () {
      if (!card.matches(':hover')) hideCard();
    }, CARD_LINGER_MS);
  }

  function render() {
    played.style.width = pct(player.state.t) + '%';
    thumb.style.left = pct(player.state.t) + '%';
    rail.setAttribute('aria-valuemax', Math.round(player.state.liveEdge));
    rail.setAttribute('aria-valuenow', Math.round(player.state.t));
    rail.setAttribute('aria-valuetext', moments.hms(player.state.t));
    notches.forEach(function (el, i) { el.style.left = pct(picks[i].t) + '%'; });
  }

  function open() { rail.classList.add('is-open'); drawSpark(); }
  function close() { if (!isDragging) rail.classList.remove('is-open'); }

  KT2.scrubber = {
    mount: function () {
      rail = document.getElementById('rail');
      played = document.getElementById('railPlayed');
      thumb = document.getElementById('railThumb');
      notchHost = document.getElementById('railNotches');
      card = document.getElementById('scrubcard');
      cardText = document.getElementById('scrubText');
      bookmarkButton = document.getElementById('scrubBookmark');
      previewBox = document.getElementById('scrubStage');
      previewCanvas = document.getElementById('scrubPreview');
      durationBadge = document.getElementById('scrubDuration');
      viewsBadge = document.getElementById('scrubViews');
      sparkArea = document.getElementById('sparkArea');
      sparkLine = document.getElementById('sparkLine');

      buildNotches();

      rail.addEventListener('pointerenter', open);
      rail.addEventListener('focus', open);
      rail.addEventListener('pointerleave', function () { close(); releaseCard(); });
      rail.addEventListener('blur', function () { close(); releaseCard(); });

      card.addEventListener('pointerenter', function () { global.clearTimeout(lingerTimer); });
      card.addEventListener('pointerleave', hideCard);

      card.addEventListener('click', function () {
        if (bookmarkPointT === null) return;
        var toOpen = shownClip || KT2.clip.fromPoint(bookmarkPointT, shownNear);
        hideCard();
        KT2.clip.open(toOpen);
      });

      bookmarkButton.addEventListener('click', function (e) {
        e.stopPropagation();
        if (bookmarkPointT === null) return;
        KT2.bookmarks.toggle(bookmarkPointT, shownNear ? shownNear.title : null);
        updateBookmarkButton(bookmarkPointT);
        buildNotches();
        render();
        KT2.overlay.refresh();
      });

      rail.addEventListener('pointermove', function (e) {
        hoverT = timeFromEvent(e);
        showCard(hoverT, e.clientX);
        if (isDragging) player.seek(hoverT);
      });

      rail.addEventListener('pointerdown', function (e) {
        isDragging = true;
        rail.setPointerCapture(e.pointerId);
        player.seek(timeFromEvent(e));
      });

      rail.addEventListener('pointerup', function (e) {
        isDragging = false;
        rail.releasePointerCapture(e.pointerId);
      });

      player.on(render);
    },

    refresh: function () {
      buildNotches();
      render();
    },

    /*
      Hovering a highlight in the Highlights panel calls this with the
      moment's id, so the matching notch on the rail glows even though the
      pointer never touched it — the reverse direction of the rail's own
      hover card. A moment the rail never picked for a notch (outside
      RAIL_LIMIT, and not a bookmark or a search hit) has nothing to glow,
      so this silently matches nothing rather than erroring.

      is-dimmed goes on every other notch at the same time. It only ever
      changes anything for a search hit (css/player.css), whose glow is
      otherwise permanent and not driven by is-linked at all: without it,
      narrowing to one tile's notch would still leave every other search
      hit pulsing away on its own.
    */
    highlight: function (id) {
      notches.forEach(function (el) {
        var isTarget = el.dataset.id === id;
        el.classList.toggle('is-linked', isTarget);
        el.classList.toggle('is-dimmed', !isTarget);
      });
    },

    unhighlight: function () {
      notches.forEach(function (el) {
        el.classList.remove('is-linked');
        el.classList.remove('is-dimmed');
      });
    },

    /*
      Filtering the Highlights panel down to one kind of moment (Peaks,
      Clips, Raids, and so on) lights up every notch of that kind at once,
      the same "these are the ones" signal Search already gives its own
      hits. Narrowing further to one tile (highlight, above) then narrows
      this down to the one notch under the pointer.
    */
    highlightGroup: function (group) {
      notches.forEach(function (el) {
        el.classList.toggle('is-linked', el.dataset.group === group);
        el.classList.remove('is-dimmed');
      });
    },

    /*
      A search hit's glow (css/player.css) only runs while active is true,
      so leaving the Search tab for Peaks, Clips or any other filter quiets
      it, even though the hit itself stays on the rail: it is no longer
      what the panel is showing, only where it was found.
    */
    setSearchActive: function (active) {
      notches.forEach(function (el) {
        if (el.dataset.group === 'search_moment' || el.dataset.group === 'search_chat') {
          el.classList.toggle('is-search-active', active);
        }
      });
    }
  };
})(window);
