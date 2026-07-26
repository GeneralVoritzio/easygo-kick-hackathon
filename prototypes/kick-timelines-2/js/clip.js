/*
  A clip. The card follows kick.com/browse/clips, and pressing it opens a viewer
  over the page. The viewer never moves the playhead, so closing it leaves the
  viewer on the same second of the same stream. Only Watch full video moves it.
*/
(function (global) {
  'use strict';
  var KT2 = global.KT2 = global.KT2 || {};
  var api = global.KT.api;
  var player = KT2.player, moments = KT2.moments;

  var FALLBACK_SECONDS = 30;

  var root, scrim, video, canvas, headline, byline, streamTitle, avatar, chatBox;
  var closeButton, watchFull, playButton, muteButton, timeText, remainText;
  var seek, track, played, thumb, hoverFill;

  var clip = null, span = 0, elapsed = 0, frame = null, drawAt = null;
  var isMuted = false;

  // A clip from the stream you are watching is minutes old, never days.
  function ageText(t) {
    var minutes = Math.round((player.state.liveEdge - t) / 60);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return minutes + ' min ago';
    return Math.floor(minutes / 60) + 'h ' + (minutes % 60) + 'm ago';
  }

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

  KT2.clip = {
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
      watchFull = document.getElementById('clipWatchFull');
      playButton = document.getElementById('clipPlay');
      muteButton = document.getElementById('clipMute');
      timeText = document.getElementById('clipTime');
      remainText = document.getElementById('clipRemain');
      seek = document.getElementById('clipSeek');
      track = seek.querySelector('.clipviewer__track');
      hoverFill = document.getElementById('clipHover');
      played = document.getElementById('clipPlayed');
      thumb = document.getElementById('clipThumb');

      var channel = api.getChannel().username;
      avatar.textContent = moments.initials(channel);
      avatar.style.background = api.colourFor(channel);
      streamTitle.textContent = api.getChannel().stream_title;
      setMuteIcon();

      scrim.addEventListener('click', KT2.clip.close);
      closeButton.addEventListener('click', KT2.clip.close);

      watchFull.addEventListener('click', function () {
        var at = clip.t;
        KT2.clip.close();
        player.seek(at);
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
      clip = moment;
      span = moment.duration || FALLBACK_SECONDS;
      elapsed = 0;

      headline.textContent = moment.title + ' • ' + api.categoryAt(moment.t).name;
      byline.textContent = moment.byline + ' • ' +
        moments.abbreviate(moment.view_count) + ' Views • ' + ageText(moment.t);
      chatBox.innerHTML = KT2.chat.replayHtml(moment.t, span);

      root.hidden = false;
      hideHover();
      drawAt = KT2.stage.preview(canvas);
      paint();
      play();
      closeButton.focus();
    },

    close: function () {
      pause();
      drawAt = null;
      clip = null;
      root.hidden = true;
    }
  };
})(window);
