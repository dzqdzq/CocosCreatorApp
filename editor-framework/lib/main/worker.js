"use strict";
const e = require("electron");
const i = require("fire-fs");
const r = require("fire-url");
const t = require("lodash");
const o = require("./console");
const s = require("./protocol");
const n = require("../share/ipc-listener");
const l = e.BrowserWindow;

module.exports = class {
  constructor(e, i) {
    this.options = i || {};
    this.ipcListener = new n();
    t.defaultsDeep(i, { workerType: "renderer", url: "" });
  }
  start(e, i) {
    if ("function" == typeof e) {
      i = e;
      e = void 0;
    }

    if ("renderer" === this.options.workerType) {
      this.nativeWin = new l({ width: 0, height: 0, show: false });

      this.nativeWin.on("closed", () => {
        this.ipcListener.clear();
        this.dispose();
      });

      this.nativeWin.webContents.on("dom-ready", () => {
        if (i) {
          i();
        }
      });

      this._load(this.options.url, e);
    }
  }
  close() {
    if ("renderer" === this.options.workerType) {
      this.nativeWin.close();
    }
  }
  on(...e) {
    if ("renderer" === this.options.workerType) {
      this.ipcListener.on.apply(this.ipcListener, e);
    }
  }
  dispose() {
    this.nativeWin = null;
  }
  _load(e, t) {
    let n = s.url(e);
    if (!n) {
      o.error(`Failed to load page ${e} for window "${this.name}"`);
      return;
    }
    this._url = e;
    this._loaded = false;
    let l = t ? encodeURIComponent(JSON.stringify(t)) : void 0;
    let h = n;
    if (i.existsSync(n)) {
      h = r.format({ protocol: "file", pathname: n, slashes: true, hash: l });
      this.nativeWin.loadURL(h);
      return;
    }

    if (l) {
      h = `${n}#${l}`;
    }

    this.nativeWin.loadURL(h);
  }
};
