function forEachFace(t, e, a) {
  let i = 0;
  var c = [];
  switch (e) {
    case ccm.gfx.PrimitiveMode.TRIANGLE_LIST: {
      i = t.length / 3;
      for (let e = 0; e < i; e++) {
        c[0] = t[3 * e];
        c[1] = t[3 * e + 1];
        c[2] = t[3 * e + 2];
        a(c);
      }
      break;
    }
    case ccm.gfx.PrimitiveMode.TRIANGLE_STRIP: {
      i = t.length - 2;
      let r = 0;
      for (let e = 0; e < i; e++) {
        c[0] = t[e - r];
        c[1] = t[e + r + 1];
        c[2] = t[e + 2];
        a(c);
        r = ~r;
      }
      break;
    }
    case ccm.gfx.PrimitiveMode.TRIANGLE_FAN: {
      i = t.length - 1;
      var [o] = t;
      for (let e = 1; e < i; e++) {
        c[0] = o;
        c[1] = t[e];
        c[2] = t[e + 1];
        a(c);
      }
      break;
    }
    case ccm.gfx.PrimitiveMode.LINE_LIST: {
      i = t.length / 2;
      for (let e = 0; e < i; e++) {
        c[0] = t[2 * e];
        c[1] = t[2 * e + 1];
        a(c);
      }
      break;
    }
    case ccm.gfx.PrimitiveMode.LINE_STRIP: {
      i = t.length - 1;
      for (let e = 0; e < i; e++) {
        c[0] = t[e];
        c[1] = t[e + 1];
        a(c);
      }
      break;
    }
    case ccm.gfx.PrimitiveMode.LINE_LOOP: {
      i = t.length;
      for (let e = 0; e < i; e++) {
        c[0] = t[e];
        c[1] = t[e + 1 === i ? 0 : e + 1];
        a(c);
      }
      break;
    }
    case ccm.gfx.PrimitiveMode.POINT_LIST: {
      i = t.length;
      for (let e = 0; e < i; e++) {
        c[0] = t[e];
        a(c);
      }
    }
  }
}
Object.defineProperty(exports, "__esModule", { value: true });

exports.splitBasedOnJoints = undefined;
exports.MeshSplitInfo = undefined;
exports.calculateTangents = undefined;
exports.calculateNormals = undefined;

exports.forEachFace = forEachFace;
exports.getUintArrayCtor = getUintArrayCtor;

exports.calculateNormals = (() => {
  const cc_Vec3 = cc.Vec3;
  const f = new cc_Vec3();
  const d = new cc_Vec3();
  const I = new cc_Vec3();
  const g = new cc_Vec3();
  const x = new cc_Vec3();
  const y = new cc_Vec3();
  return (r, t, a = []) => {
    var i = t.length / 3;
    var c = r.length / 3;

    var o = Array(3 * c)
      .fill(0)
      .map(() => new cc_Vec3());

    for (let e = 0; e < i; ++e) {
      var n = t[3 * e + 0];
      var l = t[3 * e + 1];
      var s = t[3 * e + 2];
      cc_Vec3.fromArray(f, r, 3 * n);
      cc_Vec3.fromArray(d, r, 3 * l);
      cc_Vec3.fromArray(I, r, 3 * s);
      cc_Vec3.subtract(g, d, f);
      cc_Vec3.subtract(x, I, f);
      cc_Vec3.cross(y, g, x);
      cc_Vec3.add(o[n], o[n], y);
      cc_Vec3.add(o[l], o[l], y);
      cc_Vec3.add(o[s], o[s], y);
    }
    for (let e = 0; e < c; ++e) {
      cc_Vec3.toArray(a, cc_Vec3.normalize(y, o[e]), 3 * e);
    }
    return a;
  };
})();

