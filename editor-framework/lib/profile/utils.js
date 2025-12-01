const e = require("path");
const t = require("fs-extra");
const r = require("@base/electron-profile");
require("lodash/isEqual");
function a(e, t) {
  for (let r in t) if (void 0 !== e[r]) {
    if (i(t[r])) {
      if (!i(e[r])) {
        e[r] = {};
      }

      arguments.callee(e[r], t[r]);
    }
  } else {
    if (i(t[r]) || Array.isArray(t[r])) {
      e[r] = JSON.parse(JSON.stringify(t[r]));
    } else {
      e[r] = t[r];
    }
  }
}
function i(e) {
  return e && "object" == typeof e && !Array.isArray(e);
}

module.exports = {
  url2profile: Object.create(null),
  setDefaultData(e, t) {
    let a = r.load(e);
    let i = e.startsWith("default://");
    Object.keys(t).forEach((e) => {
      if (void 0 === a.get(e)) {
        a.set(e, t[e]);
      }

      if (!i) {
        a.save();
      }
    });
  },
  checkMigrate(r, a) {
    let i = e.basename(r);
    let o = e.join(a, i);
    if (t.existsSync(o)) {
      if (r.startsWith("global://")) {
        const r = e.join(a, "profiles");
        let s = e.join(r, i);

        if (!t.existsSync(s)) {
          t.copySync(o, s);
        }
      }
    } else
      {}
  },
  adaptProfile: (e) => (
    (e.getSelfData = function () {
      return this.get("", { type: "current" });
    }),
    (e.reload = function () {
      console.warn(
        "'profile.reload' has been deprecated, the all data is up to date"
      );
    }),
    (e.clear = function () {
      let e = this.getSelfData();
      Object.keys(e).forEach((e) => {
        this.remove(e);
      });
    }),
    (e.mergeData = function (e) {
      let t = this.getSelfData();
      a(t, e);

      Object.keys(t).forEach((e) => {
        this.set(e, t[e]);
      });
    }),
    e
  ),
};
