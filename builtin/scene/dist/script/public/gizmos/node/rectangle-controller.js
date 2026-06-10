var RectHandleType;

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.RectHandleType = undefined;
exports.RectangleController = undefined;
const cc_1 = require("cc");
const editable_1 = __importDefault(require("../controller/editable"));
const controller_shape_1 = __importDefault(
  require("../utils/controller-shape")
);
const controller_utils_1 = __importDefault(
  require("../utils/controller-utils")
);
const engine_1 = __importDefault(require("../utils/engine"));
const external_1 = __importDefault(require("../utils/external"));

const {
  AttributeName,
  getModel,
  updatePositions,
  setMeshColor,
  setNodeOpacity,
  getNodeOpacity,
  panPlaneLayer,
  updateBoundingBox,
} = engine_1.default;

const EditorCamera = external_1.default.EditorCamera;
const tempVec3 = new cc_1.Vec3();
const tempQuat_a = new cc_1.Quat();
!((e) => {
  e.None = "none";
  e.TopLeft = "tl";
  e.TopRight = "tr";
  e.BottomLeft = "bl";
  e.BottomRight = "br";
  e.Left = "neg_x";
  e.Right = "x";
  e.Top = "y";
  e.Bottom = "neg_y";
  e.Area = "area";
  e.Anchor = "anchor";
})(RectHandleType || (exports.RectHandleType = RectHandleType = {}));
class RectangleController extends editable_1.default {
  static RectHandleType = RectHandleType;
  anchorLocked = false;
  contentSizeLocked = false;
  _center = new cc_1.Vec3();
  _size = new cc_1.Vec2(100, 100);
  _deltaSize = new cc_1.Vec3();
  _curHandleType = RectHandleType.None;
  _rectNode = null;
  _panPlane = null;
  _areaNode;
  _areaMR = null;
  _rectMR = null;
  _mouseDownOnPlanePos = new cc_1.Vec3();
  _areaColor = cc_1.Color.GREEN;
  _areaOpacity = 0;
  _axisDir = {};
  constructor(e, t = {}) {
    super(e);
    this._defaultEditHandleSize = 10;
    this._axisDir.x = new cc_1.Vec3(1, 0, 0);
    this._axisDir.y = new cc_1.Vec3(0, 1, 0);
    this._axisDir[RectHandleType.Left] = new cc_1.Vec3(-1, 0, 0);
    this._axisDir[RectHandleType.Bottom] = new cc_1.Vec3(0, -1, 0);
    this._axisDir[RectHandleType.TopLeft] = new cc_1.Vec3(-1, 1, 0);
    this._axisDir[RectHandleType.TopRight] = new cc_1.Vec3(1, 1, 0);
    this._axisDir[RectHandleType.BottomLeft] = new cc_1.Vec3(-1, -1, 0);
    this._axisDir[RectHandleType.BottomRight] = new cc_1.Vec3(1, -1, 0);

    if (t.needAnchor) {
      this._axisDir[RectHandleType.Anchor] = new cc_1.Vec3();
    }

    this._editHandleKeys = Object.keys(this._axisDir);
    this._hoverColor = cc_1.Color.YELLOW;
    this.initShape();
  }
  setColor(e) {
    if (this._rectNode) {
      this._color = e;
      setMeshColor(this._rectNode, e);
    }
  }
  setOpacity(e) {
    if (this._rectNode) {
      setNodeOpacity(this._rectNode, e);
    }
  }
  setAreaColor(e) {
    this._areaColor = e;

    if (this._areaNode) {
      setMeshColor(this._areaNode, e);
    }
  }
  setAreaOpacity(e) {
    this._areaOpacity = e;

    if (this._areaNode) {
      setNodeOpacity(this._areaNode, e);
    }
  }
  isBorder(e) {
    return (
      e === RectHandleType.Left ||
      e === RectHandleType.Right ||
      e === RectHandleType.Top ||
      e === RectHandleType.Bottom
    );
  }
  isCorner(e) {
    return (
      e === RectHandleType.TopLeft ||
      e === RectHandleType.TopRight ||
      e === RectHandleType.BottomLeft ||
      e === RectHandleType.BottomRight
    );
  }
  isAreaOrAnchor(e) {
    return e === RectHandleType.Area || e === RectHandleType.Anchor;
  }
  onInitEditHandles() {
    var e = controller_utils_1.default.quad(
      new cc_1.Vec3(),
      100000 /* 1e5 */,
      100000 /* 1e5 */
    );

    var e =
      ((e.parent = this._rootNode),
      (e.name = "RectPanPlane"),
      (e.active = false),
      (e.layer = panPlaneLayer),
      setNodeOpacity(e, 0),
      (this._panPlane = e),
      controller_utils_1.default.quad(
        new cc_1.Vec3(),
        100,
        100,
        new cc_1.Vec3(0, 0, 1),
        this._areaColor,
        { unlit: true }
      ));

    e.name = "RectArea";
    e.parent = this.shape;
    e.setPosition(new cc_1.Vec3(0, 0, -0.1));
    setNodeOpacity(e, this._areaOpacity);
    this._areaNode = e;
    this._areaMR = getModel(e);
    this.initHandle(e, RectHandleType.Area);
  }
  showEditHandles() {
    super.showEditHandles();

    if (this._areaNode) {
      this._areaNode.active = true;
    }
  }
  hideEditHandles() {
    super.hideEditHandles();

    if (this._areaNode) {
      this._areaNode.active = false;
    }
  }
  _updateEditHandle(e) {
    var t = this._handleDataMap[e].topNode;
    var i = this._axisDir[e];
    var a = this._editHandleScales[e];

    if (e === RectHandleType.Anchor) {
      t.setScale(
        a / this.getScale().x,
        a / this.getScale().y,
        a / this.getScale().z
      );

      t.setWorldPosition(this.getPosition());
    } else {
      e = new cc_1.Vec3();
      e.x = (i.x * this._size.x) / 2;
      e.y = (i.y * this._size.y) / 2;
      (i = new cc_1.Vec3(e)).add(this._center);

      t.setScale(
        a / this.getScale().x,
        a / this.getScale().y,
        a / this.getScale().z
      );

      cc_1.Vec3.multiply(i, i, this.getScale());
      t.setPosition(i.x, i.y, i.z);
    }
  }
  initShape() {
    this.createShapeNode("RectangleController");

    this._rectNode = controller_utils_1.default.rectangle(
      this._center,
      cc_1.Quat.IDENTITY,
      this._size,
      this._color,
      { unlit: true }
    );

    this._rectNode.parent = this.shape;
    this._rectMR = getModel(this._rectNode);

    EditorCamera.camera.node.on(
      "transform-changed",
      this.onEditorCameraMoved,
      this
    );
  }
  updateSize(e, t) {
    this._center.set(e);
    this._size.set(t);

    if (this._size.x < 0 || this._size.y < 0) {
      setMeshColor(this._rectNode, cc_1.Color.RED);
    } else {
      setMeshColor(this._rectNode, this._color);
    }

    e = controller_shape_1.default.calcRectanglePoints(
      this._center,
      cc_1.Quat.IDENTITY,
      this._size
    );
    updatePositions(this._rectMR, e.vertices);

    if (this._edit) {
      this.updateEditHandles();

      t = controller_shape_1.default.calcQuadData(
        this._center,
        this._size.x,
        this._size.y
      );

      updatePositions(this._areaMR, t.positions);
      updateBoundingBox(this._areaMR, t.minPos, t.maxPos);
    }

    this.adjustEditHandlesSize();
  }
  onMouseDown(e) {
    e.propagationStopped = true;

    if (
      this.edit &&
      ((this._curHandleType = e.handleName),
      cc_1.Vec3.set(this._deltaSize, 0, 0, 0),
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
  onMouseMove(t) {
    t.propagationStopped = true;

    if (this.edit && this._isMouseDown) {
      var i = new cc_1.Vec3();
      if (
        (!this.contentSizeLocked || this.isAreaOrAnchor(t.handleName)) &&
        (!this.anchorLocked || t.handleName !== RectHandleType.Anchor)
      ) {
        if (this.getPositionOnPanPlane(i, t.x, t.y, this._panPlane)) {
          var i = new cc_1.Vec3(i);

          i.subtract(this._mouseDownOnPlanePos);
          var a = this._axisDir[t.handleName];

          let e = 0;

          if (this.isBorder(t.handleName)) {
            cc_1.Vec3.transformQuat(tempVec3, a, this.getRotation());
            e = i.dot(tempVec3);

            this._curHandleType === RectHandleType.Left ||
            this._curHandleType === RectHandleType.Right
              ? (this._deltaSize.x = e)
              : (this._deltaSize.y = e);
          } else if (this.isCorner(t.handleName)) {
            tempVec3.x = a.x;
            tempVec3.y = 0;
            tempVec3.z = 0;
            cc_1.Vec3.transformQuat(tempVec3, tempVec3, this.getRotation());
            e = i.dot(tempVec3);
            this._deltaSize.x = e;
            tempVec3.x = 0;
            tempVec3.y = a.y;
            tempVec3.z = 0;
            cc_1.Vec3.transformQuat(tempVec3, tempVec3, this.getRotation());
            e = i.dot(tempVec3);
            this._deltaSize.y = e;
          } else {
            this._deltaSize = i;
          }
        }

        if (this.onControllerMouseMove) {
          this.onControllerMouseMove(t);
        }
      }
    }
  }
  onMouseUp(e) {
    e.propagationStopped = true;
    this._curHandleType = RectHandleType.None;
    this._panPlane.active = false;

    if (this.onControllerMouseUp) {
      this.onControllerMouseUp(e);
    }
  }
  onMouseLeave(e) {
    if (!this.isCorner(this._curHandleType)) {
      this.onMouseUp(e);
    }
  }
  onHoverIn(e) {
    var t;

    if (this.edit) {
      if (e.handleName !== RectHandleType.Area) {
        this.setHandleColor(e.handleName, this._hoverColor);
      } else if (0 < (t = getNodeOpacity(this._areaNode))) {
        this.setHandleColor(e.handleName, this._hoverColor, t);
      }
    }
  }
  onHoverOut(e) {
    this.resetHandleColor(e);
  }
  onHide() {
    super.onHide();
    this.anchorLocked = false;
    this.contentSizeLocked = false;
  }
  getDeltaSize() {
    this._deltaSize.z = 0;
    return this._deltaSize;
  }
  getCurHandleType() {
    return this._curHandleType;
  }
  reset() {
    this._curHandleType = RectHandleType.None;
    this._isMouseDown = false;
    this.resetHandleColor();
  }
}
exports.RectangleController = RectangleController;
