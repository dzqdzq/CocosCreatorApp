var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const external_1 = __importDefault(require("../../utils/external"));
const base_1 = require("../base");
const sphere_1 = __importDefault(require("../../controller/sphere"));
const NodeUtils = external_1.default.NodeUtils;
const EditorMath = external_1.default.EditorMath;
const tempQuat_a = new cc_1.Quat();
class SphereColliderComponentGizmo extends base_1.SelectGizmo {
  _controller;
  _radius = 0;
  _maxScale = 1;
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
    this._controller = new sphere_1.default(t);
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
    var t;

    if (this._isInitialized && this.target != null) {
      t = NodeUtils.getWorldScale3D(this.target.node);
      this._maxScale = this.getMaxScale(t);
      this._radius = this.target.radius;
      this._propPath = this.getCompPropPath("radius");
    }
  }
  onControllerMouseMove() {
    this.updateDataFromController();
  }
  onControllerMouseUp() {
    this.onControlEnd(this._propPath);
  }
  getMaxScale(t) {
    return Math.max(t.x, t.y, t.z);
  }
  updateDataFromController() {
    var t;

    if (this._controller.updated && this.target) {
      this.onControlUpdate(this._propPath);
      t = this._controller.getDeltaRadius();
      t = this._radius + t / this._maxScale;
      t = Math.abs(t);
      t = EditorMath.toPrecision(t, 3);
      this.target.radius = t;
      t = this.target.node;
      this.onComponentChanged(t);
    }
  }
  updateControllerData() {
    var t;
    var e;
    var o;
    var r;

    if (this._isInitialized && this.target != null) {
      if (this.target instanceof cc_1.SphereCollider) {
        t = this.target.node;
        this._controller.show();
        this._controller.checkEdit();
        e = NodeUtils.getWorldScale3D(t);
        e = this.getMaxScale(e);
        o = NodeUtils.getWorldPosition3D(t);
        r = tempQuat_a;
        NodeUtils.getWorldRotation3D(t, r);
        this._controller.setScale(cc.v3(e, e, e));
        this._controller.setPosition(o);
        this._controller.setRotation(r);
        this._controller.updateSize(this.target.center, this.target.radius);
      } else {
        this._controller.hide();
        console.error("target is not a cc.SphereCollider");
      }
    }
  }
  updateControllerTransform() {
    this.updateControllerData();
  }
  onTargetUpdate() {
    this.updateControllerData();
  }
  onNodeChanged() {
    this.updateControllerData();
  }
}
exports.default = SphereColliderComponentGizmo;
