Object.defineProperty(exports, "__esModule", { value: true });
const vec2_1 = require("./vec2");
const vec3_1 = require("./vec3");
const mat3_1 = require("./mat3");
const mat4_1 = require("./mat4");
const quat_1 = require("./quat");
const _d2r = Math.PI / 180;
const _r2d = 180 / Math.PI;

const { PI, sqrt, pow, cos, acos, max } = Math;

const TWO_PI = 2 * Math.PI;
const HALF_PI = 0.5 * Math.PI;
const EPSILON = 1e-12;
const MACHINE_EPSILON = 1.12e-16; /* 112e-18 */
class EditorMath {
  static EPSILON = EPSILON;
  static MACHINE_EPSILON = MACHINE_EPSILON;
  static TWO_PI = TWO_PI;
  static HALF_PI = HALF_PI;
  static D2R = _d2r;
  static R2D = _r2d;
  static MVec2 = vec2_1.MVec2;
  static MVec3 = vec3_1.MVec3;
  static MMat3 = mat3_1.MMat3;
  static MMat4 = mat4_1.MMat4;
  static MQuat = quat_1.MQuat;
  static deg2rad(t) {
    return t * _d2r;
  }
  static rad2deg(t) {
    return t * _r2d;
  }
  static rad180(t) {
    return (t =
      t > Math.PI || t < -Math.PI
        ? (t + EditorMath.TWO_PI) % EditorMath.TWO_PI
        : t);
  }
  static rad360(t) {
    return t > EditorMath.TWO_PI
      ? t % EditorMath.TWO_PI
      : t < 0
      ? EditorMath.TWO_PI + (t % EditorMath.TWO_PI)
      : t;
  }
  static deg180(t) {
    return (t = t > 180 || t < -180 ? (t + 360) % 360 : t);
  }
  static deg360(t) {
    return t > 360 ? t % 360 : t < 0 ? 360 + (t % 360) : t;
  }
  static randomRange(t, a) {
    return Math.random() * (a - t) + t;
  }
  static randomRangeInt(t, a) {
    return Math.floor(this.randomRange(t, a));
  }
  static clamp = _clamp;
  static clamp01(t) {
    return t < 0 ? 0 : t > 1 ? 1 : t;
  }
  static calculateMaxRect(t, a, r, c, e) {
    var i = Math.min(a.x, r.x, c.x, e.x);
    var s = Math.max(a.x, r.x, c.x, e.x);
    var M = Math.min(a.y, r.y, c.y, e.y);
    var a = Math.max(a.y, r.y, c.y, e.y);
    t.x = i;
    t.y = M;
    t.width = s - i;
    t.height = a - M;
    return t;
  }
  static lerp(t, a, r) {
    return t + (a - t) * r;
  }
  static numOfDecimals(t) {
    return this.clamp(Math.floor(Math.log10(t)), 0, 20);
  }
  static numOfDecimalsF(t) {
    return this.clamp(-Math.floor(Math.log10(t)), 0, 20);
  }
  static toPrecision(t, a) {
    a = this.clamp(a, 0, 20);
    return parseFloat(t.toFixed(a));
  }
  static bezier(t, a, r, c, e) {
    var i = 1 - e;
    return (
      t * i * i * i + 3 * a * i * i * e + 3 * r * i * e * e + c * e * e * e
    );
  }
  static solveCubicBezier(t, a, r, c, e) {
    c -= t;
    return _cardano(
      +(e = (e - t) / c),
      e - (a - t) / c,
      e - (r - t) / c,
      e - 1
    );
  }
}
function _clamp(t, a, r) {
  return t < a ? a : r < t ? r : t;
}
function _crt(t) {
  return t < 0 ? -pow(-t, 1 / 3) : pow(t, 1 / 3);
}
function _cardano(t, a, r, c) {
  var c = 3 * a - t - 3 * r + c;
  var r = (3 * t - 6 * a + 3 * r) / c;
  var a = (-3 * t + 3 * a) / c;
  var e = (3 * a - r * r) / 3;
  var i = e / 3;
  var a = (2 * r * r * r - 9 * r * a + 27 * (t / c)) / 27;
  var t = a / 2;
  var c = t * t + i * i * i;
  let s;
  let M;
  let o;
  let _;
  let n;

  if (c < 0) {
    e = (i = -e / 3) * i * i;
    e = (a = -a / (2 * (i = sqrt(e)))) < -1 ? -1 : a > 1 ? 1 : a;
    a = acos(e);
    e = 2 * _crt(i);
    o = e * cos(a / 3) - r / 3;
    _ = e * cos((a + 2 * PI) / 3) - r / 3;
    n = e * cos((a + 4 * PI) / 3) - r / 3;

    return o >= 0 && o <= 1
      ? _ >= 0 && _ <= 1
        ? n >= 0 && n <= 1
          ? max(o, _, n)
          : max(o, _)
        : n >= 0 && n <= 1
        ? max(o, n)
        : o
      : _ >= 0 && _ <= 1
      ? n >= 0 && n <= 1
        ? max(_, n)
        : _
      : n;
  }

  if (c == 0) {
    s = t < 0 ? _crt(-t) : -_crt(t);
    o = 2 * s - r / 3;
    _ = -s - r / 3;
    return o >= 0 && o <= 1 ? (_ >= 0 && _ <= 1 ? max(o, _) : o) : _;
  }

  i = sqrt(c);
  s = _crt(i - t);
  M = _crt(i + t);
  o = s - M - r / 3;
  return o;
}
exports.default = EditorMath;
