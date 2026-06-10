Object.defineProperty(exports, "__esModule", { value: true });
exports.MMat3 = undefined;
const utils_1 = require("./utils");
const cc_1 = require("cc");
const vec3_1 = require("./vec3");
let _a00 = 0;
let _a01 = 0;
let _a02 = 0;
let _a10 = 0;
let _a11 = 0;
let _a12 = 0;
let _a20 = 0;
let _a21 = 0;
let _a22 = 0;
const v3_1 = new cc_1.Vec3();
const v3_2 = new cc_1.Vec3();
class MMat3 {
  static IDENTITY = Object.freeze(new cc_1.Mat3());
  static clone(m) {
    return new cc_1.Mat3(
      m.m00,
      m.m01,
      m.m02,
      m.m03,
      m.m04,
      m.m05,
      m.m06,
      m.m07,
      m.m08
    );
  }
  static copy(m, a) {
    m.m00 = a.m00;
    m.m01 = a.m01;
    m.m02 = a.m02;
    m.m03 = a.m03;
    m.m04 = a.m04;
    m.m05 = a.m05;
    m.m06 = a.m06;
    m.m07 = a.m07;
    m.m08 = a.m08;
    return m;
  }
  static set(m, a, _, t, r, s, e, c, M, i) {
    m.m00 = a;
    m.m01 = _;
    m.m02 = t;
    m.m03 = r;
    m.m04 = s;
    m.m05 = e;
    m.m06 = c;
    m.m07 = M;
    m.m08 = i;
    return m;
  }
  static identity(m) {
    m.m00 = 1;
    m.m01 = 0;
    m.m02 = 0;
    m.m03 = 0;
    m.m04 = 1;
    m.m05 = 0;
    m.m06 = 0;
    m.m07 = 0;
    m.m08 = 1;
    return m;
  }
  static transpose(m, a) {
    if (m === a) {
      _a01 = a.m01;
      _a02 = a.m02;
      _a12 = a.m05;
      m.m01 = a.m03;
      m.m02 = a.m06;
      m.m03 = _a01;
      m.m05 = a.m07;
      m.m06 = _a02;
      m.m07 = _a12;
    } else {
      m.m00 = a.m00;
      m.m01 = a.m03;
      m.m02 = a.m06;
      m.m03 = a.m01;
      m.m04 = a.m04;
      m.m05 = a.m07;
      m.m06 = a.m02;
      m.m07 = a.m05;
      m.m08 = a.m08;
    }

    return m;
  }
  static invert(m, a) {
    _a00 = a.m00;
    _a01 = a.m01;
    _a02 = a.m02;
    _a10 = a.m03;
    _a11 = a.m04;
    _a12 = a.m05;
    _a20 = a.m06;
    _a21 = a.m07;
    var a = (_a22 = a.m08) * _a11 - _a12 * _a21;
    var _ = -_a22 * _a10 + _a12 * _a20;
    var t = _a21 * _a10 - _a11 * _a20;
    var r = _a00 * a + _a01 * _ + _a02 * t;

    if (r) {
      m.m00 = a * (r = 1 / r);
      m.m01 = (-_a22 * _a01 + _a02 * _a21) * r;
      m.m02 = (_a12 * _a01 - _a02 * _a11) * r;
      m.m03 = _ * r;
      m.m04 = (_a22 * _a00 - _a02 * _a20) * r;
      m.m05 = (-_a12 * _a00 + _a02 * _a10) * r;
      m.m06 = t * r;
      m.m07 = (-_a21 * _a00 + _a01 * _a20) * r;
      m.m08 = (_a11 * _a00 - _a01 * _a10) * r;
    }

    return m;
  }
  static determinant(m) {
    _a00 = m.m00;
    _a01 = m.m01;
    _a02 = m.m02;
    _a10 = m.m03;
    _a11 = m.m04;
    _a12 = m.m05;
    _a20 = m.m06;
    _a21 = m.m07;
    _a22 = m.m08;

    return (
      _a00 * (_a22 * _a11 - _a12 * _a21) +
      _a01 * (-_a22 * _a10 + _a12 * _a20) +
      _a02 * (_a21 * _a10 - _a11 * _a20)
    );
  }
  static multiply(m, m00, _) {
    _a00 = m00.m00;
    _a01 = m00.m01;
    _a02 = m00.m02;
    _a10 = m00.m03;
    _a11 = m00.m04;
    _a12 = m00.m05;
    _a20 = m00.m06;
    _a21 = m00.m07;
    _a22 = m00.m08;

    var { m00, m01, m02, m03, m04, m05, m06, m07 } = _;

    var _ = _.m08;
    m.m00 = m00 * _a00 + m01 * _a10 + m02 * _a20;
    m.m01 = m00 * _a01 + m01 * _a11 + m02 * _a21;
    m.m02 = m00 * _a02 + m01 * _a12 + m02 * _a22;
    m.m03 = m03 * _a00 + m04 * _a10 + m05 * _a20;
    m.m04 = m03 * _a01 + m04 * _a11 + m05 * _a21;
    m.m05 = m03 * _a02 + m04 * _a12 + m05 * _a22;
    m.m06 = m06 * _a00 + m07 * _a10 + _ * _a20;
    m.m07 = m06 * _a01 + m07 * _a11 + _ * _a21;
    m.m08 = m06 * _a02 + m07 * _a12 + _ * _a22;
    return m;
  }
  static multiplyMat4(m, m00, _) {
    _a00 = m00.m00;
    _a01 = m00.m01;
    _a02 = m00.m02;
    _a10 = m00.m03;
    _a11 = m00.m04;
    _a12 = m00.m05;
    _a20 = m00.m06;
    _a21 = m00.m07;
    _a22 = m00.m08;

    var { m00, m01, m02, m04, m05, m06, m08, m09 } = _;

    var _ = _.m10;
    m.m00 = m00 * _a00 + m01 * _a10 + m02 * _a20;
    m.m01 = m00 * _a01 + m01 * _a11 + m02 * _a21;
    m.m02 = m00 * _a02 + m01 * _a12 + m02 * _a22;
    m.m03 = m04 * _a00 + m05 * _a10 + m06 * _a20;
    m.m04 = m04 * _a01 + m05 * _a11 + m06 * _a21;
    m.m05 = m04 * _a02 + m05 * _a12 + m06 * _a22;
    m.m06 = m08 * _a00 + m09 * _a10 + _ * _a20;
    m.m07 = m08 * _a01 + m09 * _a11 + _ * _a21;
    m.m08 = m08 * _a02 + m09 * _a12 + _ * _a22;
    return m;
  }
  static transfrom(m, a, _) {
    _a00 = a.m00;
    _a01 = a.m01;
    _a02 = a.m02;
    _a10 = a.m03;
    _a11 = a.m04;
    _a12 = a.m05;
    _a20 = a.m06;
    _a21 = a.m07;
    _a22 = a.m08;
    a = _.x;
    _ = _.y;
    m.m00 = _a00;
    m.m01 = _a01;
    m.m02 = _a02;
    m.m03 = _a10;
    m.m04 = _a11;
    m.m05 = _a12;
    m.m06 = a * _a00 + _ * _a10 + _a20;
    m.m07 = a * _a01 + _ * _a11 + _a21;
    m.m08 = a * _a02 + _ * _a12 + _a22;
    return m;
  }
  static scale(m, a, _) {
    var _x = _.x;
    var _ = _.y;
    m.m00 = _x * a.m00;
    m.m01 = _x * a.m01;
    m.m02 = _x * a.m02;
    m.m03 = _ * a.m03;
    m.m04 = _ * a.m04;
    m.m05 = _ * a.m05;
    m.m06 = a.m06;
    m.m07 = a.m07;
    m.m08 = a.m08;
    return m;
  }
  static rotate(m, a, _) {
    _a00 = a.m00;
    _a01 = a.m01;
    _a02 = a.m02;
    _a10 = a.m03;
    _a11 = a.m04;
    _a12 = a.m05;
    _a20 = a.m06;
    _a21 = a.m07;
    _a22 = a.m08;
    a = Math.sin(_);
    _ = Math.cos(_);
    m.m00 = _ * _a00 + a * _a10;
    m.m01 = _ * _a01 + a * _a11;
    m.m02 = _ * _a02 + a * _a12;
    m.m03 = _ * _a10 - a * _a00;
    m.m04 = _ * _a11 - a * _a01;
    m.m05 = _ * _a12 - a * _a02;
    m.m06 = _a20;
    m.m07 = _a21;
    m.m08 = _a22;
    return m;
  }
  static fromMat4(m, a) {
    m.m00 = a.m00;
    m.m01 = a.m01;
    m.m02 = a.m02;
    m.m03 = a.m04;
    m.m04 = a.m05;
    m.m05 = a.m06;
    m.m06 = a.m08;
    m.m07 = a.m09;
    m.m08 = a.m10;
    return m;
  }
  static fromViewUp(m, a, _) {
    if (vec3_1.MVec3.lengthSqr(a) < utils_1.EPSILON * utils_1.EPSILON) {
      cc_1.Mat3.identity(m);
    } else {
      vec3_1.MVec3.normalize(
        v3_1,
        vec3_1.MVec3.cross(v3_1, _ || vec3_1.MVec3.UNIT_Y, a)
      );

      vec3_1.MVec3.lengthSqr(v3_1) < utils_1.EPSILON * utils_1.EPSILON
        ? cc_1.Mat3.identity(m)
        : (vec3_1.MVec3.cross(v3_2, a, v3_1),
          cc_1.Mat3.set(
            m,
            v3_1.x,
            v3_1.y,
            v3_1.z,
            v3_2.x,
            v3_2.y,
            v3_2.z,
            a.x,
            a.y,
            a.z
          ));
    }

    return m;
  }
  static fromTranslation(m, a) {
    m.m00 = 1;
    m.m01 = 0;
    m.m02 = 0;
    m.m03 = 0;
    m.m04 = 1;
    m.m05 = 0;
    m.m06 = a.x;
    m.m07 = a.y;
    m.m08 = 1;
    return m;
  }
  static fromScaling(m, a) {
    m.m00 = a.x;
    m.m01 = 0;
    m.m02 = 0;
    m.m03 = 0;
    m.m04 = a.y;
    m.m05 = 0;
    m.m06 = 0;
    m.m07 = 0;
    m.m08 = 1;
    return m;
  }
  static fromRotation(m, a) {
    var _ = Math.sin(a);
    var a = Math.cos(a);
    m.m00 = a;
    m.m01 = _;
    m.m02 = 0;
    m.m03 = -_;
    m.m04 = a;
    m.m05 = 0;
    m.m06 = 0;
    m.m07 = 0;
    m.m08 = 1;
    return m;
  }
  static fromQuat(m, a) {
    var { x, y, z } = a;

    var a = a.w;
    var s = x + x;
    var e = y + y;
    var c = z + z;
    var x = x * s;
    var M = y * s;
    var y = y * e;
    var i = z * s;
    var n = z * e;
    var z = z * c;
    var s = a * s;
    var e = a * e;
    var a = a * c;
    m.m00 = 1 - y - z;
    m.m03 = M - a;
    m.m06 = i + e;
    m.m01 = M + a;
    m.m04 = 1 - x - z;
    m.m07 = n - s;
    m.m02 = i - e;
    m.m05 = n + s;
    m.m08 = 1 - x - y;
    return m;
  }
  static inverseTransposeMat4(m, a) {
    var {
      m00,
      m01,
      m02,
      m03,
      m04,
      m05,
      m06,
      m07,
      m08,
      m09,
      m10,
      m11,
      m12,
      m13,
      m14,
    } = a;

    var a = a.m15;
    var x = m00 * m05 - m01 * m04;
    var y = m00 * m06 - m02 * m04;
    var d = m00 * m07 - m03 * m04;
    var p = m01 * m06 - m02 * m05;
    var f = m01 * m07 - m03 * m05;
    var S = m02 * m07 - m03 * m06;
    var V = m08 * m13 - m09 * m12;
    var I = m08 * m14 - m10 * m12;
    var m08 = m08 * a - m11 * m12;
    var q = m09 * m14 - m10 * m13;
    var m09 = m09 * a - m11 * m13;
    var m10 = m10 * a - m11 * m14;
    var m11 = x * m10 - y * m09 + d * q + p * m08 - f * I + S * V;
    return m11
      ? ((m.m00 = (m05 * m10 - m06 * m09 + m07 * q) * (m11 = 1 / m11)),
        (m.m01 = (m06 * m08 - m04 * m10 - m07 * I) * m11),
        (m.m02 = (m04 * m09 - m05 * m08 + m07 * V) * m11),
        (m.m03 = (m02 * m09 - m01 * m10 - m03 * q) * m11),
        (m.m04 = (m00 * m10 - m02 * m08 + m03 * I) * m11),
        (m.m05 = (m01 * m08 - m00 * m09 - m03 * V) * m11),
        (m.m06 = (m13 * S - m14 * f + a * p) * m11),
        (m.m07 = (m14 * d - m12 * S - a * y) * m11),
        (m.m08 = (m12 * f - m13 * d + a * x) * m11),
        m)
      : null;
  }
  static toArray(m, a, _ = 0) {
    m[_ + 0] = a.m00;
    m[_ + 1] = a.m01;
    m[_ + 2] = a.m02;
    m[_ + 3] = a.m03;
    m[_ + 4] = a.m04;
    m[_ + 5] = a.m05;
    m[_ + 6] = a.m06;
    m[_ + 7] = a.m07;
    m[_ + 8] = a.m08;
    return m;
  }
  static fromArray(m, a, _ = 0) {
    m.m00 = a[_ + 0];
    m.m01 = a[_ + 1];
    m.m02 = a[_ + 2];
    m.m03 = a[_ + 3];
    m.m04 = a[_ + 4];
    m.m05 = a[_ + 5];
    m.m06 = a[_ + 6];
    m.m07 = a[_ + 7];
    m.m08 = a[_ + 8];
    return m;
  }
  static add(m, a, _) {
    m.m00 = a.m00 + _.m00;
    m.m01 = a.m01 + _.m01;
    m.m02 = a.m02 + _.m02;
    m.m03 = a.m03 + _.m03;
    m.m04 = a.m04 + _.m04;
    m.m05 = a.m05 + _.m05;
    m.m06 = a.m06 + _.m06;
    m.m07 = a.m07 + _.m07;
    m.m08 = a.m08 + _.m08;
    return m;
  }
  static subtract(m, a, _) {
    m.m00 = a.m00 - _.m00;
    m.m01 = a.m01 - _.m01;
    m.m02 = a.m02 - _.m02;
    m.m03 = a.m03 - _.m03;
    m.m04 = a.m04 - _.m04;
    m.m05 = a.m05 - _.m05;
    m.m06 = a.m06 - _.m06;
    m.m07 = a.m07 - _.m07;
    m.m08 = a.m08 - _.m08;
    return m;
  }
  static multiplyScalar(m, a, _) {
    m.m00 = a.m00 * _;
    m.m01 = a.m01 * _;
    m.m02 = a.m02 * _;
    m.m03 = a.m03 * _;
    m.m04 = a.m04 * _;
    m.m05 = a.m05 * _;
    m.m06 = a.m06 * _;
    m.m07 = a.m07 * _;
    m.m08 = a.m08 * _;
    return m;
  }
  static multiplyScalarAndAdd(m, a, _, t) {
    m.m00 = _.m00 * t + a.m00;
    m.m01 = _.m01 * t + a.m01;
    m.m02 = _.m02 * t + a.m02;
    m.m03 = _.m03 * t + a.m03;
    m.m04 = _.m04 * t + a.m04;
    m.m05 = _.m05 * t + a.m05;
    m.m06 = _.m06 * t + a.m06;
    m.m07 = _.m07 * t + a.m07;
    m.m08 = _.m08 * t + a.m08;
    return m;
  }
  static strictEquals(m, a) {
    return (
      m.m00 === a.m00 &&
      m.m01 === a.m01 &&
      m.m02 === a.m02 &&
      m.m03 === a.m03 &&
      m.m04 === a.m04 &&
      m.m05 === a.m05 &&
      m.m06 === a.m06 &&
      m.m07 === a.m07 &&
      m.m08 === a.m08
    );
  }
  static equals(m, a, _ = utils_1.EPSILON) {
    return (
      Math.abs(m.m00 - a.m00) <=
        _ * Math.max(1, Math.abs(m.m00), Math.abs(a.m00)) &&
      Math.abs(m.m01 - a.m01) <=
        _ * Math.max(1, Math.abs(m.m01), Math.abs(a.m01)) &&
      Math.abs(m.m02 - a.m02) <=
        _ * Math.max(1, Math.abs(m.m02), Math.abs(a.m02)) &&
      Math.abs(m.m03 - a.m03) <=
        _ * Math.max(1, Math.abs(m.m03), Math.abs(a.m03)) &&
      Math.abs(m.m04 - a.m04) <=
        _ * Math.max(1, Math.abs(m.m04), Math.abs(a.m04)) &&
      Math.abs(m.m05 - a.m05) <=
        _ * Math.max(1, Math.abs(m.m05), Math.abs(a.m05)) &&
      Math.abs(m.m06 - a.m06) <=
        _ * Math.max(1, Math.abs(m.m06), Math.abs(a.m06)) &&
      Math.abs(m.m07 - a.m07) <=
        _ * Math.max(1, Math.abs(m.m07), Math.abs(a.m07)) &&
      Math.abs(m.m08 - a.m08) <=
        _ * Math.max(1, Math.abs(m.m08), Math.abs(a.m08))
    );
  }
}
exports.MMat3 = MMat3;
