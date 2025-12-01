"use strict";
let e = {};
module.exports = e;
const t = require("electron");
const r = require("async");
const i = require("../../editor");
const o = require("../../console");
const n = require("../../ipc");
const l = require("../../panel");
const a = require("../../window");
const d = require("./dom-utils");
const c = require("./drag-drop");
let u = null;
let s = [];
let f = null;
let p = 0;
let h = false;
function g(e) {
  let t = [];
  for (let r = 0; r < e.children.length; ++r) {
    let i = e.children[r].id;
    t.push(i);
  }
  return t;
}
function m(e, t, r, i, o) {
  if (!f) {
    (f = document.createElement("div")).classList.add("dock-mask");

    f.oncontextmenu = function () {
        return false;
      };
  }

  if ("dock" === e) {
    f.classList.remove("tab");
    f.classList.add("dock");
  } else {
    if ("tab" === e) {
      f.classList.remove("dock");
      f.classList.add("tab");
    }
  }

  f.style.left = `${t}px`;
  f.style.top = `${r}px`;
  f.style.width = `${i}px`;
  f.style.height = `${o}px`;

  if (!f.parentElement) {
    document.body.appendChild(f);
  }
}
function w() {
  if (f) {
    f.remove();
  }

  u = null;
  p = 0;
}
e.root = null;
Object.defineProperty(e, "resizerSpace", { enumerable: true, get: () => 3 });
Object.defineProperty(e, "tabbarSpace", { enumerable: true, get: () => 22 });
Object.defineProperty(e, "panelSpace", { enumerable: true, get: () => 4 });

e.dragstart = function (e, t) {
  let r = t.frameEL;
  let i = r.id;
  let o = r.parentNode;
  let n = o.getBoundingClientRect();

  let l = {
    panelID: i,
    panelRectWidth: n.width,
    panelRectHeight: n.height,
    panelPreferredWidth: o._preferredWidth,
    panelPreferredHeight: o._preferredHeight,
  };

  c.start(e.dataTransfer, { effect: "move", type: "tab", items: l });
};

e.dragend = function () {
  w();
  c.end();
};

e.dragoverTab = function (e) {
  a.focus();
  s = [];
  u = null;

  if (f) {
    f.remove();
  }

  let t = e.getBoundingClientRect();
  m("tab", t.left, t.top, t.width, t.height + 2);
};

e.dragleaveTab = function () {
  if (f) {
    f.remove();
  }
};

e.dropTab = function (t, r) {
  let i = c.items()[0].panelID;
  let n = l.find(i);
  if (n) {
    let i = n.parentNode;
    let o = t.panelEL;
    let a = i !== o;
    let d = i.$tabs.findTab(n);

    if (a) {
      i.closeNoCollapse(d);
    }

    let c = o.insert(d, n, r);
    o.select(c);

    if (a) {
      i._collapse();
    }

    w();
    e.finalize();
    e.saveLayout();
    n.focus();

    if (l.isDirty(n.id)) {
      o.outOfDate(n);
    }
  } else {
    l.close(i, (n, a) => {
      if (n) {
        o.error(`Failed to close panel ${i}: ${n.stack}`);
        return;
      }

      if (a) {
        l.newFrame(i, (i, n) => {
          if (i) {
            o.error(i.stack);
            return;
          }

          if (window.updateEngineSupport) {
            window.updateEngineSupport(n._info.engineSupport);
          }

          window.requestAnimationFrame(() => {
            let i = t.panelEL;
            let a = document.createElement("ui-dock-tab");
            a.name = n.name;
            let d = i.insert(a, n, r);
            i.select(d);
            l.dock(n);
            w();
            e.finalize();
            e.saveLayout();
            n.focus();

            if (l.isDirty(n.id)) {
              i.outOfDate(n);
            }

            n.load((e) => {
              if (e) {
                o.error(e.stack);
                return;
              }

              if (n.ready) {
                n.ready();
              }
            });
          });
        });
      }
    });
  }
};

e.dragoverDock = function (e) {
  if ("tab" === c.type()) {
    s.push(e);
  }
};

e.dragenterMainDock = function () {
    ++p;
  };

e.dragleaveMainDock = function () {
  if (0 === --p && f) {
    f.remove();
  }
};

