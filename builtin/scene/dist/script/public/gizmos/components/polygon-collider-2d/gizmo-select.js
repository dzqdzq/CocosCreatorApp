var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const external_1 = __importDefault(require("../../utils/external"));
const line_1 = __importDefault(require("../../controller/line"));
const utils_1 = __importDefault(require("../../utils"));
const base_1 = require("../base");
const controller_polygon_1 = require("./controller-polygon");
const NodeUtils = external_1.default.NodeUtils;
const EditorMath = external_1.default.EditorMath;
const HandleType = controller_polygon_1.PolygonController.PolygonHandleType;
const tempVec3_a = new cc_1.Vec3();
const tempQuat_a = new cc_1.Quat();
const tempMat4 = new cc_1.Mat4();
const tempVec2 = new cc_1.Vec2();
class PolygonCollider2DGizmo extends base_1.SelectGizmo {
  _controller;
  _leftDeleteLine;
  _rightDeleteLine;
  _offset = new cc_1.Vec2();
  _ctrlKey = false;
  _metaKey = false;
  _propPath = null;
  _3dPoints = [];
  _points = [];
  _curHoverInHandleType = HandleType.None;
  _curHoverInElemIndex = -1;
  _isDeletePointKeyDown = false;
  get isDeletePointKeyDown() {
    return this._isDeletePointKeyDown;
  }
  set isDeletePointKeyDown(e) {
    if ((this._isDeletePointKeyDown = e)) {
      if (this.curHoverInHandleType === HandleType.Point) {
        utils_1.default.changePointer("alias");
        this.highlightDeleteLine(true);
      }
    } else {
      this.curHoverInHandleType === HandleType.Point &&
        utils_1.default.changePointer("default");

      this.highlightDeleteLine(false);
    }
  }
  get curHoverInHandleType() {
    return this._curHoverInHandleType;
  }
  set curHoverInHandleType(e) {
    switch ((this._curHoverInHandleType = e)) {
      case HandleType.None:
      case HandleType.Area: {
        utils_1.default.changePointer("default");
        this.highlightDeleteLine(false);
        break;
      }
      case HandleType.Point: {
        if (this.isDeletePointKeyDown) {
          utils_1.default.changePointer("alias");
          this.highlightDeleteLine(true);
        } else {
          utils_1.default.changePointer("default");
          this.highlightDeleteLine(false);
        }

        break;
      }
      case HandleType.Line: {
        utils_1.default.changePointer("copy");
        this.highlightDeleteLine(false);
      }
    }
  }
  highlightDeleteLine(e) {
    var t;
    var o;
    var n;

    if (e) {
      if (this._curHoverInElemIndex >= 0 && this.target) {
        e = this.target.points;
        t = this._controller.points;

        e.length < 2 ||
          (e.length === 2
            ? (this._leftDeleteLine.updateData(t[0], t[1]),
              this._leftDeleteLine.show())
            : ((o =
                0 === (e = this._curHoverInElemIndex) ? t.length - 1 : e - 1),
              (n = e === t.length - 1 ? 0 : e + 1),
              this._leftDeleteLine.updateData(t[o], t[e]),
              this._rightDeleteLine.updateData(t[e], t[n]),
              this._leftDeleteLine.show(),
              this._rightDeleteLine.show(),
              cce.Engine.repaintInEditMode()));
      }
    } else {
      this._leftDeleteLine.hide();
      this._rightDeleteLine.hide();
      cce.Engine.repaintInEditMode();
    }
  }
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
    var e = this.getGizmoRoot();
    this._controller = new controller_polygon_1.PolygonController(e, this);
    this._controller.editable = true;
    this._controller.setColor(new cc.Color(107, 194, 53));
    this._controller.setEditHandlesColor(new cc.Color(107, 194, 53));
    this._controller.onControllerMouseDown =
      this.onControllerMouseDown.bind(this);
    this._controller.onControllerMouseMove =
      this.onControllerMouseMove.bind(this);
    this._controller.onControllerMouseUp = this.onControllerMouseUp.bind(this);
    this._controller.onControllerHoverIn = this.onControllerHoverIn.bind(this);
    this._controller.onControllerHoverOut =
      this.onControllerHoverOut.bind(this);
    this._leftDeleteLine = new line_1.default(e);
    this._leftDeleteLine.setColor(cc_1.Color.RED);
    this._leftDeleteLine.hide();
    this._rightDeleteLine = new line_1.default(e);
    this._rightDeleteLine.setColor(cc_1.Color.RED);
    this._rightDeleteLine.hide();
  }
  onControllerMouseDown() {
    var e;
    var t;
    var o;
    var n = this._controller.getHandleData();

    if (n && this.target) {
      if (n.type === HandleType.Line) {
        if ((t = n.hitPos)) {
          this._propPath = this.getCompPropPath("points");
          this.onControlUpdate(this._propPath);
          e = this.target.points;
          this.worldToLocalPos(tempVec3_a, t);
          t = this.target.offset;
          o = EditorMath.toPrecision(tempVec3_a.x - t.x, 1);
          t = EditorMath.toPrecision(tempVec3_a.y - t.y, 1);
          e.splice(n.index + 1, 0, new cc_1.Vec2(o, t));
          this.target.points = e;
          this.onComponentChanged(this.target.node);
        }
      } else if (n.type === HandleType.Point) {
        this.onControlUpdate(this._propPath);
        this._propPath = this.getCompPropPath("points");

        this.isDeletePointKeyDown &&
          ((o = this.target.points).splice(n.index, 1),
          (this.target.points = o),
          this.onComponentChanged(this.target.node),
          (this.curHoverInHandleType = HandleType.None),
          (this._curHoverInElemIndex = -1));

        this._points = [];

        this.target.points.forEach((e) => {
          this._points.push(e.clone());
        });
      } else if (n.type === HandleType.Area) {
        this._offset = this.target.offset.clone();
        this._propPath = this.getCompPropPath("offset");
      }
    }
  }
  onControllerMouseMove(e) {
    this._ctrlKey = e.ctrlKey;
    this._metaKey = e.metaKey;
    this.isDeletePointKeyDown = this._ctrlKey || this._metaKey;

    if (this._controller.updated) {
      if ((e = this._controller.getHandleData()).type === HandleType.Point) {
        this.onControlUpdate(this._propPath);
        this.handlePoints(e);
      } else if (e.type === HandleType.Area) {
        this.onControlUpdate(this._propPath);
        this.handleAreaMove(e.deltaPos);
      }
    }
  }
  onControllerMouseUp() {
    this.onControlEnd(this._propPath);
  }
  onControllerHoverIn(e) {
    if (e.handleName.charAt(0) === "l") {
      this.curHoverInHandleType = HandleType.Line;
      this._curHoverInElemIndex = e.customData?.index;
    } else if (e.handleName.charAt(0) === "p") {
      this.curHoverInHandleType = HandleType.Point;
      this._curHoverInElemIndex = e.customData?.index;
    } else if (e.handleName === HandleType.Area) {
      this.curHoverInHandleType = HandleType.Area;
    }
  }
  onControllerHoverOut(e) {
    if (e.handleName.charAt(0) === "l") {
      if (this.curHoverInHandleType === HandleType.Line) {
        this.curHoverInHandleType = HandleType.None;
        this._curHoverInElemIndex = -1;
      }
    } else if (e.handleName.charAt(0) === "p") {
      if (this.curHoverInHandleType === HandleType.Point) {
        this.curHoverInHandleType = HandleType.None;
        this._curHoverInElemIndex = -1;
      }
    } else if (
      e.handleName === HandleType.Area &&
      this.curHoverInHandleType === HandleType.Area
    ) {
      this.curHoverInHandleType = HandleType.None;
    }
  }
  onKeyDown(e) {
    this._ctrlKey = e.ctrlKey;
    this._metaKey = e.metaKey;
    this.isDeletePointKeyDown = this._ctrlKey || this._metaKey;
  }
  onKeyUp(e) {
    this._ctrlKey = e.ctrlKey;
    this._metaKey = e.metaKey;
    this.isDeletePointKeyDown = this._ctrlKey || this._metaKey;
  }
  worldToLocalPos(e, t) {
    if (this.target) {
      this.target.node.getWorldMatrix(tempMat4);
      cc_1.Mat4.invert(tempMat4, tempMat4);
      cc_1.Vec3.transformMat4(e, t, tempMat4);
    }
  }
  handleAreaMove(e) {
    var t;

    if (this.target) {
      t = this.target.node;
      e = e.clone();
      t.getWorldMatrix(tempMat4);
      cc_1.Mat4.invert(tempMat4, tempMat4);
      tempMat4.m12 = tempMat4.m13 = 0;
      cc_1.Vec3.transformMat4(e, e, tempMat4);
      NodeUtils.makeVec3InPrecision(e, 1);
      e.z = 0;
      tempVec2.set(this._offset);
      tempVec2.add2f(e.x, e.y);
      this.target.offset.set(tempVec2);
      this.onComponentChanged(t);
    }
  }
  handlePoints(e) {
    var t;
    var o;
    var n;
    var i;
    var e_index = e.index;

    if (e_index >= 0 && this.target) {
      e = e.deltaPos.clone();
      (t = this.target.node).getWorldMatrix(tempMat4);
      cc_1.Mat4.invert(tempMat4, tempMat4);
      tempMat4.m12 = tempMat4.m13 = 0;
      cc_1.Vec3.transformMat4(e, e, tempMat4);
      o = this.target.points;
      n = (i = this._points[e_index]).x + e.x;
      i = i.y + e.y;
      n = EditorMath.toPrecision(n, 1);
      i = EditorMath.toPrecision(i, 1);
      o[e_index].set(n, i);
      this.target.points = o;
      this.onComponentChanged(t);
    }
  }
  updateControllerData() {
    if (this._isInitialized && this.target !== null) {
      var e = this.target;
      if (e) {
        var e_offset = e.offset;
        const n = tempVec3_a;
        n.x = e_offset.x;
        n.y = e_offset.y;
        n.z = 0;
        e_offset = this.target.node;

        if (e_offset) {
          e_offset.getWorldMatrix(tempMat4);
        }

        if (this._3dPoints.length < e.points.length) {
          var o = e.points.length - this._3dPoints.length;
          for (let e = 0; e < o; e++) {
            this._3dPoints.push(new cc_1.Vec3(0, 0, 0));
          }
        } else {
          this._3dPoints.length = e.points.length;
        }

        e.points.forEach((e, t) => {
          this._3dPoints[t].set(e.x + n.x, e.y + n.y, 0);

          cc_1.Vec3.transformMat4(
            this._3dPoints[t],
            this._3dPoints[t],
            tempMat4
          );
        });

        this._controller.updateData(this._3dPoints);
        this._controller.edit = e.editing;
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
exports.default = PolygonCollider2DGizmo;
