"use strict";
const e = require("./platform");
let t;
function r(e, t, r) {
  let n = (function e(t, r) {
    if (!t) {
      return null;
    }
    return (
      Object.getOwnPropertyDescriptor(t, r) || e(Object.getPrototypeOf(t), r)
    );
  })(t, e);
  Object.defineProperty(r, e, n);
}

t = e.isMainProcess
  ? require("../main/console")
  : require("../renderer/console");

module.exports = {
    copyprop: r,
    assign(e, ...n) {
      e = e || {};
      for (let o = 0; o < n.length; o++) {
        let l = n[o];
        if (l) {
          if ("object" != typeof l) {
            t.error("JS.assign called on non-object:", l);
            continue;
          }
          for (let t in l) r(t, l, e);
        }
      }
      return e;
    },
    assignExcept(e, n, o) {
      e = e || {};
      if ("object" != typeof n) {
        t.error("JS.assignExcept called on non-object:", n);
        return null;
      }
      for (let t in n) if (-1 === o.indexOf(t)) {
        r(t, n, e);
      }
      return e;
    },
    addon(e, ...t) {
      e = e || {};
      for (let n = 0; n < t.length; ++n) {
        let o = t[n];
        for (let t in o) if (!(t in e)) {
          r(t, o, e);
        }
      }
      return e;
    },
    extract(e, t) {
      let n = {};
      for (let o = 0; o < t.length; ++o) {
        let l = t[o];

        if (void 0 !== e[l]) {
          r(l, e, n);
        }
      }
      return n;
    },
    extend(e, r) {
      if (!r) {
        t.error("The base class to extend from must be non-nil");
        return;
      }
      if (!e) {
        t.error("The class to extend must be non-nil");
        return;
      }
      for (var n in r) if (r.hasOwnProperty(n)) {
        e[n] = r[n];
      }
      function o() {
        this.constructor = e;
      }
      o.prototype = r.prototype;
      e.prototype = new o();
      return e;
    },
    clear(e) {
      let t = Object.keys(e);
      for (let r = 0; r < t.length; r++) {
        delete e[t[r]];
      }
    },
    getPropertyByPath(e, t) {
      if (!e) {
        return null;
      }
      if (-1 === t.indexOf(".")) {
        return e[t];
      }
      let r = t.split(".");
      let n = e;
      for (let e = 0; e < r.length; e++) {
        if (!(n = n[r[e]])) {
          return null;
        }
      }
      return n;
    },
  };
