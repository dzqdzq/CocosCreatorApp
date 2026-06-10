var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.Raycast = undefined;
const cc_1 = require("cc");
const intersect_1 = __importDefault(require("./geom-utils/intersect"));
const recycle_pool_1 = require("./memop/recycle-pool");
const ray = cc_1.geometry.Ray;
const AABB = cc_1.geometry.AABB;
const triangle = cc_1.geometry.Triangle;
const testHitPoint = new cc_1.Vec3();
const hitPoint = new cc_1.Vec3();
const worldM4 = new cc_1.Mat4();
const inverseM4 = new cc_1.Mat4();
class Raycast {
  get rayResultCanvas() {
    return resultCanvas;
  }
  get rayResultModels() {
    return resultModels;
  }
  get rayResultAll() {
    return resultAll;
  }
  get rayResultSingleModel() {
    return resultSingleModel;
  }
  get raycastColliderResults() {
    return raycastColliderResults;
  }
  raycastAll(
    e,
    t,
    r = cc_1.Layers.Enum.DEFAULT |
      cc_1.Layers.Enum.UI_2D |
      cc_1.Layers.Enum.IGNORE_RAYCAST,
    a = Infinity,
    l = false,
    c,
    o
  ) {
    e = this.raycastAllModels(e, t, r, a, l, c);
    l = this.raycastAllCanvas(t, r, a, c, o);
    t = e || l;
    resultAll.length = 0;

    if (t) {
      Array.prototype.push.apply(resultAll, resultModels);
      Array.prototype.push.apply(resultAll, resultCanvas);
    }

    return t;
  }
  narrowPhaseStep(t, r, a, l, e = false) {
    var t_transform = t.transform;
    var o = e ? narrowphaseForSnap : narrowphase;
    if (t.type === cc_1.renderer.scene.ModelType.DEFAULT) {
      t_transform.getWorldMatrix(worldM4);
      cc_1.Mat4.invert(m4, t_transform.getWorldMatrix(m4));
      cc_1.Vec3.transformMat4(modelRay.o, r.o, m4);

      cc_1.Vec3.normalize(
        modelRay.d,
        cc_1.Vec3.transformMat4Normal(modelRay.d, r.d, m4)
      );

      l = Infinity;
      for (let e = 0; e < t.subModels.length; ++e) {
        var s;
        var n;
        var i;
        var d = t.subModels[e].subMesh;

        if (
          d &&
          d.geometricInfo &&
          (({ positions: i, indices: s, doubleSided: n } = d.geometricInfo),
          o(i, s, d.primitiveMode, !!n, a, testHitPoint),
          narrowDis < l) &&
          (cc_1.Vec3.transformMat4(testHitPoint, testHitPoint, worldM4),
          (i = cc_1.Vec3.distance(r.o, testHitPoint)) < l)
        ) {
          l = i;
          hitPoint.set(testHitPoint);
        }
      }
    }
    return l;
  }
  raycastAllModels(e, l, t = cc_1.Layers.Enum.DEFAULT, c = Infinity, o, r) {
    pool.reset();
    var a = [];
    for (const d of e.models) {
      var d_transform = d.transform;

      if (
        !e.isCulledByLod(cce.Camera.camera.camera, d) &&
        (!r || !(d.node.layer & r))
      ) {
        if (d_transform && d.enabled && d.node.layer & t && d.worldBounds) {
          if (
            (d_transform = intersect_1.default.ray_aabb(l, d.worldBounds)) >
              0 &&
            c > d_transform
          ) {
            a.push([d, d_transform]);
          }
        }
      }
    }
    a.sort((e, t) => e[1] - t[1]);
    let Number_MAX_VALUE = Number.MAX_VALUE;
    let i = 0;

    a.every((e, t) => {
      var r;
      var [a, e] = e;
      return !(
        (o && Number_MAX_VALUE <= e && i > 1) ||
        ((e = this.narrowPhaseStep(a, l, c, e, true)) < c &&
          (((r = pool.add()).node = a.node),
          (r.distance = e),
          (r.hitPoint = new cc_1.Vec3(hitPoint)),
          (resultModels[pool.length - 1] = r),
          (Number_MAX_VALUE = e),
          (i += 1)),
        0)
      );
    });

    resultModels.length = pool.length;
    return resultModels.length > 0;
  }
  raycastSingleModel(e, t, r = cc_1.Layers.Enum.DEFAULT, a = Infinity, l, c) {
    pool.reset();
    return (
      !(
        !(t.transform && t.enabled && t.node.layer & r && t.worldBounds) ||
        (c && c & t.node.layer) ||
        (r = intersect_1.default.ray_aabb(e, t.worldBounds)) <= 0 ||
        a <= r
      ) &&
      ((r = this.narrowPhaseStep(t, e, a, r, l)) < a &&
        (((c = pool.add()).node = t.node),
        (c.distance = r),
        (c.hitPoint = new cc_1.Vec3(hitPoint)),
        (resultSingleModel[pool.length - 1] = c)),
      (resultSingleModel.length = pool.length),
      resultSingleModel.length > 0)
    );
  }
  raycastAllCanvas(t, r = cc_1.Layers.Enum.UI_2D, a = Infinity, l, c) {
    poolUI.reset();
    var o = cc.director.getScene().getComponentsInChildren(cc.Canvas);
    if (o && o.length > 0) {
      for (let e = o.length - 1; e >= 0; e--) {
        var s = o[e].node;

        if (s && s.active) {
          this._raycastUI2DNodeRecursiveChildren(t, s, r, a, l, c);
        }
      }
    }
    resultCanvas.length = poolUI.length;
    return resultCanvas.length > 0;
  }
  raycastAllColliders(e, t = cc_1.Layers.Enum.DEFAULT) {
    return (
      !!cc_1.PhysicsSystem.instance.raycast(e, undefined, undefined, false) &&
      ((raycastColliderResults = cc_1.PhysicsSystem.instance.raycastResults),
      true)
    );
  }
  _raycastUI2DNode(e, t, r = cc_1.Layers.Enum.UI_2D, a = Infinity, l, c) {
    var o = t._uiProps.uiTransformComp;
    if (!o || !(t.layer & r) || (l && t.layer & l)) {
      return null;
    }
    r = t._uiProps._uiSkewComp;
    if (cce.Gizmo.is2D && r && c && !o.hitTest(c)) {
      return null;
    }
    o.getComputeAABB(aabbUI);
    l = intersect_1.default.ray_aabb(e, aabbUI);
    return !(l <= 0) && l < a
      ? (((r = poolUI.add()).node = t), (r.distance = l), r)
      : null;
  }
  _raycastUI2DNodeRecursiveChildren(
    t,
    r,
    a = cc_1.Layers.Enum.UI_2D,
    l = Infinity,
    c,
    o
  ) {
    for (let e = r.children.length - 1; e >= 0; e--) {
      var s = r.children[e];

      if (s && s.active) {
        this._raycastUI2DNodeRecursiveChildren(t, s, a, l, c, o);
      }
    }
    var e = this._raycastUI2DNode(t, r, a, l, c, o);

    if (e) {
      resultCanvas[poolUI.length - 1] = e;
    }
  }
}
exports.Raycast = Raycast;
const modelRay = ray.create();
const v3 = new cc_1.Vec3();
const m4 = new cc_1.Mat4();
let narrowDis = Infinity;
const tri = triangle.create();
const tempVec3_a = new cc_1.Vec3();
const tempVec3_b = new cc_1.Vec3();
const defaultNode = new cc_1.Node();

