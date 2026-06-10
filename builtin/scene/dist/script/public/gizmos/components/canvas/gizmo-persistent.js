var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const external_1 = __importDefault(require("../../utils/external"));
const utils_1 = __importDefault(require("../../utils"));
const base_1 = require("../base");
const rectangle_controller_1 = require("../../node/rectangle-controller");
const NodeUtils = external_1.default.NodeUtils;
const tempQuat_a = new cc_1.Quat();
class CanvasGizmo extends base_1.SelectGizmo {
  _controller;
  init() {
    this.createController();
  }
  onShow() {
    this._controller.show();
    this.updateController();
  }
  onHide() {
    this._controller.hide();
  }
  createController() {
    var t = this.getGizmoRoot();
    this._controller = new rectangle_controller_1.RectangleController(t);
    this._controller.onControllerMouseDown =
      this.onControllerMouseDown.bind(this);
    this._controller.onControllerMouseMove =
      this.onControllerMouseMove.bind(this);
    this._controller.onControllerMouseUp = this.onControllerMouseUp.bind(this);
  }
  onControllerMouseDown() {}
  onControllerMouseMove() {}
  onControllerMouseUp() {
    if (this.target) {
      utils_1.default.select(this.target.node.uuid);
    }
  }
  updateControllerData() {
    var t;

    if (
      this._isInitialized &&
      this.target &&
      this.target instanceof cc_1.Canvas &&
      (t = this.target.node.getComponent(cc_1.UITransform))
    ) {
      t = t.contentSize;
      this._controller.show();
      this._controller.updateSize(cc.v3(), cc.v2(t.width, t.height));
    }
  }
  updateControllerTransform() {
    var t;
    var e;
    var o;

    if (this._isInitialized && this.target !== null) {
      t = this.target.node;

      NodeUtils.hasComponentInSelfAndParent(t, ["cc.UISkew"])
        ? this._controller.setWorldMatrix(t.worldMatrix)
        : ((e = NodeUtils.getWorldPosition3D(t)),
          (o = tempQuat_a),
          NodeUtils.getWorldRotation3D(t, o),
          this._controller.setPosition(e),
          this._controller.setRotation(o));
    }
  }
  updateController() {
    this.updateControllerData();
    this.updateControllerTransform();
  }
  onTargetUpdate() {
    this.updateController();
  }
  onNodeChanged() {
    this.updateController();
  }
}
exports.default = CanvasGizmo;