exports.calculateTangents = (() => {
  const { Vec2, Vec3 } = cc;
  const S = new Vec3();
  const v = new Vec3();
  const A = new Vec3();
  const T = new Vec3();
  const P = new Vec3();
  const h = new Vec2();
  const E = new Vec2();
  const L = new Vec2();
  const M = new Vec3();
  const w = new Vec3();
  const N = new Vec3();
  const _ = new Vec3();
  return (t, a, r, i, c = []) => {
    var e = a.length / 3;
    var o = t.length / 3;

    var n = Array(o)
      .fill(0)
      .map(() => new Vec3());

    var l = Array(o)
      .fill(0)
      .map(() => new Vec3());

    for (let r = 0; r < e; ++r) {
      var s = a[3 * r + 0];
      var m = a[3 * r + 1];
      var f = a[3 * r + 2];

      Vec3.fromArray(S, t, 3 * s);
      Vec3.fromArray(v, t, 3 * m);
      Vec3.fromArray(A, t, 3 * f);
      Vec2.fromArray(h, i, 2 * s);
      Vec2.fromArray(E, i, 2 * m);
      Vec2.fromArray(L, i, 2 * f);
      Vec3.subtract(T, v, S);
      Vec3.subtract(P, A, S);
      var d = E.x - h.x;

      var I = L.x - h.x;
      var g = E.y - h.y;
      var x = L.y - h.y;
      let e = d * x - I * g;

      if (e !== 0) {
        e = 1 / e;
      }

      Vec3.multiplyScalar(
        M,
        Vec3.subtract(
          N,
          Vec3.multiplyScalar(N, T, x),
          Vec3.multiplyScalar(_, P, g)
        ),
        e
      );

      Vec3.multiplyScalar(
        w,
        Vec3.subtract(
          N,
          Vec3.multiplyScalar(N, P, d),
          Vec3.multiplyScalar(_, T, I)
        ),
        e
      );

      Vec3.add(n[s], n[s], M);
      Vec3.add(n[m], n[m], M);
      Vec3.add(n[f], n[f], M);
      Vec3.add(l[s], l[s], w);
      Vec3.add(l[m], l[m], w);
      Vec3.add(l[f], l[f], w);
    }
    for (let e = 0; e < o; ++e) {
      const M = n[e];
      const w = l[e];
      var y = Vec3.fromArray(N, r, 3 * e);
      Vec3.subtract(
        _,
        M,
        Vec3.multiplyScalar(_, y, Vec3.dot(M, y) / Vec3.dot(y, y))
      );

      if (Vec3.dot(_, _) == 0) {
        if (y.x || y.z) {
          Vec3.set(_, y.z, 0, -y.x);
        } else {
          Vec3.set(_, 0, y.x, -y.y);
        }
      }

      Vec3.toArray(c, Vec3.normalize(_, _), 4 * e);
      c[4 * e + 3] = Vec3.dot(Vec3.cross(_, w, M), y) > 0 ? 1 : -1;
    }
    return c;
  };
})();

class MeshSplitInfo {
  indices = [];
  jointSet = new Set();
  primitiveMode;
  constructor(e = ccm.gfx.PrimitiveMode.TRIANGLE_LIST) {
    this.primitiveMode = e;
  }
}
function getUintArrayCtor(e) {
  return e < 1 << (8 * Uint8Array.BYTES_PER_ELEMENT)
    ? Uint8Array
    : e < 1 << (8 * Uint16Array.BYTES_PER_ELEMENT)
    ? Uint16Array
    : Uint32Array;
}
exports.MeshSplitInfo = MeshSplitInfo;

exports.splitBasedOnJoints = (c, e, r, o) => {
  let n;
  switch (r) {
    case ccm.gfx.PrimitiveMode.TRIANGLE_LIST:
    case ccm.gfx.PrimitiveMode.TRIANGLE_STRIP:
    case ccm.gfx.PrimitiveMode.TRIANGLE_FAN: {
      n = ccm.gfx.PrimitiveMode.TRIANGLE_LIST;
      break;
    }
    case ccm.gfx.PrimitiveMode.LINE_LIST:
    case ccm.gfx.PrimitiveMode.LINE_STRIP:
    case ccm.gfx.PrimitiveMode.LINE_LOOP: {
      n = ccm.gfx.PrimitiveMode.LINE_LIST;
      break;
    }
    case ccm.gfx.PrimitiveMode.POINT_LIST: {
      n = ccm.gfx.PrimitiveMode.POINT_LIST;
    }
  }
  if (n === undefined) {
    return [];
  }
  const l = [new MeshSplitInfo(n)];
  let [s] = l;

  forEachFace(e, r, (e) => {
    if (
      !((r, t, a, e) => {
        let i = 0;
        for (let e = 0; e < a.length; e++) {
          var c = a[e];
          for (let e = 0; e < 4; e++) {
            if (!r.jointSet.has(t[4 * c + e])) {
              i++;
            }
          }
        }
        return r.jointSet.size + i <= e;
      })(s, c, e, o)
    ) {
      s = new MeshSplitInfo(n);
      l.push(s);
    }

    var r = s;
    var t = c;
    var a = e;
    for (let e = 0; e < a.length; e++) {
      var i = a[e];
      for (let e = 0; e < 4; e++) {
        r.jointSet.add(t[4 * i + e]);
      }
      r.indices.push(i);
    }
  });

  return l;
};
