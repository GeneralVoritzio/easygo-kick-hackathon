/*
  The floating widget on the player, mirroring prototypes/kick-recap: a small
  button that fans a stack of option bubbles out above it. It behaves like
  AssistiveTouch or an Android FAB: it rests translucent so it never fights
  for attention with the stream, sharpens to full opacity on hover, and a
  press-and-drag moves it anywhere on the video rather than opening the menu.

  Two bubbles: Highlights opens the timeline panel, Expedition opens the
  panel that starts a group hopping channel to channel together
  (js/expedition.js). Search has no bubble of its own — the Highlights panel
  already carries a search field, so a second copy on the widget would just
  be the same box twice. Bookmarks has no bubble either: bookmarking still
  works everywhere it already did (the rail's hover card, every card, `B`),
  it just has no dedicated quick-open of its own, the same as any other
  single filter chip in the Highlights panel. Either panel hides the widget
  while it is open (see css/player.css's `.player.is-panel-open .widget`),
  since it covers the whole frame the widget sits on.
*/
(function (global) {
  'use strict';
  var KT2 = global.KT2 = global.KT2 || {};

  var DRAG_THRESHOLD_PX = 6;

  var root, frame, button, bubbles;
  var menuOpen = false;
  var isDragging = false, dragMoved = false, justDragged = false;
  var dragStartX = 0, dragStartY = 0, dragOriginLeft = 0, dragOriginTop = 0;

  function setMenuOpen(next) {
    menuOpen = next;
    root.classList.toggle('is-open', menuOpen);
    button.setAttribute('aria-expanded', menuOpen ? 'true' : 'false');
    button.setAttribute('aria-label', menuOpen ? 'Close quick actions' : 'Open quick actions');
    button.innerHTML = KT2.icons.get(menuOpen ? 'close' : 'highlights', 20);
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  /*
    A press starts tracking, a move past the threshold turns it into a
    drag (switching from the default right/top-50% CSS position to an
    explicit left/top the pointer controls), a release under the
    threshold is a click instead. The widget never leaves the frame.
  */
  function startDrag(e) {
    isDragging = true;
    dragMoved = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    var widgetRect = root.getBoundingClientRect();
    var frameRect = frame.getBoundingClientRect();
    dragOriginLeft = widgetRect.left - frameRect.left;
    dragOriginTop = widgetRect.top - frameRect.top;
    button.setPointerCapture(e.pointerId);
  }

  function moveDrag(e) {
    if (!isDragging) return;
    var dx = e.clientX - dragStartX;
    var dy = e.clientY - dragStartY;
    if (!dragMoved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    dragMoved = true;
    root.classList.add('is-dragging');

    var frameRect = frame.getBoundingClientRect();
    var maxLeft = Math.max(0, frameRect.width - root.offsetWidth);
    var maxTop = Math.max(0, frameRect.height - root.offsetHeight);
    var left = clamp(dragOriginLeft + dx, 0, maxLeft);
    var top = clamp(dragOriginTop + dy, 0, maxTop);

    root.style.left = left + 'px';
    root.style.top = top + 'px';
    root.style.right = 'auto';
    root.style.transform = 'none';
  }

  function endDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    root.classList.remove('is-dragging');
    button.releasePointerCapture(e.pointerId);
    if (dragMoved) justDragged = true;
    dragMoved = false;
  }

  KT2.widget = {
    mount: function () {
      root = document.getElementById('widget');
      frame = document.getElementById('frame');
      button = document.getElementById('widgetButton');
      bubbles = document.getElementById('widgetBubbles');

      button.innerHTML = KT2.icons.get('highlights', 20);

      button.addEventListener('pointerdown', startDrag);
      button.addEventListener('pointermove', moveDrag);
      button.addEventListener('pointerup', endDrag);

      button.addEventListener('click', function () {
        if (justDragged) { justDragged = false; return; }
        setMenuOpen(!menuOpen);
      });

      bubbles.addEventListener('click', function (e) {
        var bubble = e.target.closest('[data-widget-action]');
        if (!bubble) return;
        var action = bubble.dataset.widgetAction;
        setMenuOpen(false);

        if (action === 'highlights') KT2.overlay.open();
        else if (action === 'expedition') KT2.expedition.open();
      });

      document.addEventListener('click', function (e) {
        if (root.contains(e.target)) return;
        setMenuOpen(false);
      });
    }
  };
})(window);
