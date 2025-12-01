"use strict";
let e = {};
module.exports = e;
const t = require("electron");
const n = require("./dom-utils");
const l = require("./dock-utils");
let s = null;
let u = null;
let o = null;
let i = null;
let r = false;

e._isNavigable = function (e) {
  return e.focusable && !e.disabled && !e.unnavigable;
};

e._focusPrev = function () {
  let t;
  let n;
  let l;

  if (s) {
    t = s.root;
    n = s._focusedElement;
    l = s._lastFocusedElement;
  } else {
    t = document.body;
    n = o;
    l = i;
  }

  if (!n) {
    return l
      ? (e._setFocusElement(l), true)
      : (t && ((n = e._getFirstFocusableFrom(t, true)), e._setFocusElement(n)),
        void 0);
  }
  let u;
  let r = n;
  for (; (u = e._getPrevFocusable(r)) && u._getFirstFocusableElement() === r; ) {
    r = u;
  }
  return !!u && (e._setFocusElement(u), true);
};

e._focusNext = function () {
  let t;
  let n;
  let l;

  if (s) {
    t = s.root;
    n = s._focusedElement;
    l = s._lastFocusedElement;
  } else {
    t = document.body;
    n = o;
    l = i;
  }

  if (!n) {
    return l
      ? (e._setFocusElement(l), true)
      : (t && ((n = e._getFirstFocusableFrom(t, true)), e._setFocusElement(n)),
        void 0);
  }
  let u = e._getNextFocusable(n);
  return !!u && (e._setFocusElement(u), true);
};

e._focusParent = function (t) {
  let n = e._getFocusableParent(t);

  if (n) {
    if (l.isPanel(n)) {
      e._setFocusElement(null);
      n.activeTab.frameEL.focus();
    } else {
      e._setFocusElement(n);
    }
  }
};

e._setFocusPanelFrame = function (e) {
  let t;
  let n;

  if (e && o) {
    i = o;
    o._setFocused(false);
    o = null;
  }

  if (s) {
    t = s.parentElement;
  }

  if (e) {
    n = e.parentElement;
  }

  if (t !== n) {
    if (t) {
      t._setFocused(false);
    }

    if (n) {
      n._setFocused(true);
    }
  }

  if (s !== e) {
    if (s) {
      s.blur();

      if (s._focusedElement) {
        s._focusedElement._setFocused(false);
      }
    }

    u = s;
    s = e;

    if (e) {
      e.focus();

      if (e._focusedElement) {
        e._focusedElement._setFocused(true);
      }
    }
  }
};

e._refocus = function () {
    if (s) {
      let t = s.parentElement;
      if (!t) {
        e._setFocusPanelFrame(null);
        return;
      }
      t._setFocused(true);
      if ((s._focusedElement)) {
        s._focusedElement._getFirstFocusableElement().focus();
        return;
      }
      s.focus();
    }
  };

e._setFocusElement = function (t) {
  if (t && l.isPanel(t)) {
    t.focus();
    return;
  }
  let u = n.inPanel(t);

  if (t &&
      !u) {
    e._setFocusPanelFrame(null);

    if (o !== t) {
      if (o) {
        o._setFocused(false);
      }

      i = o;
      o = t;

      if (t) {
        t._setFocused(true);
      }
    }
  }

  if (u && l.isPanelFrame(u)) {
    e._setFocusPanelFrame(u);
  }

  if (!(t || s)) {
    if (o) {
      i = o;
      o._setFocused(false);
      o = null;
    }
  }

  if (
    (s)
  ) {
    if (o) {
      i = o;
      o._setFocused(false);
      o = null;
    }

    let e = s._focusedElement;

    if (e !== t) {
      if (e) {
        e._setFocused(false);
      }

      s._lastFocusedElement = e;
      s._focusedElement = t;

      if (t) {
        t._setFocused(true);
      } else {
        s.focus();
      }
    }
  }
};

e._getFirstFocusableFrom = function (t, l) {
  if (!l) {
    if (!n.isVisible(t)) {
      return null;
    }
    if (e._isNavigable(t)) {
      return t;
    }
  }
  let s = t;
  let u = t;
  if (!u.children.length) {
    return null;
  }
  for (u = u.children[0]; ; ) {
    if (!u) {
      u = s;
      if (!s || u === t) {
        return null;
      }
      s = s.parentElement;
      u = u.nextElementSibling;
    }
    if (u) {
      if (n.isVisible(u)) {
        if (e._isNavigable(u)) {
          return u;
        }

        if (u.children.length) {
          s = u;
          u = u.children[0];
        } else {
          u = u.nextElementSibling;
        }
      } else {
        u = u.nextElementSibling;
      }
    }
  }
};

