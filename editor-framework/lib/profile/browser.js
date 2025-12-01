"use strict";
const { EventEmitter: e } = require("events");
const r = require("@base/electron-profile");
const t = require("@base/electron-profile/lib/browser/data");
let o = {
  getData(e, o) {
    const a = s.join(r._type2path[e], o);
    return t.get()[a];
  },
};
global.__Profile__ = o;
const app = require("../app");
const s = require("path");
const i = require("fs-extra");

const {
  checkMigrate: l,
  adaptProfile: n,
  setDefaultData: u,
  url2profile: c,
} = require("./utils");

module.exports = new (class extends e {
  query(e) {
    return r.query(e);
  }
  register(e, t) {
    r.register(e, t);
  }
  clear() {
    r.clear();
  }
  inherit(e, t) {
    r.inherit(e, t);
  }
  reset() {
    console.warn(
      "'Editor.Profile.reset' has been deprecated, please use 'Editor.Profile.clear'."
    );

    r.clear();
  }
  getPath(e) {
    console.warn(
      "'Editor.Profile.getPath' has been deprecated, please use 'Editor.Profile.query'."
    );

    return r.query(e);
  }
  setDefault(e, r) {
    console.warn(
      "'Editor.Profile.setDefault' has been deprecated. please use profile.set(key, value)."
    );

    u(e, r);
  }
  load(e, t) {
    try {
      let s = c[e];
      return (s || (l(e, app.home), (s = r.load(e)) &&
        ((s = n(s)),
        t && u(e, t),
        Object.defineProperty(s, "data", {
          get() {
            console.warn(
              `'${this._type}/${this._file} data' has been deprecated, please use 'profile.get'`
            );

            return o.getData(this._type, this._file);
          },
        })), (c[e] = s), s));
    } catch (e) {
      console.error(e);
      return null;
    }
  }
  mount(e, r) {
    u(e, r);
  }
})();

r.on("change", (e) => {
  let r = c[e];

  if (r) {
    r.emit("changed");
  }
});

if (
  (s.isAbsolute(app.home))
) {
  const e = s.join(app.home, "default-profiles");
  i.ensureDirSync(e);
  r.register("default", e);
  const t = s.join(app.home, "profiles");
  i.ensureDirSync(t);
  r.register("global", t);
}
r.inherit("global", "default");

(function () {
  try {
    const e = s.join(app.home, "profiles");
    let r = s.join(e, "layout.windows.json");
    let t = s.join(e, "layout.dashboard.json");

    if (!i.existsSync(t) && i.existsSync(r)) {
      i.renameSync(r, t);
    }
  } catch (e) {
    console.error(e);
  }
})();
