var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const external_1 = __importDefault(require("../../utils/external"));
const base_1 = require("../base");
const controller_plane_1 = __importDefault(require("./controller-plane"));
const NodeUtils = external_1.default.NodeUtils;
const tempQuat_a = new cc_1.Quat();
class PlaneColliderGizmo extends base_1.SelectGizmo {
  _controller;
  init() {
    this._controller = new controller_plane_1.default(this.getGizmoRoot());
  }
  onShow() {
    this._controller.show();
    this.updateControllerData();
  }
  onHide() {
    this._controller.hide();
  }
  updateControllerData() {
    var t;
    var e;
    var o;

    if (
      this._isInitialized &&
      this.target !== null &&
      this.target instanceof cc_1.PlaneCollider
    ) {
      o = this.target.node;
      this._controller.show();
      t = NodeUtils.getWorldPosition3D(o);
      e = tempQuat_a;
      NodeUtils.getWorldRotation3D(o, e);
      this._controller.setPosition(t);
      this._controller.setRotation(e);
      o = this.target;
      this._controller.updateData(o.center, o.normal);
    }
  }
  onTargetUpdate() {
    this.updateControllerData();
  }
  onNodeChanged() {
    this.updateControllerData();
  }
}
exports.default = PlaneColliderGizmo;
