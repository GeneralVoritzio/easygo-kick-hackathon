(function (global) {
  'use strict';
  var KT2 = global.KT2, api = global.KT.api;
  var player = KT2.player, moments = KT2.moments, icons = KT2.icons;

  var el = {};
  ['clockNow', 'btnPlay', 'btnMute', 'btnLive', 'btnTimeline',
    'btnFull', 'channelTitle', 'channelCategory', 'channelAvatar', 'statViewers',
    'sideList', 'followList', 'navAvatar',
    'player', 'volume', 'volumeSlider', 'volumeFill', 'volumeThumb'].forEach(function (id) {
      el[id] = document.getElementById(id);
    });

  function behindText(seconds) {
    var m = Math.floor(seconds / 60);
    if (m < 1) return 'a few seconds behind';
    if (m < 60) return m + ' min behind';
    return Math.floor(m / 60) + 'h ' + (m % 60) + 'm behind';
  }

  /*
    The player ticks every frame, so each write is guarded. Without the guard
    the play icon would be rebuilt 60 times a second.
  */
  var shown = {};
  function write(key, value, apply) {
    if (shown[key] === value) return;
    shown[key] = value;
    apply(value);
  }

  function render(state) {
    var row = moments.bucketAt(state.t);
    var category = api.categoryAt(state.t);

    write('category', category.name, function (v) { el.channelCategory.textContent = v; });
    write('viewers', row.viewer_count, function (v) { el.statViewers.textContent = v.toLocaleString(); });
    write('clock', moments.hms(state.t), function (v) { el.clockNow.textContent = v; });

    write('playing', state.isPlaying, function (v) {
      el.btnPlay.innerHTML = icons.get(v ? 'pause' : 'play', 20);
      el.btnPlay.setAttribute('aria-label', v ? 'Pause' : 'Play');
      el.player.classList.toggle('is-paused', !v);
    });

    write('live', state.isFollowingLive, function (v) {
      el.btnLive.classList.toggle('is-behind', !v);
      el.btnLive.lastChild.textContent = v ? 'LIVE' : 'GO LIVE';
    });

    el.btnLive.title = state.isFollowingLive
      ? 'You are at the live edge'
      : 'You are ' + behindText(player.secondsBehindLive()) + '. Go to the live edge';
  }

  function channelHtml(c) {
    return '<a class="sidechan" href="#">' +
      '<span class="sidechan__pic" style="background:' + api.colourFor(c.username) + '">' +
      moments.initials(c.username) + '</span>' +
      '<span class="sidechan__text">' +
      '<div class="sidechan__name">' + c.username + '</div>' +
      '<div class="sidechan__cat">' + c.category + '</div></span>' +
      '<span class="sidechan__count"><i class="dot"></i>' + moments.abbreviate(c.viewer_count) + '</span></a>';
  }

  function renderSidebar() {
    function listFor(isFollowing) {
      return api.LIVE_CHANNELS.filter(function (c) {
        return !!c.is_following === isFollowing;
      }).map(channelHtml).join('');
    }
    el.followList.innerHTML = listFor(true);
    el.sideList.innerHTML = listFor(false);
  }

  function renderViewer() {
    el.navAvatar.textContent = moments.initials(api.VIEWER_ME);
    el.navAvatar.style.background = api.colourFor(api.VIEWER_ME);
    el.navAvatar.setAttribute('aria-label', 'Account, ' + api.VIEWER_ME);
  }

  var volume = { level: 0.5, isMuted: false };

  function renderVolume() {
    var shown = volume.isMuted ? 0 : volume.level;
    el.volumeFill.style.width = (shown * 100) + '%';
    el.volumeThumb.style.left = (shown * 100) + '%';
    el.volumeSlider.setAttribute('aria-valuenow', Math.round(shown * 100));
    el.btnMute.innerHTML = KT2.icons.get(shown === 0 ? 'mute' : 'volume', 20);
    el.btnMute.setAttribute('aria-label', shown === 0 ? 'Unmute' : 'Mute');
  }

  function setVolumeFromEvent(e) {
    var box = el.volumeSlider.getBoundingClientRect();
    if (!box.width) return;
    volume.level = Math.max(0, Math.min(1, (e.clientX - box.left) / box.width));
    volume.isMuted = volume.level === 0;
    renderVolume();
  }

  var isSettingVolume = false;
  el.volumeSlider.addEventListener('pointerdown', function (e) {
    isSettingVolume = true;
    el.volumeSlider.setPointerCapture(e.pointerId);
    setVolumeFromEvent(e);
  });
  el.volumeSlider.addEventListener('pointermove', function (e) {
    if (isSettingVolume) setVolumeFromEvent(e);
  });
  el.volumeSlider.addEventListener('pointerup', function (e) {
    isSettingVolume = false;
    el.volumeSlider.releasePointerCapture(e.pointerId);
  });

  el.btnMute.addEventListener('click', function () {
    volume.isMuted = !volume.isMuted;
    if (!volume.isMuted && volume.level === 0) volume.level = 0.5;
    renderVolume();
  });

  var CHAT_MIN_WIDTH = 280;
  var CHAT_MAX_WIDTH = 460;
  var handle = document.getElementById('chatResize');
  var chatWidth = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--chatroom-width')
  );

  /*
    The frame reads the column width, so the canvas is sized again on release.
    Sizing it on every move would reallocate the canvas 60 times a second.
  */
  function setChatWidth(px) {
    chatWidth = Math.max(CHAT_MIN_WIDTH, Math.min(CHAT_MAX_WIDTH, Math.round(px)));
    document.documentElement.style.setProperty('--chatroom-width', chatWidth + 'px');
    handle.setAttribute('aria-valuenow', chatWidth);
  }

  var isResizingChat = false;
  handle.addEventListener('pointerdown', function (e) {
    isResizingChat = true;
    handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener('pointermove', function (e) {
    if (isResizingChat) setChatWidth(window.innerWidth - e.clientX);
  });
  handle.addEventListener('pointerup', function (e) {
    isResizingChat = false;
    handle.releasePointerCapture(e.pointerId);
    window.dispatchEvent(new Event('resize'));
  });
  handle.addEventListener('keydown', function (e) {
    var step = e.key === 'ArrowLeft' ? 16 : (e.key === 'ArrowRight' ? -16 : 0);
    if (!step) return;
    e.preventDefault();
    setChatWidth(chatWidth + step);
    window.dispatchEvent(new Event('resize'));
  });

  var search = document.querySelector('.nav__search input');
  var searchClear = document.querySelector('.nav__clear');
  search.addEventListener('input', function () { searchClear.hidden = !search.value; });
  searchClear.addEventListener('click', function () {
    search.value = '';
    searchClear.hidden = true;
    search.focus();
  });

  el.btnPlay.addEventListener('click', player.togglePlay);
  el.btnLive.addEventListener('click', player.goLive);
  el.btnTimeline.addEventListener('click', KT2.overlay.toggle);

  el.btnFull.addEventListener('click', function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else el.player.requestFullscreen();
  });

  document.addEventListener('keydown', function (e) {
    var tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    var key = e.key.toLowerCase();

    if (key === 'escape' && KT2.clip.isOpen()) { KT2.clip.close(); return; }
    if (KT2.clip.isOpen()) return;

    if (key === 'escape' && KT2.overlay.isOpen()) { KT2.overlay.close(); return; }
    if (key === 't') { KT2.overlay.toggle(); return; }
    if (key === 'l') { player.goLive(); return; }
    if (key === ' ') { e.preventDefault(); player.togglePlay(); return; }

    var step = e.shiftKey ? 300 : 30;
    if (key === 'arrowleft') { e.preventDefault(); player.seek(player.state.t - step); }
    if (key === 'arrowright') { e.preventDefault(); player.seek(player.state.t + step); }
  });

  icons.paint();
  el.channelTitle.textContent = api.getChannel().stream_title;
  el.channelAvatar.textContent = moments.initials(api.getChannel().username);
  renderSidebar();
  renderViewer();
  renderVolume();

  KT2.stage.mount();
  KT2.clip.mount();
  KT2.scrubber.mount();
  KT2.overlay.mount();
  KT2.chat.mount();
  player.on(render);
  player.start();
})(window);
