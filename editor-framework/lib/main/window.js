"use strict";
const e = require("electron");
const fireUrl = require("fire-url");
const i = require("fire-fs");
const n = require("lodash");
const s = require("events");
const o = e.BrowserWindow;
const a = "1.1.1";
const r = 100;
let l = [];
let d = null;
let h = "";
let u = null;
let w = [];
const p = "auto";

class f extends s {
  constructor(t, s) {
    super();
    s = s || {};

    n.defaultsDeep(s, {
      windowType: "dockable",
      width: 400,
      height: 300,
      acceptFirstMouse: true,
      disableAutoHideCursor: true,
      backgroundColor: "#333",
      webPreferences: {
        enableRemoteModule: true,
        contextIsolation: false,
        nodeIntegration: true,
        webviewTag: true,
        backgroundThrottling: false,
        preload: v.url("editor-framework://renderer.js"),
      },
      defaultFontSize: 13,
      defaultMonospaceFontSize: 13,
    });

    this._loaded = false;
    this._currentSessions = {};
    this._panels = [];
    this._layout = null;
    this.closing = false;
    if (
      (d)
    ) {
      let e = d.get("windows");

      if (e && e[t]) {
        this._layout = e[t].layout;
      }
    }
    switch (
      ((this.name = t),
      (this.hideWhenBlur = false),
      (this.windowType = s.windowType),
      (this.save = s.save),
      "boolean" != typeof this.save && (this.save = true),
      this.windowType)
    ) {
      case "dockable":
        s.resizable = true;
        s.alwaysOnTop = false;
        break;
      case "float":
        s.resizable = true;
        s.alwaysOnTop = true;
        break;
      case "fixed-size":
        s.resizable = false;
        s.alwaysOnTop = true;
        break;
      case "quick":
        s.resizable = true;
        s.alwaysOnTop = true;
        this.hideWhenBlur = true;
    }
    this.nativeWin = new o(s);
    if (
      (void 0 === s.x && void 0 === s.y && f.main)
    ) {
      let t = e.screen.getDisplayMatching(f.main.nativeWin.getBounds());
      let i = this.nativeWin.getSize();
      let n = 0.5 * (t.workArea.width - i[0]);
      let s = 0.5 * (t.workArea.height - i[1]);
      n = Math.floor(n);
      s = Math.floor(s);

      if (n < 0 || s < 0) {
        this.nativeWin.setPosition(t.workArea.x, t.workArea.y);

        setImmediate(() => {
          this.nativeWin.center();
        });
      } else {
        this.nativeWin.setPosition(n, s);
      }
    }

    if (this.hideWhenBlur) {
      this.nativeWin.setAlwaysOnTop(true);
    }

    this.nativeWin.on("focus", () => {
      if (!y.focused) {
        y.focused = true;
        y.emit("focus");
      }
    });

    this.nativeWin.on("blur", () => {
      setImmediate(() => {
        if (!o.getFocusedWindow()) {
          y.focused = false;
          y.emit("blur");
        }
      });

      if (this.hideWhenBlur) {
        this.nativeWin.hide();
      }
    });

    this.nativeWin.on("close", (e) => {
      this.closing = true;

      if ("quick" === this.windowType) {
        e.preventDefault();
        this.nativeWin.hide();
      }

      f._saveWindowStates();
    });

    this.nativeWin.on("closed", () => {
      for (let e in this._currentSessions) {
        b._closeSessionThroughWin(e);
        let t = this._currentSessions[e];

        if (t) {
          t();
        }
      }
      this._currentSessions = {};

      if (this.isMainWindow) {
        f.removeWindow(this);
        f.main = null;
        c._quit();
      } else {
        f.removeWindow(this);
      }

      this.dispose();
    });

    this.nativeWin.on("unresponsive", (e) => {
      W.error(`Window "${this.name}" unresponsive: ${e}`);
    });

    this.nativeWin.webContents.on("dom-ready", () => {
      ["theme://globals/common.css", "theme://globals/layout.css"].forEach(
        (e) => {
          let t = i.readFileSync(c.url(e), "utf8");
          this.nativeWin.webContents.insertCSS(t);
        }
      );
    });

    this.nativeWin.webContents.on("did-finish-load", () => {
      this._loaded = true;
    });

    this.nativeWin.webContents.on("crashed", (e) => {
      W.error(`Window "${this.name}" crashed: ${e}`);
    });

    this.nativeWin.webContents.on("will-navigate", (t, i) => {
      t.preventDefault();
      e.shell.openExternal(i);
    });

    f.addWindow(this);
  }
  dispose() {
    this.nativeWin = null;
  }
  load(e, n) {
    let s = v.url(e);
    if (!s) {
      W.error(`Failed to load page ${e} for window "${this.name}"`);
      return;
    }
    this._url = e;
    this._loaded = false;
    let o = n ? encodeURIComponent(JSON.stringify(n)) : void 0;
    if (i.existsSync(s)) {
      s = fireUrl.format({ protocol: "file", pathname: s, slashes: true, hash: o });
      this.nativeWin.loadURL(s);
      return;
    }

    if (o) {
      s = `${s}#${o}`;
    }

    this.nativeWin.loadURL(s);
  }
  show() {
    this.nativeWin.show();
  }
  hide() {
    this.nativeWin.hide();
  }
  close() {
    this._loaded = false;
    this.nativeWin.close();
  }
  forceClose() {
    this._loaded = false;
    f._saveWindowStates();

    if (this.nativeWin) {
      this.nativeWin.destroy();
    }
  }
  focus() {
    this.nativeWin.focus();
  }
  minimize() {
    this.nativeWin.minimize();
  }
  restore() {
    this.nativeWin.restore();
  }
  openDevTools(e) {
    e = e || { mode: "detach" };
    this.nativeWin.openDevTools(e);
  }
  closeDevTools() {
    this.nativeWin.closeDevTools();
  }
  adjust(t, i, n, s) {
    let o = false;

    if ("number" != typeof t) {
      o = true;
      t = 0;
    }

    if ("number" != typeof i) {
      o = true;
      i = 0;
    }

    if (("number" != typeof n || n <= 0)) {
      o = true;
      n = 800;
    }

    if (("number" != typeof s || s <= 0)) {
      o = true;
      s = 600;
    }

    let a = e.screen.getDisplayMatching({ x: t, y: i, width: n, height: s });
    this.nativeWin.setSize(n, s);
    this.nativeWin.setPosition(a.workArea.x, a.workArea.y);
    if (
      (!o)
    ) {
      let e = a.workArea;
      let s = e.x + r;
      let l = e.y;
      let d = e.x + (e.width - r);
      let h = e.y + (e.height - r);

      if ((t + n <= s || t >= d || i <= l || i >= h)) {
        o = true;
      }
    }

    if (o) {
      this.nativeWin.center();
    } else {
      this.nativeWin.setPosition(t, i);
    }
  }
  resetLayout(e, t) {
    let n;
    let s = c.url(e);

    if (!s) {
      s = c.url(h);
    }

    try {
      n = JSON.parse(i.readFileSync(s));
    } catch (e) {
      c.error(`Failed to load default layout: ${e.message}`);
      n = null;
    }

    if (n) {
      b._closeAllSessions();
      this.send("editor:reset-layout", n, true, t);
    }
  }
  emptyLayout() {
    b._closeAllSessions();
    this.send("editor:reset-layout", null);
  }
  _send(...e) {
    let t = this.nativeWin.webContents;
    return t
      ? (t.send.apply(t, e), true)
      : (W.error(
          `Failed to send "${e[0]}" to ${this.name} because web contents are not yet loaded`
        ),
        false);
  }
  _sendToPanel(e, t, ...i) {
    if ("string" != typeof t) {
      W.error(`The message ${t} sent to panel ${e} must be a string`);
      return;
    }
    let n = b._popReplyAndTimeout(i, b.debug);
    if (!n) {
      i = ["editor:ipc-main2panel", e, t, ...i];

      if (false === this._send.apply(this, i)) {
        W.failed(
          `send message "${t}" to panel "${e}" failed, no response received.`
        );
      }

      return;
    }
    let s = b._newSession(t, `${e}@main`, n.reply, n.timeout, this);
    this._currentSessions[s] = n.reply;

    i = [
      "editor:ipc-main2panel",
      e,
      t,
      ...i,
      b.option({ sessionId: s, waitForReply: true, timeout: n.timeout }),
    ];

    this._send.apply(this, i);
    return s;
  }
  _closeSession(e) {
    if (this.nativeWin) {
      delete this._currentSessions[e];
    }
  }
  _addPanel(e) {
    if (-1 === this._panels.indexOf(e)) {
      this._panels.push(e);
    }
  }
  _removePanel(e) {
    let t = this._panels.indexOf(e);

    if (-1 !== t) {
      this._panels.splice(t, 1);
    }
  }
  _removeAllPanels() {
    this._panels = [];
  }
  send(e, ...t) {
    if ("string" != typeof e) {
      W.error(`Send message failed for '${e}'. The message must be a string`);
      return;
    }
    let i = b._popReplyAndTimeout(t, b.debug);
    if (!i) {
      t = [e, ...t];

      if (false === this._send.apply(this, t)) {
        W.failed(
          `send message "${e}" to window failed. No response was received.`
        );
      }

      return;
    }
    let n = b._newSession(
      e,
      `${this.nativeWin.id}@main`,
      i.reply,
      i.timeout,
      this
    );
    this._currentSessions[n] = i.reply;

    t = [
      "editor:ipc-main2renderer",
      e,
      ...t,
      b.option({ sessionId: n, waitForReply: true, timeout: i.timeout }),
    ];

    this._send.apply(this, t);
    return n;
  }
  popupMenu(e, t, i) {
    if (void 0 !== t) {
      t = Math.floor(t);
    }

    if (void 0 !== i) {
      i = Math.floor(i);
    }

    let n = this.nativeWin.webContents;
    let s = new g(e, n);
    s.nativeMenu.popup(this.nativeWin, t, i);
    s.dispose();
  }
  get isMainWindow() {
    return f.main === this;
  }
  get isFocused() {
    return this.nativeWin.isFocused();
  }
  get isMinimized() {
    return this.nativeWin.isMinimized();
  }
  get isLoaded() {
    return this._loaded;
  }
  get panels() {
    return this._panels;
  }
  static get defaultLayoutUrl() {
    return h;
  }
  static set defaultLayoutUrl(e) {
    h = e;
  }
  static get windows() {
    return l.slice();
  }
  static set main(e) {
    return (u = e);
  }
  static get main() {
    return u;
  }
  static find(e) {
    if ("string" == typeof e) {
      for (let t = 0; t < l.length; ++t) {
        let i = l[t];
        if (i.name === e) {
          return i;
        }
      }
      return null;
    }
    if (e instanceof o) {
      for (let t = 0; t < l.length; ++t) {
        let i = l[t];
        if (i.nativeWin === e) {
          return i;
        }
      }
      return null;
    }
    for (let t = 0; t < l.length; ++t) {
      let i = l[t];
      if (i.nativeWin && i.nativeWin.webContents === e) {
        return i;
      }
    }
    return null;
  }
  static addWindow(e) {
    l.push(e);
  }
  static removeWindow(e) {
    let t = l.indexOf(e);
    if (-1 === t) {
      W.warn(`Cannot find window ${e.name}`);
      return;
    }
    l.splice(t, 1);
  }
  static getPanelWindowState(e) {
    if (d) {
      let t = d.get(`panels.${e}`);
      if (t) {
        return { x: t.x, y: t.y, width: t.width, height: t.height };
      }
    }
    return {};
  }
  static getLabelWidth(e) {
    return d ? d.get(`panelLabelWidth.${e}`) : p;
  }
  static saveLabelWidth(e, t) {
    if (d) {
      d.set(`panelLabelWidth.${e}`, t);
      d.save();
    }
  }
  static _saveWindowStates(e) {
    if ("test" === c.argv._command) {
      return;
    }
    if (!f.main) {
      return;
    }
    if (!d) {
      return;
    }
    d.set("version", a);
    let t = d.get("panels") || [];
    let i = {};
    for (let e = 0; e < l.length; ++e) {
      let n = l[e];
      let s = n.nativeWin.getBounds();

      if (n.save) {
        if (!s.width) {
          W.warn(
                    `Failed to commit window state. Invalid window width: ${s.width}`
                  );

          s.width = 800;
        }

        if (!s.height) {
          W.warn(
              `Failed to commit window state. Invalid window height ${s.height}`
            );

          s.height = 600;
        }

        i[n.name] = {
                main: n.isMainWindow,
                url: n._url,
                windowType: n.windowType,
                x: s.x,
                y: s.y,
                width: s.width,
                height: s.height,
                layout: n._layout,
                panels: n._panels,
              };
      } else {
        i[n.name] = {};
      }

      if (
        (!n.isMainWindow && 1 === n.panels.length)
      ) {
        t[n.panels[0]] = { x: s.x, y: s.y, width: s.width, height: s.height };
      }
    }
    d.set("windows", i);
    d.set("panels", t);
    d.save();

    if (e) {
      e();
    }
  }
  static initWindowStates(e, t) {
    let i = require("../share/profile/default-layout-windows");
    m.load(t, i);

    if ((d = m.load(e)).get("version") !== a) {
      i.version = a;
      d.set(null, i);
    }
  }
  static _restoreWindowStates(e) {
    if (d) {
      let t = Object.assign({}, e);
      w = [];
      let i = d.get("windows");
      for (let e in i) {
        let n;
        let s = i[e];

        if (v.url(s.url)) {
          if (s.main) {
            t.show = false;
            t.windowType = s.windowType;
            n = new f(e, t);
            f.main = n;
          } else {
            n = new f(e, { show: false, windowType: s.windowType });
          }

          if ("simple" === s.windowType) {
            n._panels = s.panels;
          }

          if (!s.main &&
            s.panels &&
            s.panels.length) {
            n.nativeWin.setMenuBarVisibility(false);
          }

          n.adjust(s.x, s.y, s.width, s.height);

          if (s.main) {
            n.show();
            n.load(s.url);
          } else {
            w.push({ win: n, state: s });
          }
        }
      }
      if (f.main) {
        f.main.focus();
        return true;
      }
    }
    return false;
  }
}
module.exports = f;
const c = require("./editor");
const v = require("./protocol");
const y = require("../app");
const m = require("../profile");
const W = require("./console");
const g = require("./menu");
const b = require("./ipc");
const _ = require("./package");
const S = e.ipcMain;