e.dragoverMainDock = function (e, t) {
    a.focus();
    let r = null;
    u = null;
    for (let i = 0; i < s.length; ++i) {
      let o = s[i];
      let n = o.getBoundingClientRect();
      let l = n.left + n.width / 2;
      let a = n.top + n.height / 2;
      let d = null;
      let c = Math.abs(e - n.left);
      let f = Math.abs(e - n.right);
      let p = Math.abs(t - n.top);
      let h = Math.abs(t - n.bottom);
      let g = 100;
      let m = -1;

      if (c < g) {
        g = c;
        m = Math.abs(t - a);
        d = "left";
      }

      if (f < g) {
        g = f;
        m = Math.abs(t - a);
        d = "right";
      }

      if (p < g) {
        g = p;
        m = Math.abs(e - l);
        d = "top";
      }

      if (h < g) {
        g = h;
        m = Math.abs(e - l);
        d = "bottom";
      }

      if (null !== d &&
        (null === r || m < r)) {
        r = m;
        u = { target: o, position: d };
      }
    }
    if (u) {
      let e = c.items()[0];
      let t = u.target.getBoundingClientRect();
      let r = null;
      let i = e.panelPreferredWidth;
      let o = e.panelPreferredHeight;
      let n = i;

      if (n >= Math.floor(t.width)) {
        n = Math.floor(0.5 * t.width);
      }

      let l = o;

      if (l >= Math.floor(t.height)) {
        l = Math.floor(0.5 * t.height);
      }

      if ("top" === u.position) {
        r = { left: t.left, top: t.top, width: t.width, height: l };
      } else {
        if ("bottom" === u.position) {
          r = { left: t.left, top: t.bottom - l, width: t.width, height: l };
        } else {
          if ("left" === u.position) {
            r = { left: t.left, top: t.top, width: n, height: t.height };
          } else {
            if ("right" === u.position) {
              r = { left: t.right - n, top: t.top, width: n, height: t.height };
            }
          }
        }
      }

      m("dock", r.left, r.top, r.width, r.height);
    } else {
      if (f) {
        f.remove();
      }
    }
    s = [];
  };

e.dropMainDock = function (t) {
  if (null === u) {
    return;
  }
  let r = t.panelID;
  let i = t.panelRectWidth;
  let n = t.panelRectHeight;
  let a = t.panelPreferredWidth;
  let d = t.panelPreferredHeight;
  let c = u.target;
  let s = u.position;
  let f = l.find(r);
  if (!f) {
    l.close(r, (t, i) => {
      if (t) {
        o.error(`Failed to close panel ${r}: ${t.stack}`);
        return;
      }

      if (i) {
        l.newFrame(r, (t, r) => {
          if (t) {
            o.error(t.stack);
            return;
          }
          window.requestAnimationFrame(() => {
            let t = document.createElement("ui-dock-panel");
            t.add(r);
            t.select(0);
            t._preferredWidth = a;
            t._preferredHeight = d;
            c.addDock(s, t);
            l.dock(r);
            w();
            e.finalize();
            e.saveLayout();
            r.focus();

            if (l.isDirty(r.id)) {
              t.outOfDate(r);
            }

            r.load((e) => {
              if (e) {
                o.error(e.stack);
                return;
              }

              if (r.ready) {
                r.ready();
              }
            });
          });
        });
      }
    });

    return;
  }
  let p = f.parentNode;
  if (c === p && 1 === c.tabCount) {
    return;
  }
  let h = p.parentNode;
  let g = h === c.parentNode;
  let m = p.$tabs.findTab(f);
  p.closeNoCollapse(m);
  let v = document.createElement("ui-dock-panel");
  v.add(f);
  v.select(0);
  v._preferredWidth = a;
  v._preferredHeight = d;
  c.addDock(s, v, g);
  let y = 0 === p.children.length;
  p._collapse();
  if ((y)) {
    let e = false;
    if (v.parentNode !== h) {
      let t = v;
      let r = v.parentNode;
      for (; r && r._dockable; ) {
        if (r === h) {
          e = true;
          break;
        }
        t = r;
        r = r.parentNode;
      }
      if (e) {
        let e = 0;

        if (h.row) {
          e = t.offsetWidth + 3 + i;
          t._preferredWidth = e;
        } else {
          e = t.offsetHeight + 3 + n;
          t._preferredHeight = e;
        }

        t.style.flex = `0 0 ${e}px`;
      }
    }
  }
  w();
  e.finalize();
  e.saveLayout();
  f.focus();

  if (l.isDirty(f.id)) {
    v.outOfDate(f);
  }
};

e.collapse = function () {
  if (e.root) {
    e.root._collapseRecursively();
  }
};

e.finalize = function () {
  if (e.root) {
    e.root._finalizeMinMaxRecursively();
    e.root._finalizePreferredSizeRecursively();
    e.root._finalizeStyleRecursively();
    e.root._reflowRecursively();
    e.root._updatePreferredSizeRecursively();
    e.root._notifyResize();

    (function () {
      let r = e.root;
      if (!r) {
        return;
      }
      let i = t.remote.getCurrentWindow();
      let o = i.getSize();
      let n = o[0];
      let l = o[1];
      let a = window.innerWidth - r.clientWidth;
      let d = window.innerHeight - r.clientHeight;
      let c = r._computedMinWidth + a;
      let u = r._computedMinHeight + d;
      a = n - window.innerWidth;
      d = l - window.innerHeight;
      c += a;
      u += d;
      i.setMinimumSize(c, u);

      if (n < c) {
        n = c;
      }

      if (l < u) {
        l = u;
      }

      i.setSize(n, l);
    })();
  }
};

e.resize = function () {
  if (e.root) {
    e.root._reflowRecursively();
    e.root._notifyResize();

    window.requestAnimationFrame(() => {
      e.root._updatePreferredSizeRecursively();
    });
  }
};

