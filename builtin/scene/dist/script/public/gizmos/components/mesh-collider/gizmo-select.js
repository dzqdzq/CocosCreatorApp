var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const external_1 = __importDefault(require("../../utils/external"));
const base_1 = require("../base");
const controller_mesh_1 = __importDefault(require("./controller-mesh"));
const NodeUtils = external_1.default.NodeUtils;
const tempQuat_a = new cc_1.Quat();
class MeshColliderGizmo extends base_1.SelectGizmo {
  _controller;
  init() {
    this._controller = new controller_mesh_1.default(this.getGizmoRoot());
  }
  onShow() {
    this.updateControllerData();
  }
  onHide() {
    this._controller.hide();
  }
  updateControllerData() {
    if (
      this._isInitialized &&
      this.target !== null &&
      this.target instanceof cc_1.MeshCollider
    ) {
      var e = this.target.node;
      var e_mesh = NodeUtils.getWorldScale3D(e);
      var r = NodeUtils.getWorldPosition3D(e);
      var o = tempQuat_a;

      var e =
        (NodeUtils.getWorldRotation3D(e, o),
        this._controller.setScale(e_mesh),
        this._controller.setPosition(r),
        this._controller.setRotation(o),
        this.target);

      var e_mesh = e.mesh;
      if (e_mesh) {
        this._controller.show();
        var r = this.calcMeshData(e_mesh);
        var r_points = r.points;
        var e_center = e.center;
        for (let e = 0; e < r_points.length; e += 3) {
          r_points[e] += e_center.x;
          r_points[e + 1] += e_center.y;
          r_points[e + 2] += e_center.z;
        }
        this._controller.updateData(r_points, r.indices);
      } else {
        this._controller.hide();
      }
    }
  }
  calcMeshData(t) {
    let r = [];
    let o = [];
    var i = t?.renderingSubMeshes.length;
    for (let e = 0; e < i; e++) {
      var l;
      var s = t.renderingSubMeshes[e];
      var s_geometricInfo = s.geometricInfo;

      if (
        s_geometricInfo &&
        ((s = s.primitiveMode),
        (l = s_geometricInfo.positions),
        (s_geometricInfo = s_geometricInfo.indices),
        (l = this._generateWireFrameData(l, r.length / 3, s_geometricInfo, s)))
      ) {
        r = r.concat(l.positions);
        o = o.concat(l.edgeIndices);
      }
    }
    return { points: r, indices: o };
  }
  _generateWireFrameData(e, r, o, t) {
    if (!o) {
      console.error("indexBuffer of mesh is undefined");
      return null;
    }
    let i = [];
    var l = [];
    if (t === cc_1.gfx.PrimitiveMode.TRIANGLE_LIST) {
      i = Array.from(e);
      var s = o.length / 3;
      for (let e = 0; e < s; e++) {
        var a = o[3 * e + 0] + r;
        var n = o[3 * e + 1] + r;
        var c = o[3 * e + 2] + r;
        l.push(a, n, n, c, c, a);
      }
    } else if (t === cc_1.gfx.PrimitiveMode.TRIANGLE_STRIP) {
      i = Array.from(e);
      var d = o.length - 2;
      let t = 0;
      for (let e = 0; e < d; e++) {
        var h = o[e - t] + r;
        var _ = o[e + t + 1] + r;
        var u = o[e + 2] + r;
        l.push(h, _, _, u, u, h);
        t = ~t;
      }
    } else if (t === cc_1.gfx.PrimitiveMode.TRIANGLE_FAN) {
      i = Array.from(e);
      var f = o.length - 2;
      var g = o[0] + r;
      for (let e = 0; e < f; e += 1) {
        var m = o[e + 1] + r;
        var p = o[e + 2] + r;
        l.push(g, m, m, p, p, g);
      }
    }
    return { positions: i, edgeIndices: l };
  }
  onTargetUpdate() {
    this.updateControllerData();
  }
  onNodeChanged() {
    this.updateControllerData();
  }
}
exports.default = MeshColliderGizmo;
