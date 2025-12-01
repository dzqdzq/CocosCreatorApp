"use strict";
let e = {
  padLeft: (e, t, r) =>
    (t -= (e = e.toString()).length) > 0 ? new Array(t + 1).join(r) + e : e,
  toFixed(e, t, r) {
    let o = Math.pow(10, t);
    let l = (Math.round(e * o) / o).toFixed(t);
    if (r) {
      let e = new RegExp("0{1," + r + "}$");
      l = l.replace(e, "");

      if (r >= t && "." === l[l.length - 1]) {
        l = l.slice(0, -1);
      }
    }
    return l;
  },
  formatFrame(t, r) {
    let o = Math.floor(Math.log10(r)) + 1;
    let l = "";

    if (t < 0) {
      l = "-";
      t = -t;
    }

    return l + Math.floor(t / r) + ":" + e.padLeft(t % r, o, "0");
  },
  smoothScale(e, t) {
    let r = e;
    return (r = Math.pow(2, 0.002 * t) * r);
  },
  wrapError: (e) => ({
    __error__: true,
    stack: e.stack,
    message: e.message,
    code: e.code,
    errno: e.errno,
    syscall: e.syscall,
  }),
  arrayCmpFilter(e, t) {
    let r = [];
    for (let o = 0; o < e.length; ++o) {
      let l = e[o];
      let a = true;
      for (let e = 0; e < r.length; ++e) {
        let o = r[e];
        if (l === o) {
          a = false;
          break;
        }
        let n = t(o, l);
        if (n > 0) {
          a = false;
          break;
        }

        if (n < 0) {
          r.splice(e, 1);
          --e;
        }
      }

      if (a) {
        r.push(l);
      }
    }
    return r;
  },
  fitSize(e, t, r, o) {
    let l;
    let a;

    if (e > r && t > o) {
      l = r;

      if ((a = (t * r) / e) > o) {
        a = o;
        l = (e * o) / t;
      }
    } else {
      if (e > r) {
        l = r;
        a = (t * r) / e;
      } else {
        if (t > o) {
          l = (e * o) / t;
          a = o;
        } else {
          l = e;
          a = t;
        }
      }
    }

    return [l, a];
  },
  prettyBytes(e) {
    if ("number" != typeof e || Number.isNaN(e)) {
      throw new TypeError("Expected a number, got " + typeof e);
    }
    let t = e < 0;
    let r = ["B", "kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    if (t) {
      e = -e;
    }

    if (e < 1) {
      return (t ? "-" : "") + e + " B";
    }
    let o = Math.min(Math.floor(Math.log(e) / Math.log(1e3)), r.length - 1);
    e = Number((e / Math.pow(1e3, o)).toFixed(2));
    return `${t ? "-" : ""}${e} ${r[o]}`;
  },
  run(e, ...t) {
    (0, require("child_process").spawn)(e, t, { detached: true }).unref();
  },
};
module.exports = e;