e.reset = function (t, n, a) {
  h = true;

  r.waterfall(
    [
      (e) => {
        l._unloadAll(e);
      },
      (e) => {
        d.clear(t);
        if (!n || !n.type || 0 !== n.type.indexOf("dock")) {
          e(null, []);
          return;
        }

        if ("dock-v" === n.type) {
          t.row = false;
        } else {
          if ("dock-h" === n.type) {
            t.row = true;
          }
        }

        let r = [];

        (function e(t, r, i) {
          if (!r) {
            return;
          }
          for (let o = 0; o < r.length; ++o) {
            let n;
            let l = r[o];

            if ("dock-v" === l.type) {
              (n = document.createElement("ui-dock")).row = false;
            } else {
              if ("dock-h" === l.type) {
                (n = document.createElement("ui-dock")).row = true;
              } else {
                if ("panel" === l.type) {
                  n = document.createElement("ui-dock-panel");
                }
              }
            }

            if (n) {
              if (void 0 !== l.width) {
                n._preferredWidth = l.width;
              }

              if (void 0 !== l.height) {
                n._preferredHeight = l.height;
              }

              if ("panel" === l.type) {
                for (let e = 0; e < l.children.length; ++e) {
                  i.push({
                    dockEL: n,
                    panelID: l.children[e],
                    active: e === l.active,
                  });
                }
              } else {
                e(n, l.children, i);
              }
              t.appendChild(n);
            } else {
              Editor.warn(`Failed to create layout from ${l}`);
            }
          }
          t._initResizers();
        })(t, n.children, r);

        e(null, r);
      },
      (t, i) => {
        let n = [];
        let a = Editor.remote.Window.windows;
        r.each(
          t,
          (e, t) => {
            if (a.some((t) => -1 !== t._panels.indexOf(e.panelID))) {
              l.close(e.panelID);
            }

            l.newFrame(e.panelID, (r, i) => {
              if (r) {
                o.error(r.stack);
                t();
                return;
              }
              let a = e.dockEL;
              a.add(i);

              if (e.active) {
                a.select(i);
              }

              l.dock(i);
              n.push(i);
              t();
            });
          },
          (t) => {
            h = false;
            e.collapse();
            e.finalize();
            e.saveLayout();
            i(t, n);
          }
        );
      },
      (e, t) => {
        let r = i.argv && i.argv.panelID && i.argv.panelArgv;

        e.forEach((e) => {
          e.load((t) => {
            if (t) {
              o.error(t.stack);
              return;
            }

            if (e.ready) {
              e.ready();
            }

            if (r &&
              i.argv.panelID === e.id &&
              e.run) {
              e.run(i.argv.panelArgv);
            }
          });
        });

        t();
      },
    ],
    (e) => {
      if (a) {
        a(e);
      }
    }
  );
};

e.saveLayout = function () {
  if (!h) {
    window.requestAnimationFrame(() => {
      n.sendToMain("editor:window-save-layout", e.dumpLayout());
    });
  }
};

e.dumpLayout = function () {
    let t = e.root;
    if (!t) {
      return null;
    }
    if (t._dockable) {
      return {
        type: t.row ? "dock-h" : "dock-v",
        children: (function t(r) {
          let i = [];
          for (let o = 0; o < r.children.length; ++o) {
            let n = r.children[o];
            if (!n._dockable) {
              continue;
            }
            let l = n.getBoundingClientRect();
            let a = { width: l.width, height: l.height };
            if (e.isPanel(n)) {
              a.type = "panel";
              a.active = n.activeIndex;
              a.children = g(n);
            } else {
              let e = n.row ? "dock-h" : "dock-v";
              a.type = e;
              a.children = t(n);
            }
            i.push(a);
          }
          return i;
        })(t),
      };
    }
    {
      let e = t.getAttribute("id");
      let r = t.getBoundingClientRect();
      return { type: "standalone", panel: e, width: r.width, height: r.height };
    }
  };

e.isPanel = function (e) {
    return "UI-DOCK-PANEL" === e.tagName;
  };

e.isPanelFrame = function (e) {
    return "UI-PANEL-FRAME" === e.tagName;
  };

e.isResizer = function (e) {
    return "UI-DOCK-RESIZER" === e.tagName;
  };

e.isTab = function (e) {
    return "UI-DOCK-TAB" === e.tagName;
  };

e.isTabBar = function (e) {
    return "UI-DOCK-TABS" === e.tagName;
  };

t.ipcRenderer.on("editor:reset-layout", (t, r, i) => {
  if (i) {
    n.sendToMain("editor:window-save-layout", r, () => {
      if (t.reply) {
        t.reply();
      }
    });

    return;
  }
  n._closeAllSessions();

  e.reset(e.root, r, (e) => {
    if (e) {
      o.error(`Failed to reset layout: ${e.stack}`);
    }
  });
});

window.addEventListener("resize", () => {
  e.resize();
});
