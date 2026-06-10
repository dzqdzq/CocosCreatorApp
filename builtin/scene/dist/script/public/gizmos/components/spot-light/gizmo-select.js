var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const external_1 = __importDefault(require("../../utils/external"));
const engine_1 = __importDefault(require("../../utils/engine"));
const base_1 = require("../base");
const cone_1 = __importDefault(require("../../controller/cone"));
const sphere_1 = __importDefault(require("../../controller/sphere"));
const NodeUtils = external_1.default.NodeUtils;
const { create3DNode, setMaterialProperty } = engine_1.default;
const MathUtil = external_1.default.EditorMath;
const tempQuat_a = new cc_1.Quat();
class SpotLightComponentGizmo extends base_1.SelectGizmo {
  _lightGizmoColor = new cc_1.Color(255, 255, 50);
  _lightCtrlHoverColor = new cc_1.Color(0, 255, 0);
  _range = 0;
  _angle = 0;
  _baseSize = 0.5;
  _glowSize = 0.4;
  _controller;
  _sizeSphereCtrl;
  _rangePropPath = null;
  _anglePropPath = null;
  _rangeChanged = false;
  _angleChanged = false;
  _coneTopPos = new cc_1.Vec3();
  init() {
    this.createController();
    this._isInitialized = true;
  }
  onShow() {
    this._controller.show();
    this._sizeSphereCtrl.show();
    this.updateControllerData();
  }
  onHide() {
    this._controller.hide();
    this._sizeSphereCtrl.hide();
  }
  createController() {
    var t = this.getGizmoRoot();
    var e = create3DNode("SpotLightGizmo");
    e.parent = t;
    this._controller = new cone_1.default(e);
    this._controller.direction = cc_1.EAxisDirection.Z_AXIS;
    this._controller.setColor(this._lightGizmoColor);
    this._controller.onControllerMouseDown =
      this.onControllerMouseDown.bind(this);
    this._controller.onControllerMouseMove =
      this.onControllerMouseMove.bind(this);
    this._controller.onControllerMouseUp = this.onControllerMouseUp.bind(this);
    this._controller.editable = true;
    this._controller.hoverColor = this._lightCtrlHoverColor;
    this._sizeSphereCtrl = new sphere_1.default(e);
    this._sizeSphereCtrl.editable = false;
  }
  onControllerMouseDown() {
    if (this._isInitialized && this.target !== null) {
      this._range = this.target.range;
      this._angle = this.target.spotAngle;
      this._rangePropPath = this.getCompPropPath("range");
      this._anglePropPath = this.getCompPropPath("spotAngle");
      this._rangeChanged = false;
      this._angleChanged = false;
    }
  }
  onControllerMouseMove() {
    this.updateDataFromController();
  }
  onControllerMouseUp() {
    if (this._rangeChanged) {
      this.onControlEnd(this._rangePropPath);
    }

    if (this._angleChanged) {
      this.onControlEnd(this._anglePropPath);
    }
  }
  getConeRadius(t, e) {
    return Math.tan((t / 2) * MathUtil.D2R) * e;
  }
  updateDataFromController() {
    if (this._controller.updated && this.target) {
      var o = this.target.node;
      var r = this._controller.getDeltaRadius();
      var i = this._controller.getDeltaHeight();
      let t = this._range;

      if (i !== 0) {
        t = this._range + i;
        t = MathUtil.toPrecision(t, 3);
        (t = Math.abs(t)) < 0.01 && (t = 0.01);
        this._rangeChanged = true;
      }

      this.getConeRadius(this._angle, t);
      let e = this._angle;

      if (r !== 0) {
        i = this.getConeRadius(this._angle, t) + r;
        i = Math.abs(i);
        (e = 2 * Math.atan2(i, t)) < MathUtil.D2R && (e = MathUtil.D2R);
        e *= MathUtil.R2D;
        e = MathUtil.toPrecision(e, 3);
        this._angleChanged = true;
      }

      if (this._rangeChanged) {
        this.onControlUpdate(this._rangePropPath);
      }

      if (this._angleChanged) {
        this.onControlUpdate(this._anglePropPath);
      }

      this.target.spotAngle = e;
      this.target.range = t;
      this.onComponentChanged(o);
    }
  }
  updateControllerTransform() {
    var t;
    var e;

    if (this.target) {
      e = this.target.node;
      t = tempQuat_a;
      NodeUtils.getWorldRotation3D(e, t);
      e = NodeUtils.getWorldPosition3D(e);
      this._controller.setPosition(e);
      this._controller.setRotation(t);
      this._sizeSphereCtrl.setPosition(e);
    }
  }
  updateControllerData() {
    var t;
    var e;
    var o;

    if (this._isInitialized && this.target !== null) {
      this.updateControllerTransform();
      this._controller.checkEdit();
      t = this.target;
      e = this.getConeRadius(t.spotAngle, t.range);

      this._controller.updateSize(
        this._coneTopPos.set(0, 0, -t.range / 2),
        e,
        t.range
      );

      e = t.color.clone();

      t.useColorTemperature &&
        ((o = t._light.colorTemperatureRGB),
        (e.r *= o.x),
        (e.g *= o.y),
        (e.b *= o.z));

      o = cc.v4();
      o.x = t.luminance;
      o.y = this._glowSize;
      this._sizeSphereCtrl.setColor(e);
      this._sizeSphereCtrl.radius = t.size;
    }
  }
  onTargetUpdate() {
    this.updateControllerData();
  }
  onNodeChanged() {
    this.updateControllerData();
  }
}
exports.default = SpotLightComponentGizmo;
