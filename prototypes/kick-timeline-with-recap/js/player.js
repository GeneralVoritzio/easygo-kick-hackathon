/*
  The playhead. A live stream has no end, so the clock has two parts: the live
  edge, which grows with the wall clock, and the playhead, which the viewer
  moves. The playhead follows the live edge until the viewer seeks away.
*/
(function (global) {
  'use strict';
  var KT2 = global.KT2 = global.KT2 || {};
  var api = global.KT.api;

  var JOINED_AT_SECONDS = 11400;

  var state = {
    t: api.VOD_LENGTH_SECONDS,
    liveEdge: api.VOD_LENGTH_SECONDS,
    joinedAt: JOINED_AT_SECONDS,
    isPlaying: true,
    isFollowingLive: true
  };

  var listeners = [];
  var lastTick = Date.now();

  function emit() { listeners.forEach(function (fn) { fn(state); }); }

  function clamp(t) { return Math.max(0, Math.min(state.liveEdge, t)); }

  function tick() {
    var now = Date.now();
    var elapsed = (now - lastTick) / 1000;
    lastTick = now;

    state.liveEdge += elapsed;
    if (state.isFollowingLive) state.t = state.liveEdge;
    else if (state.isPlaying) state.t = clamp(state.t + elapsed);
    if (state.t >= state.liveEdge - 1) state.isFollowingLive = true;

    emit();
  }

  KT2.player = {
    state: state,

    on: function (fn) { listeners.push(fn); fn(state); },

    seek: function (t) {
      state.t = clamp(t);
      state.isFollowingLive = state.t >= state.liveEdge - 1;
      emit();
    },

    goLive: function () {
      state.isFollowingLive = true;
      state.isPlaying = true;
      state.t = state.liveEdge;
      emit();
    },

    togglePlay: function () {
      state.isPlaying = !state.isPlaying;
      if (!state.isPlaying) state.isFollowingLive = false;
      emit();
    },

    secondsBehindLive: function () { return Math.max(0, state.liveEdge - state.t); },

    start: function () {
      function frame() { tick(); global.requestAnimationFrame(frame); }
      global.requestAnimationFrame(frame);
    }
  };
})(window);
