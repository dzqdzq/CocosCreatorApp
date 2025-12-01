"use strict";
const e = require("electron");
const n = require("fire-path");
const t = require("lodash");
let r;
let i = {};
let a = false;
class u {
  constructor(n, t) {
    if (!n) {
      this.nativeMenu = new e.Menu();
      return;
    }
    u.convert(n, t);
    this.nativeMenu = e.Menu.buildFromTemplate(n);
    r = this.nativeMenu;
  }
  dispose() {
    this.nativeMenu = null;
  }
  reset(n) {
    u.convert(n);
    this.nativeMenu = e.Menu.buildFromTemplate(n);
  }
  clear() {
    this.nativeMenu = new e.Menu();
  }
  add(t, r) {
    if (!Array.isArray(r) && !r.label && "separator" !== r.type) {
      let e = t.lastIndexOf("/");

      if (-1 !== e) {
        r.label = t.slice(e + 1);
        t = t.slice(0, e);
      }
    }
    let i = m(this.nativeMenu, t, true);
    if (!i) {
      l.error(`Failed to find menu in path: ${t}`);
      return false;
    }
    if ("submenu" !== i.type || !i.submenu) {
      l.error(`Failed to add menu at ${t}, it is not a submenu`);
      return false;
    }

    if (!Array.isArray(r)) {
      r = [r];
    }

    u.convert(r);
    let a = e.Menu.buildFromTemplate(r);
    for (let e = 0; e < a.items.length; ++e) {
      let r = a.items[e];
      if (i.submenu.items.some((e) => e.label === r.label)) {
        l.error(
          `Failed to add menu to ${t},\n          a menu item ${n.posix.join(
            t,
            r.label
          )} you tried to add already exists`
        );

        return false;
      }
    }
    for (let e = 0; e < a.items.length; ++e) {
      let n = a.items[e];
      i.submenu.append(n);
    }
    return true;
  }
  insert(t, r, i) {
    if (!Array.isArray(i) && !i.label && "separator" !== i.type) {
      let e = t.lastIndexOf("/");

      if (-1 !== e) {
        i.label = t.slice(e + 1);
        t = t.slice(0, e);
      }
    }
    let a = n.dirname(t);
    if ("." === a) {
      if (!Array.isArray(i)) {
        i = [i];
      }

      u.convert(i);
      let n = e.Menu.buildFromTemplate(i);

      let a = new e.MenuItem({
        label: t,
        id: t.toLowerCase(),
        submenu: new e.Menu(),
        type: "submenu",
      });

      for (let e = 0; e < n.items.length; ++e) {
        let t = n.items[e];
        a.submenu.append(t);
      }
      this.nativeMenu.insert(r, a);
      return true;
    }
    let s = n.basename(t);
    let o = m(this.nativeMenu, a);
    if (!o) {
      l.error(`Failed to find menu in path: ${a}`);
      return false;
    }
    if ("submenu" !== o.type || !o.submenu) {
      l.error(`Failed to insert menu at ${a}, it is not a submenu`);
      return false;
    }
    let d = o.submenu.items.some((e) => e.label === s);

    if (!Array.isArray(i)) {
      i = [i];
    }

    u.convert(i);
    let p = e.Menu.buildFromTemplate(i);
    if (d) {
      let e = m(this.nativeMenu, t, true);
      for (let n = 0; n < p.items.length; ++n) {
        let t = p.items[n];
        e.submenu.append(t);
      }
      return false;
    }
    {
      let n = new e.MenuItem({
        label: s,
        id: s.toLowerCase(),
        submenu: new e.Menu(),
        type: "submenu",
      });
      for (let e = 0; e < p.items.length; ++e) {
        let t = p.items[e];
        n.submenu.append(t);
      }
      o.submenu.insert(r, n);
      return true;
    }
  }
  remove(t) {
    let r = new e.Menu();
    return (function e(t, r, i, a) {
      let u = false;
      for (let l = 0; l < r.items.length; ++l) {
        let s = r.items[l];
        let o = n.posix.join(a, s.label);
        if (!n.contains(o, i)) {
          t.append(s);
          continue;
        }
        if (o === i) {
          u = true;
          continue;
        }
        let m = d(s);
        if ("submenu" !== m.type) {
          t.append(m);
          continue;
        }
        let p = e(m.submenu, s.submenu, i, o);

        if (p) {
          u = true;
        }

        if (m.submenu.items.length > 0) {
          t.append(m);
        }
      }
      return u;
    })(r, this.nativeMenu, t, "")
      ? ((this.nativeMenu = r), true)
      : (l.error(`Failed to remove menu in path: ${t} (could not be found)`),
        false);
  }
  update(e, r) {
    let i = (function (e, r) {
      let i = e;
      let a = r.split("/");
      let u = "";
      for (let e = 0; e < a.length; e++) {
        let r = e === a.length - 1;
        let l = a[e];
        let s = null;
        u = n.posix.join(u, l);
        let o = t.findIndex(i.items, (e) => e.label === l);

        if (-1 !== o) {
          s = i.items[o];
        }

        if (!s) {
          return -1;
        }
        if (r) {
          return o;
        }
        if (!s.submenu || "submenu" !== s.type) {
          return -1;
        }
        i = s.submenu;
      }
      return -1;
    })(this.nativeMenu, e);
    this.remove(e);
    return -1 !== i && this.insert(e, i, r);
  }
  exists(e) {
    return !!m(this.nativeMenu, e, false);
  }
  set(e, n) {
    let t = m(this.nativeMenu, e, false);
    return (!!t && ("separator" === t.type ? (l.error(`Failed to set menu in path ${e}: menu item is a separator`), false) : (void 0 !== n.icon && (t.icon = n.icon), void 0 !== n.enabled && (t.enabled = n.enabled), void 0 !== n.visible && (t.visible = n.visible), void 0 !== n.checked && (t.checked = n.checked), true)));
  }
  static set showDev(e) {
    a = e;
  }
  static get showDev() {
    return a;
  }
  static convert(e, n) {
    if (!Array.isArray(e)) {
      l.error("template must be an array");
      return;
    }
    for (let t = 0; t < e.length; ++t) {
      if (p(e, t, n)) {
        e.splice(t, 1);
        --t;
      }
    }
  }
  static register(e, n, t) {
    return "function" != typeof n
      ? (l.warn(`Cannot register menu ${e}, "fn" must be a function`), void 0)
      : !t && i[e]
      ? (l.warn(`Cannot register menu "${e}" (already exists).`), void 0)
      : ((i[e] = n), void 0);
  }
  static unregister(e) {
    if (!i[e]) {
      l.warn(`Cannot find menu "${e}"`);
      return;
    }
    delete i[e];
  }
  static getMenu(e) {
    let n = i[e];
    return n ? n() : [];
  }
  static walk(e, n) {
    if (!Array.isArray(e)) {
      e = [e];
    }

    e.forEach((e) => {
      n(e);

      if (e.submenu) {
        u.walk(e.submenu, n);
      }
    });
  }
}
module.exports = u;
const l = require("./console");
const s = require("./ipc");
const o = e.ipcMain;
function m(r, i, a) {
  let u = r;

  if ("boolean" != typeof a) {
    a = false;
  }

  let s = i.split("/");
  let o = "";
  for (let r = 0; r < s.length; r++) {
    let m = r === s.length - 1;
    let d = s[r];
    let p = null;
    o = n.posix.join(o, d);
    let b = t.findIndex(u.items, (e) => e.label === d);

    if (-1 !== b) {
      p = u.items[b];
    }

    if ((p)) {
      if (m) {
        return p;
      }
      if (!p.submenu || "submenu" !== p.type) {
        l.warn(`Cannot add menu in ${i}, the ${o} is already used`);
        return null;
      }
      u = p.submenu;
    } else {
      if (!a) {
        return null;
      }

      p = new e.MenuItem({
          label: d,
          id: d.toLowerCase(),
          submenu: new e.Menu(),
          type: "submenu",
        });

      if (0 === r) {
        let e = Math.max(u.items.length - 1, 0);
        u.insert(e, p);
      } else {
        u.append(p);
      }
      if (m) {
        return p;
      }
      u = p.submenu;
    }
  }
  return null;
}
function d(n) {
  let r = t.pick(n, [
    "click",
    "role",
    "type",
    "label",
    "sublabel",
    "accelerator",
    "icon",
    "enabled",
    "visible",
    "checked",
    "id",
    "position",
  ]);

  if ("submenu" === r.type) {
    r.submenu = new e.Menu();
  }

  return new e.MenuItem(r);
}
function p(e, r, i) {
  let o = e[r];
  let m = o.path || o.label;
  if (o.dev && false === a) {
    return true;
  }
  if (o.message) {
    if (o.click) {
      l.error(`Skip 'click' in menu item '${m}', already has 'message'`);
    }

    if (o.command) {
      l.error(`Skip 'command' in menu item '${m}', already has 'message'`);
    }

    let e = [o.message];
    if (o.params) {
      if (!Array.isArray(o.params)) {
        l.error(`Failed to add menu item '${m}', 'params' must be an array`);
        return true;
      }
      e = e.concat(o.params);
    }

    if (o.panel) {
      e.unshift(o.panel);
    }

    if (o.panel) {
      o.click = () => {
            setImmediate(() => {
              s.sendToPanel.apply(null, e);
            });
          };
    } else {
      o.click = i
            ? () => {
                setImmediate(() => {
                  i.send.apply(i, e);
                });
              }
            : () => {
                setImmediate(() => {
                  s.sendToMain.apply(null, e);
                });
              };
    }
  } else {
    if (o.command) {
      if (o.click) {
        l.error(
          `Skipping "click" action in menu item '${m}' since it's already mapped to a command.`
        );
      }

      let e = t.get(global, o.command, null);
      if (!e || "function" != typeof e) {
        l.error(
          `Failed to add menu item '${m}', cannot find global function ${o.command} in main process for 'command'.`
        );

        return true;
      }
      let n = [];
      if (o.params) {
        if (!Array.isArray(o.params)) {
          l.error("message parameters must be an array");
          return;
        }
        n = n.concat(o.params);
      }

      o.click = () => {
        e.apply(null, n);
      };
    } else {
      if (o.submenu) {
        u.convert(o.submenu, i);
      }
    }
  }
  let d = false;

  if (o.path) {
    if (o.label) {
      l.warn(`Skipping label "${o.label}" in menu item "${o.path}"`);
    }

    d = (function (e, r) {
      let i = e[r];
      if (!i.path) {
        return;
      }
      let a = i.path.split("/");
      if (1 === a.length) {
        e[r].label = a[0];
        return false;
      }
      let u = e;
      let s = null;
      let o = "";
      let m = false;
      for (let e = 0; e < a.length - 1; e++) {
        let d = e === a.length - 2;
        let p = a[e];
        o = n.posix.join(o, p);
        s = null;
        let b = t.findIndex(u, (e) => e.label === p);

        if (-1 !== b) {
          s = u[b];
        }

        if (s) {
          if (0 === e) {
            m = true;
          }
        } else {
          s = { label: p, type: "submenu", submenu: [] };

          if (0 === e) {
            u[r] = s;
          } else {
            u.push(s);
          }
        }

        if (!s.submenu || "submenu" !== s.type) {
          l.warn(
            `Cannot add menu in ${i.path}, the ${o} is already used`
          );

          return;
        }
        if (d) {
          break;
        }
        u = s.submenu;
      }
      i.label = a[a.length - 1];
      s.submenu.push(i);
      return m;
    })(e, r);
  } else {
    if (void 0 === o.label &&
        "separator" !== o.type) {
      l.warn("Missing label for menu item");
    }
  }

  return d;
}

o.on("menu:popup", (n, t, r, i) => {
  if (void 0 !== r) {
    r = Math.floor(r);
  }

  if (void 0 !== i) {
    i = Math.floor(i);
  }

  let a = new u(t, n.sender);
  a.nativeMenu.popup(e.BrowserWindow.fromWebContents(n.sender), r, i);
  a.dispose();
});

o.on("menu:register", (e, n, t, r) => {
  u.register(n, () => JSON.parse(JSON.stringify(t)), r);
});