const pool = new recycle_pool_1.RecyclePool(
  () => ({
    node: defaultNode,
    distance: Infinity,
    hitPoint: new cc_1.Vec3(),
  }),
  8
);

const resultModels = [];
const aabbUI = new AABB();

const poolUI = new recycle_pool_1.RecyclePool(
  () => ({
    node: defaultNode,
    distance: Infinity,
    hitPoint: new cc_1.Vec3(),
  }),
  8
);

const resultCanvas = [];
const resultAll = [];
const resultSingleModel = [];
let raycastColliderResults = [];

const narrowphase = (r, a, e, l, t = Infinity, c) => {
  narrowDis = t;

  if (!a) {
    t = r.length / 3;
    a = new Uint32Array([...Array(t).keys()]);
  }

  if (e === cc_1.gfx.PrimitiveMode.TRIANGLE_LIST) {
    var a_length = a.length;
    for (let e = 0; e < a_length; e += 3) {
      var s = 3 * a[e];
      var n = 3 * a[e + 1];
      var i = 3 * a[e + 2];

      var s =
        (cc_1.Vec3.set(tri.a, r[s], r[1 + s], r[2 + s]),
        cc_1.Vec3.set(tri.b, r[n], r[1 + n], r[2 + n]),
        cc_1.Vec3.set(tri.c, r[i], r[1 + i], r[2 + i]),
        intersect_1.default.ray_triangle(modelRay, tri, l, c));

      if (s > 0 && s < narrowDis) {
        narrowDis = s;
      }
    }
  } else if (e === cc_1.gfx.PrimitiveMode.TRIANGLE_STRIP) {
    var d = a.length - 2;
    let t = 0;
    for (let e = 0; e < d; e += 1) {
      var _ = 3 * a[e - t];
      var u = 3 * a[e + t + 1];
      var y = 3 * a[e + 2];

      var _ =
        (cc_1.Vec3.set(tri.a, r[_], r[1 + _], r[2 + _]),
        cc_1.Vec3.set(tri.b, r[u], r[1 + u], r[2 + u]),
        cc_1.Vec3.set(tri.c, r[y], r[1 + y], r[2 + y]),
        (t = ~t),
        intersect_1.default.ray_triangle(modelRay, tri, l, c));

      if (_ > 0 && _ < narrowDis) {
        narrowDis = _;
      }
    }
  } else if (e === cc_1.gfx.PrimitiveMode.TRIANGLE_FAN) {
    var m = a.length - 1;
    var t = 3 * a[0];
    cc_1.Vec3.set(tri.a, r[t], r[1 + t], r[2 + t]);
    for (let e = 1; e < m; e += 1) {
      var g = 3 * a[e];
      var h = 3 * a[e + 1];

      var g =
        (cc_1.Vec3.set(tri.b, r[g], r[1 + g], r[2 + g]),
        cc_1.Vec3.set(tri.c, r[h], r[1 + h], r[2 + h]),
        intersect_1.default.ray_triangle(modelRay, tri, l, c));

      if (g > 0 && g < narrowDis) {
        narrowDis = g;
      }
    }
  } else if (e === cc_1.gfx.PrimitiveMode.LINE_LIST) {
    var a_length_1 = a.length;
    for (let e = 0; e < a_length_1; e += 2) {
      var f = 3 * a[e];
      var v = 3 * a[e + 1];

      var f =
        (cc_1.Vec3.set(tempVec3_a, r[f], r[1 + f], r[2 + f]),
        cc_1.Vec3.set(tempVec3_b, r[v], r[1 + v], r[2 + v]),
        intersect_1.default.ray_segment(
          modelRay,
          tempVec3_a,
          tempVec3_b,
          2,
          c
        ));

      if (f > 0 && f < narrowDis) {
        narrowDis = f;
      }
    }
  }
};

