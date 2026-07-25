/*
  The live event generator. The recorded stream is seeded at startup. This adds
  new behaviour while you watch.

  Rates are a function of viewer_count, not a fixed loop. A surge raises the
  rate multiplier and the audience together, then both decay.
*/
(function (global) {
  'use strict';
  var KT = global.KT = global.KT || {};
  var api = KT.api;

  var TICK_MS = 200;
  var CHAT_RENDER_MS = 240;

  var handlers = {}, tickTimer = null, chatTimer = null;

  var st = {
    live_offset: api.VOD_LENGTH_SECONDS,
    viewer_count: 7840,
    surge_add: 0,
    surges: [],
    bucket_index: Math.floor(api.VOD_LENGTH_SECONDS / api.BUCKET_SECONDS),
    bucket: null,
    queue: [],
    minute_window: [],
    is_running: false
  };

  function newBucket(index) {
    return {
      t: index * api.BUCKET_SECONDS,
      viewer_count: st.viewer_count,
      messages_count: 0,
      follows_count: 0,
      subscriptions_count: 0,
      kicks_amount: 0,
      category_id: api.categoryAt(index * api.BUCKET_SECONDS).id,
      hype_score: 0
    };
  }

  function surgeFactor() {
    var add = 0, mult = 1, now = st.live_offset;
    st.surges = st.surges.filter(function (s) { return now - s.at < s.decay * 3 + s.rise; });
    st.surges.forEach(function (s) {
      var d = now - s.at;
      if (d < 0) return;
      var f = d < s.rise ? d / s.rise : Math.exp(-(d - s.rise) / s.decay);
      add += s.peak * f;
      mult = Math.max(mult, 1 + (s.mult - 1) * f);
    });
    return { add: add, mult: mult };
  }

  function badgesFor(name) {
    if (api.MODS.indexOf(name) !== -1) return [{ text: 'Moderator', type: 'moderator', count: 1 }];
    if (name === api.getChannel().username) return [{ text: 'Broadcaster', type: 'broadcaster', count: 1 }];
    if (name.length % 3 === 0) return [{ text: 'Subscriber', type: 'subscriber', count: (name.length % 24) + 1 }];
    return [];
  }

  function emitChat(content, username, badges) {
    var name = username || api.pick(api.VIEWERS);
    var msg = {
      message_id: api.uuid(),
      broadcaster: api.subject(api.getChannel().username, [{ text: 'Broadcaster', type: 'broadcaster', count: 1 }]),
      sender: api.subject(name, badges || badgesFor(name)),
      content: content,
      emotes: [],
      created_at: new Date().toISOString()
    };
    st.queue.push(msg);
    st.bucket.messages_count++;
    st.minute_window.push(Date.now());
    return msg;
  }

  function emitFollow() {
    st.bucket.follows_count++;
    if (handlers.onEvent) handlers.onEvent('channel.followed', { follower: api.subject(api.pick(api.VIEWERS)) });
  }

  function emitSub(count) {
    st.bucket.subscriptions_count += (count || 1);
    if (handlers.onEvent) {
      handlers.onEvent('channel.subscription.new', { subscriber: api.subject(api.pick(api.VIEWERS)), duration: 1 });
    }
  }

  function emitKicks(amount, username, message) {
    var sender = api.subject(username || api.pick(api.VIEWERS));
    st.bucket.kicks_amount += amount;
    if (handlers.onEvent) {
      handlers.onEvent('kicks.gifted', {
        sender: sender,
        gift: {
          amount: amount,
          name: amount >= 2000 ? 'Kick Bomb' : 'Kick Pack',
          type: 'kicks',
          tier: amount >= 2000 ? 'legendary' : amount >= 500 ? 'epic' : 'common',
          message: message || '',
          pinned_time_seconds: amount >= 2000 ? 120 : 30
        },
        created_at: new Date().toISOString()
      });
    }
    return sender;
  }

  function tick() {
    var dt = TICK_MS / 1000;
    st.live_offset += dt;

    var sg = surgeFactor();
    var target = api.SEGMENTS[api.SEGMENTS.length - 1].target;
    var base = st.viewer_count - st.surge_add;
    base += (target - base) * 0.004 + (Math.random() - 0.5) * base * 0.004;
    st.surge_add = sg.add;
    st.viewer_count = Math.max(0, Math.round(base + sg.add));

    var perMinute = (st.viewer_count / 100) * 1.8 * sg.mult;
    var expected = (perMinute / 60) * dt;
    var count = Math.floor(expected) + (Math.random() < (expected % 1) ? 1 : 0);
    for (var i = 0; i < count; i++) {
      var pool = sg.mult > 1.7 ? api.CHAT_HYPE : (Math.random() < 0.22 ? api.CHAT_SALT : api.CHAT_CALM);
      emitChat(api.pick(pool));
    }

    if (Math.random() < (st.viewer_count / 90000) * sg.mult * dt * 3) emitFollow();
    if (Math.random() < (st.viewer_count / 300000) * sg.mult * dt * 3) emitSub(1);
    if (Math.random() < (st.viewer_count / 220000) * sg.mult * dt * 3) {
      emitKicks(api.pick([100, 100, 200, 250, 300, 500, 1000]));
    }

    var idx = Math.floor(st.live_offset / api.BUCKET_SECONDS);
    if (idx > st.bucket_index) {
      st.bucket.viewer_count = st.viewer_count;
      api.pushBucket(st.bucket);
      api.recomputeHype();
      st.bucket_index = idx;
      st.bucket = newBucket(idx);
      if (handlers.onBucket) handlers.onBucket();
    }

    var cutoff = Date.now() - 60000;
    while (st.minute_window.length && st.minute_window[0] < cutoff) st.minute_window.shift();
    if (handlers.onTick) handlers.onTick();
  }

  function drainChat() {
    if (!st.queue.length) return;
    // A real chat panel also drops messages when it cannot keep up.
    if (st.queue.length > 40) st.queue.splice(0, st.queue.length - 40);
    if (handlers.onChat) handlers.onChat(st.queue.shift());
  }

  function fireRaid(t) {
    st.surges.push({ at: st.live_offset, peak: 2400, rise: 6, decay: 90, mult: 4.4 });
    if (handlers.onSystem) handlers.onSystem('<b>Ac7ionMan</b> is raiding with 2,400 viewers.');
    emitChat('RAID LETS GOOO', 'toastedGG');
    emitChat('ac7ion army reporting in 🫡');
    return api.createMarker({
      type: 'raid', offset_seconds: t, title: 'Raid from Ac7ionMan',
      source_event: 'chat.message.sent', is_new: true,
      detail: {
        raider: api.subject('Ac7ionMan', [{ text: 'Verified', type: 'verified', count: 1 }]),
        viewer_count_gained: 2400
      }
    });
  }

  function fireWhale(t) {
    st.surges.push({ at: st.live_offset, peak: 1600, rise: 5, decay: 110, mult: 3.6 });
    var sender = emitKicks(5000, 'BigYoshi_AU', 'this stream carried my whole week');
    if (handlers.onSystem) handlers.onSystem('<b>BigYoshi_AU</b> gifted 5,000 kicks.');
    emitChat('5000 KICKS??');
    emitChat('BIG YOSHI THE GOAT', 'NanaBread77');
    return api.createMarker({
      type: 'kicks', offset_seconds: t, title: '5,000 kicks from BigYoshi_AU',
      source_event: 'kicks.gifted', is_new: true,
      detail: {
        sender: sender,
        gift: {
          amount: 5000, name: 'Kick Bomb', type: 'kicks', tier: 'legendary',
          pinned_time_seconds: 120, message: 'this stream carried my whole week'
        }
      }
    });
  }

  function fireSubTrain(t) {
    st.surges.push({ at: st.live_offset, peak: 900, rise: 6, decay: 80, mult: 2.4 });
    emitSub(18);
    if (handlers.onSystem) handlers.onSystem('<b>she_clutch</b> gifted 18 subscriptions.');
    emitChat('SUB TRAIN LETS GO');
    return api.createMarker({
      type: 'milestone', offset_seconds: t, title: 'Sub train, 18 subs',
      source_event: 'channel.subscription.gifts', is_new: true,
      detail: { gifter: api.subject('she_clutch', [{ text: 'OG', type: 'og', count: 1 }]), giftees_count: 18 }
    });
  }

  function fireCategory(t) {
    var order = [api.CATEGORIES.chat, api.CATEGORIES.cs2, api.CATEGORIES.gta, api.CATEGORIES.slots];
    var from = api.categoryAt(st.live_offset);
    var ids = order.map(function (c) { return c.id; });
    var to = order[(ids.indexOf(from.id) + 1) % order.length];
    // A category change moves the audience. Slots costs this streamer about 20%.
    var target = to.id === api.CATEGORIES.slots.id ? Math.round(st.viewer_count * 0.78)
      : to.id === api.CATEGORIES.gta.id ? Math.round(st.viewer_count * 1.14)
        : Math.round(st.viewer_count * 0.97);

    api.SEGMENTS.push({ at: Math.round(st.live_offset), category: to, target: target, ramp: 240 });
    if (handlers.onSystem) handlers.onSystem('Category changed to <b>' + to.name + '</b>.');
    if (handlers.onCategory) handlers.onCategory(to);
    return api.createMarker({
      type: 'category_change', offset_seconds: t, title: 'Category to ' + to.name,
      source_event: 'livestream.metadata.updated', is_new: true,
      detail: { category_from: from, category_to: to }
    });
  }

  function fire(kind) {
    var t = Math.round(st.live_offset);
    if (kind === 'raid') return fireRaid(t);
    if (kind === 'whale') return fireWhale(t);
    if (kind === 'subtrain') return fireSubTrain(t);
    if (kind === 'category') return fireCategory(t);
    return null;
  }

  function seedPollChatter(poll) {
    for (var i = 0; i < 6; i++) {
      emitChat('!vote ' + poll.options[Math.floor(Math.random() * poll.options.length)].option_id);
    }
    emitChat(poll.resolution_mode === 'chance' ? 'THE WHEEL DECIDES' : 'option 1 obviously');
  }

  KT.engine = {
    init: function (h) { handlers = h || {}; st.bucket = newBucket(st.bucket_index); },
    start: function () {
      if (st.is_running) return;
      st.is_running = true;
      tickTimer = global.setInterval(tick, TICK_MS);
      chatTimer = global.setInterval(drainChat, CHAT_RENDER_MS);
    },
    stop: function () {
      st.is_running = false;
      global.clearInterval(tickTimer);
      global.clearInterval(chatTimer);
    },
    fire: fire,
    seedPollChatter: seedPollChatter,
    emitChat: emitChat,
    liveOffset: function () { return st.live_offset; },
    viewerCount: function () { return st.viewer_count; },
    velocity: function () { return st.minute_window.length; },
    hypeNow: function () {
      var rows = api.getBuckets();
      return rows.length ? rows[rows.length - 1].hype_score : 0;
    }
  };
})(window);
