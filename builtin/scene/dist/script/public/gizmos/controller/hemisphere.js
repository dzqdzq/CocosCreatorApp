var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const editable_1 = __importDefault(require("./editable"));
const controller_shape_1 = __importDefault(
  require("../utils/controller-shape")
);
const controller_utils_1 = __importDefault(
  require("../utils/controller-utils")
);
const engine_1 = __importDefault(require("../utils/engine"));
const external_1 = __importDefault(require("../utils/external"));
const { AttributeName, getModel, updatePositions, setMeshColor } =
  engine_1.default;
const EditorMath = external_1.default.EditorMath;
const axisDirMap = controller_utils_1.default.axisDirectionMap;
const AxisName = controller_utils_1.default.AxisName;
class SphereController extends editable_1.default {
  _center = new cc_1.Vec3();
  _radius = 100;
  _deltaRadius = 0;
  _circleDataMap = {};
  _mouseDeltaPos = new cc_1.Vec2();
  _curDistScalar = 0;
  _controlDir = new cc_1.Vec3();
  constructor(e) {
    super(e);

    this._editHandleKeys = [
      AxisName.x,
      AxisName.y,
      AxisName.neg_x,
      AxisName.neg_y,
      AxisName.neg_z,
    ];

    this.initShape();
  }
  get radius() {
    return this._radius;
  }
  set radius(e) {
    this.updateSize(this._center, e);
  }
  setColor(t) {
    Object.keys(this._circleDataMap).forEach((e) => {
      e = this._circleDataMap[e];
      setMeshColor(e.arcMR.node, t);
    });

    this.setEditHandlesColor(t);
    this._color = t;
  }
  createCircleByAxis(e, t, i) {
    var r = axisDirMap[e];
    var t = axisDirMap[t];
    let Math_PI = Math.PI;

    if (e === "neg_z") {
      Math_PI = EditorMath.TWO_PI;
    }

    var i = controller_utils_1.default.arc(
      this._center,
      r,
      t,
      Math_PI,
      this._radius,
      i
    );

    i.parent = this.shape;
    var s = {};
    s.arcMR = getModel(i);
    s.normalDir = r;
    s.fromDir = t;
    this._circleDataMap[e] = s;
  }
  _updateEditHandle(e) {
    var t = this._handleDataMap[e].topNode;
    var e = axisDirMap[e];
    var i = new cc_1.Vec3();
    var e = (cc_1.Vec3.multiplyScalar(i, e, this._radius), new cc_1.Vec3(i));
    e.add(this._center);
    cc_1.Vec3.multiply(e, e, this.getScale());
    t.setPosition(e.x, e.y, e.z);
  }
  initShape() {
    this.createShapeNode("SphereController");
    this._circleDataMap = {};
    this.createCircleByAxis("x", "neg_y", this._color);
    this.createCircleByAxis("y", "x", this._color);
    this.createCircleByAxis("neg_z", "x", this._color);
    this.hide();
  }
  updateSize(e, t) {
    this._center = e;
    this._radius = t;

    Object.keys(this._circleDataMap).forEach((e) => {
      var t = this._circleDataMap[e].normalDir;
      var i = this._circleDataMap[e].fromDir;
      var r = this._circleDataMap[e].arcMR;
      let Math_PI = Math.PI;

      if (e === "neg_z") {
        Math_PI = EditorMath.TWO_PI;
      }

      this.updateArcMesh(r, this._center, t, i, Math_PI, this._radius);
    });

    if (this._edit) {
      this.updateEditHandles();
    }

    this.adjustEditHandlesSize();
  }
  updateArcMesh(e, t, i, r, a, s) {
    t = controller_shape_1.default.calcArcPoints(t, i, r, a, s);
    updatePositions(e, t);
  }
  onMouseDown(e) {
    e.propagationStopped = true;
    this._mouseDeltaPos = cc.v2(0, 0);
    this._curDistScalar = super.getDistScalar();
    this._controlDir = new cc_1.Vec3(0, 0, 0);

    if (this.onControllerMouseDown) {
      this.onControllerMouseDown(e);
    }
  }
  onMouseMove(e) {
    var t;
    e.propagationStopped = true;

    if (
      this._isMouseDown &&
      ((this._mouseDeltaPos.x += e.moveDeltaX),
      (this._mouseDeltaPos.y += e.moveDeltaY),
      (t = axisDirMap[e.handleName]),
      (this._controlDir = t),
      (this._deltaRadius =
        this.getAlignAxisMoveDistance(
          this.localToWorldDir(t),
          this._mouseDeltaPos
        ) * this._curDistScalar),
      this.onControllerMouseMove)
    ) {
      this.onControllerMouseMove(e);
    }
  }
  onMouseUp(e) {
    e.propagationStopped = true;

    if (this.onControllerMouseUp) {
      this.onControllerMouseUp(e);
    }
  }
  onMouseLeave(e) {
    this.onMouseUp(e);
  }
  getDeltaRadius() {
    return this._deltaRadius;
  }
  getControlDir() {
    return this._controlDir;
  }
}
exports.default = SphereController;
