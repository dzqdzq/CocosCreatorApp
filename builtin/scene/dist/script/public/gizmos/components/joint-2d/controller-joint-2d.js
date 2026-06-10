var Joint2DControllerType;

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.Joint2DControllerType = undefined;
exports.Joint2DController = undefined;

const controller_utils_1 = __importDefault(
  require("../../utils/controller-utils")
);

const controller_shape_1 = __importDefault(
  require("../../utils/controller-shape")
);
const cc_1 = require("cc");
const editable_1 = __importDefault(require("../../controller/editable"));
const engine_1 = __importDefault(require("../../utils/engine"));

const {
  updateVBAttr,
  getModel,
  updatePositions,
  setMeshColor,
  setNodeOpacity,
  getNodeOpacity,
  panPlaneLayer,
  updateBoundingBox,
} = engine_1.default;

const tempVec3_a = new cc_1.Vec3();
!((e) => {
  e[(e.Revolute = 0)] = "Revolute";
  e[(e.Distance = 1)] = "Distance";
  e[(e.Fixed = 2)] = "Fixed";
  e[(e.Hinge = 3)] = "Hinge";
  e[(e.Slider = 4)] = "Slider";
  e[(e.Spring = 5)] = "Spring";
  e[(e.Wheel = 6)] = "Wheel";
})(
  Joint2DControllerType ||
    (exports.Joint2DControllerType = Joint2DControllerType = {})
);
class Joint2DController extends editable_1.default {
  _lineNode = null;
  _lineMR = null;
  _anchor = new cc_1.Vec3();
  _panPlane = null;
  _mouseDownOnPlanePos = new cc_1.Vec3();
  _deltaPos = new cc_1.Vec3();
  _type = Joint2DControllerType.Revolute;
  _center = new cc_1.Vec3();
  constructor(e, t) {
    super(e);
    this._editHandleColor = cc_1.Color.BLUE;
    this._hoverColor = cc_1.Color.YELLOW;
    this._editHandleKeys = ["Head"];

    if (t) {
      this._type = t;
    }

    this.initShape();
  }
  setColor(e) {
    this.setEditHandlesColor(e);
    setMeshColor(this._lineNode, e);
  }
  createEditHandle(e, t) {
    t = this.createHeadNode(this._anchor, e, t);
    setNodeOpacity(t, 80);
    t.parent = this._editHandlesShape;
    this._editHandleScales[e] = 1;
    t = this.initHandle(t, e);
    return t;
  }
  createHeadNode(e, t, o) {
    var n = controller_shape_1.default.calcDiscData(e, cc_1.Vec3.UNIT_Z, 10);
    var n = controller_utils_1.default.createShapeByData(n, o, { unlit: true });

    var t =
      ((n.name = t),
      controller_shape_1.default.calcCircleData(
        cc_1.Vec3.ZERO,
        cc_1.Vec3.UNIT_Z,
        10
      ));

    var t =
      ((controller_utils_1.default.createShapeByData(t, o, {
        unlit: true,
      }).parent = n),
      controller_shape_1.default.calcDiscData(e, cc_1.Vec3.UNIT_Z, 3));

    return (controller_utils_1.default.createShapeByData(t, o, {
      unlit: true,
    }).parent = n);
  }
  createLineNode(e, t, o, n) {
    e = controller_shape_1.default.calcLineData(e, t);

    t = controller_utils_1.default.createShapeByData(e, n, {
      unlit: true,
      dashed: true,
    });

    t.name = o;
    t.parent = this.shape;
    return t;
  }
  initShape() {
    this.createShapeNode("Joint2DController");
    var e = controller_utils_1.default.quad(
      new cc_1.Vec3(),
      100000 /* 1e5 */,
      100000 /* 1e5 */
    );
    e.parent = this._rootNode;
    e.name = "JointPanPlane";
    e.active = false;
    e.layer = panPlaneLayer;
    setNodeOpacity(e, 0);
    this._panPlane = e;

    this._lineNode = this.createLineNode(
      this._center,
      this._anchor,
      "JointLine",
      cc_1.Color.BLUE
    );

    this._lineMR = getModel(this._lineNode);
  }
  _updateEditHandle(e) {
    var t = this._handleDataMap[e].topNode;
    var e = this._editHandleScales[e];

    t.setScale(
      e / this.getScale().x,
      e / this.getScale().y,
      e / this.getScale().z
    );

    tempVec3_a.set(this._anchor);
    cc_1.Vec3.multiply(tempVec3_a, tempVec3_a, this.getScale());
    t.setPosition(tempVec3_a);
  }
  updatePosition(e, t) {
    this._center.set(e);
    this._anchor.set(t);
    e = controller_shape_1.default.calcLineData(this._center, this._anchor);
    t = [];
    t[0] = 0;
    t[1] = cc_1.Vec3.distance(this._center, this._anchor);
    updateVBAttr(this._lineMR, "a_lineDistance", t);
    updatePositions(this._lineMR, e.positions);
    updateBoundingBox(this._lineMR, e.minPos, e.maxPos);

    if (this._edit) {
      this.updateEditHandles();
    }

    this.adjustControllerSize();
  }
  onMouseDown(e) {
    e.propagationStopped = true;

    if (
      this.edit &&
      (cc_1.Vec3.set(this._deltaPos, 0, 0, 0),
      (this._panPlane.active = true),
      (this._mouseDownOnPlanePos = new cc_1.Vec3()),
      this.getPositionOnPanPlane(
        this._mouseDownOnPlanePos,
        e.x,
        e.y,
        this._panPlane
      ),
      this.onControllerMouseDown)
    ) {
      this.onControllerMouseDown(e);
    }
  }
  onMouseMove(e) {
    var t;
    e.propagationStopped = true;

    if (
      this.edit &&
      this._isMouseDown &&
      ((t = new cc_1.Vec3()),
      this.getPositionOnPanPlane(t, e.x, e.y, this._panPlane) &&
        (this._deltaPos = t),
      this.onControllerMouseMove)
    ) {
      this.onControllerMouseMove(e);
    }
  }
  onMouseUp(e) {
    e.propagationStopped = true;
    this._panPlane.active = false;

    if (this.onControllerMouseUp) {
      this.onControllerMouseUp(e);
    }
  }
  onMouseLeave(e) {
    this.onMouseUp(e);
  }
  onHoverIn(e) {
    super.onHoverIn(e);

    if (this.onControllerHoverIn) {
      this.onControllerHoverIn(e);
    }
  }
  onHoverOut(e) {
    super.onHoverOut(e);

    if (this.onControllerHoverOut) {
      this.onControllerHoverOut(e);
    }
  }
  getDeltaPos() {
    return this._deltaPos;
  }
}
exports.Joint2DController = Joint2DController;
