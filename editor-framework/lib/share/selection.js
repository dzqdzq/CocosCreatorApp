"use strict";
const e = require("electron");
const t = require("lodash");
const i = require("./platform");
let s;
let r;

if (i.isMainProcess) {
  s = require("../main/ipc");
  r = require("../main/console");
} else {
  s = require("../renderer/ipc");
  r = require("../renderer/console");
}

let n = null;
let l = {};
const o = "selection:selected";
const c = "selection:unselected";
const a = "selection:activated";
const h = "selection:deactivated";
const f = "selection:hoverin";
const d = "selection:hoverout";
const u = "selection:context";
const v = "selection:changed";
const p = "selection:patch";
let y = {
  register(e) {
    if (!i.isMainProcess) {
      r.warn("Editor.Selection.register can only be called in core level.");
      return;
    }

    if (!l[e]) {
      l[e] = new m(e);
      s.sendToWins("_selection:register", e);
    }
  },
  reset() {
    for (let e in l) l[e].clear();
    l = {};
  },
  local: () => new m("local"),
  confirm() {
    for (let e in l) l[e].confirm();
  },
  cancel() {
    for (let e in l) l[e].cancel();
  },
  confirmed(e) {
    let t = l[e];
    return t
      ? t.confirmed
      : (r.error(
          "Cannot find the type %s for selection. Please register it first.",
          e
        ),
        false);
  },
  select(e, t, i, s) {
    let n = l[e];
    return n
      ? t && "string" != typeof t && !Array.isArray(t)
        ? (r.error(
            "The 2nd argument for `Editor.Selection.select` must be a string or array"
          ),
          void 0)
        : (n.select(t, i, s), void 0)
      : (r.error(
          "Cannot find the type %s for selection. Please register it first.",
          e
        ),
        void 0);
  },
  unselect(e, t, i) {
    let s = l[e];
    return s
      ? t && "string" != typeof t && !Array.isArray(t)
        ? (r.error(
            "The 2nd argument for `Editor.Selection.select` must be a string or array"
          ),
          void 0)
        : (s.unselect(t, i), void 0)
      : (r.error(
          "Cannot find the type %s for selection. Please register it first.",
          e
        ),
        void 0);
  },
  hover(e, t) {
    let i = l[e];
    if (!i) {
      r.error(
        "Cannot find the type %s for selection. Please register it first.",
        e
      );

      return;
    }
    i.hover(t);
  },
  setContext(e, t) {
    let i = l[e];
    return i
      ? t && "string" != typeof t
        ? (r.error(
            "The 2nd argument for `Editor.Selection.setContext` must be a string"
          ),
          void 0)
        : (i.setContext(t), void 0)
      : (r.error(
          "Cannot find the type %s for selection. Please register it first.",
          e
        ),
        void 0);
  },
  patch(e, t, i) {
    let s = l[e];
    if (!s) {
      r.error(
        "Cannot find the type %s for selection. Please register it first",
        e
      );

      return;
    }
    s.patch(t, i);
  },
  clear(e) {
    let t = l[e];
    if (!t) {
      r.error(
        "Cannot find the type %s for selection. Please register it first",
        e
      );

      return;
    }
    t.clear();
  },
  hovering(e) {
    let t = l[e];
    return t
      ? t.lastHover
      : (r.error(
          "Cannot find the type %s for selection. Please register it first",
          e
        ),
        null);
  },
  contexts(e) {
    let t = l[e];
    return t
      ? t.contexts
      : (r.error(
          "Cannot find the type %s for selection. Please register it first.",
          e
        ),
        null);
  },
  curActivate(e) {
    let t = l[e];
    return t
      ? t.lastActive
      : (r.error(
          "Cannot find the type %s for selection. Please register it first.",
          e
        ),
        null);
  },
  curGlobalActivate: () => (n ? { type: n.type, id: n.lastActive } : null),
  curSelection(e) {
    let t = l[e];
    return t
      ? t.selection.slice()
      : (r.error(
          "Cannot find the type %s for selection. Please register it first.",
          e
        ),
        null);
  },
  filter(e, t, i) {
    let s;
    let r;
    let n;
    let l;
    if ("name" === t) {
      s = e.filter(i);
    } else {
      for (s = [], n = 0; n < e.length; ++n) {
        r = e[n];
        let t = true;
        for (l = 0; l < s.length; ++l) {
          let e = s[l];
          if (r === e) {
            t = false;
            break;
          }
          let n = i(e, r);
          if (n > 0) {
            t = false;
            break;
          }

          if (n < 0) {
            s.splice(l, 1);
            --l;
          }
        }

        if (t) {
          s.push(r);
        }
      }
    }
    return s;
  },
};
function g(e, t, ...i) {
  if ("local" !== t) {
    s.sendToAll.apply(null, [`_${e}`, t, ...i, s.option({ excludeSelf: true })]);
    s.sendToAll.apply(null, [e, t, ...i]);
  }
}
module.exports = y;
class _ {
  constructor(e) {
    this.type = e;
    this.selection = [];
    this.lastActive = null;
    this.lastHover = null;
    this._context = null;
  }
  _activate(e) {
    if (this.lastActive !== e) {
      if (null !== this.lastActive &&
        void 0 !== this.lastActive) {
        g(h, this.type, this.lastActive);
      }

      this.lastActive = e;
      g(a, this.type, e);
      n = this;
      return;
    }

    if (n !== this) {
      n = this;
      g(a, this.type, this.lastActive);
    }
  }
  _unselectOthers(e) {
    e = e || [];

    if (!Array.isArray(e)) {
      e = [e];
    }

    let i = t.difference(this.selection, e);
    return (!!i.length && (g(c, this.type, i), (this.selection = t.intersection(this.selection, e)), true));
  }
  select(e, i, s) {
    let r = false;
    e = e || [];

    if (!Array.isArray(e)) {
      e = [e];
    }

    if ((i = void 0 === i || i)) {
      r = this._unselectOthers(e);
    }

    if (
      (e.length)
    ) {
      let i = t.difference(e, this.selection);

      if (i.length) {
        this.selection = this.selection.concat(i);
        g(o, this.type, i);
        r = true;
      }
    }

    if (e.length) {
      this._activate(e[e.length - 1]);
    } else {
      this._activate(null);
    }

    if (r && s) {
      g(v, this.type);
    }
  }
  unselect(e, i) {
    let s = false;
    let r = false;
    e = e || [];

    if (!Array.isArray(e)) {
      e = [e];
    }

    if ((e.length)) {
      let i = t.intersection(this.selection, e);
      this.selection = t.difference(this.selection, e);

      if (i.length) {
        if (-1 !== i.indexOf(this.lastActive)) {
          r = true;
        }

        g(c, this.type, i);
        s = true;
      }
    }

    if (r) {
      if (this.selection.length) {
        this._activate(this.selection[this.selection.length - 1]);
      } else {
        this._activate(null);
      }
    }

    if (s && i) {
      g(v, this.type);
    }
  }
  hover(e) {
    if (this.lastHover !== e) {
      if (null !== this.lastHover &&
          void 0 !== this.lastHover) {
        g(d, this.type, this.lastHover);
      }

      this.lastHover = e;

      if (null !== e && void 0 !== e) {
        g(f, this.type, e);
      }
    }
  }
  setContext(e) {
    this._context = e;
    g(u, this.type, e);
  }
  patch(e, t) {
    let i = this.selection.indexOf(e);

    if (-1 !== i) {
      this.selection[i] = t;
    }

    if (this.lastActive === e) {
      this.lastActive = t;
    }

    if (this.lastHover === e) {
      this.lastHover = t;
    }

    if (this._context === e) {
      this._context = t;
    }

    g(p, this.type, e, t);
  }
  clear() {
    let e = false;

    if (this.selection.length) {
      g(c, this.type, this.selection);
      this.selection = [];
      e = true;
    }

    if (this.lastActive) {
      this._activate(null);
      e = true;
    }

    if (e) {
      g(v, this.type);
    }
  }
}
Object.defineProperty(_.prototype, "contexts", {
  enumerable: true,
  get() {
    let e = this._context;
    return e
      ? -1 === this.selection.indexOf(e)
        ? [e]
        : this.selection.slice()
      : [];
  },
});
class m extends _ {
  constructor(e) {
    super(e);
    this.confirmed = true;
    this._confirmedSnapShot = [];
  }
  _checkConfirm(e) {
    if (!this.confirmed && e) {
      this.confirm();
    } else {
      if (this.confirmed &&
          !e) {
        this._confirmedSnapShot = this.selection.slice();
        this.confirmed = false;
      }
    }
  }
  _activate(e) {
    if (this.confirmed) {
      super._activate(e);
    }
  }
  select(e, t, i) {
    i = void 0 === i || i;
    this._checkConfirm(i);
    super.select(e, t, i);
  }
  unselect(e, t) {
    t = void 0 === t || t;
    this._checkConfirm(t);
    super.unselect(e, t);
  }
  confirm() {
    if (!this.confirmed) {
      this.confirmed = true;

      if (t.xor(this._confirmedSnapShot, this.selection).length) {
        g(v, this.type);
      }

      this._confirmedSnapShot = [];

      if (this.selection.length > 0) {
        this._activate(this.selection[this.selection.length - 1]);
      } else {
        this._activate(null);
      }
    }
  }
  cancel() {
    if (!this.confirmed) {
      super.select(this._confirmedSnapShot, true);
      this.confirmed = true;
      this._confirmedSnapShot = [];
    }
  }
  clear() {
    super.clear();
    this.confirm();
  }
}
let A = null;
A = i.isMainProcess ? e.ipcMain : e.ipcRenderer;

