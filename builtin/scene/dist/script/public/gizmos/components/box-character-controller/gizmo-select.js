var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const utils_1 = __importDefault(require("../../utils"));
const external_1 = __importDefault(require("../../utils/external"));
const base_1 = require("../base");
const box_1 = __importDefault(require("../../controller/box"));
const NodeUtils = external_1.default.NodeUtils;
const tempVec3 = new cc_1.Vec3();
const tempQuat_a = new cc_1.Quat();
class BoxCharacterControllerComponentGizmo extends base_1.SelectGizmo {
  _controller;
  _size = new cc_1.Vec3();
  _scale = new cc_1.Vec3();
  _propPath = null;
  init() {
    this.createController();
    this._isInitialized = true;
  }
  onShow() {
    this._controller.show();
    this.updateControllerData();
  }
  onHide() {
    this._controller.hide();
  }
  createController() {
    var t = this.getGizmoRoot();
    this._controller = new box_1.default(t);
    this._controller.setColor(cc.Color.GREEN);
    this._controller.editable = true;
    this._controller.hoverColor = cc.Color.YELLOW;
    this._controller.onControllerMouseDown =
      this.onControllerMouseDown.bind(this);
    this._controller.onControllerMouseMove =
      this.onControllerMouseMove.bind(this);
    this._controller.onControllerMouseUp = this.onControllerMouseUp.bind(this);
  }
  onControllerMouseDown() {
    if (this._isInitialized && this.target) {
      tempVec3.set(
        2 * this.target.halfSideExtent,
        2 * this.target.halfHeight,
        2 * this.target.halfForwardExtent
      );

      this._size = tempVec3.clone();
      this._scale = NodeUtils.getWorldScale3D(this.target.node);
      this._propPath = this.getCompPropPath("size");
    }
  }
  onControllerMouseMove() {
    this.updateDataFromController();
  }
  onControllerMouseUp() {
    this.onControlEnd(this._propPath);
  }
  updateDataFromController() {
    var t;

    if (this._controller.updated && this.target) {
      this.onControlUpdate(this._propPath);
      t = this._controller.getDeltaSize();
      cc_1.Vec3.divide(t, t, this._scale);
      cc_1.Vec3.multiplyScalar(t, t, 2);
      t = cc_1.Vec3.add(tempVec3, this._size, t);
      utils_1.default.clampSize(t);
      this.target.halfSideExtent = 0.5 * t.x;
      this.target.halfHeight = 0.5 * t.y;
      this.target.halfForwardExtent = 0.5 * t.z;
      t = this.target.node;
      this.onComponentChanged(t);
    }
  }
  updateControllerTransform() {
    this.updateControllerData();
  }
  updateControllerData() {
    var t;
    var e;
    var o;
    var r;

    if (this._isInitialized && this.target != null) {
      if (this.target instanceof cc_1.BoxCharacterController) {
        t = this.target.node;
        this._controller.show();
        this._controller.checkEdit();
        e = NodeUtils.getWorldScale3D(t);
        o = NodeUtils.getWorldPosition3D(t);
        r = tempQuat_a;
        NodeUtils.getWorldRotation3D(t, r);
        this._controller.setScale(e);
        this._controller.setPosition(o);
        this._controller.setRotation(r);

        tempVec3.set(
          2 * this.target.halfSideExtent,
          2 * this.target.halfHeight,
          2 * this.target.halfForwardExtent
        );

        this._controller.updateSize(this.target.center, tempVec3);
      } else {
        this._controller.hide();
        console.error("target is not a cc.BoxCharacterController");
      }
    }
  }
  onTargetUpdate() {
    this.updateControllerData();
  }
  onNodeChanged() {
    this.updateControllerData();
  }
}
exports.default = BoxCharacterControllerComponentGizmo;
