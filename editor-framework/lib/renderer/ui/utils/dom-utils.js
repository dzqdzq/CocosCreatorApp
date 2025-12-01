"use strict";
let e = {};
module.exports = e;
const t = require("lodash");
const n = require("../../console");
const o = require("./resource-mgr");
const r = require("./dock-utils");
let u = null;
let i = null;
let l = null;
let s = null;
let c = null;
let a = null;
let d = ["mousedown", "mousemove", "mouseup", "click"];
let f = [0, 1, 4, 2];

let m = (function () {
  try {
    return 1 === new MouseEvent("test", { buttons: 1 }).buttons;
  } catch (e) {
    return false;
  }
})();

function p(e) {
  var t = e.type;
  if (-1 === d.indexOf(t)) {
    return false;
  }
  if ("mousemove" === t) {
    var n = void 0 === e.buttons ? 1 : e.buttons;

    if (e instanceof window.MouseEvent && !m) {
      n = f[e.which] || 0;
    }

    return Boolean(1 & n);
  }
  return 0 === (void 0 === e.button ? 0 : e.button);
}

e.createStyleElement = function (e) {
  let t = o.getResource(e) || "";
  if (!t) {
    n.error(`${e} not preloaded`);
    return null;
  }
  let r = document.createElement("style");
  r.type = "text/css";
  r.textContent = t;
  return r;
};

e.clear = function (e) {
    for (; e.firstChild; ) {
      e.removeChild(e.firstChild);
    }
  };

e.index = function (e) {
    let t = e.parentNode;
    for (let n = 0, o = t.children.length; n < o; ++n) {
      if (t.children[n] === e) {
        return n;
      }
    }
    return -1;
  };

e.parentElement = function (e) {
    let t = e.parentElement;
    if (!t && (t = e.parentNode) && t.host) {
      return t.host;
    }
  };

e.offsetTo = function (e, t) {
  let o = 0;
  let r = 0;
  for (; e && e !== t; ) {
    o += e.offsetLeft - e.scrollLeft;
    r += e.offsetTop - e.scrollTop;
    e = e.offsetParent;
  }
  return t && e !== t
    ? (n.warn("The parentEL is not the element's offsetParent"),
      { x: 0, y: 0 })
    : { x: o, y: r };
};

e.walk = function (e, t, n) {
  let o = t;

  if ("function" == typeof t) {
    n = t;
    o = {};
  }

  if ((!o.excludeSelf)) {
    if (n(e)) {
      return;
    }
  }
  if (!e.children.length) {
    return;
  }
  let r = e;
  let u = e.children[0];
  for (;;) {
    if (!u) {
      if ((u = r) === e) {
        return;
      }
      r = r.parentElement;
      u = u.nextElementSibling;
    }
    if (u) {
      if (n(u)) {
        u = u.nextElementSibling;
        continue;
      }

      if (u.children.length) {
        r = u;
        u = u.children[0];
      } else {
        u = u.nextElementSibling;
      }
    }
  }
};

e.fire = function (e, t, n) {
  n = n || {};
  e.dispatchEvent(new window.CustomEvent(t, n));
};

e.acceptEvent = function (e) {
  e.preventDefault();
  e.stopImmediatePropagation();
};

e.installDownUpEvent = function (t) {
    function n(e, t) {
      document.removeEventListener("mousemove", e);
      document.removeEventListener("mouseup", t);
    }
    t.addEventListener("mousedown", function (o) {
      e.acceptEvent(o);
      if (!p(o)) {
        return;
      }

      let r = function o(r) {
        if (!p(r)) {
          e.fire(t, "up", { sourceEvent: r, bubbles: true });
          n(o, u);
        }
      };

      let u = function o(u) {
        if (p(u)) {
          e.fire(t, "up", { sourceEvent: u, bubbles: true });
          n(r, o);
        }
      };

      (function (e, t) {
        document.addEventListener("mousemove", e);
        document.addEventListener("mouseup", t, true);
      })(r, u);

      e.fire(t, "down", { sourceEvent: o, bubbles: true });
    });
  };

e.inDocument = function (e) {
    for (;;) {
      if (!e) {
        return false;
      }
      if (e === document) {
        return true;
      }

      if ((e = e.parentNode) && e.host) {
        e = e.host;
      }
    }
  };

e.inPanel = function (e) {
    for (;;) {
      if (!e) {
        return null;
      }
      if (r.isPanelFrame(e)) {
        return e;
      }

      if ((e = e.parentNode) && e.host) {
        e = e.host;
      }
    }
  };

e.isVisible = function (e) {
    let t = window.getComputedStyle(e);
    return "none" !== t.display && "hidden" !== t.visibility && 0 !== t.opacity;
  };

e.isVisibleInHierarchy = function (t) {
    if (false === e.inDocument(t)) {
      return false;
    }
    for (;;) {
      if (t === document) {
        return true;
      }
      if (false === e.isVisible(t)) {
        return false;
      }

      if ((t = t.parentNode) && t.host) {
        t = t.host;
      }
    }
  };

