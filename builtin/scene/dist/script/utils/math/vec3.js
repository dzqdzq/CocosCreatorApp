Object.defineProperty(exports, "__esModule", { value: true });
exports.MVec3 = undefined;
const cc_1 = require("cc");
const utils_1 = require("./utils");

const { random } = utils_1;

let _x = 0;
let _y = 0;
let _z = 0;
const v3_1 = new cc_1.Vec3();
const v3_2 = new cc_1.Vec3();
class MVec3 {
  static UNIT_X = Object.freeze(new cc_1.Vec3(1, 0, 0));
  static UNIT_Y = Object.freeze(new cc_1.Vec3(0, 1, 0));
  static UNIT_Z = Object.freeze(new cc_1.Vec3(0, 0, 1));
  static ZERO = Object.freeze(new cc_1.Vec3(0, 0, 0));
  static ONE = Object.freeze(new cc_1.Vec3(1, 1, 1));
  static NEG_ONE = Object.freeze(new cc_1.Vec3(-1, -1, -1));
  static zero(t) {
    t.x = 0;
    t.y = 0;
    t.z = 0;
    return t;
  }
  static clone(t) {
    return new cc_1.Vec3(t.x, t.y, t.z);
  }
  static copy(t, x) {
    t.x = x.x;
    t.y = x.y;
    t.z = x.z;
    return t;
  }
  static set(t, x, r, z) {
    t.x = x;
    t.y = r;
    t.z = z;
    return t;
  }
  static add(t, x, r) {
    t.x = x.x + r.x;
    t.y = x.y + r.y;
    t.z = x.z + r.z;
    return t;
  }
  static subtract(t, x, r) {
    t.x = x.x - r.x;
    t.y = x.y - r.y;
    t.z = x.z - r.z;
    return t;
  }
  static multiply(t, x, r) {
    t.x = x.x * r.x;
    t.y = x.y * r.y;
    t.z = x.z * r.z;
    return t;
  }
  static divide(t, x, r) {
    t.x = x.x / r.x;
    t.y = x.y / r.y;
    t.z = x.z / r.z;
    return t;
  }
  static ceil(t, x) {
    t.x = Math.ceil(x.x);
    t.y = Math.ceil(x.y);
    t.z = Math.ceil(x.z);
    return t;
  }
  static floor(t, x) {
    t.x = Math.floor(x.x);
    t.y = Math.floor(x.y);
    t.z = Math.floor(x.z);
    return t;
  }
  static min(t, x, r) {
    t.x = Math.min(x.x, r.x);
    t.y = Math.min(x.y, r.y);
    t.z = Math.min(x.z, r.z);
    return t;
  }
  static max(t, x, r) {
    t.x = Math.max(x.x, r.x);
    t.y = Math.max(x.y, r.y);
    t.z = Math.max(x.z, r.z);
    return t;
  }
  static round(t, x) {
    t.x = Math.round(x.x);
    t.y = Math.round(x.y);
    t.z = Math.round(x.z);
    return t;
  }
  static multiplyScalar(t, x, r) {
    t.x = x.x * r;
    t.y = x.y * r;
    t.z = x.z * r;
    return t;
  }
  static scaleAndAdd(t, x, r, z) {
    t.x = x.x + r.x * z;
    t.y = x.y + r.y * z;
    t.z = x.z + r.z * z;
    return t;
  }
  static distance(t, x) {
    _x = x.x - t.x;
    _y = x.y - t.y;
    _z = x.z - t.z;
    return Math.sqrt(_x * _x + _y * _y + _z * _z);
  }
  static squaredDistance(t, x) {
    _x = x.x - t.x;
    _y = x.y - t.y;
    _z = x.z - t.z;
    return _x * _x + _y * _y + _z * _z;
  }
  static len(t) {
    _x = t.x;
    _y = t.y;
    _z = t.z;
    return Math.sqrt(_x * _x + _y * _y + _z * _z);
  }
  static lengthSqr(t) {
    _x = t.x;
    _y = t.y;
    _z = t.z;
    return _x * _x + _y * _y + _z * _z;
  }
  static negate(t, x) {
    t.x = -x.x;
    t.y = -x.y;
    t.z = -x.z;
    return t;
  }
  static invert(t, x) {
    t.x = 1 / x.x;
    t.y = 1 / x.y;
    t.z = 1 / x.z;
    return t;
  }
  static invertSafe(t, x) {
    _x = x.x;
    _y = x.y;
    _z = x.z;

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

    if (Math.abs(_z) < utils_1.EPSILON) {
      t.z = 0;
    } else {
      t.z = 1 / _z;
    }

    return t;
  }
  static normalize(t, x) {
    _x = x.x;
    _y = x.y;
    _z = x.z;
    x = _x * _x + _y * _y + _z * _z;

    if (x > 0) {
      x = 1 / Math.sqrt(x);
      t.x = _x * x;
      t.y = _y * x;
      t.z = _z * x;
    }

    return t;
  }
  static dot(t, x) {
    return t.x * x.x + t.y * x.y + t.z * x.z;
  }
  static cross(t, x, r) {
    var { x, y: y_1, z } = x;
    var { x: r, y, z: z_1 } = r;
    t.x = y_1 * z_1 - z * y;
    t.y = z * r - x * z_1;
    t.z = x * y - y_1 * r;
    return t;
  }
  static lerp(t, x, r, z) {
    t.x = x.x + z * (r.x - x.x);
    t.y = x.y + z * (r.y - x.y);
    t.z = x.z + z * (r.z - x.z);
    return t;
  }
  static random(t, x) {
    x = x || 1;
    var r = 2 * random() * Math.PI;
    var z = 2 * random() - 1;
    var y = Math.sqrt(1 - z * z);
    t.x = y * Math.cos(r) * x;
    t.y = y * Math.sin(r) * x;
    t.z = z * x;
    return t;
  }
  static transformMat4(t, x, r) {
    _x = x.x;
    _y = x.y;
    _z = x.z;
    x = (x = r.m03 * _x + r.m07 * _y + r.m11 * _z + r.m15) ? 1 / x : 1;
    t.x = (r.m00 * _x + r.m04 * _y + r.m08 * _z + r.m12) * x;
    t.y = (r.m01 * _x + r.m05 * _y + r.m09 * _z + r.m13) * x;
    t.z = (r.m02 * _x + r.m06 * _y + r.m10 * _z + r.m14) * x;
    return t;
  }
  static transformMat4Normal(t, x, r) {
    _x = x.x;
    _y = x.y;
    _z = x.z;
    x = (x = r.m03 * _x + r.m07 * _y + r.m11 * _z) ? 1 / x : 1;
    t.x = (r.m00 * _x + r.m04 * _y + r.m08 * _z) * x;
    t.y = (r.m01 * _x + r.m05 * _y + r.m09 * _z) * x;
    t.z = (r.m02 * _x + r.m06 * _y + r.m10 * _z) * x;
    return t;
  }
  static transformMat3(t, x, r) {
    _x = x.x;
    _y = x.y;
    _z = x.z;
    t.x = _x * r.m00 + _y * r.m03 + _z * r.m06;
    t.y = _x * r.m01 + _y * r.m04 + _z * r.m07;
    t.z = _x * r.m02 + _y * r.m05 + _z * r.m08;
    return t;
  }
  static transformAffine(t, x, r) {
    _x = x.x;
    _y = x.y;
    _z = x.z;
    t.x = r.m00 * _x + r.m01 * _y + r.m02 * _z + r.m03;
    t.y = r.m04 * _x + r.m05 * _y + r.m06 * _z + r.m07;
    t.x = r.m08 * _x + r.m09 * _y + r.m10 * _z + r.m11;
    return t;
  }
  static transformQuat(t, x, r) {
    var z = r.w * x.x + r.y * x.z - r.z * x.y;
    var y = r.w * x.y + r.z * x.x - r.x * x.z;
    var a = r.w * x.z + r.x * x.y - r.y * x.x;
    var x = -r.x * x.x - r.y * x.y - r.z * x.z;
    t.x = z * r.w + x * -r.x + y * -r.z - a * -r.y;
    t.y = y * r.w + x * -r.y + a * -r.x - z * -r.z;
    t.z = a * r.w + x * -r.z + z * -r.y - y * -r.x;
    return t;
  }
  static transformRTS(t, x, r, z, y) {
    var a = x.x * y.x;
    var _ = x.y * y.y;
    var x = x.z * y.z;
    var y = r.w * a + r.y * x - r.z * _;
    var e = r.w * _ + r.z * a - r.x * x;
    var c = r.w * x + r.x * _ - r.y * a;
    var a = -r.x * a - r.y * _ - r.z * x;
    t.x = y * r.w + a * -r.x + e * -r.z - c * -r.y + z.x;
    t.y = e * r.w + a * -r.y + c * -r.x - y * -r.z + z.y;
    t.z = c * r.w + a * -r.z + y * -r.y - e * -r.x + z.z;
    return t;
  }
  static transformInverseRTS(t, x, r, z, y) {
    var a = x.x - z.x;
    var _ = x.y - z.y;
    var x = x.z - z.z;
    var z = r.w * a - r.y * x + r.z * _;
    var e = r.w * _ - r.z * a + r.x * x;
    var c = r.w * x - r.x * _ + r.y * a;
    var a = r.x * a + r.y * _ + r.z * x;
    t.x = (z * r.w + a * r.x + e * r.z - c * r.y) / y.x;
    t.y = (e * r.w + a * r.y + c * r.x - z * r.z) / y.y;
    t.z = (c * r.w + a * r.z + z * r.y - e * r.x) / y.z;
    return t;
  }
  static rotateX(t, x, r, z) {
    _x = x.x - r.x;
    _y = x.y - r.y;
    _z = x.z - r.z;
    var x = Math.cos(z);
    var z = Math.sin(z);
    var y = _x;
    var a = _y * x - _z * z;
    var z = _y * z + _z * x;
    t.x = y + r.x;
    t.y = a + r.y;
    t.z = z + r.z;
    return t;
  }
  static rotateY(t, x, r, z) {
    _x = x.x - r.x;
    _y = x.y - r.y;
    _z = x.z - r.z;
    var x = Math.cos(z);
    var z = Math.sin(z);
    var y = _z * z + _x * x;
    var a = _y;
    var x = _z * x - _x * z;
    t.x = y + r.x;
    t.y = a + r.y;
    t.z = x + r.z;
    return t;
  }
  static rotateZ(t, x, r, z) {
    _x = x.x - r.x;
    _y = x.y - r.y;
    _z = x.z - r.z;
    var x = Math.cos(z);
    var z = Math.sin(z);
    var y = _x * x - _y * z;
    var z = _x * z + _y * x;
    var x = _z;
    t.x = y + r.x;
    t.y = z + r.y;
    t.z = x + r.z;
    return t;
  }
  static toArray(t, x, r = 0) {
    t[r + 0] = x.x;
    t[r + 1] = x.y;
    t[r + 2] = x.z;
    return t;
  }
  static fromArray(t, x, r = 0) {
    t.x = x[r + 0];
    t.y = x[r + 1];
    t.z = x[r + 2];
    return t;
  }
  static strictEquals(t, x) {
    return t.x === x.x && t.y === x.y && t.z === x.z;
  }
  static equals(t, x, r = utils_1.EPSILON) {
    var { x: t, y: y_1, z } = t;
    var { x, y, z: z_1 } = x;
    return (
      Math.abs(t - x) <= r * Math.max(1, Math.abs(t), Math.abs(x)) &&
      Math.abs(y_1 - y) <= r * Math.max(1, Math.abs(y_1), Math.abs(y)) &&
      Math.abs(z - z_1) <= r * Math.max(1, Math.abs(z), Math.abs(z_1))
    );
  }
  static angle(t, x) {
    MVec3.normalize(v3_1, t);
    MVec3.normalize(v3_2, x);
    t = MVec3.dot(v3_1, v3_2);
    return t > 1 ? 0 : t < -1 ? Math.PI : Math.acos(t);
  }
  static projectOnPlane(t, x, r) {
    return MVec3.subtract(t, x, MVec3.project(t, x, r));
  }
  static project(t, x, r) {
    var z = MVec3.lengthSqr(r);
    return z < 0.000001 /* 1e-6 */
      ? MVec3.set(t, 0, 0, 0)
      : MVec3.multiplyScalar(t, r, MVec3.dot(x, r) / z);
  }
}
exports.MVec3 = MVec3;