S.on("editor:ready", () => {
  for (; w.length > 0; ) {
    let e = w.pop();
    let t = e.win;
    let i = e.state;
    let n = i.panels[0];
    let s = _.panelInfo(n);
    t.show();

    t.load(i.url, {
      panelID: n,
      panelArgv: void 0,
      engineSupport: s && s.engineSupport,
    });
  }
});

S.on("editor:window-open", (e, t, i, n) => {
  let s = new f(t, (n = n || {}));
  s.nativeWin.setMenuBarVisibility(false);

  if (n.width && n.height) {
    s.nativeWin.setContentSize(n.width, n.height);
  }

  s.load(i, n.argv);
  s.show();
});

S.on("editor:window-query-layout", (e) => {
  let t = o.fromWebContents(e.sender);
  let n = f.find(t);
  if (!n) {
    W.warn("Failed to query layout, cannot find the window.");
    e.reply();
    return;
  }
  let s = n._layout;
  if (n.isMainWindow && !s) {
    let e = v.url(h);
    if (i.existsSync(e)) {
      try {
        s = JSON.parse(i.readFileSync(e));
      } catch (e) {
        W.error(`Failed to load default layout: ${e.message}`);
        s = null;
      }
    }
  }
  e.reply(null, s);
});

S.on("editor:window-save-layout", (e, t) => {
  let i = o.fromWebContents(e.sender);
  let n = f.find(i);
  if (!n) {
    W.warn("Failed to save layout, cannot find the window.");
    return;
  }
  n._layout = t;

  f._saveWindowStates(() => {
    if (e.reply) {
      e.reply();
    }
  });
});

