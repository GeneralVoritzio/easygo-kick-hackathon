/*
  The timeline overlay. It covers the video frame, not the page, so the viewer
  never leaves the stream. One curve, one filter row, one grid of moments.
*/
(function (global) {
  'use strict';
  var KT2 = global.KT2 = global.KT2 || {};
  var player = KT2.player, moments = KT2.moments;
  var api = global.KT.api;

  var MISSED_LIMIT = 3;

  var root, curveArea, curveLine, pinHost, head, cardHost, missedBox, missedHost;
  var momentsHead, sub, foot, filter = 'all';

  function drawCurve() {
    var rows = api.getBuckets();
    var step = Math.max(1, Math.floor(rows.length / 300));
    var pts = [];
    for (var i = 0; i < rows.length; i += step) {
      pts.push([(rows[i].t / player.state.liveEdge) * 1000, 90 - (rows[i].hype_score / 100) * 82]);
    }
    var d = 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L');
    curveLine.setAttribute('d', d);
    curveArea.setAttribute('d', d + 'L' + pts[pts.length - 1][0].toFixed(1) + ' 90L0 90Z');

    pinHost.innerHTML = moments.byGroup(filter).map(function (m) {
      return '<button class="pin pin--' + m.group + '" data-seek="' + m.t + '" ' +
        'style="left:' + ((m.t / player.state.liveEdge) * 100) + '%" ' +
        'aria-label="' + m.label + ' at ' + moments.hms(m.t) + ', ' + m.title + '"></button>';
    }).join('');
  }

  function thumbFor(m) {
    var category = api.categoryAt(m.t);
    return '<span class="card__thumb card__thumb--' + m.group + '">' +
      '<em>' + category.name + '</em>' +
      '<span class="card__noframe">no frame, by design</span></span>';
  }

  function cardHtml(m) {
    return '<article class="card" data-id="' + m.id + '">' +
      '<button class="card__go" data-seek="' + m.t + '">' +
      thumbFor(m) +
      '<span class="card__label card__label--' + m.group + '">' + m.label + '</span>' +
      '<span class="card__title">' + m.title + '</span>' +
      '<span class="card__byline">' + m.byline + '</span>' +
      '<span class="card__time tabular">' + moments.hms(m.t) + ' · ' +
      m.viewer_count.toLocaleString() + ' watching</span>' +
      '</button>' +
      '<button class="react' + (m.has_reacted ? ' is-on' : '') + '" data-react="' + m.id + '" ' +
      'aria-pressed="' + (m.has_reacted ? 'true' : 'false') + '">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 20s-7-4.5-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.5-7 9-7 9Z"/></svg>' +
      '<span class="tabular">' + m.reactions_count.toLocaleString() + '</span></button>' +
      '</article>';
  }

  function renderCards() {
    var list = moments.byGroup(filter);
    cardHost.innerHTML = list.map(cardHtml).join('');
    momentsHead.textContent = filter === 'all'
      ? list.length + ' moments so far'
      : list.length + ' ' + filter + ' moments';
  }

  function renderMissed() {
    var list = moments.missed(player.state.joinedAt, MISSED_LIMIT);
    missedBox.hidden = list.length === 0;
    missedHost.innerHTML = list.map(cardHtml).join('');
  }

  function renderHead() {
    head.style.left = ((player.state.t / player.state.liveEdge) * 100) + '%';
  }

  function setFilter(next) {
    filter = next;
    root.querySelectorAll('[data-filter]').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.filter === filter);
    });
    drawCurve();
    renderCards();
  }

  KT2.overlay = {
    mount: function () {
      root = document.getElementById('overlay');
      curveArea = document.getElementById('curveArea');
      curveLine = document.getElementById('curveLine');
      pinHost = document.getElementById('curvePins');
      head = document.getElementById('curveHead');
      cardHost = document.getElementById('momentCards');
      missedBox = document.getElementById('missed');
      missedHost = document.getElementById('missedCards');
      momentsHead = document.getElementById('momentsHead');
      sub = document.getElementById('overlaySub');
      foot = document.getElementById('overlayFoot');

      sub.textContent = 'You joined at ' + moments.hms(player.state.joinedAt) +
        '. Pick a moment and the player goes there.';
      foot.textContent = 'Moments come from ' + KT2.FAKE_SOURCES.markers +
        '. A heart posts to ' + KT2.FAKE_SOURCES.reactions + '.';

      root.addEventListener('click', function (e) {
        var chip = e.target.closest('[data-filter]');
        if (chip) { setFilter(chip.dataset.filter); return; }

        var react = e.target.closest('[data-react]');
        if (react) {
          var m = moments.react(react.dataset.react);
          if (m) { renderCards(); renderMissed(); }
          return;
        }

        var go = e.target.closest('[data-seek]');
        if (go) { player.seek(+go.dataset.seek); KT2.overlay.close(); }
      });

      document.getElementById('overlayClose').addEventListener('click', KT2.overlay.close);
      player.on(function () { if (!root.hidden) renderHead(); });
    },

    isOpen: function () { return !root.hidden; },

    open: function () {
      root.hidden = false;
      drawCurve();
      renderCards();
      renderMissed();
      renderHead();
      document.getElementById('overlayClose').focus();
    },

    close: function () { root.hidden = true; },

    toggle: function () { KT2.overlay.isOpen() ? KT2.overlay.close() : KT2.overlay.open(); }
  };
})(window);