e.startDrag = function (t, n, o, r, i) {
  e.addDragGhost(t);
  n.stopPropagation();
  let l = n.button;
  let s = n.clientX;
  let c = n.clientX;
  let a = n.clientY;
  let d = n.clientY;
  let f = 0;
  let m = 0;
  let p = 0;
  let v = 0;

  let h = function (e) {
    e.stopPropagation();
    f = e.clientX - c;
    p = e.clientY - d;
    m = e.clientX - s;
    v = e.clientY - a;
    c = e.clientX;
    d = e.clientY;

    if (o) {
      o(e, f, p, m, v);
    }
  };

  let b = function (t) {
    t.stopPropagation();

    if (t.button === l) {
      document.removeEventListener("mousemove", h);
      document.removeEventListener("mouseup", b);
      document.removeEventListener("mousewheel", E);
      e.removeDragGhost();
      f = t.clientX - c;
      p = t.clientY - d;
      m = t.clientX - s;
      v = t.clientY - a;
      u = null;

      if (r) {
        r(t, f, p, m, v);
      }
    }
  };

  let E = function (e) {
    if (i) {
      i(e);
    }
  };

  u = function () {
    document.removeEventListener("mousemove", h);
    document.removeEventListener("mouseup", b);
    document.removeEventListener("mousewheel", E);
    e.removeDragGhost();
  };

  document.addEventListener("mousemove", h);
  document.addEventListener("mouseup", b);
  document.addEventListener("mousewheel", E);
};

e.cancelDrag = function () {
  if (u) {
    u();
  }
};

e.addDragGhost = function (e) {
  if (null === i) {
    (i = document.createElement("div")).classList.add("drag-ghost");
    i.style.position = "absolute";
    i.style.zIndex = "999";
    i.style.top = "0";
    i.style.right = "0";
    i.style.bottom = "0";
    i.style.left = "0";

    i.oncontextmenu = function () {
        return false;
      };
  }

  i.style.cursor = e;
  document.body.appendChild(i);
  return i;
};

e.removeDragGhost = function () {
  if (null !== i) {
    i.style.cursor = "auto";

    if (null !== i.parentElement) {
      i.parentElement.removeChild(i);
    }
  }
};

e.addHitGhost = function (e, t, n) {
  if (null === l) {
    (l = document.createElement("div")).classList.add("hit-ghost");
    l.style.position = "absolute";
    l.style.zIndex = t;
    l.style.top = "0";
    l.style.right = "0";
    l.style.bottom = "0";
    l.style.left = "0";

    l.oncontextmenu = function () {
        return false;
      };
  }

  l.style.cursor = e;

  s = function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (n) {
      n();
    }
  };

  l.addEventListener("mousedown", s);
  document.body.appendChild(l);
  return l;
};

e.removeHitGhost = function () {
  if (null !== l) {
    l.style.cursor = "auto";

    if (null !== l.parentElement) {
      l.parentElement.removeChild(l);
      l.removeEventListener("mousedown", s);
      s = null;
    }
  }
};

e.addLoadingMask = function (e, t) {
  if (null === c) {
    (c = document.createElement("div")).classList.add("loading-mask");
    c.style.position = "absolute";
    c.style.top = "0";
    c.style.right = "0";
    c.style.bottom = "0";
    c.style.left = "0";

    c.oncontextmenu = function () {
        return false;
      };
  }

  if (e && "string" == typeof e.zindex) {
    c.style.zIndex = e.zindex;
  } else {
    c.style.zIndex = "1999";
  }

  if (e && "string" == typeof e.background) {
    c.style.backgroundColor = e.background;
  } else {
    c.style.backgroundColor = "rgba(0,0,0,0.2)";
  }

  if (e && "string" == typeof e.cursor) {
    c.style.cursor = e.cursor;
  } else {
    c.style.cursor = "default";
  }

  c.addEventListener("mousedown", function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (t) {
      t();
    }
  });

  document.body.appendChild(c);
  return c;
};

e.removeLoadingMask = function () {
  if (null !== c) {
    c.style.cursor = "auto";

    if (null !== c.parentElement) {
      c.parentElement.removeChild(c);
      c.removeEventListener("mousedown", a);
      a = null;
    }
  }
};

e.toHumanText = function (e) {
  let t = e.replace(/[-_]([a-z])/g, function (e) {
    return e[1].toUpperCase();
  });

  if (" " ===
    (t = t.replace(/([a-z][A-Z])/g, function (e) {
      return e[0] + " " + e[1];
    })).charAt(0)) {
    t.slice(1);
  }

  return t.charAt(0).toUpperCase() + t.slice(1);
};

e.camelCase = function (e) {
    return t.camelCase(e);
  };

e.kebabCase = function (e) {
    return t.kebabCase(e);
  };

e._focusParent = function (e) {
    let t = e.parentElement;
    for (; t; ) {
      if (null !== t.tabIndex && void 0 !== t.tabIndex && -1 !== t.tabIndex) {
        t.focus();
        return;
      }
      t = t.parentElement;
    }
  };

e._getFirstFocusableChild = function (t) {
    if (null !== t.tabIndex && void 0 !== t.tabIndex && -1 !== t.tabIndex) {
      return t;
    }
    for (let n = 0; n < t.children.length; ++n) {
      let o = e._getFirstFocusableChild(t.children[n]);
      if (null !== o) {
        return o;
      }
    }
    return null;
  };
