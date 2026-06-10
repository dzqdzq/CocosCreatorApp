Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const ray = cc_1.geometry.Ray;
const aabb = cc_1.geometry.AABB;
const triangle = cc_1.geometry.Triangle;
const tempVec3_a = new cc_1.Vec3();

const ray_triangle = (() => {
  const r = new cc_1.Vec3(0, 0, 0);
  const _ = new cc_1.Vec3(0, 0, 0);
  const V = new cc_1.Vec3(0, 0, 0);
  const m = new cc_1.Vec3(0, 0, 0);
  const o = new cc_1.Vec3(0, 0, 0);
  return (c, e, t = false, a) => {
    cc_1.Vec3.subtract(r, e.b, e.a);
    cc_1.Vec3.subtract(_, e.c, e.a);
    cc_1.Vec3.cross(V, c.d, _);
    var n = cc_1.Vec3.dot(r, V);
    if (n < Number.EPSILON && (!t || n > -Number.EPSILON)) {
      return 0;
    }
    t = 1 / n;
    cc_1.Vec3.subtract(m, c.o, e.a);
    n = cc_1.Vec3.dot(m, V) * t;
    if (n < 0 || n > 1) {
      return 0;
    }
    cc_1.Vec3.cross(o, m, r);
    e = cc_1.Vec3.dot(c.d, o) * t;
    return e < 0 || 1 < n + e || (n = cc_1.Vec3.dot(_, o) * t) < 0
      ? 0
      : (cc_1.Vec3.scaleAndAdd(a, c.o, c.d, n), n);
  };
})();

const ray_aabb = (() => {
  const V = new cc_1.Vec3();
  const m = new cc_1.Vec3();
  return (c, e) => {
    var c_o = c.o;
    var c = c.d;
    var a = 1 / c.x;
    var n = 1 / c.y;
    var c = 1 / c.z;

    var e =
      (cc_1.Vec3.subtract(V, e.center, e.halfExtents),
      cc_1.Vec3.add(m, e.center, e.halfExtents),
      (V.x - c_o.x) * a);

    var a = (m.x - c_o.x) * a;
    var r = (V.y - c_o.y) * n;
    var n = (m.y - c_o.y) * n;
    var _ = (V.z - c_o.z) * c;
    var c_o = (m.z - c_o.z) * c;
    var c = Math.max(
      Math.max(Math.min(e, a), Math.min(r, n)),
      Math.min(_, c_o)
    );
    var e = Math.min(
      Math.min(Math.max(e, a), Math.max(r, n)),
      Math.max(_, c_o)
    );
    return e < 0 || e < c ? 0 : c > 0 ? c : e;
  };
})();

const ray_segment = (() => {
  const h = new cc_1.Vec3();
  const M = new cc_1.Vec3();
  const x = new cc_1.Vec3();
  const y = new cc_1.Vec3();
  return (c, e, t, a = 2, n) => {
    var a = a * a;

    var e =
      (cc_1.Vec3.add(tempVec3_a, e, t),
      cc_1.Vec3.multiplyScalar(h, tempVec3_a, 0.5),
      cc_1.Vec3.subtract(tempVec3_a, t, e),
      cc_1.Vec3.normalize(M, tempVec3_a),
      cc_1.Vec3.subtract(x, c.o, h),
      0.5 * cc_1.Vec3.distance(e, t));

    var t = -c.d.dot(M);
    var r = x.dot(c.d);
    var _ = -x.dot(M);
    var V = x.lengthSqr();
    var m = Math.abs(1 - t * t);
    let o;
    let s;
    let i;
    let d;

    i =
      m > 0
        ? ((o = t * _ - r),
          (s = t * r - _),
          (d = e * m),
          o >= 0
            ? s >= -d
              ? s <= d
                ? ((m = 1 / m),
                  (o *= m),
                  (s *= m),
                  o * (o + t * s + 2 * r) + s * (t * o + s + 2 * _) + V)
                : ((s = e),
                  -(o = Math.max(0, -(t * s + r))) * o + s * (s + 2 * _) + V)
              : ((s = -e),
                -(o = Math.max(0, -(t * s + r))) * o + s * (s + 2 * _) + V)
            : s <= -d
            ? ((o = Math.max(0, -(-t * e + r))),
              (s = o > 0 ? -e : Math.min(Math.max(-e, -_), e)),
              -o * o + s * (s + 2 * _) + V)
            : s <= d
            ? ((o = 0), (s = Math.min(Math.max(-e, -_), e)) * (s + 2 * _) + V)
            : ((o = Math.max(0, -(t * e + r))),
              (s = o > 0 ? e : Math.min(Math.max(-e, -_), e)),
              -o * o + s * (s + 2 * _) + V))
        : ((s = t > 0 ? -e : e),
          -(o = Math.max(0, -(t * s + r))) * o + s * (s + 2 * _) + V);

    if (y) {
      cc_1.Vec3.scaleAndAdd(y, h, M, s);
    }

    if (n) {
      n.set(y);
    }

    let u = 0;

    return (u = i < a ? cc_1.Vec3.distance(c.o, y) : u);
  };
})();

const intersect = {
  ray_triangle,
  ray_aabb,
  ray_segment,
};

exports.default = intersect;
