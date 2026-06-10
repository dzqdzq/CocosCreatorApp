Object.defineProperty(exports, "__esModule", { value: true });
exports.MQuat = undefined;
const cc_1 = require("cc");
const utils_1 = require("./utils");

const { toDegree } = utils_1;

const vec3_1 = require("./vec3");
let _x = 0;
let _y = 0;
let _z = 0;
let _w = 0;
const qt_1 = new cc_1.Quat();
const qt_2 = new cc_1.Quat();
const v3_1 = new cc_1.Vec3();
const m3_1 = new cc_1.Mat3();
const halfToRad = (0.5 * Math.PI) / 180;
class MQuat {
  static IDENTITY = Object.freeze(new cc_1.Quat());
  static clone(t) {
    return new cc_1.Quat(t.x, t.y, t.z, t.w);
  }
  static copy(t, a) {
    t.x = a.x;
    t.y = a.y;
    t.z = a.z;
    t.w = a.w;
    return t;
  }
  static set(t, a, r, e, c) {
    t.x = a;
    t.y = r;
    t.z = e;
    t.w = c;
    return t;
  }
  static identity(t) {
    t.x = 0;
    t.y = 0;
    t.z = 0;
    t.w = 1;
    return t;
  }
  static rotationTo(t, a, r) {
    var e = vec3_1.MVec3.dot(a, r);

    if (e < -0.999999) {
      vec3_1.MVec3.cross(v3_1, vec3_1.MVec3.UNIT_X, a);

      v3_1.length() < 0.000001 /* 1e-6 */ &&
        vec3_1.MVec3.cross(v3_1, vec3_1.MVec3.UNIT_Y, a);

      vec3_1.MVec3.normalize(v3_1, v3_1);
      cc_1.Quat.fromAxisAngle(t, v3_1, Math.PI);
      return t;
    }

    if (e > 0.999999) {
      t.x = 0;
      t.y = 0;
      t.z = 0;
      t.w = 1;
      return t;
    }

    vec3_1.MVec3.cross(v3_1, a, r);
    t.x = v3_1.x;
    t.y = v3_1.y;
    t.z = v3_1.z;
    t.w = 1 + e;
    return cc_1.Quat.normalize(t, t);
  }
  static getAxisAngle(t, a) {
    var r = 2 * Math.acos(a.w);
    var e = Math.sin(r / 2);

    if (e !== 0) {
      t.x = a.x / e;
      t.y = a.y / e;
      t.z = a.z / e;
    } else {
      t.x = 1;
      t.y = 0;
      t.z = 0;
    }

    return r;
  }
  static multiply(t, a, r) {
    _x = a.x * r.w + a.w * r.x + a.y * r.z - a.z * r.y;
    _y = a.y * r.w + a.w * r.y + a.z * r.x - a.x * r.z;
    _z = a.z * r.w + a.w * r.z + a.x * r.y - a.y * r.x;
    _w = a.w * r.w - a.x * r.x - a.y * r.y - a.z * r.z;
    t.x = _x;
    t.y = _y;
    t.z = _z;
    t.w = _w;
    return t;
  }
  static multiplyScalar(t, a, r) {
    t.x = a.x * r;
    t.y = a.y * r;
    t.z = a.z * r;
    t.w = a.w * r;
    return t;
  }
  static scaleAndAdd(t, a, r, e) {
    t.x = a.x + r.x * e;
    t.y = a.y + r.y * e;
    t.z = a.z + r.z * e;
    t.w = a.w + r.w * e;
    return t;
  }
  static rotateX(t, a, r) {
    r *= 0.5;
    var e = Math.sin(r);
    var r = Math.cos(r);
    t.x = a.x * r + a.w * e;
    t.y = a.y * r + a.z * e;
    t.z = a.z * r - a.y * e;
    t.w = a.w * r - a.x * e;
    return t;
  }
  static rotateY(t, a, r) {
    r *= 0.5;
    var e = Math.sin(r);
    var r = Math.cos(r);
    t.x = a.x * r - a.z * e;
    t.y = a.y * r + a.w * e;
    t.z = a.z * r + a.x * e;
    t.w = a.w * r - a.y * e;
    return t;
  }
  static rotateZ(t, a, r) {
    r *= 0.5;
    var e = Math.sin(r);
    var r = Math.cos(r);
    t.x = a.x * r + a.y * e;
    t.y = a.y * r - a.x * e;
    t.z = a.z * r + a.w * e;
    t.w = a.w * r - a.z * e;
    return t;
  }
  static rotateAround(t, a, r, e) {
    cc_1.Quat.invert(qt_1, a);
    vec3_1.MVec3.transformQuat(v3_1, r, qt_1);
    cc_1.Quat.fromAxisAngle(qt_1, v3_1, e);
    cc_1.Quat.multiply(t, a, qt_1);
    return t;
  }
  static rotateAroundLocal(t, a, r, e) {
    cc_1.Quat.fromAxisAngle(qt_1, r, e);
    cc_1.Quat.multiply(t, a, qt_1);
    return t;
  }
  static calculateW(t, a) {
    t.x = a.x;
    t.y = a.y;
    t.z = a.z;
    t.w = Math.sqrt(Math.abs(1 - a.x * a.x - a.y * a.y - a.z * a.z));
    return t;
  }
  static dot(t, a) {
    return t.x * a.x + t.y * a.y + t.z * a.z + t.w * a.w;
  }
  static lerp(t, a, r, e) {
    t.x = a.x + e * (r.x - a.x);
    t.y = a.y + e * (r.y - a.y);
    t.z = a.z + e * (r.z - a.z);
    t.w = a.w + e * (r.w - a.w);
    return t;
  }
  static slerp(t, a, r, e) {
    let c = 0;
    let s = 0;
    let x = a.x * r.x + a.y * r.y + a.z * r.z + a.w * r.w;
    var y;
    var z;

    if (x < 0) {
      x = -x;
      r.x = -r.x;
      r.y = -r.y;
      r.z = -r.z;
      r.w = -r.w;
    }

    s =
      0.000001 /* 1e-6 */ < 1 - x
        ? ((y = Math.acos(x)),
          (z = Math.sin(y)),
          (c = Math.sin((1 - e) * y) / z),
          Math.sin(e * y) / z)
        : ((c = 1 - e), e);

    t.x = c * a.x + s * r.x;
    t.y = c * a.y + s * r.y;
    t.z = c * a.z + s * r.z;
    t.w = c * a.w + s * r.w;
    return t;
  }
  static sqlerp(t, a, r, e, c, s) {
    cc_1.Quat.slerp(qt_1, a, c, s);
    cc_1.Quat.slerp(qt_2, r, e, s);
    cc_1.Quat.slerp(t, qt_1, qt_2, 2 * s * (1 - s));
    return t;
  }
  static invert(t, a) {
    var r = a.x * a.x + a.y * a.y + a.z * a.z + a.w * a.w;
    var r = r ? 1 / r : 0;
    t.x = -a.x * r;
    t.y = -a.y * r;
    t.z = -a.z * r;
    t.w = a.w * r;
    return t;
  }
  static conjugate(t, a) {
    t.x = -a.x;
    t.y = -a.y;
    t.z = -a.z;
    t.w = a.w;
    return t;
  }
  static len(t) {
    return Math.sqrt(t.x * t.x + t.y * t.y + t.z * t.z + t.w * t.w);
  }
  static lengthSqr(t) {
    return t.x * t.x + t.y * t.y + t.z * t.z + t.w * t.w;
  }
  static normalize(t, a) {
    var r = a.x * a.x + a.y * a.y + a.z * a.z + a.w * a.w;

    if (r > 0) {
      r = 1 / Math.sqrt(r);
      t.x = a.x * r;
      t.y = a.y * r;
      t.z = a.z * r;
      t.w = a.w * r;
    }

    return t;
  }
  static fromAxes(t, a, r, e) {
    cc_1.Mat3.set(m3_1, a.x, a.y, a.z, r.x, r.y, r.z, e.x, e.y, e.z);
    return cc_1.Quat.normalize(t, cc_1.Quat.fromMat3(t, m3_1));
  }
  static fromViewUp(t, a, r) {
    cc_1.Mat3.fromViewUp(m3_1, a, r);
    return cc_1.Quat.normalize(t, cc_1.Quat.fromMat3(t, m3_1));
  }
  static fromAxisAngle(t, a, r) {
    r *= 0.5;
    var e = Math.sin(r);
    t.x = e * a.x;
    t.y = e * a.y;
    t.z = e * a.z;
    t.w = Math.cos(r);
    return t;
  }
  static fromMat3(t, a) {
    var { m00: a, m03, m06, m01, m04, m07, m02, m05, m08 } = a;

    var w = a + m04 + m08;

    if (w > 0) {
      w = 0.5 / Math.sqrt(w + 1);
      t.w = 0.25 / w;
      t.x = (m05 - m07) * w;
      t.y = (m06 - m02) * w;
      t.z = (m01 - m03) * w;
    } else if (m04 < a && m08 < a) {
      w = 2 * Math.sqrt(1 + a - m04 - m08);
      t.w = (m05 - m07) / w;
      t.x = 0.25 * w;
      t.y = (m03 + m01) / w;
      t.z = (m06 + m02) / w;
    } else if (m08 < m04) {
      w = 2 * Math.sqrt(1 + m04 - a - m08);
      t.w = (m06 - m02) / w;
      t.x = (m03 + m01) / w;
      t.y = 0.25 * w;
      t.z = (m07 + m05) / w;
    } else {
      w = 2 * Math.sqrt(1 + m08 - a - m04);
      t.w = (m01 - m03) / w;
      t.x = (m06 + m02) / w;
      t.y = (m07 + m05) / w;
      t.z = 0.25 * w;
    }

    return t;
  }
  static fromEuler(t, a, r, e) {
    a *= halfToRad;
    r *= halfToRad;
    e *= halfToRad;
    var c = Math.sin(a);
    var a = Math.cos(a);
    var s = Math.sin(r);
    var r = Math.cos(r);
    var x = Math.sin(e);
    var e = Math.cos(e);
    t.x = c * r * e + a * s * x;
    t.y = a * s * e + c * r * x;
    t.z = a * r * x - c * s * e;
    t.w = a * r * e - c * s * x;
    return t;
  }
  static fromAngleZ(t, a) {
    a *= halfToRad;
    t.x = 0;
    t.y = 0;
    t.z = Math.sin(a);
    t.w = Math.cos(a);
  }
  static toAxisX(t, a) {
    var r = 2 * a.y;
    var e = 2 * a.z;
    t.x = 1 - r * a.y - e * a.z;
    t.y = r * a.x + e * a.w;
    t.z = e * a.x + r * a.w;
    return t;
  }
  static toAxisY(t, a) {
    var r = 2 * a.x;
    var e = 2 * a.y;
    var c = 2 * a.z;
    t.x = e * a.x - c * a.w;
    t.y = 1 - r * a.x - c * a.z;
    t.z = c * a.y + r * a.w;
    return t;
  }
  static toAxisZ(t, a) {
    var r = 2 * a.x;
    var e = 2 * a.y;
    var c = 2 * a.z;
    t.x = c * a.x - e * a.w;
    t.y = c * a.y - r * a.w;
    t.z = 1 - r * a.x - e * a.y;
    return t;
  }
  static toEuler(t, a, r) {
    var { x: a, y: y_1, z: z_1, w: w_1 } = a;
    let x = 0;
    let y = 0;
    let z = 0;
    var i;
    var w;
    var n;
    var u = a * y_1 + z_1 * w_1;

    if (u > 0.499999) {
      x = 0;
      y = toDegree(2 * Math.atan2(a, w_1));
      z = 90;
    } else if (u < -0.499999) {
      x = 0;
      y = -toDegree(2 * Math.atan2(a, w_1));
      z = -90;
    } else {
      i = a * a;
      w = y_1 * y_1;
      n = z_1 * z_1;
      x = toDegree(Math.atan2(2 * a * w_1 - 2 * y_1 * z_1, 1 - 2 * i - 2 * n));
      y = toDegree(Math.atan2(2 * y_1 * w_1 - 2 * a * z_1, 1 - 2 * w - 2 * n));
      z = toDegree(Math.asin(2 * u));

      r &&
        ((x = -180 * Math.sign(x + 0.000001 /* 1e-6 */) + x),
        (y = -180 * Math.sign(y + 0.000001 /* 1e-6 */) + y),
        (z = 180 * Math.sign(z + 0.000001 /* 1e-6 */) - z));
    }

    t.x = x;
    t.y = y;
    t.z = z;
    return t;
  }
  static toArray(t, a, r = 0) {
    t[r + 0] = a.x;
    t[r + 1] = a.y;
    t[r + 2] = a.z;
    t[r + 3] = a.w;
    return t;
  }
  static fromArray(t, a, r = 0) {
    t.x = a[r + 0];
    t.y = a[r + 1];
    t.z = a[r + 2];
    t.w = a[r + 3];
    return t;
  }
  static strictEquals(t, a) {
    return t.x === a.x && t.y === a.y && t.z === a.z && t.w === a.w;
  }
  static equals(t, a, r = utils_1.EPSILON) {
    return (
      Math.abs(t.x - a.x) <= r * Math.max(1, Math.abs(t.x), Math.abs(a.x)) &&
      Math.abs(t.y - a.y) <= r * Math.max(1, Math.abs(t.y), Math.abs(a.y)) &&
      Math.abs(t.z - a.z) <= r * Math.max(1, Math.abs(t.z), Math.abs(a.z)) &&
      Math.abs(t.w - a.w) <= r * Math.max(1, Math.abs(t.w), Math.abs(a.w))
    );
  }
}
exports.MQuat = MQuat;
