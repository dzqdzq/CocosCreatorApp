var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const external_1 = __importDefault(require("../../utils/external"));
const utils_1 = __importDefault(require("../../utils"));
const base_1 = require("../base");
const disc_1 = __importDefault(require("../../controller/disc"));
const NodeUtils = external_1.default.NodeUtils;
const EditorMath = external_1.default.EditorMath;
const GizmoUtils = utils_1.default.GizmoUtils;
const HandleType = disc_1.default.DiscHandleType;
const tempQuat_a = new cc_1.Quat();
const tempMat4 = new cc_1.Mat4();
const tempVec2 = new cc_1.Vec2();
class CircleCollider2DGizmo extends base_1.SelectGizmo {
  _controller;
  _radius = 0;
  _offset = new cc_1.Vec2();
  _propRadiusPath = null;
  _propOffsetPath = null;
  _curHandleType;
  _maxScale = 1;
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
    this._controller = new disc_1.default(this.getGizmoRoot());
    this._controller.editable = true;
    this._controller.setColor(new cc.Color(107, 194, 53));
    this._controller.setEditHandlesColor(new cc.Color(107, 194, 53));
    this._controller.setAreaOpacity(50);
    this._controller.onControllerMouseDown =
      this.onControllerMouseDown.bind(this);
    this._controller.onControllerMouseMove =
      this.onControllerMouseMove.bind(this);
    this._controller.onControllerMouseUp = this.onControllerMouseUp.bind(this);
  }
  onControllerMouseDown() {
    var t;

    if (this.target) {
      this._radius = this.target.radius;
      this._offset = this.target.offset.clone();
      this._propRadiusPath = this.getCompPropPath("radius");
      this._propOffsetPath = this.getCompPropPath("offset");
      t = NodeUtils.getWorldScale3D(this.target.node);
      this._maxScale = GizmoUtils.getMaxCompInVec3(t);
    }
  }
  onControllerMouseMove() {
    var t;

    if (this._controller.updated) {
      t = this._controller.getCurHandleType();

      (this._curHandleType = t) === HandleType.Area
        ? (this.onControlUpdate(this._propRadiusPath),
          (t = this._controller.getDeltaPos()),
          this.handleAreaMove(t))
        : ((t = this._controller.getDeltaRadius()), this.handleRadius(t));
    }
  }
  onControllerMouseUp() {
    if (this._curHandleType === HandleType.Area) {
      this.onControlEnd(this._propOffsetPath);
    } else {
      this.onControlEnd(this._propRadiusPath);
    }
  }
  handleAreaMove(t) {
    var e;

    if (this.target) {
      e = this.target.node;
      t = t.clone();

      e &&
        (e.getWorldMatrix(tempMat4),
        cc_1.Mat4.invert(tempMat4, tempMat4),
        (tempMat4.m12 = tempMat4.m13 = 0),
        cc_1.Vec3.transformMat4(t, t, tempMat4));

      NodeUtils.makeVec3InPrecision(t, 1);
      t.z = 0;
      tempVec2.set(this._offset);
      tempVec2.add2f(t.x, t.y);
      this.target.offset = tempVec2;
      this.onComponentChanged(e);
    }
  }
  handleRadius(t) {
    if (this.target) {
      t = EditorMath.toPrecision(this._radius + t / this._maxScale, 1);
      this.target.radius = t;
      this.onComponentChanged(this.target.node);
    }
  }
  updateControllerData() {
    var t;
    var e;
    var o;
    var r;
    var i;
    var l;

    if (this._isInitialized && this.target !== null) {
      if ((t = this.target)) {
        (l = this.target.node).getWorldMatrix(tempMat4);
        e = t.radius;
        r = t.offset;
        o = cc.v3();
        o.x = r.x;
        o.y = r.y;
        r = NodeUtils.getWorldScale3D(l);
        cc_1.Vec3.transformMat4(o, o, tempMat4);
        i = tempQuat_a;
        NodeUtils.getWorldRotation3D(l, i);
        this._controller.setPosition(o);
        this._controller.setRotation(i);
        l = r.x;
        this._controller.updateSize(cc_1.Vec3.ZERO, e * l);
        this._controller.edit = t.editing;
      } else {
        this._controller.hide();
      }
    }
  }
  updateController() {
    this.updateControllerData();
  }
  onTargetUpdate() {
    this.updateController();
  }
  onNodeChanged() {
    this.updateController();
  }
}
exports.default = CircleCollider2DGizmo;
