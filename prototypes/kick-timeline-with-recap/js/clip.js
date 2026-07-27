/*
  A clip. The card follows kick.com/browse/clips, and pressing it opens a viewer
  over the page. Every point on the rail opens the same viewer now, not just a
  recorded clip: a point with no recorded clip on it gets one built on the spot
  (see fromPoint), a 40 second window centred on whatever was under the pointer.

  The same viewer also plays a recap: openSequence steps through a list of
  moments stories-style, one segmented progress bar per moment, auto-advancing
  and tappable (left third back, right two thirds on), the same idea
  prototypes/kick-recap's catch-up used. "Before you joined" in the Highlights
  panel opens one of these instead of listing its moments as rows.

  Opening it does not pause the main stream: the frame behind it keeps ticking
  on its own clock. What it does do is move audio focus onto the viewer, the
  way opening any picture-in-picture surface would: the main player mutes for
  as long as the viewer is open, and the viewer's own sound starts enabled, so
  there is only ever one thing making sound. Closing it hands audio back to
  whatever the main player's mute state was before.

  The viewer never moves the playhead. Closing it leaves the main player
  exactly where it already was.
*/
(function (global) {
  'use strict';
  var KT2 = global.KT2 = global.KT2 || {};
  var api = global.KT.api;
  var player = KT2.player, moments = KT2.moments;

  var FALLBACK_SECONDS = 30;
  var SHARE_PAD_SECONDS = 20;
  var SEGMENT_MS = 5000;

  var root, scrim, video, canvas, headline, byline, streamTitle, avatar, chatBox;
  var closeButton, shareButton, bookmarkButton, playButton, muteButton, timeText, remainText;
  var seek, track, played, thumb, hoverFill;
  var segmentsHost, tapPrev, tapNext;

  var clip = null, span = 0, elapsed = 0, frame = null, drawAt = null;
  var isMuted = false, mainWasMuted = false;
  var sequence = null, sequenceIndex = 0, advanceTimer = null;

  // A clip from the stream you are watching is minutes old, never days.
  function ageText(t) {
    var minutes = Math.round((player.state.liveEdge - t) / 60);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return minutes + ' min ago';
    return Math.floor(minutes / 60) + 'h ' + (minutes % 60) + 'm ago';
  }

  // A recorded clip's own t is the meaningful point. A built-on-the-spot
  // preview's t is padded back by SHARE_PAD_SECONDS, so it carries its own
  // unpadded centre instead.
  function centreOf(m) { return m.center !== undefined ? m.center : m.t; }

  function paint() {
    var ratio = elapsed / span;
    played.style.width = (ratio * 100) + '%';
    thumb.style.left = (ratio * 100) + '%';
    timeText.textContent = moments.mmss(elapsed) + ' / ' + moments.mmss(span);
    seek.setAttribute('aria-valuenow', Math.round(ratio * 100));
    seek.setAttribute('aria-valuetext', moments.mmss(elapsed));
    drawAt(clip.t + elapsed);
  }

  function ratioFrom(clientX) {
    var box = track.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - box.left) / box.width));
  }

  // The bar reads out the time left at the point under the pointer.
  function showHover(clientX) {
    var ratio = ratioFrom(clientX);
    hoverFill.style.width = (ratio * 100) + '%';
    remainText.style.left = (ratio * 100) + '%';
    remainText.textContent = '-' + moments.mmss(span - ratio * span);
    remainText.hidden = false;
  }

  function hideHover() {
    hoverFill.style.width = '0';
    remainText.hidden = true;
  }

  function setPlayIcon() {
    playButton.innerHTML = KT2.icons.get(frame ? 'pause' : 'play', 20);
    playButton.setAttribute('aria-label', frame ? 'Pause' : 'Play');
  }

  function setMuteIcon() {
    muteButton.innerHTML = KT2.icons.get(isMuted ? 'mute' : 'volume', 20);
    muteButton.setAttribute('aria-label', isMuted ? 'Unmute' : 'Mute');
  }

  function updateBookmarkButton() {
    var on = !!KT2.bookmarks.at(centreOf(clip));
    bookmarkButton.classList.toggle('is-on', on);
    bookmarkButton.setAttribute('aria-pressed', on ? 'true' : 'false');
    bookmarkButton.setAttribute('aria-label', on ? 'Remove bookmark' : 'Bookmark this point');
  }

  function pause() {
    if (frame) global.cancelAnimationFrame(frame);
    frame = null;
    setPlayIcon();
  }

  function play() {
    if (frame) return;
    var last = global.performance.now();
    function step(now) {
      elapsed = (elapsed + (now - last) / 1000) % span;
      last = now;
      paint();
      frame = global.requestAnimationFrame(step);
    }
    frame = global.requestAnimationFrame(step);
    setPlayIcon();
  }

  function seekFromEvent(e) {
    elapsed = ratioFrom(e.clientX) * span;
    paint();
  }

  /*
    One click, no viewer to open first: builds a link carrying the 20 seconds
    before and after the point, and hands it back for the caller to copy.
    Invented surface (js/search.js and js/bookmarks.js hold the same
    reasoning): KICK's public API has no clip-sharing endpoint, so this
    never claims to cut real footage, only to carry the same window a real
    one would.
  */
  function shareUrl(t) {
    var start = Math.max(0, Math.round(t - SHARE_PAD_SECONDS));
    var end = Math.round(t + SHARE_PAD_SECONDS);
    var url = new global.URL(global.location.href);
    url.searchParams.set('clip_start', start);
    url.searchParams.set('clip_end', end);
    return url.toString();
  }

  /*
    Every point on the rail opens this same viewer, not just a marker the
    recorder flagged. A real clip already carries everything below; this
    builds the same shape for a point that has none, a 40 second window
    centred on it. `near`, if given, lends its title/byline/label so the
    viewer still reads as about something rather than a bare timestamp.
  */
  function fromPoint(t, near) {
    var centre = near ? near.t : t;
    var row = moments.bucketAt(centre);
    return {
      id: 'preview_' + Math.round(centre),
      group: 'clip',
      center: centre,
      label: near ? near.label : 'Preview',
      t: Math.max(0, centre - SHARE_PAD_SECONDS),
      duration: SHARE_PAD_SECONDS * 2,
      view_count: row.viewer_count,
      title: near ? near.title : 'Stream preview',
      byline: near ? near.byline : moments.hms(centre) + ' into the stream',
      hype: row.hype_score,
      viewer_count: row.viewer_count,
      reactions_count: 0,
      has_reacted: false,
      source_event: 'fake-kick timeline.marker.created'
    };
  }

  // The part every open, single or sequenced, shares: paint the moment in.
  function display(moment) {
    clip = moment;
    span = moment.duration || FALLBACK_SECONDS;
    elapsed = 0;

    headline.textContent = moment.title + ' • ' + api.categoryAt(moment.t).name;
    byline.textContent = moment.byline + ' • ' +
      moments.abbreviate(moment.view_count) + ' Views • ' + ageText(moment.t);
    chatBox.innerHTML = KT2.chat.replayHtml(moment.t, span);
    updateBookmarkButton();

    hideHover();
    drawAt = KT2.stage.preview(canvas);
    paint();
    play();
  }

  // Audio focus moves to the viewer once, on the way in, not on every
  // segment of a sequence — `wasOpen` tells the two apart.
  function claimAudio(wasOpen) {
    if (!wasOpen) {
      mainWasMuted = KT2.audio.isMainMuted();
      KT2.audio.setMainMuted(true);
    }
    isMuted = false;
    setMuteIcon();
  }

  function renderSegments() {
    segmentsHost.innerHTML = sequence.map(function (_, i) {
      return '<span class="clipviewer__segment" data-i="' + i + '"><i></i></span>';
    }).join('');
    segmentsHost.hidden = false;
  }

  // Every segment before the current one is full and static, the current
  // one fills over SEGMENT_MS, the rest are empty. The frame-delay is the
  // same trick scrubber.js's notches use: without it there is no scale(0)
  // (here, width 0) to transition from, since the class lands the moment
  // the element exists.
  function updateSegments() {
    var spans = segmentsHost.querySelectorAll('.clipviewer__segment');
    spans.forEach(function (el, i) {
      el.classList.remove('is-active', 'is-done');
      if (i < sequenceIndex) el.classList.add('is-done');
    });
    var active = spans[sequenceIndex];
    if (!active) return;
    global.requestAnimationFrame(function () { active.classList.add('is-active'); });
  }

  function showAt(i) {
    sequenceIndex = i;
    display(sequence[i]);
    updateSegments();
    global.clearTimeout(advanceTimer);
    advanceTimer = global.setTimeout(goNext, SEGMENT_MS);
  }

  function goNext() {
    if (!sequence) return;
    global.clearTimeout(advanceTimer);
    if (sequenceIndex >= sequence.length - 1) { KT2.clip.close(); return; }
    showAt(sequenceIndex + 1);
  }

  function goPrev() {
    if (!sequence) return;
    global.clearTimeout(advanceTimer);
    showAt(Math.max(0, sequenceIndex - 1));
  }

  KT2.clip = {
    SHARE_PAD_SECONDS: SHARE_PAD_SECONDS,
    shareUrl: shareUrl,
    fromPoint: fromPoint,

    // The row under a clip thumbnail: avatar, channel, title, category and age.
    metaHtml: function (m) {
      var channel = api.getChannel().username;
      return '<div class="clipmeta">' +
        '<span class="avatar avatar--sm" style="background:' + api.colourFor(channel) + '" ' +
        'aria-hidden="true">' + moments.initials(channel) + '</span>' +
        '<span class="clipmeta__text">' +
        '<span class="clipmeta__channel">' + channel + '</span>' +
        '<span class="clipmeta__title">' + m.title + '</span>' +
        '<span class="clipmeta__foot">' +
        '<span class="clipmeta__cat">' + api.categoryAt(m.t).name + '</span>' +
        '<span>· ' + ageText(m.t) + '</span>' +
        '</span></span></div>';
    },

    durationText: function (m) { return moments.mmss(m.duration); },

    viewsText: function (m) { return moments.abbreviate(m.view_count) + ' views'; },

    mount: function () {
      root = document.getElementById('clipViewer');
      scrim = document.getElementById('clipScrim');
      video = document.getElementById('clipVideo');
      canvas = document.getElementById('clipCanvas');
      headline = document.getElementById('clipHeadline');
      byline = document.getElementById('clipByline');
      streamTitle = document.getElementById('clipStreamTitle');
      avatar = document.getElementById('clipAvatar');
      chatBox = document.getElementById('clipChat');
      closeButton = document.getElementById('clipClose');
      shareButton = document.getElementById('clipShare');
      bookmarkButton = document.getElementById('clipBookmark');
      playButton = document.getElementById('clipPlay');
      muteButton = document.getElementById('clipMute');
      timeText = document.getElementById('clipTime');
      remainText = document.getElementById('clipRemain');
      seek = document.getElementById('clipSeek');
      track = seek.querySelector('.clipviewer__track');
      hoverFill = document.getElementById('clipHover');
      played = document.getElementById('clipPlayed');
      thumb = document.getElementById('clipThumb');
      segmentsHost = document.getElementById('clipSegments');
      tapPrev = document.getElementById('clipTapPrev');
      tapNext = document.getElementById('clipTapNext');

      var channel = api.getChannel().username;
      avatar.textContent = moments.initials(channel);
      avatar.style.background = api.colourFor(channel);
      streamTitle.textContent = api.getChannel().stream_title;
      setMuteIcon();

      scrim.addEventListener('click', KT2.clip.close);
      closeButton.addEventListener('click', KT2.clip.close);

      shareButton.addEventListener('click', function () {
        global.navigator.clipboard.writeText(shareUrl(centreOf(clip))).then(function () {
          shareButton.classList.add('is-copied');
          global.setTimeout(function () { shareButton.classList.remove('is-copied'); }, 2000);
        });
      });

      bookmarkButton.addEventListener('click', function () {
        var point = centreOf(clip);
        KT2.bookmarks.toggle(point, clip.title);
        updateBookmarkButton();
        KT2.scrubber.refresh();
        KT2.overlay.refreshBookmarkState();
      });

      playButton.addEventListener('click', function () { frame ? pause() : play(); });
      muteButton.addEventListener('click', function () {
        isMuted = !isMuted;
        setMuteIcon();
      });

      document.getElementById('clipFull').addEventListener('click', function () {
        if (document.fullscreenElement) document.exitFullscreen();
        else video.requestFullscreen();
      });

      tapPrev.addEventListener('click', goPrev);
      tapNext.addEventListener('click', goNext);

      var isScrubbing = false;
      seek.addEventListener('pointerdown', function (e) {
        isScrubbing = true;
        seek.setPointerCapture(e.pointerId);
        seekFromEvent(e);
      });
      seek.addEventListener('pointermove', function (e) {
        showHover(e.clientX);
        if (isScrubbing) seekFromEvent(e);
      });
      seek.addEventListener('pointerleave', hideHover);
      seek.addEventListener('pointerup', function (e) {
        isScrubbing = false;
        seek.releasePointerCapture(e.pointerId);
      });
    },

    isOpen: function () { return !root.hidden; },

    open: function (moment) {
      var wasOpen = !root.hidden;
      sequence = null;
      global.clearTimeout(advanceTimer);
      segmentsHost.hidden = true;
      segmentsHost.innerHTML = '';
      tapPrev.hidden = true;
      tapNext.hidden = true;

      display(moment);
      root.hidden = false;
      claimAudio(wasOpen);
      closeButton.focus();
    },

    /*
      The recap: a list of moments played stories-style, one segmented bar
      per moment, auto-advancing every SEGMENT_MS, tappable to move by hand.
      Reaching the end of the list closes the viewer, the same as it would
      after a single clip.
    */
    openSequence: function (list) {
      if (!list || !list.length) return;
      var wasOpen = !root.hidden;
      sequence = list;
      renderSegments();
      tapPrev.hidden = false;
      tapNext.hidden = false;

      root.hidden = false;
      showAt(0);
      claimAudio(wasOpen);
      closeButton.focus();
    },

    close: function () {
      pause();
      global.clearTimeout(advanceTimer);
      sequence = null;
      drawAt = null;
      clip = null;
      root.hidden = true;
      KT2.audio.setMainMuted(mainWasMuted);
    }
  };
})(window);
