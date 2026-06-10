var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const external_1 = __importDefault(require("../../utils/external"));
const base_1 = require("../base");
const point_1 = __importDefault(require("../../controller/point"));
const line_1 = __importDefault(require("../../controller/line"));
const triangle_1 = __importDefault(require("../../controller/triangle"));
const tetrahedron_1 = __importDefault(require("../../controller/tetrahedron"));
const NodeUtils = external_1.default.NodeUtils;
const tempVec3_a = new cc_1.Vec3();
const tempVec3_b = new cc_1.Vec3();
const tempVec3_c = new cc_1.Vec3();
const tempVec3_d = new cc_1.Vec3();
const tempQuat_a = new cc_1.Quat();
class SimplexColliderGizmo extends base_1.SelectGizmo {
  _shapeControllers = {};
  _activeController = null;
  init() {}
  createControllerByShape(e) {
    var t = this.getGizmoRoot();
    let r = null;
    switch (e) {
      case cc_1.SimplexCollider.ESimplexType.VERTEX: {
        r = new point_1.default(t);
        break;
      }
      case cc_1.SimplexCollider.ESimplexType.LINE: {
        r = new line_1.default(t);
        break;
      }
      case cc_1.SimplexCollider.ESimplexType.TRIANGLE: {
        r = new triangle_1.default(t);
        break;
      }
      case cc_1.SimplexCollider.ESimplexType.TETRAHEDRON: {
        r = new tetrahedron_1.default(t);
        break;
      }
      default: {
        console.error("Invalid Type:", e);
      }
    }

    if (r) {
      r.setColor(cc_1.Color.GREEN);
    }

    return r;
  }
  getControllerByShape(e) {
    let t = this._shapeControllers[e];

    if (!t) {
      t = this.createControllerByShape(e);
      this._shapeControllers[e] = t;
    }

    return t;
  }
  onShow() {
    this.updateControllerData();
  }
  onHide() {
    if (this._activeController) {
      this._activeController.hide();
    }
  }
  updateControllerData() {
    if (
      this._isInitialized &&
      this.target !== null &&
      this.target instanceof cc_1.SimplexCollider
    ) {
      var e = this.target.node;
      var t = this.target;

      this._activeController?.hide();
      this._activeController = this.getControllerByShape(t.shapeType);
      var r = NodeUtils.getWorldScale3D(e);

      var l = NodeUtils.getWorldPosition3D(e);
      var c = tempQuat_a;
      NodeUtils.getWorldRotation3D(e, c);
      this._activeController?.setScale(r);
      this._activeController?.setPosition(l);
      this._activeController?.setRotation(c);

      switch (t.shapeType) {
        case cc_1.SimplexCollider.ESimplexType.VERTEX: {
          cc_1.Vec3.add(tempVec3_a, t.center, t.vertex0);
          this._activeController.updateData(tempVec3_a);
          break;
        }
        case cc_1.SimplexCollider.ESimplexType.LINE: {
          cc_1.Vec3.add(tempVec3_a, t.center, t.vertex0);
          cc_1.Vec3.add(tempVec3_b, t.center, t.vertex1);
          this._activeController.updateData(tempVec3_a, tempVec3_b);
          break;
        }
        case cc_1.SimplexCollider.ESimplexType.TRIANGLE: {
          cc_1.Vec3.add(tempVec3_a, t.center, t.vertex0);
          cc_1.Vec3.add(tempVec3_b, t.center, t.vertex1);
          cc_1.Vec3.add(tempVec3_c, t.center, t.vertex2);

          this._activeController.updateData(tempVec3_a, tempVec3_b, tempVec3_c);

          break;
        }
        case cc_1.SimplexCollider.ESimplexType.TETRAHEDRON: {
          cc_1.Vec3.add(tempVec3_a, t.center, t.vertex0);
          cc_1.Vec3.add(tempVec3_b, t.center, t.vertex1);
          cc_1.Vec3.add(tempVec3_c, t.center, t.vertex2);
          cc_1.Vec3.add(tempVec3_d, t.center, t.vertex3);

          this._activeController.updateData(
            tempVec3_a,
            tempVec3_b,
            tempVec3_c,
            tempVec3_d
          );
        }
      }

      this._activeController?.show();
    }
  }
  onTargetUpdate() {
    this.updateControllerData();
  }
  onNodeChanged() {
    this.updateControllerData();
  }
}
exports.default = SimplexColliderGizmo;
