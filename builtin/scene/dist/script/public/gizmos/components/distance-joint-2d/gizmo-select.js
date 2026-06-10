var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const joint_2d_1 = require("../joint-2d");
const line_1 = __importDefault(require("../../controller/line"));
const tempVec2_a = new cc_1.Vec2();
const tempVec3_a = new cc_1.Vec3();
const tempVec3_b = new cc_1.Vec3();
const tempQuat_a = new cc_1.Quat();
const tempMat4 = new cc_1.Mat4();
class DistanceJoint2DGizmo extends joint_2d_1.SelectGizmo {
  _lineController;
  createController() {
    super.createController();
    var e = this.getGizmoRoot();
    this._lineController = new line_1.default(e);
    this._lineController.setColor(this._anchorColor);
    this._lineController.setOpacity(128);
  }
  onHide() {
    super.onHide();
    this._lineController.hide();
  }
  updateAnchorControllerData() {
    super.updateAnchorControllerData();
    var e;
    var t;
    var o = this.target;
    this._lineController.show();

    if (o) {
      o.node.getWorldMatrix(tempMat4);
      e = tempVec3_a.set(o.anchor.x, o.anchor.y, 0);
      cc_1.Vec3.transformMat4(e, e, tempMat4);

      o.connectedBody
        ? ((t = tempVec3_b.set(o.connectedAnchor.x, o.connectedAnchor.y, 0)),
          o.connectedBody.node.getWorldMatrix(tempMat4),
          cc_1.Vec3.transformMat4(t, t, tempMat4),
          this._lineController.updateData(e, t))
        : ((t = tempVec3_b.set(o.connectedAnchor.x, o.connectedAnchor.y, 0)),
          this._lineController.updateData(e, t));
    }
  }
}
exports.default = DistanceJoint2DGizmo;
