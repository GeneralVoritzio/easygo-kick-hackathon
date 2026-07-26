(function (global) {
  'use strict';
  var KT2 = global.KT2, api = global.KT.api;
  var player = KT2.player, moments = KT2.moments, icons = KT2.icons;

  var el = {};
  ['clockNow', 'btnPlay', 'btnMute', 'btnLive', 'btnTimeline',
    'btnFull', 'channelTitle', 'channelCategory', 'statViewers', 'sourceList', 'sideList',
    'player', 'volume', 'volumeSlider', 'volumeFill', 'volumeThumb'].forEach(function (id) {
      el[id] = document.getElementById(id);
    });

  function initials(name) {
    var parts = name.replace(/[^a-zA-Z]/g, ' ').trim().split(/\s+/);
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  function abbreviate(n) {
    return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K' : String(n);
  }

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
    });

    write('live', state.isFollowingLive, function (v) {
      el.btnLive.classList.toggle('is-behind', !v);
      el.btnLive.lastChild.textContent = v ? 'LIVE' : 'GO LIVE';
    });

    el.btnLive.title = state.isFollowingLive
      ? 'You are at the live edge'
      : 'You are ' + behindText(player.secondsBehindLive()) + '. Go to the live edge';
  }

  function renderSidebar() {
    el.sideList.innerHTML = api.LIVE_CHANNELS.map(function (c) {
      return '<a class="sidechan" href="#">' +
        '<span class="sidechan__pic">' + initials(c.username) + '</span>' +
        '<span class="sidechan__text">' +
        '<div class="sidechan__name">' + c.username + '</div>' +
        '<div class="sidechan__cat">' + c.category + '</div></span>' +
        '<span class="sidechan__count"><i class="dot"></i>' + abbreviate(c.viewer_count) + '</span></a>';
    }).join('');
  }

  function renderSources() {
    var rows = [
      [api.KICK_SOURCES.channels, 'Channel identity, stream_title and started_at'],
      [api.KICK_SOURCES.livestreams, 'The sidebar list, viewer_count and the hype curve'],
      [api.KICK_SOURCES.chat_message_sent, 'Chat, the chat rate and every peak'],
      [api.KICK_SOURCES.kicks_gifted, 'Gift moments and the gifter leaderboard'],
      [api.KICK_SOURCES.channel_subscription, 'Sub train moments'],
      [api.KICK_SOURCES.livestream_metadata_updated, 'Category changes, and the category on each card'],
      [KT2.FAKE_SOURCES.window, 'How far back the rail can go'],
      [KT2.FAKE_SOURCES.markers, 'Every notch and every card'],
      [KT2.FAKE_SOURCES.reactions, 'The heart on a card']
    ];
    el.sourceList.innerHTML = rows.map(function (r) {
      var kind = r[0].indexOf('fake-kick') === 0 ? 'fake' : 'real';
      return '<li><code class="src src--' + kind + '">' + r[0] + '</code><span>' + r[1] + '</span></li>';
    }).join('');
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
  renderSidebar();
  renderSources();
  renderVolume();

  KT2.stage.mount();
  KT2.scrubber.mount();
  KT2.overlay.mount();
  KT2.chat.mount();
  player.on(render);
  player.start();
})(window);
