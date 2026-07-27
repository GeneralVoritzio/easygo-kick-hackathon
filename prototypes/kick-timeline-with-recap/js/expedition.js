/*
  The Expedition panel. KICK has no expedition surface: this is a viewer
  starting a group that hops channel to channel together, invented and named
  to KICK-API-CONVENTIONS.md Part 2, on the same `/public/v1/...` family
  bookmarks and markers use.

  One panel, three shapes. A Kick Expedition needs nothing: press start and
  it departs, open to everyone watching. A Kick Private Expedition needs who
  gets in and, if the host wants one, a passcode. A Kick Custom Expedition
  exposes every knob: title, public or private, how long each stop lasts, a
  cap on expeditors, which streams are on the route, when it departs, and
  whether an expeditor can be kicked once aboard.

  The invite-and-passcode fields are one block in the markup
  (`[data-expedition-pane="invite"]`), shown for the Private type on its own
  and again under Custom whenever Custom is itself set private, rather than
  two copies of the same two fields.

  Starting one never launches anything: there is no second stream to hop to
  in this prototype. It builds the payload a real `fake-kick POST
  /public/v1/expeditions` would take, and the panel closes to a toast naming
  what would have departed.
*/
(function (global) {
  'use strict';
  var KT2 = global.KT2 = global.KT2 || {};
  var api = global.KT.api;
  var moments = KT2.moments;

  var FAKE_SOURCES = {
    create: 'fake-kick POST /public/v1/expeditions',
    created_event: 'fake-kick expedition.created'
  };

  var TOAST_MS = 4000;

  var root, sub, closeButton, typesHost, standardPane, customPane, invitePane;
  var titleInput, durationSelect, maxInput, streamsHost;
  var scheduleInput, kickingCheckbox;
  var inviteChipsHost, inviteInput, inviteListHost, passcodeInput;
  var startButton, toastHost;

  var type = 'standard';
  var customVisibility = 'public';
  var departure = 'now';
  var invited = [];
  var streamsSelected = {};
  var seq = 0;
  var toastTimer = null;

  function personRow(picClass, nameClass, username) {
    return '<span class="' + picClass + '" style="background:' + api.colourFor(username) + '">' +
      moments.initials(username) + '</span>' +
      '<span class="' + nameClass + '">' + username + '</span>';
  }

  var TYPE_SUB = {
    standard: 'Travel channel to channel with everyone who joins',
    private: 'Invite who you want, lock it with a passcode',
    custom: 'Configure every stop yourself'
  };

  function updatePanes() {
    standardPane.hidden = type !== 'standard';
    customPane.hidden = type !== 'custom';
    invitePane.hidden = !(type === 'private' || (type === 'custom' && customVisibility === 'private'));
  }

  function updateStartLabel() {
    var label = type === 'private' ? 'Start private expedition' :
      type === 'custom' ? 'Start custom expedition' : 'Start expedition';
    startButton.textContent = label;
  }

  function setType(next) {
    type = next;
    typesHost.querySelectorAll('[data-expedition-type]').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.expeditionType === type);
    });
    sub.textContent = TYPE_SUB[type];
    updateStartLabel();
    updatePanes();
  }

  function setVisibility(next) {
    customVisibility = next;
    customPane.querySelectorAll('[data-expedition-visibility]').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.expeditionVisibility === customVisibility);
    });
    updatePanes();
  }

  function setDeparture(next) {
    departure = next;
    customPane.querySelectorAll('[data-expedition-departure]').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.expeditionDeparture === departure);
    });
    scheduleInput.hidden = departure !== 'schedule';
  }

  function renderStreams() {
    streamsHost.innerHTML = api.LIVE_CHANNELS.map(function (c) {
      var checked = streamsSelected[c.username] ? ' checked' : '';
      return '<label class="expeditionstream">' +
        '<input type="checkbox" data-expedition-stream="' + c.username + '"' + checked + '>' +
        '<span class="expeditionstream__pic" style="background:' + api.colourFor(c.username) + '">' +
        moments.initials(c.username) + '</span>' +
        '<span class="expeditionstream__text">' +
        '<span class="expeditionstream__name">' + c.username + '</span> ' +
        '<span class="expeditionstream__cat">' + c.category + '</span>' +
        '</span>' +
        '<span class="expeditionstream__count">' + moments.abbreviate(c.viewer_count) + ' watching</span>' +
        '</label>';
    }).join('');
  }

  function renderChips() {
    inviteChipsHost.innerHTML = invited.map(function (username) {
      return '<span class="expeditionchip">' +
        personRow('expeditionchip__pic', 'expeditionchip__name', username) +
        '<button class="expeditionchip__remove" data-expedition-uninvite="' + username + '" ' +
        'aria-label="Remove ' + username + '">' + KT2.icons.get('close', 10) + '</button>' +
        '</span>';
    }).join('');
  }

  function renderInviteList() {
    var query = inviteInput.value.trim().toLowerCase();
    var candidates = api.VIEWERS.filter(function (username) {
      if (username === api.VIEWER_ME) return false;
      if (invited.indexOf(username) !== -1) return false;
      return !query || username.toLowerCase().indexOf(query) !== -1;
    }).slice(0, 8);

    inviteListHost.innerHTML = candidates.map(function (username) {
      return '<button class="expeditioninvitee" data-expedition-invite="' + username + '">' +
        personRow('expeditioninvitee__pic', 'expeditioninvitee__name', username) +
        '</button>';
    }).join('');
  }

  function invite(username) {
    if (invited.indexOf(username) !== -1) return;
    invited.push(username);
    renderChips();
    renderInviteList();
  }

  function uninvite(username) {
    invited = invited.filter(function (u) { return u !== username; });
    renderChips();
    renderInviteList();
  }

  function toast(text) {
    global.clearTimeout(toastTimer);
    toastHost.textContent = text;
    toastHost.hidden = false;
    toastTimer = global.setTimeout(function () { toastHost.hidden = true; }, TOAST_MS);
  }

  function selectedStreams() {
    var out = Object.keys(streamsSelected).filter(function (u) { return streamsSelected[u]; });
    return out.length ? out : [api.getChannel().username];
  }

  function toastText(m) {
    var departsNow = Math.abs(new Date(m.departs_at).getTime() - Date.now()) < 5000;
    var when = departsNow ? 'now' : 'at ' + new Date(m.departs_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return '"' + m.title + '" departs ' + when + ', ' + m.streams.length +
      (m.streams.length === 1 ? ' stream' : ' streams') + ' on the route.';
  }

  /*
    The payload a real `fake-kick POST /public/v1/expeditions` would take.
    Every field this file cannot ask about (a real one departed by anything
    other than "now" or "a chosen time") stays out, so nothing here claims a
    capability the panel does not actually expose.
  */
  function buildPayload() {
    var channel = api.getChannel().username;
    var made = {
      id: 'expedition_' + (seq++),
      type: type,
      title: '',
      is_private: type !== 'standard',
      passcode: null,
      invited: [],
      streams: [channel],
      per_stream_seconds: 600,
      max_expeditors: null,
      kicking_allowed: true,
      departs_at: new Date().toISOString(),
      created_by: api.VIEWER_ME,
      created_at: new Date().toISOString(),
      source_event: FAKE_SOURCES.created_event
    };

    if (type === 'standard') {
      made.title = channel + "'s expedition";
    } else if (type === 'private') {
      made.title = channel + "'s private expedition";
      made.passcode = passcodeInput.value.trim() || null;
      made.invited = invited.slice();
    } else {
      made.title = titleInput.value.trim() || (channel + "'s expedition");
      made.is_private = customVisibility === 'private';
      made.per_stream_seconds = +durationSelect.value;
      made.max_expeditors = Math.max(2, +maxInput.value || 50);
      made.streams = selectedStreams();
      made.kicking_allowed = kickingCheckbox.checked;
      if (departure === 'schedule' && scheduleInput.value) {
        made.departs_at = new Date(scheduleInput.value).toISOString();
      }
      if (made.is_private) {
        made.passcode = passcodeInput.value.trim() || null;
        made.invited = invited.slice();
      }
    }
    return made;
  }

  function resetForm() {
    setType('standard');
    setVisibility('public');
    setDeparture('now');
    invited = [];
    streamsSelected = {};
    api.LIVE_CHANNELS.forEach(function (c) { if (c.is_following) streamsSelected[c.username] = true; });
    titleInput.value = '';
    durationSelect.value = '600';
    maxInput.value = '50';
    scheduleInput.value = '';
    kickingCheckbox.checked = true;
    passcodeInput.value = '';
    inviteInput.value = '';
    renderChips();
    renderInviteList();
    renderStreams();
  }

  KT2.expedition = {
    FAKE_SOURCES: FAKE_SOURCES,

    mount: function () {
      root = document.getElementById('expedition');
      sub = document.getElementById('expeditionSub');
      closeButton = document.getElementById('expeditionClose');
      typesHost = root.querySelector('.expedition__types');
      standardPane = root.querySelector('[data-expedition-pane="standard"]');
      customPane = root.querySelector('[data-expedition-pane="custom"]');
      invitePane = root.querySelector('[data-expedition-pane="invite"]');
      titleInput = document.getElementById('expeditionTitle');
      durationSelect = document.getElementById('expeditionDuration');
      maxInput = document.getElementById('expeditionMax');
      streamsHost = document.getElementById('expeditionStreams');
      scheduleInput = document.getElementById('expeditionScheduleAt');
      kickingCheckbox = document.getElementById('expeditionKicking');
      inviteChipsHost = document.getElementById('expeditionInviteChips');
      inviteInput = document.getElementById('expeditionInviteInput');
      inviteListHost = document.getElementById('expeditionInviteList');
      passcodeInput = document.getElementById('expeditionPasscode');
      startButton = document.getElementById('expeditionStart');
      toastHost = document.getElementById('expeditionToast');

      typesHost.addEventListener('click', function (e) {
        var b = e.target.closest('[data-expedition-type]');
        if (b) setType(b.dataset.expeditionType);
      });

      customPane.addEventListener('click', function (e) {
        var vis = e.target.closest('[data-expedition-visibility]');
        if (vis) { setVisibility(vis.dataset.expeditionVisibility); return; }
        var dep = e.target.closest('[data-expedition-departure]');
        if (dep) setDeparture(dep.dataset.expeditionDeparture);
      });

      streamsHost.addEventListener('change', function (e) {
        var box = e.target.closest('[data-expedition-stream]');
        if (!box) return;
        streamsSelected[box.dataset.expeditionStream] = box.checked;
      });

      inviteInput.addEventListener('input', renderInviteList);
      inviteListHost.addEventListener('click', function (e) {
        var row = e.target.closest('[data-expedition-invite]');
        if (row) invite(row.dataset.expeditionInvite);
      });
      inviteChipsHost.addEventListener('click', function (e) {
        var x = e.target.closest('[data-expedition-uninvite]');
        if (x) uninvite(x.dataset.expeditionUninvite);
      });

      startButton.addEventListener('click', function () {
        var made = buildPayload();
        KT2.expedition.close();
        toast(toastText(made));
      });

      closeButton.addEventListener('click', KT2.expedition.close);

      resetForm();
    },

    isOpen: function () { return !root.hidden; },

    open: function () {
      resetForm();
      root.hidden = false;
      document.getElementById('player').classList.add('is-panel-open');
      closeButton.focus();
    },

    close: function () {
      root.hidden = true;
      document.getElementById('player').classList.remove('is-panel-open');
    }
  };
})(window);
