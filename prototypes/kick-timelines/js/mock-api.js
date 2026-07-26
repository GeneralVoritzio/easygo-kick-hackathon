/*
  MockKickClient. The adapter layer from Hackathon Brief 2A.2: one interface,
  two implementations. LiveKickClient has the same method names and returns the
  same shapes, so the app cannot tell which one it holds.

  Field names come from the real API (.claude/KICK-API-MAP.md). Invented names
  follow KICK-API-CONVENTIONS Part 2.
*/
(function (global) {
  'use strict';
  var KT = global.KT = global.KT || {};

  var CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

  function ulid() {
    var t = Date.now(), head = '', tail = '';
    for (var i = 0; i < 10; i++) { head = CROCKFORD[t % 32] + head; t = Math.floor(t / 32); }
    for (var j = 0; j < 16; j++) tail += CROCKFORD[(Math.random() * 32) | 0];
    return head + tail;
  }

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  // Seeded generator, so the demo replays the same stream every time.
  var seed = 0x5f3c21;
  function rnd() { seed = (seed * 1664525 + 1013904223) & 0x7fffffff; return seed / 0x7fffffff; }
  function rint(lo, hi) { return lo + Math.floor(rnd() * (hi - lo + 1)); }
  function pick(a) { return a[(rnd() * a.length) | 0]; }

  var VOD_LENGTH_SECONDS = 13620;
  var BUCKET_SECONDS = 15;
  var STARTED_AT = new Date(Date.now() - VOD_LENGTH_SECONDS * 1000);

  var channel = {
    broadcaster_user_id: 4471288,
    slug: 'clutchgoblin',
    username: 'ClutchGoblin',
    is_verified: true,
    profile_picture: 'https://files.kick.com/images/user/4471288/profile_image/conversion/6f2a-fullsize.webp',
    stream_title: 'PREMIER GRIND until we hit Global Elite (or i uninstall)',
    active_subscribers_count: 3184,
    canceled_subscribers_count: 96,
    stream: {
      is_live: true,
      is_mature: false,
      language: 'en',
      started_at: STARTED_AT.toISOString(),
      viewer_count: 7840,
      custom_tags: ['English', 'Aussie', 'Ranked', 'Chill']
    }
  };

  var VIEWERS = [
    'SuperBunny551', 'xXNightRaverXx', 'toastedGG', 'lurkmaster99', 'clipfarm3r',
    'kekw_enjoyer', 'ratioed_again', 'vibecheckerr', 'sleepygoose204', 'TurboRaccoon_',
    'notacop_promise', 'mid_diff_andy', 'crispymoth42', 'pogchampion', 'BigYoshi_AU',
    'headshot_hannah', 'gravy_seal', 'wombat_with_wifi', 'ZeroPingZeke', 'melbourne_mick',
    'aimlab_addict', 'twoTapTerry', 'copium_dealer', 'silent_but_deadlift', 'NanaBread77',
    'frog_in_a_sock', 'uninstall_andy', 'peakedInBronze', 'DoritoDustDan', 'she_clutch',
    'moist_toastie', 'PixelPossum', 'RegionalRandy', 'bucket_hat_bailey', 'CtrlAltDefeat_',
    'yeetusdeletus88', 'chair_enjoyer', 'GoblinModeGaz', 'no_scope_noah', 'servo_pie_guy'
  ];
  var MODS = ['toastedGG', 'NanaBread77', 'RegionalRandy'];

  var COLOURS = ['#3EA6FF', '#FFB020', '#FF6BA9', '#8AE1FF', '#C4A5FF', '#7BE38A', '#FF9A6B', '#E3E7E8'];

  function colourFor(name) {
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
    return COLOURS[h % COLOURS.length];
  }

  // One user shape for every human role. Never add a second one.
  function subject(username, badges) {
    return {
      is_anonymous: false,
      user_id: 100000 + (username.length * 977 + username.charCodeAt(0) * 13),
      username: username,
      is_verified: username === 'Ac7ionMan',
      profile_picture: 'https://files.kick.com/images/user/' + (100000 + username.length * 977) +
        '/profile_image/conversion/thumb.webp',
      channel_slug: username.toLowerCase().replace(/[^a-z0-9]/g, ''),
      identity: { username_color: colourFor(username), badges: badges || [] }
    };
  }

  var CHAT_HYPE = [
    'LETS GOOOO 🔥', 'CLIP THAT', 'NO WAY HE HIT THAT', 'ACTUAL INSANITY', 'WWWWW',
    'chat we are so back', 'THAT WAS FILTHY', 'goblin mode engaged', 'HE COOKED',
    '1v4 ARE YOU KIDDING', 'framed and on my wall', 'SHEEEESH', 'ok that was cracked'
  ];
  var CHAT_CALM = [
    'what rank are you now?', 'hi from brazil 🇧🇷', 'first time here, vibes are good',
    'whats the sens', 'mum said i can stay up till the end of the stream',
    'been lurking 2h, best stream on kick rn', 'is this the new map pool',
    'im at work watching this dont tell anyone', 'the aussie accent is elite',
    'anyone else here from the raid', 'kangaroo confirmed', 'W stream',
    'how long you been live?', 'that crosshair is diabolical', 'gm from london',
    'stream quality looking crispy today', 'do the voice', 'brb making toast'
  ];
  var CHAT_SALT = [
    'that was a throw ngl', 'mid diff', 'bro whiffed everything', 'unlucky',
    'copium', 'we ball anyway', 'server issue for sure', 'that tickrate is criminal'
  ];

  var CATEGORIES = {
    chat: { id: 15, name: 'Just Chatting', thumbnail: 'https://files.kick.com/images/subcategories/15/banner/just-chatting.webp' },
    cs2: { id: 28, name: 'Counter-Strike 2', thumbnail: 'https://files.kick.com/images/subcategories/28/banner/counter-strike-2.webp' },
    gta: { id: 8, name: 'GTA V', thumbnail: 'https://files.kick.com/images/subcategories/8/banner/gta-v.webp' },
    slots: { id: 3, name: 'Slots & Casino', thumbnail: 'https://files.kick.com/images/subcategories/3/banner/slots-casino.webp' }
  };

  // The 02:41 switch to Slots costs him the room. That is the lesson in the demo.
  var SEGMENTS = [
    { at: 0, category: CATEGORIES.chat, target: 2400, ramp: 600 },
    { at: 1080, category: CATEGORIES.cs2, target: 5800, ramp: 1200 },
    { at: 6420, category: CATEGORIES.gta, target: 8900, ramp: 900 },
    { at: 9660, category: CATEGORIES.slots, target: 6900, ramp: 720 },
    { at: 11100, category: CATEGORIES.chat, target: 7800, ramp: 600 }
  ];

  var SURGES = [
    { at: 3900, peak: 3200, rise: 90, decay: 1500, mult: 4.2 },
    { at: 5520, peak: 900, rise: 60, decay: 600, mult: 2.1 },
    { at: 7260, peak: 1400, rise: 45, decay: 480, mult: 2.6 },
    { at: 8640, peak: 2100, rise: 50, decay: 900, mult: 3.4 },
    { at: 10380, peak: 700, rise: 60, decay: 540, mult: 1.8 },
    { at: 12540, peak: 2600, rise: 40, decay: 1080, mult: 3.8 }
  ];

  function segmentIndexAt(t) {
    var idx = 0;
    for (var i = 0; i < SEGMENTS.length; i++) if (SEGMENTS[i].at <= t) idx = i;
    return idx;
  }
  function segmentAt(t) { return SEGMENTS[segmentIndexAt(t)]; }

  function baseViewers(t) {
    var i = segmentIndexAt(t), seg = SEGMENTS[i];
    var prev = i === 0 ? 0 : SEGMENTS[i - 1].target;
    var p = Math.min(1, (t - seg.at) / seg.ramp);
    return prev + (seg.target - prev) * (1 - Math.pow(1 - p, 3));
  }

  function surgeAt(t) {
    var add = 0, mult = 1;
    for (var i = 0; i < SURGES.length; i++) {
      var s = SURGES[i], d = t - s.at, f;
      if (d < -s.rise || d > s.decay * 2.2) continue;
      f = d < 0 ? 1 - (-d / s.rise) : Math.exp(-d / s.decay);
      if (f <= 0) continue;
      add += s.peak * f;
      mult = Math.max(mult, 1 + (s.mult - 1) * f);
    }
    return { add: add, mult: mult };
  }

  function buildBuckets(lengthSeconds) {
    var rows = [], n = Math.floor(lengthSeconds / BUCKET_SECONDS) + 1;
    for (var i = 0; i < n; i++) {
      var t = i * BUCKET_SECONDS;
      var sg = surgeAt(t);
      var wobble = 1 + Math.sin(t / 260) * 0.035 + (rnd() - 0.5) * 0.02;
      var viewers = Math.max(0, Math.round((baseViewers(t) + sg.add) * wobble));
      var perMinute = (viewers / 100) * 1.8 * sg.mult * (0.82 + rnd() * 0.36);
      var kicks = 0;
      if (rnd() < (viewers / 180000) * sg.mult * 3) kicks = pick([100, 100, 200, 250, 300, 500, 500, 1000, 2000]);

      rows.push({
        t: t,
        viewer_count: viewers,
        messages_count: Math.max(0, Math.round(perMinute * (BUCKET_SECONDS / 60))),
        follows_count: rnd() < (viewers / 90000) * sg.mult * 3 ? rint(1, Math.max(1, Math.round(2 * sg.mult))) : 0,
        subscriptions_count: rnd() < (viewers / 260000) * sg.mult * 3 ? rint(1, Math.max(1, Math.round(1.5 * sg.mult))) : 0,
        kicks_amount: kicks,
        category_id: segmentAt(t).category.id
      });
    }
    rows[Math.floor(12540 / BUCKET_SECONDS)].kicks_amount += 5000;
    rows[Math.floor(12555 / BUCKET_SECONDS)].subscriptions_count += 24;
    return rows;
  }

  var buckets = buildBuckets(VOD_LENGTH_SECONDS);

  /*
    hype_score is a derived meter, not an API field. It blends four real
    signals and is normalised across the stream, so 100 is the loudest moment.
    The 3 bucket smoothing stops one noisy 15 second window faking a peak.
  */
  function computeHype(rows) {
    var maxM = 1, maxF = 1, maxS = 1, maxK = 1;
    rows.forEach(function (r) {
      if (r.messages_count > maxM) maxM = r.messages_count;
      if (r.follows_count > maxF) maxF = r.follows_count;
      if (r.subscriptions_count > maxS) maxS = r.subscriptions_count;
      if (r.kicks_amount > maxK) maxK = r.kicks_amount;
    });
    var raw = rows.map(function (r) {
      return 0.45 * (r.messages_count / maxM) + 0.15 * (r.follows_count / maxF) +
        0.15 * (r.subscriptions_count / maxS) + 0.25 * (r.kicks_amount / maxK);
    });
    var top = 0.0001;
    for (var i = 0; i < rows.length; i++) {
      var a = raw[Math.max(0, i - 1)], b = raw[i], c = raw[Math.min(raw.length - 1, i + 1)];
      rows[i].hype_score = (a + b * 2 + c) / 4;
      if (rows[i].hype_score > top) top = rows[i].hype_score;
    }
    rows.forEach(function (r) { r.hype_score = Math.round((r.hype_score / top) * 1000) / 10; });
  }
  computeHype(buckets);

  /*
    A marker is a row our recorder writes. KICK has no timeline resource, so
    this surface is invented. It is named in app.js with a fake-kick label, and
    never in this file.
  */
  function marker(o) {
    o.id = o.id || ulid();
    o.created_at = new Date(STARTED_AT.getTime() + o.offset_seconds * 1000).toISOString();
    return o;
  }

  var markers = [
    marker({
      type: 'livestream_status', offset_seconds: 0, title: 'Stream started',
      source_event: 'livestream.status.updated',
      detail: { is_live: true, title: channel.stream_title, category: CATEGORIES.chat }
    }),
    marker({
      type: 'category_change', offset_seconds: 1080, title: 'Category to Counter-Strike 2',
      source_event: 'livestream.metadata.updated',
      detail: { category_from: CATEGORIES.chat, category_to: CATEGORIES.cs2 }
    }),
    marker({
      type: 'raid', offset_seconds: 3900, title: 'Raid from Ac7ionMan',
      source_event: 'chat.message.sent',
      detail: {
        raider: subject('Ac7ionMan', [{ text: 'Verified', type: 'verified', count: 1 }]),
        viewer_count_gained: 3200
      }
    }),
    marker({
      type: 'clip', offset_seconds: 3948, title: 'Ac7ionMan raid reaction',
      source_event: 'timeline.marker.created',
      detail: {
        flagged_by: subject('ClutchGoblin', [{ text: 'Broadcaster', type: 'broadcaster', count: 1 }]),
        flagged_role: 'broadcaster', duration_seconds: 42, trigger: 'hotkey',
        view_count: 18420, is_published: true
      }
    }),
    marker({
      type: 'poll', offset_seconds: 5520, title: 'Ranked grind or new map pool?',
      source_event: 'poll.resolved',
      detail: {
        question: 'What are we doing for the next hour?',
        resolution_mode: 'viewer_vote',
        duration_seconds: 120,
        votes_count: 4187,
        options: [
          { option_id: 1, label: 'Ranked grind, no excuses', votes_count: 2411, is_winner: true },
          { option_id: 2, label: 'New map pool, casual', votes_count: 1290, is_winner: false },
          { option_id: 3, label: 'Aim map for an hour (boring)', votes_count: 486, is_winner: false }
        ]
      }
    }),
    marker({
      type: 'category_change', offset_seconds: 6420, title: 'Category to GTA V',
      source_event: 'livestream.metadata.updated',
      detail: { category_from: CATEGORIES.cs2, category_to: CATEGORIES.gta }
    }),
    marker({
      type: 'clip', offset_seconds: 7266, title: '1v4 retake on Nuke',
      source_event: 'timeline.marker.created',
      detail: {
        flagged_by: subject('toastedGG', [{ text: 'Moderator', type: 'moderator', count: 1 }]),
        flagged_role: 'moderator', duration_seconds: 55, trigger: 'chat_command',
        view_count: 61250, is_published: true
      }
    }),
    marker({
      type: 'poll', offset_seconds: 8640, title: 'Chat picks the next 30 minutes',
      source_event: 'poll.resolved',
      detail: {
        question: 'Chat picks the next 30 minutes',
        resolution_mode: 'chance',
        chance_weighting: 'viewer_weighted',
        duration_seconds: 90,
        votes_count: 6934,
        spin_duration_seconds: 5,
        options: [
          { option_id: 1, label: 'Cayo Perico heist, solo, no prep', votes_count: 4021, is_winner: false },
          { option_id: 2, label: 'Drive to the airport in reverse', votes_count: 1877, is_winner: true },
          { option_id: 3, label: 'Give a stranger $1M and log off', votes_count: 1036, is_winner: false }
        ]
      }
    }),
    marker({
      type: 'clip', offset_seconds: 8712, title: 'The wheel picks reverse airport',
      source_event: 'timeline.marker.created',
      detail: {
        flagged_by: subject('NanaBread77', [{ text: 'Moderator', type: 'moderator', count: 1 }]),
        flagged_role: 'moderator', duration_seconds: 38, trigger: 'chat_command',
        view_count: 94870, is_published: true
      }
    }),
    marker({
      type: 'category_change', offset_seconds: 9660, title: 'Category to Slots & Casino',
      source_event: 'livestream.metadata.updated',
      detail: { category_from: CATEGORIES.gta, category_to: CATEGORIES.slots }
    }),
    marker({
      type: 'category_change', offset_seconds: 11100, title: 'Category to Just Chatting',
      source_event: 'livestream.metadata.updated',
      detail: { category_from: CATEGORIES.slots, category_to: CATEGORIES.chat }
    }),
    marker({
      type: 'kicks', offset_seconds: 12540, title: '5,000 kicks from BigYoshi_AU',
      source_event: 'kicks.gifted',
      detail: {
        sender: subject('BigYoshi_AU', [{ text: 'Subscriber', type: 'subscriber', count: 14 }]),
        gift: {
          amount: 5000, name: 'Kick Bomb', type: 'kicks', tier: 'legendary',
          pinned_time_seconds: 120, message: 'for the reverse airport run. worth every cent'
        }
      }
    }),
    marker({
      type: 'clip', offset_seconds: 12564, title: 'Reading the 5k kicks message',
      source_event: 'timeline.marker.created',
      detail: {
        flagged_by: subject('ClutchGoblin', [{ text: 'Broadcaster', type: 'broadcaster', count: 1 }]),
        flagged_role: 'broadcaster', duration_seconds: 47, trigger: 'hotkey',
        view_count: 7310, is_published: false
      }
    }),
    marker({
      type: 'milestone', offset_seconds: 12570, title: 'Sub train, 24 subs in 90s',
      source_event: 'channel.subscription.gifts',
      detail: {
        gifter: subject('she_clutch', [{ text: 'OG', type: 'og', count: 1 }]),
        giftees_count: 24
      }
    })
  ].sort(function (a, b) { return a.offset_seconds - b.offset_seconds; });

  var PEAK_LINES = {
    3900: ['RAID LETS GOOO', 'ac7ion army reporting in 🫡', 'chat just doubled', 'WELCOME RAIDERS', 'oh he is cooked now'],
    7260: ['1v4 NO WAY', 'CLIP THAT', 'FRAME IT', 'that was actual insanity', 'ok he is him', 'WWWWWW'],
    8640: ['NOT THE 27%', 'THE WHEEL HAS SPOKEN', 'reverse airport arc begins', 'chat we did this', 'RIGGED (in a good way)'],
    12540: ['5000 KICKS??', 'BIG YOSHI THE GOAT', 'that message got me', 'holy generosity', 'W BigYoshi']
  };

  function chatAt(t) {
    var key = null;
    Object.keys(PEAK_LINES).forEach(function (k) { if (Math.abs(t - (+k)) < 240) key = k; });
    var pool = key ? PEAK_LINES[key] : (t > 9660 && t < 11100 ? CHAT_SALT : CHAT_CALM);
    var out = [];
    for (var i = 0; i < 4; i++) out.push({ sender: subject(pick(VIEWERS)), content: pool[i % pool.length] });
    return out;
  }

  // Compares the viewer_count samples before a marker with the samples after.
  function impactAt(offsetSeconds, windowSeconds) {
    var w = windowSeconds || 600;
    function slice(a, b) { return buckets.filter(function (r) { return r.t >= a && r.t < b; }); }
    function avg(rows, k) { return rows.reduce(function (s, r) { return s + r[k]; }, 0) / rows.length; }
    function sum(rows, k) { return rows.reduce(function (s, r) { return s + r[k]; }, 0); }

    var before = slice(offsetSeconds - w, offsetSeconds), after = slice(offsetSeconds, offsetSeconds + w);
    if (!before.length || !after.length) return null;
    var vb = avg(before, 'viewer_count'), va = avg(after, 'viewer_count');
    return {
      window_seconds: w,
      viewer_count_before: Math.round(vb),
      viewer_count_after: Math.round(va),
      viewer_count_delta_pct: Math.round(((va - vb) / vb) * 1000) / 10,
      follows_count_before: sum(before, 'follows_count'),
      follows_count_after: sum(after, 'follows_count'),
      subscriptions_count_before: sum(before, 'subscriptions_count'),
      subscriptions_count_after: sum(after, 'subscriptions_count'),
      kicks_amount_after: sum(after, 'kicks_amount')
    };
  }

  /*
    The real KICK surface each shape above stands in for. Every label starts
    with kick, so a reader cannot mistake it for surface we invented.
    Invented endpoints carry a fake-kick label, and they live in app.js.
  */
  var KICK_SOURCES = {
    livestreams: 'kick GET /public/v2/livestreams',
    channels: 'kick GET /public/v1/channels',
    chat_message_sent: 'kick chat.message.sent',
    channel_followed: 'kick channel.followed',
    channel_subscription: 'kick channel.subscription.new, .gifts, .renewal',
    kicks_gifted: 'kick kicks.gifted',
    livestream_metadata_updated: 'kick livestream.metadata.updated',
    livestream_status_updated: 'kick livestream.status.updated'
  };

  var exportKey = 'tl_' + ulid().slice(0, 12).toLowerCase();
  var exportElements = [
    { element_id: 'hype_ticker', label: 'Live hype meter', description: 'Shows the hype score and a 60 second sparkline.', is_enabled: true, size: '480x120' },
    { element_id: 'poll_card', label: 'Poll and roulette card', description: 'Shows an open poll, and the wheel when it spins.', is_enabled: true, size: '560x320' },
    { element_id: 'clip_toast', label: 'Clip flagged toast', description: 'Shows a 4 second toast when you or a mod flags a clip.', is_enabled: false, size: '420x96' },
    { element_id: 'peak_alert', label: 'Peak detected alert', description: 'Fires when the hype score goes above your threshold.', is_enabled: false, size: '420x96' },
    { element_id: 'session_ribbon', label: 'Session timeline ribbon', description: 'Shows a small live copy of this timeline.', is_enabled: false, size: '1280x72' }
  ];

  KT.api = {
    VOD_LENGTH_SECONDS: VOD_LENGTH_SECONDS,
    BUCKET_SECONDS: BUCKET_SECONDS,
    STARTED_AT: STARTED_AT,
    CATEGORIES: CATEGORIES,
    KICK_SOURCES: KICK_SOURCES,
    SEGMENTS: SEGMENTS,
    VIEWERS: VIEWERS,
    MODS: MODS,
    CHAT_HYPE: CHAT_HYPE,
    CHAT_CALM: CHAT_CALM,
    CHAT_SALT: CHAT_SALT,

    ulid: ulid,
    uuid: uuid,
    rint: rint,
    pick: pick,
    subject: subject,
    colourFor: colourFor,

    getChannel: function () { return channel; },
    getBuckets: function () { return buckets; },
    getMarkers: function () { return markers; },
    getExports: function () { return exportElements; },
    getExportKey: function () { return exportKey; },
    categoryAt: function (t) { return segmentAt(t).category; },
    chatAt: chatAt,
    impactAt: impactAt,

    createMarker: function (m) {
      var made = marker(m);
      markers.push(made);
      markers.sort(function (a, b) { return a.offset_seconds - b.offset_seconds; });
      return made;
    },

    pushBucket: function (row) { buckets.push(row); return row; },
    recomputeHype: function () { computeHype(buckets); }
  };
})(window);