S.on("editor:update-label-width", (e, t, i) => {
  let n = o.fromWebContents(e.sender);
  if (!f.find(n)) {
    W.warn("Failed to save layout, cannot find the window.");
    return;
  }
  f.saveLabelWidth(t, i);
});

S.on("editor:query-label-width", (e, t) => {
  let i = o.fromWebContents(e.sender);
  if (!f.find(i)) {
    W.warn("Failed to save layout, cannot find the window.");
    return;
  }

  if (e.reply) {
    e.reply(null, f.getLabelWidth(t));
  }
});

S.on("editor:window-focus", (e) => {
  let t = o.fromWebContents(e.sender);
  let i = f.find(t);
  if (!i) {
    W.warn("Failed to focus, cannot find the window.");
    return;
  }

  if (!i.isFocused) {
    i.focus();
  }
});

S.on("editor:window-load", (e, t, i) => {
  let n = o.fromWebContents(e.sender);
  let s = f.find(n);
  if (!s) {
    W.warn("Failed to focus, cannot find the window.");
    return;
  }
  s.load(t, i);
});

S.on("editor:window-resize", (e, t, i, n) => {
  let s = o.fromWebContents(e.sender);
  let a = f.find(s);
  if (!a) {
    W.warn("Failed to focus, cannot find the window.");
    return;
  }

  if (n) {
    a.nativeWin.setContentSize(t, i);
  } else {
    a.nativeWin.setSize(t, i);
  }
});

S.on("editor:window-center", (e) => {
  let t = o.fromWebContents(e.sender);
  let i = f.find(t);
  if (!i) {
    W.warn("Failed to focus, cannot find the window.");
    return;
  }
  i.nativeWin.center();
});

S.on("editor:window-inspect-at", (e, t, i) => {
  let n = o.fromWebContents(e.sender);
  if (!n) {
    W.warn(`Failed to inspect at ${t}, ${i}, cannot find the window.`);
    return;
  }
  n.inspectElement(t, i);

  if (n.devToolsWebContents) {
    n.devToolsWebContents.focus();
  }
});

S.on("editor:window-remove-all-panels", (e) => {
  let t = o.fromWebContents(e.sender);
  let i = f.find(t);
  if (!i) {
    e.reply();
    return;
  }
  i._removeAllPanels();
  e.reply();
});
