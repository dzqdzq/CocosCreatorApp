var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const external_1 = __importDefault(require("../../utils/external"));
const engine_1 = __importDefault(require("../../utils/engine"));
const base_1 = require("../base");
const sphere_1 = __importDefault(require("../../controller/sphere"));
const NodeUtils = external_1.default.NodeUtils;
const create3DNode = engine_1.default.create3DNode;
const MathUtil = external_1.default.EditorMath;
class SphereLightComponentGizmo extends base_1.SelectGizmo {
  _lightGizmoColor = new cc_1.Color(255, 255, 50);
  _lightCtrlHoverColor = new cc_1.Color(0, 255, 0);
  _range = 0;
  _glowSize = 0.4;
  _controller;
  _sizeSphereCtrl;
  _propPath = null;
  init() {
    this.createController();
    this._isInitialized = true;
  }
  onShow() {
    this._controller.show();
    this._sizeSphereCtrl.show();
    this.updateController();
  }
  onHide() {
    this._controller.hide();
    this._sizeSphereCtrl.hide();
  }
  createController() {
    var e = this.getGizmoRoot();
    var t = create3DNode("SphereLightGizmo");
    t.parent = e;
    this._controller = new sphere_1.default(t);
    this._controller.setColor(this._lightGizmoColor);
    this._controller.onControllerMouseDown =
      this.onControllerMouseDown.bind(this);
    this._controller.onControllerMouseMove =
      this.onControllerMouseMove.bind(this);
    this._controller.onControllerMouseUp = this.onControllerMouseUp.bind(this);
    this._controller.editable = true;
    this._controller.hoverColor = this._lightCtrlHoverColor;
    this._sizeSphereCtrl = new sphere_1.default(t);
    this._sizeSphereCtrl.editable = false;
  }
  onControllerMouseDown() {
    if (this._isInitialized && this.target !== null) {
      this._range = this.target.range;
      this._propPath = this.getCompPropPath("range");
    }
  }
  onControllerMouseMove() {
    this.updateDataFromController();
  }
  onControllerMouseUp() {
    this.onControlEnd(this._propPath);
  }
  updateDataFromController() {
    var e;
    var t;

    if (this._controller.updated && this.target) {
      this.onControlUpdate(this._propPath);
      e = this.target.node;
      t = this._controller.getDeltaRadius();
      t = this._range + t;
      t = MathUtil.toPrecision(t, 3);
      t = Math.abs(t);
      this.target.range = t;
      this.onComponentChanged(e);
    }
  }
  updateControllerTransform() {
    var e;

    if (this._isInitialized && this.target !== null) {
      e = this.target.node;
      e = NodeUtils.getWorldPosition3D(e);
      this._controller.setPosition(e);
      this._sizeSphereCtrl.setPosition(e);
    }
  }
  updateControllerData() {
    var e;
    var t;
    var o;

    if (this._isInitialized && this.target !== null) {
      this._controller.checkEdit();
      e = this.target;
      this._controller.radius = e.range;
      t = e.color.clone();

      e.useColorTemperature &&
        (o = e._light?.colorTemperatureRGB) &&
        ((t.r *= o.x), (t.g *= o.y), (t.b *= o.z));

      o = cc.v4();
      o.x = e.luminance;
      o.y = this._glowSize;
      this._sizeSphereCtrl.setColor(t);
      this._sizeSphereCtrl.radius = e.size;
    }
  }
  updateController() {
    this.updateControllerTransform();
    this.updateControllerData();
  }
  onTargetUpdate() {
    this.updateController();
  }
  onNodeChanged() {
    this.updateController();
  }
}
exports.default = SphereLightComponentGizmo;
