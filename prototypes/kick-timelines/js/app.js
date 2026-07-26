(function (global) {
  'use strict';
  var KT = global.KT, api = KT.api, TL = KT.timeline, EN = KT.engine;
  var esc = TL.esc, hms = TL.hms, fmtInt = TL.fmtInt, tag = TL.tag, icon = TL.icon;

  var state = {
    playhead: 3900,
    is_playing: false,
    is_following_live: false,
    speed: 1,
    mode: 'streamer',
    active_tab: 'log',
    poll: null,
    layers: ['clip', 'poll', 'category_change', 'peak']
  };

  /*
    Surface this app invented, named per KICK-API-CONVENTIONS Part 2. Every
    label starts with fake-kick, so a reader cannot mistake it for real KICK
    surface. The real endpoints are in api.KICK_SOURCES.
  */
  var FAKE_MARKERS_LIST = 'fake-kick GET /public/v1/timelines/{livestream_id}/markers';
  var FAKE_MARKER_CREATE = 'fake-kick POST /public/v1/timelines/markers, timeline.marker.created';
  var FAKE_POLL_CREATE = 'fake-kick POST /public/v1/polls, poll.created, poll.resolved';
  var FAKE_EXPORTS = 'fake-kick POST /public/v1/timelines/exports';

  var el = {};
  function $(id) { return document.getElementById(id); }

  function duration() { return Math.max(api.VOD_LENGTH_SECONDS, Math.floor(EN.liveOffset())); }

  function paintStage() {
    var category = api.categoryAt(state.playhead);
    el.scene.setAttribute('style', TL.scenePaint(state.playhead));
    el.stageCategory.textContent = category.name;
    el.hudCategory.textContent = category.name;
    el.hudTime.textContent = hms(state.playhead);
    el.hudLive.hidden = !state.is_following_live;
  }

  var toastTimer = null;
  function toast(html) {
    el.toast.innerHTML = html;
    el.toast.hidden = false;
    global.clearTimeout(toastTimer);
    toastTimer = global.setTimeout(function () { el.toast.hidden = true; }, 4000);
  }

  function seek(t) {
    var dur = duration();
    state.playhead = Math.max(0, Math.min(dur, t));
    state.is_following_live = (dur - state.playhead) < 3;
    TL.setPlayhead(state.playhead);
    el.clockNow.textContent = hms(state.playhead);
    el.clockEnd.textContent = hms(dur);
    el.btnLive.classList.toggle('is-live', state.is_following_live);
    paintStage();
    markCurrentLogRow();
  }

  function setPlaying(on) {
    state.is_playing = on;
    el.btnPlay.innerHTML = on
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
    el.btnPlay.setAttribute('aria-label', on ? 'Pause' : 'Play');
  }

  function stepMarker(direction) {
    var list = api.getMarkers().filter(function (m) { return m.offset_seconds <= duration(); });
    var target = null, i;
    if (direction > 0) {
      for (i = 0; i < list.length; i++) if (list[i].offset_seconds > state.playhead + 1) { target = list[i]; break; }
    } else {
      for (i = list.length - 1; i >= 0; i--) if (list[i].offset_seconds < state.playhead - 1) { target = list[i]; break; }
    }
    if (!target) return;
    seek(target.offset_seconds);
    toast('<b>' + esc(target.title) + '</b><br>' + hms(target.offset_seconds));
  }

  function badgeChip(b) {
    var letter = { broadcaster: 'B', moderator: 'M', subscriber: 'S', verified: '+', og: 'OG' }[b.type] || '.';
    return '<span class="msg__badge msg__badge--' + esc(b.type) + '" title="' + esc(b.text) + '">' + letter + '</span>';
  }

  function isChatAtBottom() {
    return el.chatBody.scrollHeight - el.chatBody.scrollTop - el.chatBody.clientHeight < 60;
  }

  function appendChat(msg) {
    var atBottom = isChatAtBottom();
    var div = document.createElement('div');
    div.className = 'msg msg--in';
    div.innerHTML = (msg.sender.identity.badges || []).map(badgeChip).join('') +
      '<span class="msg__user" style="color:' + msg.sender.identity.username_color + '">' +
      esc(msg.sender.username) + '</span><span class="msg__sep">: </span>' +
      '<span class="msg__body">' + esc(msg.content) + '</span>';
    el.chatBody.appendChild(div);
    while (el.chatBody.childNodes.length > 140) el.chatBody.removeChild(el.chatBody.firstChild);
    if (atBottom) el.chatBody.scrollTop = el.chatBody.scrollHeight;
  }

  function systemChat(html) {
    var atBottom = isChatAtBottom();
    var div = document.createElement('div');
    div.className = 'msg msg--system msg--in';
    div.innerHTML = html;
    el.chatBody.appendChild(div);
    if (atBottom) el.chatBody.scrollTop = el.chatBody.scrollHeight;
  }

  function sendChat() {
    var text = el.chatInput.value.trim();
    if (!text) return;
    el.chatInput.value = '';

    if (/^!clip\b/i.test(text)) { flagClip('chat_command', 'ClutchGoblin'); return; }

    var vote = text.match(/^!vote\s+(\d+)/i);
    if (vote && state.poll && !state.poll.is_resolved) {
      var option = state.poll.options.filter(function (o) { return o.option_id === +vote[1]; })[0];
      if (option) { option.votes_count += 1; state.poll.votes_count += 1; renderPollCard(); }
      EN.emitChat(text, 'ClutchGoblin');
      return;
    }
    EN.emitChat(text, 'ClutchGoblin', [{ text: 'Broadcaster', type: 'broadcaster', count: 1 }]);
  }

  function flagClip(trigger, who) {
    var role = who === 'ClutchGoblin' ? 'broadcaster' : 'moderator';
    var at = Math.max(0, Math.round(state.playhead) - 30);
    var marker = api.createMarker({
      type: 'clip', offset_seconds: at, is_new: true,
      title: api.categoryAt(at).name + ' clip at ' + hms(state.playhead),
      source_event: 'timeline.marker.created',
      detail: {
        flagged_by: api.subject(who, role === 'broadcaster'
          ? [{ text: 'Broadcaster', type: 'broadcaster', count: 1 }]
          : [{ text: 'Moderator', type: 'moderator', count: 1 }]),
        flagged_role: role, duration_seconds: 45, trigger: trigger,
        view_count: 0, is_published: false
      }
    });
    systemChat('<b>Clip flagged</b> at ' + hms(at) + '. Length 45s. Saved as a draft.');
    toast('<b>Clip flagged</b><br>' + hms(at) + ' to ' + hms(at + 45) + ', draft');
    TL.render();
    renderTabs();
    return marker;
  }

  var POLL_TEMPLATES = [
    {
      question: 'Chat decides the next 30 minutes',
      options: [
        { option_id: 1, label: 'Ranked, but only the worst gun in the game' },
        { option_id: 2, label: 'Duo queue with a random viewer' },
        { option_id: 3, label: 'Drive to the airport in reverse. Again.' }
      ]
    },
    {
      question: 'What happens if we lose this round?',
      options: [
        { option_id: 1, label: 'Uninstall on stream, 5 minute timer' },
        { option_id: 2, label: 'Switch to Just Chatting and cope' },
        { option_id: 3, label: 'Nothing. We do not lose.' }
      ]
    }
  ];
  var pollCount = 0;
  var pollVoteTimer = null;

  function openPoll() {
    if (state.poll && !state.poll.is_resolved) { toast('A poll is already open.'); return; }
    var template = POLL_TEMPLATES[pollCount++ % POLL_TEMPLATES.length];
    state.poll = {
      id: api.ulid(),
      question: template.question,
      options: template.options.map(function (o) {
        return { option_id: o.option_id, label: o.label, votes_count: api.rint(40, 180) };
      }),
      votes_count: 0,
      resolution_mode: 'viewer_vote',
      chance_weighting: 'viewer_weighted',
      is_timeline_visible: true,
      is_resolved: false,
      offset_seconds: Math.round(EN.liveOffset()),
      duration_seconds: 90
    };
    state.poll.votes_count = state.poll.options.reduce(function (s, o) { return s + o.votes_count; }, 0);
    systemChat('<b>Poll opened.</b> ' + esc(state.poll.question) + '. Vote with <code>!vote 1</code>');
    EN.seedPollChatter(state.poll);
    renderPollCard();

    global.clearInterval(pollVoteTimer);
    pollVoteTimer = global.setInterval(addPollVotes, 700);
  }

  function addPollVotes() {
    if (!state.poll || state.poll.is_resolved) { global.clearInterval(pollVoteTimer); return; }
    var lean = state.poll.options[state.poll.id.charCodeAt(3) % state.poll.options.length];
    state.poll.options.forEach(function (o) {
      var n = Math.round((EN.viewerCount() / 900) * (o === lean ? 2.1 : 0.9) * Math.random());
      o.votes_count += n;
      state.poll.votes_count += n;
    });
    renderPollCard();
  }

  function renderPollCard() {
    var p = state.poll;
    if (!p) { el.chatPoll.hidden = true; return; }
    var total = p.votes_count || 1;
    el.chatPoll.hidden = false;
    el.chatPoll.innerHTML =
      '<div class="eyebrow">' + (p.is_resolved ? 'poll.resolved' : 'poll.created') + '</div>' +
      '<h4>' + esc(p.question) + '</h4>' +
      '<div class="vbar">' + p.options.map(function (o) {
        var pct = (o.votes_count / total) * 100;
        return '<div class="vbar__row ' + (p.resolved_option_id === o.option_id ? 'is-winner' : '') + '">' +
          '<div class="vbar__top"><span>' + o.option_id + '. ' + esc(o.label) + '</span>' +
          '<b>' + pct.toFixed(0) + '%</b></div>' +
          '<div class="vbar__track"><i class="vbar__fill" style="width:' + pct.toFixed(1) + '%"></i></div></div>';
      }).join('') + '</div>' +
      '<div class="prow" style="margin-top:8px"><span>' + fmtInt(p.votes_count) + ' votes</span>' +
        '<label class="tog"><input type="checkbox" id="pollOnTimeline"' + (p.is_timeline_visible ? ' checked' : '') +
        '><span>Show on timeline</span></label></div>' +
      (p.is_resolved
        ? '<div class="prow" style="margin-top:6px"><span>Result</span><b>' +
          esc(p.options.filter(function (o) { return o.option_id === p.resolved_option_id; })[0].label) + '</b></div>'
        : '<div class="pollcta">' +
          '<button class="btn btn--secondary btn--sm" id="pollByVote">Viewers decide</button>' +
          '<button class="btn btn--primary btn--sm" id="pollByChance">Leave it to chance</button></div>');

    var onTimeline = $('pollOnTimeline');
    if (onTimeline) {
      onTimeline.addEventListener('change', function () { p.is_timeline_visible = onTimeline.checked; });
    }
    var byVote = $('pollByVote'), byChance = $('pollByChance');
    if (byVote) byVote.addEventListener('click', function () { resolvePoll('viewer_vote'); });
    if (byChance) byChance.addEventListener('click', function () { resolvePoll('chance'); });
  }

  function resolvePoll(mode) {
    var p = state.poll;
    if (!p || p.is_resolved) return;
    p.resolution_mode = mode;
    global.clearInterval(pollVoteTimer);

    if (mode === 'viewer_vote') {
      finishPoll(p.options.slice().sort(function (a, b) { return b.votes_count - a.votes_count; })[0]);
      return;
    }
    KT.roulette.open({
      question: p.question,
      options: p.options,
      chance_weighting: p.chance_weighting,
      onResolved: function (option, wheel) {
        p.chance_weighting = wheel.chance_weighting;
        finishPoll(option);
      }
    });
  }

  function finishPoll(winner) {
    var p = state.poll;
    p.is_resolved = true;
    p.resolved_option_id = winner.option_id;
    p.options.forEach(function (o) { o.is_winner = o.option_id === winner.option_id; });
    renderPollCard();

    systemChat('<b>Poll resolved.</b> ' + esc(winner.label) + '. Method: ' +
      (p.resolution_mode === 'chance' ? 'chance, ' + p.chance_weighting.replace('_', ' ') : 'viewer vote') + '.');
    EN.emitChat(p.resolution_mode === 'chance' ? 'THE WHEEL HAS SPOKEN' : 'chat has spoken', 'toastedGG');
    toast('<b>Poll resolved</b><br>' + esc(winner.label));

    if (!p.is_timeline_visible) {
      systemChat('This poll is hidden from the timeline. The streamer opted out.');
      renderTabs();
      return;
    }

    api.createMarker({
      type: 'poll', offset_seconds: p.offset_seconds, is_new: true,
      title: p.question, source_event: 'poll.resolved',
      detail: {
        question: p.question,
        resolution_mode: p.resolution_mode,
        chance_weighting: p.resolution_mode === 'chance' ? p.chance_weighting : undefined,
        duration_seconds: p.duration_seconds,
        votes_count: p.votes_count,
        spin_duration_seconds: KT.roulette.SPIN_SECONDS,
        options: p.options.map(function (o) {
          return { option_id: o.option_id, label: o.label, votes_count: o.votes_count, is_winner: !!o.is_winner };
        })
      }
    });
    TL.render();
    renderTabs();
  }

  function markerSubtitle(m) {
    var d = m.detail || {};
    if (m.type === 'clip') {
      return (d.flagged_role === 'broadcaster' ? 'Flagged by the streamer' : 'Flagged by ' + d.flagged_by.username) +
        ', ' + d.duration_seconds + 's, ' + (d.trigger === 'chat_command' ? '!clip' : 'hotkey');
    }
    if (m.type === 'poll') {
      return (d.resolution_mode === 'chance'
        ? 'Resolved by chance (' + (d.chance_weighting === 'even' ? 'even split' : 'weighted by votes') + ')'
        : 'Resolved by viewer vote') + ', ' + fmtInt(d.votes_count) + ' votes';
    }
    if (m.type === 'category_change') return d.category_from.name + ' to ' + d.category_to.name;
    if (m.type === 'raid') return 'plus ' + fmtInt(d.viewer_count_gained) + ' viewers from ' + d.raider.username;
    if (m.type === 'kicks') return fmtInt(d.gift.amount) + ' kicks, ' + d.gift.tier;
    if (m.type === 'milestone') return d.giftees_count + ' gifted by ' + d.gifter.username;
    return m.source_event;
  }

  function markerTags(m) {
    var out = '';
    if (m.type === 'category_change') {
      var im = api.impactAt(m.offset_seconds);
      if (im) {
        out += tag((im.viewer_count_delta_pct > 0 ? '+' : '') + im.viewer_count_delta_pct + '% viewers',
          im.viewer_count_delta_pct < -5 ? 'tag--bad' : im.viewer_count_delta_pct > 3 ? 'tag--good' : '');
      }
    }
    if (m.type === 'clip') out += tag(m.detail.is_published ? fmtInt(m.detail.view_count) + ' views' : 'draft');
    if (m.type === 'poll') out += tag(m.detail.resolution_mode === 'chance' ? 'chance' : 'viewers');
    return out;
  }

  function renderLog() {
    var dur = duration();
    var rows = api.getMarkers().filter(function (m) { return m.offset_seconds <= dur; });
    el.paneLog.innerHTML = '<div class="log">' + rows.map(function (m) {
      return '<div class="lrow" tabindex="0" role="button" data-seek="' + m.offset_seconds + '">' +
        '<span class="lrow__t">' + hms(m.offset_seconds) + '</span>' +
        '<span class="lrow__ico mk--' + m.type + '">' + icon(m.type) + '</span>' +
        '<span class="lrow__main"><span class="lrow__title">' + esc(m.title) + '</span>' +
        '<span class="lrow__sub">' + esc(markerSubtitle(m)) + '</span></span>' +
        '<span class="lrow__tags">' + markerTags(m) + '</span></div>';
    }).join('') + '</div>';
    markCurrentLogRow();
  }

  function markCurrentLogRow() {
    if (state.active_tab !== 'log' || !el.paneLog) return;
    var best = null;
    Array.prototype.forEach.call(el.paneLog.querySelectorAll('.lrow'), function (r) {
      r.classList.remove('is-current');
      if (+r.dataset.seek <= state.playhead) best = r;
    });
    if (best) best.classList.add('is-current');
  }

  function renderDecisionTree(polls) {
    if (!polls.length) return '<p class="note">No polls yet in this stream.</p>';
    return polls.map(function (m) {
      var d = m.detail;
      var total = d.options.reduce(function (s, o) { return s + o.votes_count; }, 0) || 1;
      var chance = d.resolution_mode === 'chance';
      return '<div class="tnode">' +
        '<div class="tnode__head"><span class="tnode__time">' + hms(m.offset_seconds) + '</span><div>' +
          '<h4 class="tnode__q">' + esc(d.question) + '</h4><div class="tnode__mode">' +
          tag(chance ? 'Up to chance' : 'Up to viewers', chance ? '' : 'tag--good') +
          (chance ? ' ' + tag(d.chance_weighting === 'even' ? 'Even split' : 'Weighted by votes') : '') +
          ' ' + tag(fmtInt(d.votes_count) + ' votes') + '</div></div></div>' +
        '<div class="branches">' + d.options.map(function (o) {
          var pct = (o.votes_count / total) * 100;
          var odds = chance && d.chance_weighting === 'even' ? 100 / d.options.length : pct;
          return '<div class="branch ' + (o.is_winner ? 'is-chosen' : '') + '">' +
            '<span class="branch__label">' + esc(o.label) + '</span>' +
            '<span class="branch__pct">' + pct.toFixed(0) + '% votes' +
            (chance ? ', ' + odds.toFixed(0) + '% odds' : '') + '</span>' +
            (o.is_winner ? '<span class="tag tag--good">chosen</span>' : '') + '</div>';
        }).join('') + '</div>' +
        '<div class="tnode__foot">' +
          '<button class="btn btn--secondary btn--sm" data-seek="' + m.offset_seconds + '">Go to ' + hms(m.offset_seconds) + '</button>' +
          (chance ? '<button class="btn btn--ghost btn--sm" data-replay="' + m.id + '">Show the wheel again</button>' : '') +
        '</div></div>';
    }).join('');
  }

  function renderImpactTable(changes) {
    return '<table class="itable"><thead><tr><th>Time</th><th>Decision</th>' +
      '<th class="num">Viewers before</th><th class="num">After 10 min</th><th class="num">Change</th>' +
      '<th class="num">Follows</th><th class="num">Subs</th></tr></thead><tbody>' +
      changes.map(function (m) {
        var im = api.impactAt(m.offset_seconds);
        if (!im) {
          return '<tr data-seek="' + m.offset_seconds + '"><td class="t">' + hms(m.offset_seconds) + '</td>' +
            '<td>' + esc(m.detail.category_from.name) + ' to <b>' + esc(m.detail.category_to.name) + '</b></td>' +
            '<td class="num" colspan="5">Still measuring. This needs 10 minutes of samples.</td></tr>';
        }
        var cls = im.viewer_count_delta_pct < -5 ? 'neg' : im.viewer_count_delta_pct > 3 ? 'pos' : '';
        return '<tr data-seek="' + m.offset_seconds + '">' +
          '<td class="t">' + hms(m.offset_seconds) + '</td>' +
          '<td>' + esc(m.detail.category_from.name) + ' to <b>' + esc(m.detail.category_to.name) + '</b></td>' +
          '<td class="num">' + fmtInt(im.viewer_count_before) + '</td>' +
          '<td class="num">' + fmtInt(im.viewer_count_after) + '</td>' +
          '<td class="num ' + cls + '"><b>' + (im.viewer_count_delta_pct > 0 ? '+' : '') +
            im.viewer_count_delta_pct + '%</b></td>' +
          '<td class="num">' + im.follows_count_before + ' to ' + im.follows_count_after + '</td>' +
          '<td class="num">' + im.subscriptions_count_before + ' to ' + im.subscriptions_count_after + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function renderDecisions() {
    var dur = duration();
    var polls = api.getMarkers().filter(function (m) { return m.type === 'poll' && m.offset_seconds <= dur; });
    var changes = api.getMarkers().filter(function (m) { return m.type === 'category_change' && m.offset_seconds <= dur; });

    el.paneDecisions.innerHTML =
      '<p class="note"><strong>This page shows each decision and its result.</strong> The app compares the ' +
      '<code>viewer_count</code> samples from 10 minutes before the change with the samples from 10 minutes after. ' +
      'Any app can poll <code>' + api.KICK_SOURCES.livestreams + '</code> for the same samples.</p>' +
      '<h3 class="eyebrow" style="margin:16px 0 8px">Decision tree</h3>' + renderDecisionTree(polls) +
      '<h3 class="eyebrow" style="margin:20px 0 8px">Category changes</h3>' + renderImpactTable(changes);
  }

  function renderClips() {
    var dur = duration();
    var clips = api.getMarkers().filter(function (m) { return m.type === 'clip' && m.offset_seconds <= dur; });
    el.paneClips.innerHTML = '<div class="clips">' + clips.map(function (m) {
      var d = m.detail;
      return '<div class="clipcard" tabindex="0" role="button" data-seek="' + m.offset_seconds + '">' +
        '<div class="clipcard__thumb" style="' + TL.scenePaint(m.offset_seconds) + '">' +
          '<div class="stage__grain"></div>' +
          '<span class="clipcard__dur">' + d.duration_seconds + 's</span></div>' +
        '<div class="clipcard__body"><p class="clipcard__title">' + esc(m.title) + '</p>' +
        '<div class="clipcard__meta">' + hms(m.offset_seconds) + ', ' + esc(d.flagged_by.username) + ', ' +
        (d.is_published ? fmtInt(d.view_count) + ' views' : 'draft') + '</div></div></div>';
    }).join('') + '</div>' +
      '<p class="note" style="margin-top:14px"><strong>Three ways to flag a clip.</strong> The streamer hotkey, the flag ' +
      'button, or a mod who types <code>!clip</code>. The app reads that command from <code>chat.message.sent</code>. ' +
      'A clip here is a time range that this app owns. The KICK public API has no clips resource, so the app does not ' +
      'claim to create a clip on their side.</p>';
  }

  function renderExport() {
    var enabled = api.getExports().filter(function (x) { return x.is_enabled; })
      .map(function (x) { return x.element_id; }).join(',');

    el.paneExport.innerHTML =
      '<p class="note"><strong>Each element is opt in, and works on all platforms.</strong> Every element below is a ' +
      'separate browser source. The streamer adds it to OBS, so it goes into the encode and reaches all platforms they ' +
      'stream to. Nothing goes out unless you switch it on. The background is transparent, there is no audio, and no ' +
      'element sits in the lower third.</p>' +
      '<div class="exp" style="margin-top:14px">' + api.getExports().map(function (x) {
        return '<div class="exprow"><label class="switch"><input type="checkbox" data-export="' + x.element_id + '"' +
          (x.is_enabled ? ' checked' : '') + ' aria-label="Enable ' + esc(x.label) + '"><i></i></label>' +
          '<div class="exprow__main"><div class="exprow__t">' + esc(x.label) + '</div>' +
          '<div class="exprow__d">' + esc(x.description) + '</div></div>' +
          '<span class="tag">' + esc(x.size) + '</span></div>';
      }).join('') + '</div>' +
      '<h3 class="eyebrow" style="margin:18px 0 8px">Browser source URL</h3>' +
      '<div class="expurl"><input class="input" id="expUrl" readonly aria-label="Browser source URL" ' +
      'value="https://overlays.kick.com/timelines/' + api.getExportKey() + '?elements=' + enabled + '">' +
      '<button class="btn btn--secondary btn--sm" id="expCopy">Copy</button></div>' +
      '<p class="preview__src" style="margin-top:10px">' + FAKE_EXPORTS + ', scope timelines:write. ' +
      'Invented surface, named per KICK-API-CONVENTIONS Part 2.</p>';

    Array.prototype.forEach.call(el.paneExport.querySelectorAll('[data-export]'), function (cb) {
      cb.addEventListener('change', function () {
        api.getExports().forEach(function (x) { if (x.element_id === cb.dataset.export) x.is_enabled = cb.checked; });
        renderExport();
      });
    });
    $('expCopy').addEventListener('click', function () {
      $('expUrl').select();
      var button = $('expCopy');
      try {
        document.execCommand('copy');
        button.textContent = 'Copied';
      } catch (e) {
        button.textContent = 'Press Ctrl and C';
      }
      global.setTimeout(function () { button.textContent = 'Copy'; }, 1600);
    });
  }

  var KICK = api.KICK_SOURCES;

  var SOURCES = [
    [KICK.livestreams, 'The app polls this for <code>viewer_count</code>. Every point on the viewer curve is one sample.', false],
    [KICK.channels, 'Channel identity, <code>stream_title</code>, <code>active_subscribers_count</code>, <code>started_at</code>.', false],
    [KICK.chat_message_sent, 'Chat rate for the hype curve. Also carries <code>!clip</code>, <code>!vote</code> and the raid message.', false],
    [KICK.channel_followed, 'Follow markers and the follows curve.', false],
    [KICK.channel_subscription, 'Sub markers, sub trains, and the subs curve.', false],
    [KICK.kicks_gifted, 'Kicks curve and large gift markers. Reuses <code>amount</code>, <code>tier</code> and <code>pinned_time_seconds</code>.', false],
    [KICK.livestream_metadata_updated, 'Each category change and title change. This is the decision layer.', false],
    [KICK.livestream_status_updated, 'Stream start and stream end. All offsets are measured from <code>started_at</code>.', false],
    [FAKE_MARKERS_LIST, 'The marker list from our recorder. KICK has no timeline resource, so this is invented.', true],
    [FAKE_MARKER_CREATE, 'Flags a clip or a note at an offset. Scope <code>timelines:write</code>.', true],
    [FAKE_POLL_CREATE, 'The poll runs in our app. It posts to chat with <code>chat:write</code> and counts votes from <code>chat.message.sent</code>.', true],
    [FAKE_EXPORTS, 'Opt in for each browser source element.', true]
  ];

  function renderApi() {
    el.paneApi.innerHTML =
      '<p class="note"><strong>Every value here comes from a real KICK capability.</strong> The app reads no video ' +
      'frames, no audio, no game state, no per viewer telemetry and no emote events. It builds the timeline from ' +
      'webhooks it received while the stream was live, plus <code>viewer_count</code> polling. The timeline is a ' +
      'recording that this app makes. It is not a resource that KICK serves. Green rows are real KICK surface. Purple ' +
      'rows are ours, named to their conventions.</p>' +
      '<div class="src" style="margin-top:14px">' + SOURCES.map(function (s) {
        return '<div class="srcrow' + (s[2] ? ' is-invented' : '') + '"><code>' + esc(s[0]) + '</code>' +
          '<span>' + s[1] + '</span></div>';
      }).join('') + '</div>';
  }

  function renderTabs() {
    if (state.active_tab === 'log') renderLog();
    if (state.active_tab === 'decisions') renderDecisions();
    if (state.active_tab === 'clips') renderClips();
    if (state.active_tab === 'export') renderExport();
    if (state.active_tab === 'api') renderApi();
  }

  function switchTab(name) {
    state.active_tab = name;
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) {
      var on = t.dataset.tab === name;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    ['log', 'decisions', 'clips', 'export', 'api'].forEach(function (n) {
      $('pane' + n.charAt(0).toUpperCase() + n.slice(1)).hidden = n !== name;
    });
    renderTabs();
  }

  function openMarker(m) {
    seek(m.offset_seconds);
    if (m.type !== 'poll' || m.detail.resolution_mode !== 'chance') return;
    KT.roulette.open({
      question: m.detail.question,
      options: m.detail.options,
      chance_weighting: m.detail.chance_weighting || 'viewer_weighted',
      resolved_option_id: (m.detail.options.filter(function (o) { return o.is_winner; })[0] || {}).option_id
    });
  }

  function paintStats() {
    el.statViewers.textContent = fmtInt(EN.viewerCount());
    el.statHype.textContent = EN.hypeNow().toFixed(1);
    el.statVelocity.textContent = fmtInt(EN.velocity());
    el.chatRate.textContent = fmtInt(EN.velocity()) + ' msgs/min';
  }

  function fireDemo(kind) {
    if (kind === 'poll') { openPoll(); return; }
    if (kind === 'roulette') {
      if (!state.poll || state.poll.is_resolved) openPoll();
      global.setTimeout(function () { resolvePoll('chance'); }, 400);
      return;
    }
    var marker = EN.fire(kind);
    seek(duration());
    TL.render();
    renderTabs();
    if (marker) toast('<b>' + esc(marker.title) + '</b><br>' + esc(marker.source_event));
  }

  function bind() {
    el.btnPlay.addEventListener('click', function () { setPlaying(!state.is_playing); });
    el.btnPrev.addEventListener('click', function () { stepMarker(-1); });
    el.btnNext.addEventListener('click', function () { stepMarker(1); });
    el.btnLive.addEventListener('click', function () { seek(duration()); setPlaying(true); });
    el.btnClip.addEventListener('click', function () { flagClip('hotkey', 'ClutchGoblin'); });

    Array.prototype.forEach.call(document.querySelectorAll('.speed'), function (b) {
      b.addEventListener('click', function () {
        state.speed = +b.dataset.speed;
        Array.prototype.forEach.call(document.querySelectorAll('.speed'), function (x) {
          x.classList.toggle('is-active', x === b);
        });
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll('.mchip'), function (c) {
      c.addEventListener('click', function () {
        Array.prototype.forEach.call(document.querySelectorAll('.mchip'), function (x) {
          x.classList.toggle('is-active', x === c);
          x.setAttribute('aria-selected', x === c ? 'true' : 'false');
        });
        TL.setMetric(c.dataset.metric);
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-layer]'), function (cb) {
      cb.addEventListener('change', function () {
        state.layers = Array.prototype.filter
          .call(document.querySelectorAll('[data-layer]'), function (x) { return x.checked; })
          .map(function (x) { return x.dataset.layer; });
        TL.render();
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) {
      t.addEventListener('click', function () { switchTab(t.dataset.tab); });
    });

    document.addEventListener('click', function (e) {
      var seekTarget = e.target.closest('[data-seek]');
      if (seekTarget) { seek(+seekTarget.dataset.seek); TL.hidePreview(); }
      var replay = e.target.closest('[data-replay]');
      if (replay) {
        var m = api.getMarkers().filter(function (x) { return x.id === replay.dataset.replay; })[0];
        if (m) openMarker(m);
      }
    });

    el.chatSend.addEventListener('click', sendChat);
    el.chatInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendChat(); });

    el.btnMode.addEventListener('click', function () {
      state.mode = state.mode === 'streamer' ? 'viewer' : 'streamer';
      document.body.dataset.mode = state.mode;
      el.btnMode.textContent = state.mode === 'streamer' ? 'Streamer view' : 'Viewer view';
      if (state.mode === 'viewer' && (state.active_tab === 'export' || state.active_tab === 'decisions')) {
        switchTab('log');
      }
    });

    el.btnDemo.addEventListener('click', function () { el.drawer.hidden = !el.drawer.hidden; });
    $('drawerClose').addEventListener('click', function () { el.drawer.hidden = true; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-fire]'), function (b) {
      b.addEventListener('click', function () { fireDemo(b.dataset.fire); });
    });

    document.addEventListener('keydown', function (e) {
      var row = e.target.closest && e.target.closest('[data-seek]');
      if (row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); seek(+row.dataset.seek); return; }
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === ' ') { e.preventDefault(); setPlaying(!state.is_playing); }
      if (e.key === 'c' || e.key === 'C') flagClip('hotkey', 'ClutchGoblin');
      if (e.key === 'l' || e.key === 'L') { seek(duration()); setPlaying(true); }
      if (e.key === ',') stepMarker(-1);
      if (e.key === '.') stepMarker(1);
    });
  }

  function loop() {
    if (state.is_playing && !state.is_following_live) seek(state.playhead + 0.25 * state.speed);
    else if (state.is_following_live) seek(duration());
    global.setTimeout(loop, 250);
  }

  function boot() {
    el = {
      scene: $('stageScene'), stageCategory: $('stageCategory'), hudCategory: $('hudCategory'),
      hudTime: $('hudTime'), hudLive: $('hudLive'), toast: $('stageToast'),
      btnPlay: $('btnPlay'), btnPrev: $('btnPrev'), btnNext: $('btnNext'), btnLive: $('btnLive'),
      btnClip: $('btnClip'), btnMode: $('btnMode'), btnDemo: $('btnDemo'), drawer: $('drawer'),
      clockNow: $('clockNow'), clockEnd: $('clockEnd'),
      chatBody: $('chatBody'), chatInput: $('chatInput'), chatSend: $('chatSend'),
      chatRate: $('chatRate'), chatPoll: $('chatPoll'),
      statViewers: $('statViewers'), statHype: $('statHype'), statVelocity: $('statVelocity'),
      paneLog: $('paneLog'), paneDecisions: $('paneDecisions'), paneClips: $('paneClips'),
      paneExport: $('paneExport'), paneApi: $('paneApi')
    };

    document.body.dataset.mode = state.mode;
    $('streamTitle').textContent = api.getChannel().stream_title;

    KT.roulette.init();
    TL.init({
      duration: duration,
      playhead: function () { return state.playhead; },
      layers: function () { return state.layers; },
      onSeek: seek,
      onMarkerClick: openMarker
    });

    EN.init({
      onChat: appendChat,
      onSystem: systemChat,
      onBucket: function () { TL.render(); markCurrentLogRow(); },
      onTick: paintStats,
      onCategory: paintStage
    });
    EN.start();

    bind();
    switchTab('log');
    seek(state.playhead);
    paintStats();

    api.chatAt(state.playhead).concat(api.chatAt(state.playhead)).forEach(appendChat);
    systemChat('This app has recorded the stream since <b>00:00:00</b>. It found ' +
      api.getMarkers().length + ' markers. Press <b>C</b> to flag a clip.');
    loop();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
