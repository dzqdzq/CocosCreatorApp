"use strict";
const t = Math.PI / 180;
const a = 180 / Math.PI;
const e = Math.PI;
const r = 2 * Math.PI;
const n = 0.5 * Math.PI;
let o = Math.sqrt;
let h = Math.pow;
let l = Math.cos;
let M = Math.acos;
let c = Math.max;

let m = {
  EPSILON: 1e-12,
  MACHINE_EPSILON: 1.12e-16,
  TWO_PI: r,
  HALF_PI: n,
  D2R: t,
  R2D: a,
  deg2rad: (a) => a * t,
  rad2deg: (t) => t * a,
  rad180: (t) => (
    (t > Math.PI || t < -Math.PI) && (t = (t + m.TOW_PI) % m.TOW_PI), t
  ),
  rad360: (t) =>
    t > m.TWO_PI ? t % m.TOW_PI : t < 0 ? m.TOW_PI + (t % m.TOW_PI) : t,
  deg180: (t) => ((t > 180 || t < -180) && (t = (t + 360) % 360), t),
  deg360: (t) => (t > 360 ? t % 360 : t < 0 ? 360 + (t % 360) : t),
  randomRange: (t, a) => Math.random() * (a - t) + t,
  randomRangeInt: (t, a) => Math.floor(m.randomRange(t, a)),
  clamp: function (t, a, e) {
    return t < a ? a : t > e ? e : t;
  },
  clamp01: (t) => (t < 0 ? 0 : t > 1 ? 1 : t),
  calculateMaxRect(t, a, e, r, n) {
    let o = Math.min(a.x, e.x, r.x, n.x);
    let h = Math.max(a.x, e.x, r.x, n.x);
    let l = Math.min(a.y, e.y, r.y, n.y);
    let M = Math.max(a.y, e.y, r.y, n.y);
    t.x = o;
    t.y = l;
    t.width = h - o;
    t.height = M - l;
    return t;
  },
  lerp: (t, a, e) => t + (a - t) * e,
  numOfDecimals: (t) => m.clamp(Math.floor(Math.log10(t)), 0, 20),
  numOfDecimalsF: (t) => m.clamp(-Math.floor(Math.log10(t)), 0, 20),
  toPrecision: (t, a) => ((a = m.clamp(a, 0, 20)), parseFloat(t.toFixed(a))),
  bezier(t, a, e, r, n) {
    let o = 1 - n;
    return (
      t * o * o * o + 3 * a * o * o * n + 3 * e * o * n * n + r * n * n * n
    );
  },
  solveCubicBezier(t, a, r, n, h) {
    let m = n - t;
    return (function (t, a, r, n) {
      let h;
      let m;
      let i;
      let P;
      let u;
      let d = 3 * a - t - 3 * r + n;
      let x = (3 * t - 6 * a + 3 * r) / d;
      let s = (-3 * t + 3 * a) / d;
      let O = (3 * s - x * x) / 3;
      let f = O / 3;
      let g = (2 * x * x * x - 9 * x * s + (t / d) * 27) / 27;
      let p = g / 2;
      let y = p * p + f * f * f;
      if (y < 0) {
        let t = -O / 3;
        let a = t * t * t;
        let r = o(a);
        let n = -g / (2 * r);
        let h = n < -1 ? -1 : n > 1 ? 1 : n;
        let m = M(h);
        let d = I(r);
        let s = 2 * d;
        i = s * l(m / 3) - x / 3;
        P = s * l((m + 2 * e) / 3) - x / 3;
        u = s * l((m + 4 * e) / 3) - x / 3;
        return 0 <= i && i <= 1
          ? 0 <= P && P <= 1
            ? 0 <= u && u <= 1
              ? c(i, P, u)
              : c(i, P)
            : 0 <= u && u <= 1
            ? c(i, u)
            : i
          : 0 <= P && P <= 1
          ? 0 <= u && u <= 1
            ? c(P, u)
            : P
          : u;
      }
      if (0 === y) {
        h = p < 0 ? I(-p) : -I(p);
        P = -h - x / 3;
        return 0 <= (i = 2 * h - x / 3) && i <= 1
          ? 0 <= P && P <= 1
            ? c(i, P)
            : i
          : P;
      }
      {
        let t = o(y);
        h = I(t - p);
        m = I(t + p);
        return (i = h - m - x / 3);
      }
    })((h = (h - t) / m) - 0, h - (a - t) / m, h - (r - t) / m, h - 1);
  },
};

function I(t) {
  return t < 0 ? -h(-t, 1 / 3) : h(t, 1 / 3);
}
module.exports = m;
