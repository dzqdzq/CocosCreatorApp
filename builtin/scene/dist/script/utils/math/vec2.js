Object.defineProperty(exports, "__esModule", { value: true });
exports.MVec2 = undefined;
const cc_1 = require("cc");
const utils_1 = require("./utils");

const { random } = utils_1;

let _x = 0;
let _y = 0;
const v2_1 = new cc_1.Vec2();
const v2_2 = new cc_1.Vec2();
class MVec2 {
  static ZERO = Object.freeze(new cc_1.Vec2(0, 0));
  static ONE = Object.freeze(new cc_1.Vec2(1, 1));
  static NEG_ONE = Object.freeze(new cc_1.Vec2(-1, -1));
  static UNIT_X = Object.freeze(new cc_1.Vec2(1, 0));
  static UNIT_Y = Object.freeze(new cc_1.Vec2(0, 1));
  static clone(t) {
    return new cc_1.Vec2(t.x, t.y);
  }
  static copy(t, e) {
    t.x = e.x;
    t.y = e.y;
    return t;
  }
  static set(t, e, r) {
    t.x = e;
    t.y = r;
    return t;
  }
  static add(t, e, r) {
    t.x = e.x + r.x;
    t.y = e.y + r.y;
    return t;
  }
  static subtract(t, e, r) {
    t.x = e.x - r.x;
    t.y = e.y - r.y;
    return t;
  }
  static multiply(t, e, r) {
    t.x = e.x * r.x;
    t.y = e.y * r.y;
    return t;
  }
  static divide(t, e, r) {
    t.x = e.x / r.x;
    t.y = e.y / r.y;
    return t;
  }
  static ceil(t, e) {
    t.x = Math.ceil(e.x);
    t.y = Math.ceil(e.y);
    return t;
  }
  static floor(t, e) {
    t.x = Math.floor(e.x);
    t.y = Math.floor(e.y);
    return t;
  }
  static min(t, e, r) {
    t.x = Math.min(e.x, r.x);
    t.y = Math.min(e.y, r.y);
    return t;
  }
  static max(t, e, r) {
    t.x = Math.max(e.x, r.x);
    t.y = Math.max(e.y, r.y);
    return t;
  }
  static round(t, e) {
    t.x = Math.round(e.x);
    t.y = Math.round(e.y);
    return t;
  }
  static multiplyScalar(t, e, r) {
    t.x = e.x * r;
    t.y = e.y * r;
    return t;
  }
  static scaleAndAdd(t, e, r, a) {
    t.x = e.x + r.x * a;
    t.y = e.y + r.y * a;
    return t;
  }
  static distance(t, e) {
    _x = e.x - t.x;
    _y = e.y - t.y;
    return Math.sqrt(_x * _x + _y * _y);
  }
  static squaredDistance(t, e) {
    _x = e.x - t.x;
    _y = e.y - t.y;
    return _x * _x + _y * _y;
  }
  static len(t) {
    _x = t.x;
    _y = t.y;
    return Math.sqrt(_x * _x + _y * _y);
  }
  static lengthSqr(t) {
    _x = t.x;
    _y = t.y;
    return _x * _x + _y * _y;
  }
  static negate(t, e) {
    t.x = -e.x;
    t.y = -e.y;
    return t;
  }
  static inverse(t, e) {
    t.x = 1 / e.x;
    t.y = 1 / e.y;
    return t;
  }
  static inverseSafe(t, e) {
    _x = e.x;
    _y = e.y;

    if (Math.abs(_x) < utils_1.EPSILON) {
      t.x = 0;
    } else {
      t.x = 1 / _x;
    }

    if (Math.abs(_y) < utils_1.EPSILON) {
      t.y = 0;
    } else {
      t.y = 1 / _y;
    }

    return t;
  }
  static normalize(t, e) {
    _x = e.x;
    _y = e.y;
    e = _x * _x + _y * _y;

    if (e > 0) {
      e = 1 / Math.sqrt(e);
      t.x = _x * e;
      t.y = _y * e;
    }

    return t;
  }
  static dot(t, e) {
    return t.x * e.x + t.y * e.y;
  }
  static cross(t, e, r) {
    t.x = 0;
    t.y = 0;
    t.z = e.x * r.y - e.y * r.x;
    return t;
  }
  static lerp(t, e, r, a) {
    _x = e.x;
    _y = e.y;
    t.x = _x + a * (r.x - _x);
    t.y = _y + a * (r.y - _y);
    return t;
  }
  static random(t, e) {
    e = e || 1;
    var r = 2 * random() * Math.PI;
    t.x = Math.cos(r) * e;
    t.y = Math.sin(r) * e;
    return t;
  }
  static transformMat3(t, e, r) {
    _x = e.x;
    _y = e.y;
    t.x = r.m00 * _x + r.m03 * _y + r.m06;
    t.y = r.m01 * _x + r.m04 * _y + r.m07;
    return t;
  }
  static transformMat4(t, e, r) {
    _x = e.x;
    _y = e.y;
    t.x = r.m00 * _x + r.m04 * _y + r.m12;
    t.y = r.m01 * _x + r.m05 * _y + r.m13;
    return t;
  }
  static str(t) {
    return `Vec2(${t.x}, ${t.y})`;
  }
  static toArray(t, e, r = 0) {
    t[r + 0] = e.x;
    t[r + 1] = e.y;
    return t;
  }
  static fromArray(t, e, r = 0) {
    t.x = e[r + 0];
    t.y = e[r + 1];
    return t;
  }
  static strictEquals(t, e) {
    return t.x === e.x && t.y === e.y;
  }
  static equals(t, e, r = utils_1.EPSILON) {
    return (
      Math.abs(t.x - e.x) <= r * Math.max(1, Math.abs(t.x), Math.abs(e.x)) &&
      Math.abs(t.y - e.y) <= r * Math.max(1, Math.abs(t.y), Math.abs(e.y))
    );
  }
  static angle(t, e) {
    cc_1.Vec2.normalize(v2_1, t);
    cc_1.Vec2.normalize(v2_2, e);
    t = cc_1.Vec2.dot(v2_1, v2_2);
    return t > 1 ? 0 : t < -1 ? Math.PI : Math.acos(t);
  }
}
exports.MVec2 = MVec2;
