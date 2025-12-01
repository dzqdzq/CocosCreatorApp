"use strict";
const t = require("fire-path");
const e = require("mousetrap");
const i = require("../utils/resource-mgr");
const s = require("../utils/dom-utils");
const r = require("../../i18n");
const n = require("../../console");
const o = require("../../../profile");
const h = require("../../../share/js-utils");
const l = require("../../../share/ipc-listener");
const a = require("../../ipc");

module.exports = class extends window.HTMLElement {
  static get tagName() {
    return "ui-panel-frame";
  }
  get root() {
    return this.shadowRoot ? this.shadowRoot : this;
  }
  get info() {
    return this._info;
  }
  get name() {
    return this._info ? r.format(this._info.title) : this.id;
  }
  get popable() {
    return !this._info || this._info.popable;
  }
  get width() {
    if (!this._info) {
      return "auto";
    }
    let t = parseInt(this._info.width);
    return isNaN(t) ? "auto" : t;
  }
  get minWidth() {
    if (!this._info) {
      return 100;
    }
    let t = parseInt(this._info["min-width"]);
    return isNaN(t) ? 100 : t;
  }
  get maxWidth() {
    if (!this._info) {
      return "auto";
    }
    let t = parseInt(this._info["max-width"]);
    return isNaN(t) ? "auto" : t;
  }
  get height() {
    if (!this._info) {
      return "auto";
    }
    let t = parseInt(this._info.height);
    return isNaN(t) ? "auto" : t;
  }
  get minHeight() {
    if (!this._info) {
      return 100;
    }
    let t = parseInt(this._info["min-height"]);
    return isNaN(t) ? 100 : t;
  }
  get maxHeight() {
    if (!this._info) {
      return "auto";
    }
    let t = parseInt(this._info["max-height"]);
    return isNaN(t) ? "auto" : t;
  }
  constructor() {
    super();
    this._focusedElement = null;
    this._lastFocusedElement = null;
    this._info = null;
  }
  connectedCallback() {
    this.classList.add("fit");
    this.tabIndex = -1;
  }
  queryID(t) {
    return this.root.getElementById(t);
  }
  query(t) {
    return this.root.querySelector(t);
  }
  queryAll(t) {
    return this.root.querySelectorAll(t);
  }
  reset() {}
  load(e) {
    let s = t.join(this._info.path, this._info.main);
    this._loadLabelWidth();

    i
      .importScript(s)
      .then((t) => {
      if (!t) {
        throw new Error(
          `Failed to load panel-frame ${this.id}: no panel prototype return.`
        );
      }
      if (t.dependencies && t.dependencies.length) {
        i
          .importScripts(t.dependencies)
          .then(() => {
          let i = this._loadProfiles();
          this._apply(t, i);

          if (e) {
            e(null);
          }
        })
          .catch((t) => {
          if (e) {
            e(t);
          }
        });

        return;
      }
      let s = this._loadProfiles();
      this._apply(t, s);
      this._registerEvent();

      if (e) {
        e(null);
      }
    })
      .catch((t) => {
      if (e) {
        e(t);
      }
    });
  }
  _loadProfiles() {
    let t = {};

    this._info.profileTypes.forEach((e) => {
      let i = `${e}://${this.id}.json`;
      t[e] = o.load(i);
    });

    return t;
  }
  _apply(t, i) {
    let r = this._info["shadow-dom"];
    let o = t.template;
    let a = t.style;
    let d = t.listeners;
    let u = t.behaviors;
    let f = t.$;

    h.assignExcept(this, t, [
      "dependencies",
      "template",
      "style",
      "listeners",
      "behaviors",
      "$",
    ]);

    if (u) {
      u.forEach((t) => {
        h.addon(this, t);
      });
    }

    if (r) {
      this.attachShadow({ mode: "open" });
    }

    let c = this.root;

    if (o) {
      c.innerHTML = o;
    }

    if ((a)) {
      let t = document.createElement("style");
      t.type = "text/css";
      t.textContent = a;
      c.insertBefore(t, c.firstChild);
    }

    if (r) {
      c.insertBefore(
        s.createStyleElement("theme://elements/panel-frame.css"),
        c.firstChild
      );
    }

    if (f) {
      for (let t in f) {
        if (this[`$${t}`]) {
          n.warn(`failed to assign selector $${t}, already used.`);
          continue;
        }
        let e = c.querySelector(f[t]);

        if (e) {
          this[`$${t}`] = e;
        } else {
          n.warn(`failed to query selector ${f[t]} to $${t}.`);
        }
      }
    }
    if (d) {
      for (let t in d) {
        if (c) {
          c.addEventListener(
            t,
            d[t].bind(this),
            "mousewheel" === t ? { passive: true } : {}
          );
        }

        this.addEventListener(
          t,
          d[t].bind(this),
          "mousewheel" === t ? { passive: true } : {}
        );
      }
    }
    if (this.messages) {
      let t = new l();
      for (let e in this.messages) {
        let i = this.messages[e];

        if (i && "function" == typeof i) {
          t.on(e, (t, ...e) => {
                i.apply(this, [t, ...e]);
              });
        } else {
          n.warn(
                `Failed to register ipc message ${e} in panel ${this.id}, function not provide.`
              );
        }
      }
      this._ipcListener = t;
    }

    if (i) {
      this.profiles = i;
    }

    if ((this._info.shortcuts)) {
      let t = [];
      let i = new e(this);
      t.push(i);
      for (let s in this._info.shortcuts) {
        if ("#" !== s[0]) {
          let t = this._info.shortcuts[s];
          let e = this[t];
          if (!e || "function" != typeof e) {
            n.warn(
              `Failed to register shortcut, cannot find method ${t} in panel ${this.id}.`
            );
            continue;
          }
          i.bind(s, e.bind(this));
          continue;
        }
        let r = c.querySelector(s);
        if (!r) {
          n.warn(
            `Failed to register shortcut for element ${s}, cannot find it.`
          );
          continue;
        }
        let o = this._info.shortcuts[s];
        let h = new e(r);
        t.push(h);
        for (let t in o) {
          let e = o[t];
          let i = this[e];

          if (i && "function" == typeof i) {
            h.bind(t, i.bind(this));
          } else {
            n.warn(
                  `Failed to register shortcut, cannot find method ${e} in panel ${this.id}.`
                );
          }
        }
      }
      this._mousetrapList = t;
    }
  }
  _loadLabelWidth() {
    a.sendToMain(
      "editor:query-label-width",
      this.getAttribute("id"),
      (t, e) => {
        this.labelWidth = e;
      }
    );
  }
  _registerEvent() {
    this.root.addEventListener("ui-prop-connected", (t) => {
      let e = t.detail;

      if (!(e.hasAttribute("subset") || "auto" === this.labelWidth)) {
        e.labelWidth = this.labelWidth;
      }

      Editor.UI.acceptEvent(t);
    });

    this.root.addEventListener("label-width-change", (t) => {
      let e = this.shadowRoot.querySelectorAll("ui-prop");
      for (let i of e) if (!i.hasAttribute("subset")) {
        i.labelWidth = t.detail;
      }
      this.labelWidth = t.detail;
      Editor.UI.acceptEvent(t);
    });

    this.root.addEventListener("label-width-change-finish", (t) => {
      a.sendToMain(
        "editor:update-label-width",
        this.getAttribute("id"),
        this.labelWidth
      );

      Editor.UI.acceptEvent(t);
    });
  }
};
