/*
  Chat follows the playhead. Rewind the stream and chat rewinds with it, because
  every kick chat.message.sent event carries a timestamp against started_at.
  The rate comes from messages_count in the bucket under the playhead.
*/
(function (global) {
  'use strict';
  var KT2 = global.KT2 = global.KT2 || {};
  var api = global.KT.api;
  var player = KT2.player, moments = KT2.moments;

  var MAX_ROWS = 120;
  var SEEK_GAP_SECONDS = 5;
  var REPLAY_LIMIT = 80;

  var body, board, lastT = null, carry = 0;

  /*
    api.chatAt returns the same four lines for a given moment, which reads as a
    loop once chat is streaming. This picks the same pool it picks, then takes
    any line from it.
  */
  function nextMessage(t) {
    var near = moments.nearest(t, 240);
    var pool = api.CHAT_CALM;
    if (near && near.hype > 70) pool = api.CHAT_HYPE;
    else if (api.categoryAt(t).id === api.CATEGORIES.slots.id) pool = api.CHAT_SALT;
    return { sender: api.subject(api.pick(api.VIEWERS)), content: api.pick(pool) };
  }

  function badgesFor(name) {
    if (name === api.getChannel().username) return ['broadcaster'];
    if (api.MODS.indexOf(name) !== -1) return ['moderator'];
    if (name.length % 3 === 0) return ['subscriber'];
    if (name.length % 5 === 0) return ['og'];
    return [];
  }

  function escape(text) {
    return text.replace(/[&<>]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
    });
  }

  function rowHtml(message, stamp) {
    var name = message.sender.username;
    var badges = badgesFor(name).map(function (b) {
      return '<span class="msg__badge msg__badge--' + b + '" title="' + b + '"></span>';
    }).join('');
    var time = stamp ? '<span class="msg__time tabular">' + stamp + '</span>' : '';
    return '<div class="msg"><div class="msg__inner">' + time + badges +
      '<span class="msg__name" style="color:' + message.sender.identity.username_color + '">' +
      escape(name) + '</span><span class="msg__sep">: </span>' +
      '<span class="msg__body">' + escape(message.content) + '</span></div></div>';
  }

  function systemHtml(text) {
    return '<div class="msg msg--system"><div class="msg__inner">' + text + '</div></div>';
  }

  function append(html) {
    body.insertAdjacentHTML('beforeend', html);
    while (body.children.length > MAX_ROWS) body.removeChild(body.firstChild);
    body.scrollTop = body.scrollHeight;
  }

  function fill(t) {
    body.innerHTML = '';
    for (var i = 20; i > 0; i--) {
      body.insertAdjacentHTML('beforeend', rowHtml(nextMessage(t - i * 3)));
    }
    body.scrollTop = body.scrollHeight;
  }

  function tick(state) {
    if (lastT === null) { fill(state.t); lastT = state.t; return; }

    var moved = state.t - lastT;
    if (Math.abs(moved) > SEEK_GAP_SECONDS) {
      fill(state.t);
      append(systemHtml('Chat moved to <b>' + moments.hms(state.t) + '</b>'));
      lastT = state.t;
      carry = 0;
      return;
    }

    if (!state.isPlaying) { lastT = state.t; return; }

    var row = moments.bucketAt(state.t);
    carry += (row.messages_count / api.BUCKET_SECONDS) * moved;
    while (carry >= 1) {
      carry -= 1;
      append(rowHtml(nextMessage(state.t)));
    }
    lastT = state.t;
  }

  function renderBoard() {
    var top = [
      { name: 'BigYoshi_AU', amount: 5000 },
      { name: 'she_clutch', amount: 2400 },
      { name: 'toastedGG', amount: 1100 }
    ];
    board.innerHTML = top.map(function (g) {
      return '<span><b>' + g.name + '</b><em>' + g.amount.toLocaleString() + '</em></span>';
    }).join('');
  }

  KT2.chat = {
    mount: function () {
      body = document.getElementById('chatBody');
      board = document.getElementById('chatBoard');
      renderBoard();

      var input = document.getElementById('chatInput');
      function send() {
        var text = input.value.trim();
        if (!text) return;
        append(rowHtml({ sender: api.subject(api.VIEWER_ME), content: text }));
        input.value = '';
      }
      document.getElementById('chatSend').addEventListener('click', send);
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });

      player.on(tick);
    },

    say: function (text) { append(systemHtml(text)); },

    /*
      The room as it was, for a window of the stream. Each row carries its offset
      from the start of the window, which is what a clip replay shows. Real
      capability: every kick chat.message.sent event is timestamped against
      started_at, so a recorder can rebuild this.
    */
    replayHtml: function (from, span) {
      var rows = [];
      for (var i = 0; i < span && rows.length < REPLAY_LIMIT; i++) {
        var rate = moments.bucketAt(from + i).messages_count / api.BUCKET_SECONDS;
        var count = Math.max(1, Math.round(rate));
        for (var k = 0; k < count && rows.length < REPLAY_LIMIT; k++) {
          rows.push(rowHtml(nextMessage(from + i), moments.mmss(i)));
        }
      }
      return rows.join('');
    }
  };
})(window);
