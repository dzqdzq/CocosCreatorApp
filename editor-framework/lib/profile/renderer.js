"use strict";
require("fire-path");
const e = require("electron");
const t = require("@base/electron-profile");
const { EventEmitter: r } = require("events");
const { checkMigrate: o, adaptProfile: l, url2profile: a } = require("./utils");
const i = e.remote.getGlobal("__Profile__");
t.on("change", (e) => {
  let t = a[e];

  if (t) {
    t.emit("changed");
  }
});

module.exports = new (class extends r {
  load(e, r) {
    let n;
    let s = null;
    try {
      if ((n = a[e])) {
        return n;
      }
      o(e, Editor.remote.App.home);

      if ((n = t.load(e))) {
        n = l(n);

        Object.defineProperty(n, "data", {
          get() {
            console.warn(
              `'${this._type}/${this._file} data' has been deprecated, please use 'profile.get'`
            );

            return i.getData(this._type, this._file);
          },
        });
      }

      a[e] = n;
    } catch (e) {
      s = e;
      console.error(e);
    }

    if (r) {
      console.warn(
          "'Editor.Profile.load' async changed to sync, don't need callback."
        );

      r(s, n);
    }

    return n;
  }
})();
