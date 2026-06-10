var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const external_1 = __importDefault(require("../../utils/external"));
const base_1 = require("../base");
const frustum_1 = __importDefault(require("../../controller/frustum"));

const controller_direction_light_1 = __importDefault(
  require("./controller-direction-light")
);

const NodeUtils = external_1.default.NodeUtils;
const tempQuat = new cc_1.Quat();
class DirectionalLightComponentGizmo extends base_1.SelectGizmo {
  _controller;
  _frustumCtrl;
  _lightGizmoColor = new cc.Color(255, 255, 50);
  init() {
    this.createController();
    this._isInitialized = true;
  }
  onShow() {
    this._controller.show();
    this._frustumCtrl.show();
    this.updateControllerData();
  }
  onHide() {
    this._controller.hide();
    this._frustumCtrl.hide();
  }
  createController() {
    var t = this.getGizmoRoot();
    this._controller = new controller_direction_light_1.default(t);
    this._controller.setColor(this._lightGizmoColor);
    this._frustumCtrl = new frustum_1.default(t);
  }
  onControllerMouseDown() {
    if (this._isInitialized) {
      this.target;
    }
  }
  onControllerMouseMove() {
    this.updateDataFromController();
  }
  onControllerMouseUp() {}
  updateDataFromController() {
    var t;

    if (this._controller.updated && this.target) {
      t = this.target.node;
      this.onComponentChanged(t);
    }
  }
  updateControllerTransform() {
    var t;
    var e;

    if (this.target !== null) {
      e = this.target.node;
      t = tempQuat;
      NodeUtils.getWorldRotation3D(e, t);
      e = NodeUtils.getWorldPosition3D(e);
      this._controller.setPosition(e);
      this._controller.setRotation(t);
      this._frustumCtrl.setPosition(e);
      this._frustumCtrl.setRotation(t);
    }
  }
  updateControllerData() {
    var t;

    if (this._isInitialized && this.target !== null) {
      (t = this.target) && t.shadowEnabled
        ? (this._frustumCtrl.show(),
          this._frustumCtrl.updateSize(
            0,
            t.shadowOrthoSize,
            1,
            1,
            t.shadowNear,
            t.shadowFar,
            0
          ))
        : this._frustumCtrl.hide();

      this.updateControllerTransform();
    }
  }
  onTargetUpdate() {
    this.updateControllerData();
  }
  onNodeChanged() {
    this.updateControllerData();
  }
}
exports.default = DirectionalLightComponentGizmo;
