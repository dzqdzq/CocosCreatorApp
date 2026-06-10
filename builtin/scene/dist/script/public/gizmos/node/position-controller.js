var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const base_1 = __importDefault(require("../controller/base"));
const controller_utils_1 = __importDefault(
  require("../utils/controller-utils")
);
const external_1 = __importDefault(require("../utils/external"));
const engine_1 = __importDefault(require("../utils/engine"));
const NodeUtils = external_1.default.NodeUtils;
const EditorCamera = external_1.default.EditorCamera;

const {
  getRaycastResultsByNodes,
  getRaycastResults,
  setNodeOpacity,
  panPlaneLayer,
  create3DNode,
  getModel,
} = engine_1.default;

const axisDirMap = controller_utils_1.default.axisDirectionMap;
const SnapPlaneName = "SnapPlane";
const TempVec3A = new cc_1.Vec3();
const TempVec3B = new cc_1.Vec3();
const TempQuatA = new cc_1.Quat();
class PositionController extends base_1.default {
  _deltaPosition = new cc_1.Vec3();
  _mouseDownPos = new cc_1.Vec3();
  _ctrlPlaneGroup;
  _mouseDownAxis = "";
  _curDistScalar = 0;
  _dragPanPlane = null;
  _isInPanDrag = false;
  _mouseDownOnPlanePos = new cc_1.Vec3();
  _snapDragPlane;
  static baseArrowHeadHeight = 12.5;
  static baseArrowHeadRadius = 5;
  static baseArrowBodyHeight = 70;
  static planeWidth = 12.5;
  static scale2D = new cc_1.Vec3(2, 2, 2);
  static scale3D = new cc_1.Vec3(1, 1, 1);
  constructor(e) {
    super(e);
    this._lockSize = true;
    this.initShape();
    this.onDimensionChanged();
  }
  onCameraFovChanged = (e) => {
    if (!cce.Gizmo.is2D) {
      e = cc_1.Vec3.multiplyScalar(
        new cc_1.Vec3(),
        PositionController.scale3D,
        e / 45
      );

      this.setScale(e);
    }
  };
  onDimensionChanged() {
    super.onDimensionChanged?.();

    this.setScale(
      cce.Gizmo.is2D ? PositionController.scale2D : PositionController.scale3D
    );
  }
  createAxis(e, t, a) {
    t = controller_utils_1.default.arrow(
      PositionController.baseArrowHeadHeight,
      PositionController.baseArrowHeadRadius,
      PositionController.baseArrowBodyHeight,
      t,
      { priority: 1000 /* 1e3 */ }
    );
    t.name = e + "Axis";
    t.parent = this.shape;
    NodeUtils.setEulerAngles(t, a);
    this.initHandle(t, e);
  }
  createControlPlane(t, a, e) {
    var o = PositionController.planeWidth / 2;
    var i = new cc_1.Vec3();
    for (let e = 0; e < t.length; e++) {
      var n = cc.v3();
      cc_1.Vec3.multiplyScalar(n, axisDirMap[t.charAt(e)], o);
      i.add(n);
    }

    var s = controller_utils_1.default.borderPlane(
      PositionController.planeWidth,
      PositionController.planeWidth,
      a,
      128
    );

    s.name = t + "Plane";
    s.parent = this.shape;
    NodeUtils.setEulerAngles(s, e);
    s.setPosition(i.x, i.y, i.z);
    var a = controller_utils_1.default.quad(
      cc.v3(),
      100000000 /* 1e8 */,
      100000000 /* 1e8 */,
      cc.v3(0, 0, 1),
      a
    );

    a.parent = this._ctrlPlaneGroup;
    a.name = t + "PanPlane";
    a.active = false;
    a.layer = panPlaneLayer;
    NodeUtils.setEulerAngles(a, e);
    setNodeOpacity(a, 0);
    this.initHandle(s, t);
    this._handleDataMap[t].panPlane = a;

    if (cce.Gizmo.is2D) {
      let e = s.position.clone();
      e.z = 5;
      s.position = e;
      e = a.position.clone();
      e.z = 5;
      a.position = e;
    }
  }
  createSnapPlane() {
    this._snapDragPlane = controller_utils_1.default.quad(
      new cc_1.Vec3(0, 0, 0),
      PositionController.planeWidth,
      PositionController.planeWidth,
      new cc_1.Vec3(0, 0, 1),
      cc_1.Color.WHITE,
      { unlit: true }
    );

    this._snapDragPlane.parent = this.shape;
    setNodeOpacity(this._snapDragPlane, 80);
    this._snapDragPlane.active = false;
    this.initHandle(this._snapDragPlane, SnapPlaneName);
  }
  initShape() {
    this.createShapeNode("PositionController");
    this.registerEvents();
    this.createAxis("x", cc.Color.RED, cc.v3(-90, -90, 0));
    this.createAxis("y", cc.Color.GREEN, cc.v3());
    this.createAxis("z", cc.Color.BLUE, cc.v3(90, 0, 90));
    var e = create3DNode("ctrlPlaneGroup");
    e.parent = this._rootNode;
    this._ctrlPlaneGroup = e;
    this.createControlPlane("xy", cc.Color.BLUE, cc.v3());
    this.createControlPlane("xz", cc.Color.GREEN, cc.v3(-90, -90, 0));
    this.createControlPlane("yz", cc.Color.RED, cc.v3(0, 90, 90));
    this.createSnapPlane();
    this.hide();
  }
  getDeltaPositionOfAxis(e, t) {
    e ??= new cc_1.Vec3();
    t = axisDirMap[t];
    cc_1.Vec3.transformQuat(TempVec3A, t, this.getRotation());
    return cc_1.Vec3.project(e, this._deltaPosition, TempVec3A);
  }
  getDeltaPosition() {
    return this._deltaPosition;
  }
  onMouseDown(e) {
    e.propagationStopped = true;
    this._deltaPosition.set(0, 0, 0);
    this._mouseDownPos = this.getPosition();
    this._mouseDownAxis = e.handleName;
    this._curDistScalar = this.getDistScalar();

    if (!this.isSnapping()) {
      this._dragPanPlane = this.getPanPlane(e.handleName);

      this._dragPanPlane &&
        ((this._isInPanDrag = true),
        this._ctrlPlaneGroup.setPosition(this.getPosition()),
        this._ctrlPlaneGroup.setRotation(this.getRotation()),
        (this._dragPanPlane.active = true),
        getModel(this._dragPanPlane).model?.updateTransform(-1),
        this.getPositionOnPanPlane(
          this._mouseDownOnPlanePos,
          e.x,
          e.y,
          this._dragPanPlane
        ));

      cc.game.canvas.style.cursor = "move";
    }

    if (this.onControllerMouseDown) {
      this.onControllerMouseDown(e);
    }
  }
  getPanPlane(e) {
    let a = null;
    if (e.length > 1) {
      a = this._handleDataMap[e].panPlane;
    } else {
      var o = "xyz".replace(e, "");
      let t = 0.00001; /* 1e-5 */
      for (let e = 0; e < o.length; e++) {
        var i = o.charAt(e);
        var n = axisDirMap[i];
        var s = TempVec3A;

        var n =
          (cc_1.Vec3.transformQuat(s, n, this.getRotation()),
          cc_1.Vec3.normalize(s, s),
          TempVec3B);

        EditorCamera.camera.node.getWorldPosition(n);
        var l = cc.v3();

        var n =
          (cc_1.Vec3.subtract(l, n, this.getPosition()),
          cc_1.Vec3.normalize(l, l),
          Math.abs(cc_1.Vec3.dot(s, l)));

        if (n > t) {
          s = "xyz".replace(i, "");
          a = this._handleDataMap[s].panPlane;
          t = n;
        }
      }
    }
    return a;
  }
  static isXYZ(e) {
    return e.length === 1 && ["x", "y", "z"].includes(e);
  }
  static isPlane(e) {
    return e.length === 2 && ["xy", "yz", "xz"].includes(e);
  }
  getAlignAxisDeltaPosition(e, t) {
    var e = axisDirMap[e];
    var t = this.getAlignAxisMoveDistance(this.localToWorldDir(e), t);
    var a = cc.v3();
    cc_1.Vec3.multiplyScalar(a, e, t * this._curDistScalar);
    return a;
  }
  getPositionOnPanPlane(e, t, a, o) {
    o = getRaycastResultsByNodes([o], t, a, Infinity, this.isSnapping());
    t = o.ray;
    return (
      o.length > 0 &&
      ((a = o[0]),
      cc_1.Vec3.multiplyScalar(e, t.d, a.distance),
      cc_1.Vec3.add(e, t.o, e),
      true)
    );
  }
  onMouseMove(e) {
    var t;
    e.propagationStopped = true;

    if (this.isSnapping()) {
      if (this.onControllerMouseMove) {
        this.onControllerMouseMove(e);
      }
    } else if (this._isMouseDown && this._isInPanDrag) {
      t = new cc_1.Vec3();

      this._dragPanPlane &&
        this.getPositionOnPanPlane(t, e.x, e.y, this._dragPanPlane) &&
        (this._deltaPosition.set(t),
        this._deltaPosition.subtract(this._mouseDownOnPlanePos),
        PositionController.isXYZ(this._mouseDownAxis)) &&
        this.getDeltaPositionOfAxis(this._deltaPosition, this._mouseDownAxis);

      (t = new cc_1.Vec3(this._mouseDownPos)).add(this._deltaPosition);

      this.isLock
        ? this.onControllerMouseMove && this.onControllerMouseMove(e)
        : (this.setPosition(t),
          this.onControllerMouseMove && this.onControllerMouseMove(e),
          this.updateController());
    }
  }
  onMouseUp(e) {
    e.propagationStopped = true;

    if (!this.isSnapping()) {
      this._isInPanDrag &&
        (this._dragPanPlane && (this._dragPanPlane.active = false),
        (this._isInPanDrag = false));

      cc.game.canvas.style.cursor = "default";
    }

    if (this.onControllerMouseUp) {
      this.onControllerMouseUp(e);
    }
  }
  onMouseLeave(e) {
    this.onMouseUp(e);
  }
  onHoverIn(e) {
    this.setHandleColor(e.handleName, cc_1.Color.YELLOW);
  }
  onHoverOut(e) {
    this.resetHandleColor(e);
  }
  onShow() {
    this.registerEvents();
    var e = cce.Camera.getCameraFov();

    if (e) {
      this.onCameraFovChanged(e);
    }

    this.setScale(
      cce.Gizmo.is2D ? PositionController.scale2D : PositionController.scale3D
    );

    if (this.transformToolData.is2D) {
      this._handleDataMap.z.topNode.active = false;
      this._handleDataMap.xz.topNode.active = false;
      this._handleDataMap.yz.topNode.active = false;
      this.updateController();
    } else {
      this._handleDataMap.z.topNode.active = true;
      this._handleDataMap.xz.topNode.active = true;
      this._handleDataMap.yz.topNode.active = true;
    }
  }
  onHide() {
    this.unregisterEvents();
  }
  isSnapping() {
    return this._snapDragPlane.active;
  }
  updateSnapUI(e) {
    if ((this._snapDragPlane.active = e)) {
      e = TempQuatA;
      EditorCamera.camera.node.getWorldRotation(e);
      this._snapDragPlane.setWorldRotation(e);
      this._handleDataMap.xy.topNode.active = false;
      this._handleDataMap.xz.topNode.active = false;
      this._handleDataMap.yz.topNode.active = false;
    } else {
      this._handleDataMap.xy.topNode.active = true;
      this._handleDataMap.xz.topNode.active = true;
      this._handleDataMap.yz.topNode.active = true;
    }
  }
}
exports.default = PositionController;