if (i.isMainProcess) {
  A.on("selection:get-registers", (e) => {
    let t = [];
    for (let e in l) {
      let i = l[e];
      t.push({
        type: e,
        selection: i.selection,
        lastActive: i.lastActive,
        lastHover: i.lastHover,
        context: i._context,
        isLastGlobalActive: i === n,
      });
    }
    e.returnValue = t;
  });
}

if (i.isRendererProcess) {
  (() => {
    let e = s.sendToMainSync("selection:get-registers");
    for (let t = 0; t < e.length; ++t) {
      let i = e[t];
      if (l[i.type]) {
        return;
      }
      let s = new m(i.type);
      s.selection = i.selection.slice();
      s.lastActive = i.lastActive;
      s.lastHover = i.lastHover;
      s._context = i.context;
      l[i.type] = s;

      if (i.isLastGlobalActive) {
        n = s;
      }
    }
    A.on("_selection:register", (e, t) => {
      let i = new m(t);
      l[t] = i;
    });
  })();
}

A.on("_selection:selected", (e, t, i) => {
  let s = l[t];
  if (!s) {
    r.error(
      "Cannot find the type %s for selection. Please register it first.",
      t
    );

    return;
  }

  if (1 === (i = i.filter((e) => -1 === s.selection.indexOf(e))).length) {
    s.selection.push(i[0]);
  } else {
    if (i.length > 1) {
      s.selection = s.selection.concat(i);
    }
  }
});

