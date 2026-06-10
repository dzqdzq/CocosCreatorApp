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

const { setNodeOpacity, getModel, updatePositions, ProjectionType, FOVAxis } =
  engine_1.default;

const EditorMath = external_1.default.EditorMath;
const axisDirMap = controller_utils_1.default.axisDirectionMap;
const AxisName = controller_utils_1.default.AxisName;
const tempVec3 = new cc_1.Vec3();
class FrustumController extends editable_1.default {
  _aspect = 1;
  _near = 1;
  _far = 10;
  _cameraProjection = 1;
  _fov = 30;
  _fovAxis = FOVAxis.VERTICAL;
  _orthoHeight = 0;
  _oriDir = new cc_1.Vec3(0, 0, -1);
  _deltaWidth = 0;
  _deltaHeight = 0;
  _deltaDistance = 0;
  _mouseDeltaPos = new cc_1.Vec2();
  _curDistScalar = 0;
  _frustumNode = null;
  _frustumMeshRenderer = null;
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
  getFarClipSize(e, t, i, s, a, o) {
    let r;
    let l;

    if (e) {
      r = t;
      l = r * s;
    } else if (o === FOVAxis.VERTICAL) {
      r = Math.tan(EditorMath.deg2rad(i / 2)) * a;
      l = r * s;
    } else {
      l = Math.tan(EditorMath.deg2rad(i / 2)) * a;
      r = l / s;
    }

    return { farHalfHeight: r, farHalfWidth: l };
  }
  _updateEditHandle(e) {
    var t;
    var i = this._handleDataMap[e].topNode;
    var s = axisDirMap[e];
    var a = new cc_1.Vec3();
    cc_1.Vec3.multiplyScalar(a, this._oriDir, this._far);

    if (e !== "neg_z") {
      t = this.getFarClipSize(
        this._cameraProjection === ProjectionType.ORTHO,
        this._orthoHeight,
        this._fov,
        this._aspect,
        this._far,
        this._fovAxis
      );

      e === "x" || e === "neg_x"
        ? cc_1.Vec3.multiplyScalar(tempVec3, s, t.farHalfWidth)
        : (e !== "y" && e !== "neg_y") ||
          cc_1.Vec3.multiplyScalar(tempVec3, s, t.farHalfHeight);

      a.add(tempVec3);
    }

    cc_1.Vec3.multiply(a, a, this.getScale());
    i.setPosition(a);
  }
  initShape() {
    this.createShapeNode("FrustumController");

    this._frustumNode = controller_utils_1.default.frustum(
      this._cameraProjection === ProjectionType.ORTHO,
      this._orthoHeight,
      this._fov,
      this._aspect,
      this._near,
      this._far,
      this._color,
      { forwardPipeline: true }
    );

    setNodeOpacity(this._frustumNode, 150);
    this._frustumNode.parent = this.shape;
    this._frustumMeshRenderer = getModel(this._frustumNode);
    this.hide();
  }
  updateSize(e, t, i, s, a, o, r) {
    this._cameraProjection = e;
    this._orthoHeight = t;
    this._fov = i;
    this._aspect = s;
    this._near = a;
    this._far = o;
    this._fovAxis = r;
    e = controller_shape_1.default.calcFrustum(
      this._cameraProjection === ProjectionType.ORTHO,
      this._orthoHeight,
      this._fov,
      this._aspect,
      this._near,
      this._far,
      this._fovAxis === FOVAxis.VERTICAL
    ).positions;
    updatePositions(this._frustumMeshRenderer, e);

    if (this._edit) {
      this.updateEditHandles();
    }

    this.adjustEditHandlesSize();
  }
  onMouseDown(e) {
    e.propagationStopped = true;
    this._mouseDeltaPos = cc.v2(0, 0);
    var t = new cc_1.Vec3();

    if (e.node) {
      e.node.getWorldPosition(t);
    }

    this._curDistScalar = this.getCameraDistScalar(t);
    this._deltaWidth = 0;
    this._deltaHeight = 0;
    this._deltaDistance = 0;

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
      (t =
        this.getAlignAxisMoveDistance(
          this.localToWorldDir(t),
          this._mouseDeltaPos
        ) * this._curDistScalar),
      e.handleName === "neg_z"
        ? (this._deltaDistance = t)
        : e.handleName === "x" || e.handleName === "neg_x"
        ? (this._deltaWidth = t)
        : (e.handleName !== "y" && e.handleName !== "neg_y") ||
          (this._deltaHeight = t),
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
  getDeltaWidth() {
    return this._deltaWidth;
  }
  getDeltaHeight() {
    return this._deltaHeight;
  }
  getDeltaDistance() {
    return this._deltaDistance;
  }
}
exports.default = FrustumController;
