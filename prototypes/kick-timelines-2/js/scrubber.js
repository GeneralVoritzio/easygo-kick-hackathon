/*
  The rail. It is the player's own seek bar, so it stays thin: a 4px track and
  a notch for each of the loudest moments. Hover opens it. The track grows, the
  notches grow, and the hype curve fades in above. Nothing else is added.
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
  var previewBox, previewCanvas, durationBadge, viewsBadge;
  var notches = [], picks = [], isDragging = false, hoverT = null;
  var shownClip = null, lingerTimer = null;

  function pct(t) { return (t / player.state.liveEdge) * 100; }

  function timeFromEvent(e) {
    var box = rail.getBoundingClientRect();
    var ratio = (e.clientX - box.left) / box.width;
    return Math.max(0, Math.min(1, ratio)) * player.state.liveEdge;
  }

  function buildNotches() {
    picks = moments.railPicks(RAIL_LIMIT, RAIL_GAP_SECONDS);
    notchHost.innerHTML = '';
    notches = picks.map(function (m) {
      var el = document.createElement('span');
      el.className = 'notch notch--' + m.group;
      el.title = moments.hms(m.t) + ' ' + m.title;
      notchHost.appendChild(el);
      return el;
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

  /*
    The thumbnail sits outside the card text, because the text is rebuilt on
    every pointer move. Sizing a canvas clears it, so it is sized once per clip.
    The card shows one still frame. Pressing it opens the clip viewer, which is
    where a clip plays.
  */
  function showClip(clip) {
    if (shownClip && shownClip.id === clip.id) return;
    shownClip = clip;
    durationBadge.textContent = KT2.clip.durationText(clip);
    viewsBadge.textContent = KT2.clip.viewsText(clip);
    KT2.stage.preview(previewCanvas)(clip.t);
  }

  function showCard(t, clientX) {
    var box = rail.getBoundingClientRect();
    var near = moments.nearest(t, HOVER_GRAB_SECONDS);
    var isClip = !!near && near.group === 'clip';

    global.clearTimeout(lingerTimer);
    cardText.innerHTML = cardHtml(t, near);
    card.classList.toggle('has-preview', isClip);
    previewBox.hidden = !isClip;
    card.hidden = false;

    if (isClip) showClip(near);
    else shownClip = null;

    var half = card.offsetWidth / 2;
    var x = Math.max(box.left + half, Math.min(box.right - half, clientX));
    card.style.left = (x - box.left) + 'px';
  }

  function hideCard() {
    global.clearTimeout(lingerTimer);
    card.hidden = true;
    hoverT = null;
    shownClip = null;
  }

  /*
    A clip card waits, so the pointer can travel from the rail up onto it. It
    then stays while the pointer rests on it. A press opens the clip viewer.
  */
  function releaseCard() {
    if (!shownClip) { hideCard(); return; }
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
        if (!shownClip) return;
        var clip = shownClip;
        hideCard();
        KT2.clip.open(clip);
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
    }
  };
})(window);