A.on("_selection:unselected", (e, t, i) => {
  let s = l[t];
  if (!s) {
    r.error(
      "Cannot find the type %s for selection. Please register it first.",
      t
    );

    return;
  }
  s.selection = s.selection.filter((e) => -1 === i.indexOf(e));
});

A.on("_selection:activated", (e, t, i) => {
  let s = l[t];
  if (!s) {
    r.error(
      "Cannot find the type %s for selection. Please register it first.",
      t
    );

    return;
  }
  n = s;
  s.lastActive = i;
});

A.on("_selection:deactivated", (e, t, i) => {
  unused(i);
  let s = l[t];
  if (!s) {
    r.error(
      "Cannot find the type %s for selection. Please register it first.",
      t
    );

    return;
  }

  if (n === s) {
    n = null;
  }

  s.lastActive = null;
});

A.on("_selection:hoverin", (e, t, i) => {
  let s = l[t];
  if (!s) {
    r.error(
      "Cannot find the type %s for selection. Please register it first.",
      t
    );

    return;
  }
  s.lastHover = i;
});

A.on("_selection:hoverout", (e, t, i) => {
  unused(i);
  let s = l[t];
  if (!s) {
    r.error(
      "Cannot find the type %s for selection. Please register it first.",
      t
    );

    return;
  }
  s.lastHover = null;
});

A.on("_selection:context", (e, t, i) => {
  let s = l[t];
  if (!s) {
    r.error(
      "Cannot find the type %s for selection. Please register it first.",
      t
    );

    return;
  }
  s._context = i;
});

A.on("_selection:patch", (e, t, i, s) => {
  let n = l[t];
  if (!n) {
    r.error(
      "Cannot find the type %s for selection. Please register it first.",
      t
    );

    return;
  }
  let o = n.selection.indexOf(i);

  if (-1 !== o) {
    n.selection[o] = s;
  }

  if (n.lastActive === i) {
    n.lastActive = s;
  }

  if (n.lastHover === i) {
    n.lastHover = s;
  }

  if (n._context === i) {
    n._context = s;
  }
});