const narrowphaseForSnap = (r, a, e, l, t = Infinity, c) => {
  narrowDis = t;

  if (!a) {
    t = r.length / 3;
    a = new Uint32Array([...Array(t).keys()]);
  }

  let o;
  let s;
  let n;

  var { a: a_2, b, c: c_2 } = tri;

  let u;
  var y = cc_1.Vec3.fromArray;
  if (e === cc_1.gfx.PrimitiveMode.TRIANGLE_LIST) {
    var a_length = a.length;
    var g =
      a.length > 3000000 /* 3e6 */
        ? 3 * Math.floor(a.length / 3000000 /* 3e6 */)
        : 3;
    for (let e = 0; e < a_length; e += g) {
      o = 3 * a[e];
      s = 3 * a[e + 1];
      n = 3 * a[e + 2];
      y(a_2, r, o);
      y(b, r, s);
      y(c_2, r, n);

      if (
        (u = intersect_1.default.ray_triangle(modelRay, tri, l, c)) > 0 &&
        u < narrowDis
      ) {
        narrowDis = u;
      }
    }
  } else if (e === cc_1.gfx.PrimitiveMode.TRIANGLE_STRIP) {
    var h = a.length - 2;
    let t = 0;
    for (let e = 0; e < h; e += 1) {
      o = 3 * a[e - t];
      s = 3 * a[e + t + 1];
      n = 3 * a[e + 2];
      y(tri.a, r, o);
      y(tri.b, r, s);
      y(tri.c, r, n);
      t = ~t;

      if (
        (u = intersect_1.default.ray_triangle(modelRay, tri, l, c)) > 0 &&
        u < narrowDis
      ) {
        narrowDis = u;
      }
    }
  } else if (e === cc_1.gfx.PrimitiveMode.TRIANGLE_FAN) {
    var p = a.length - 1;
    o = 3 * a[0];
    cc_1.Vec3.set(tri.a, r[o], r[o + 1], r[o + 2]);
    for (let e = 1; e < p; e += 1) {
      s = 3 * a[e];
      n = 3 * a[e + 1];
      y(b, r, s);
      y(c_2, r, n);

      if (
        (u = intersect_1.default.ray_triangle(modelRay, tri, l, c)) > 0 &&
        u < narrowDis
      ) {
        narrowDis = u;
      }
    }
  } else if (e === cc_1.gfx.PrimitiveMode.LINE_LIST) {
    var a_length_1 = a.length;
    for (let e = 0; e < a_length_1; e += 2) {
      o = 3 * a[e];
      s = 3 * a[e + 1];
      y(tempVec3_a, r, o);
      y(tempVec3_b, r, s);

      if (
        (u = intersect_1.default.ray_segment(
          modelRay,
          tempVec3_a,
          tempVec3_b,
          2,
          c
        )) > 0 &&
        u < narrowDis
      ) {
        narrowDis = u;
      }
    }
  }
};

exports.default = new Raycast();