e._getLastFocusableFrom = function (t, l) {
  let s = null;
  if (!l) {
    if (!n.isVisible(t)) {
      return null;
    }

    if (e._isNavigable(t)) {
      s = t;
    }
  }
  let u = t;
  let o = t;
  if (!o.children.length) {
    return s;
  }
  for (o = o.children[0]; ; ) {
    if (!o) {
      if ((o = u) === t) {
        return s;
      }
      u = u.parentElement;
      o = o.nextElementSibling;
    }

    if (o) {
      if (n.isVisible(o)) {
        if (e._isNavigable(o)) {
          s = o;
        }

        if (o.children.length) {
          u = o;
          o = o.children[0];
        } else {
          o = o.nextElementSibling;
        }
      } else {
        o = o.nextElementSibling;
      }
    }
  }
};

e._getFocusableParent = function (e) {
    let t = e.parentNode;
    for (t.host && (t = t.host); t; ) {
      if (t.focusable && !t.disabled) {
        return t;
      }

      if ((t = t.parentNode) && t.host) {
        t = t.host;
      }
    }
    return null;
  };

e._getNextFocusable = function (t) {
  let n = e._getFirstFocusableFrom(t, true);
  if (n) {
    return n;
  }
  let l = t.parentElement;
  let s = t.nextElementSibling;
  for (;;) {
    if (!s) {
      if (null === (s = l)) {
        return null;
      }
      l = l.parentElement;
      s = s.nextElementSibling;
    }
    if (s) {
      if ((n = e._getFirstFocusableFrom(s))) {
        return n;
      }
      s = s.nextElementSibling;
    }
  }
};

e._getPrevFocusable = function (t) {
  let n;
  let l = t.parentElement;
  let s = t.previousElementSibling;
  for (;;) {
    if (!s) {
      if (null === (s = l)) {
        return null;
      }
      if (s.focusable && !s.disabled) {
        return s;
      }
      l = l.parentElement;
      s = s.previousElementSibling;
    }
    if (s) {
      if ((n = e._getLastFocusableFrom(s))) {
        return n;
      }
      s = s.previousElementSibling;
    }
  }
};

Object.defineProperty(e, "lastFocusedPanelFrame", {
  enumerable: true,
  get: () => u,
});

Object.defineProperty(e, "focusedPanelFrame", {
  enumerable: true,
  get: () => s,
});

Object.defineProperty(e, "lastFocusedElement", {
  enumerable: true,
  get: () => (s ? s._lastFocusedElement : i),
});

Object.defineProperty(e, "focusedElement", {
  enumerable: true,
  get: () => (s ? s._focusedElement : o),
});

Object.defineProperty(e, "disabled", {
  enumerable: true,
  get: () => r,
  set(e) {
    r = e;
  },
});

window.addEventListener("mousedown", (t) => {
  if ("UI-PANEL-FRAME" !== t.target.tagName) {
    if (!r) {
      if (1 === t.which) {
        e._setFocusElement(null);
        e._setFocusPanelFrame(null);
      }
    }
  }
});

window.addEventListener("focus", () => {
  if (!r) {
    e._setFocusElement(i);
    e._setFocusPanelFrame(u);
  }
});

window.addEventListener("blur", () => {
  if (!r) {
    i = o;
    u = s;

    if (!s) {
      e._setFocusElement(null);
    }

    e._setFocusPanelFrame(null);
  }
});

window.addEventListener(
  "keydown",
  (u) => {
    if (!r && 9 === u.keyCode) {
      if (u.ctrlKey || u.metaKey) {
        return;
      }
      if (s && !l.isPanelFrame(s)) {
        return;
      }
      let o;
      n.acceptEvent(u);
      o = u.shiftKey ? e._focusPrev() : e._focusNext();

      if (e.focusedElement) {
        e.focusedElement._navELs[0].focus();
      }

      if (!o) {
        t.shell.beep();
      }
    }
  },
  true
);

window.addEventListener("keydown", (l) => {
  if (!r) {
    if (38 === l.keyCode) {
      n.acceptEvent(l);

      if (!e._focusPrev()) {
        t.shell.beep();
      }
    } else {
      if (40 === l.keyCode) {
        n.acceptEvent(l);

        if (!e._focusNext()) {
          t.shell.beep();
        }
      }
    }
  }
});
