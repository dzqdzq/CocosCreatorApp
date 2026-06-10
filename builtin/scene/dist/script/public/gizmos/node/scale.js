var __importDefault =
  (this && this.__importDefault) ||
  ((o) => (o && o.__esModule ? o : { default: o }));
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = __importDefault(require("../utils"));
const external_1 = __importDefault(require("../utils/external"));
const NodeUtils = external_1.default.NodeUtils;
const GizmoUtils = utils_1.default.GizmoUtils;
const transform_base_1 = __importDefault(require("./transform-base"));
const scale_controller_1 = __importDefault(require("./scale-controller"));
const cc_1 = require("cc");

const { v3, v2 } = cc_1;

const tempQuat_a = new cc_1.Quat();
let _controller;
class ScaleGizmo extends transform_base_1.default {
  _localScaleList = [];
  _offsetList = [];
  _center = new cc_1.Vec3();
  isNodeLocked(o) {
    return (
      !!o &&
      o.components.some((o) => o._objFlags & cc_1.CCObject.Flags.IsScaleLocked)
    );
  }
  init() {
    this.createController();
  }
  layer() {
    return "foreground";
  }
  onTargetUpdate() {
    if (_controller) {
      (this._controller = _controller).onControllerMouseDown =
        this.onControllerMouseDown.bind(this);
      _controller.onControllerMouseMove = this.onControllerMouseMove.bind(this);
      _controller.onControllerMouseUp = this.onControllerMouseUp.bind(this);
    }

    super.onTargetUpdate();
  }
  createController() {
    if (_controller) {
      this._controller = _controller;
    } else {
      this._controller = _controller = new scale_controller_1.default(
        this.getGizmoRoot()
      );
    }

    this._controller.onControllerMouseDown =
      this.onControllerMouseDown.bind(this);
    this._controller.onControllerMouseMove =
      this.onControllerMouseMove.bind(this);
    this._controller.onControllerMouseUp = this.onControllerMouseUp.bind(this);
  }
  onControllerMouseDown() {
    if (this._controller) {
      this._controller.isLock = this.nodes.some((o) => this.isNodeLocked(o));
    }

    this._localScaleList = [];
    var t = this.nodes;
    for (let o = 0; o < t.length; ++o) {
      var e = t[o];
      var r = v3();
      e.getScale(r);
      this._localScaleList.push(r);
    }
    if (this._controller.transformToolData.pivot === "center") {
      this._center = GizmoUtils.getCenterWorldPos3D(this.nodes);
      for (let o = (this._offsetList.length = 0); o < t.length; ++o) {
        var l = NodeUtils.getWorldPosition3D(t[o]);
        var l = new cc_1.Vec3(l);
        l.subtract(this._center);
        this._offsetList.push(l);
      }
    }
  }
  onControllerMouseMove(o) {
    this.updateDataFromController(o);
  }
  onControllerMouseUp() {
    if (this._controller.updated) {
      this.onControlEnd("scale");
    }
  }
  onKeyDown(o) {
    if (!this.nodes || this.nodes.length === 0) {
      return true;
    }
    var t = o.key.toLowerCase();
    if (
      t !== "arrowleft" &&
      t !== "arrowright" &&
      t !== "arrowup" &&
      t !== "arrowdown"
    ) {
      return super.onKeyUp(o);
    }
    o = o.shiftKey ? 1 : 0.1;
    const e = v2();

    switch (t) {
      case "arrowleft":
        e.x = -1 * o;
        break;
      case "arrowright":
        e.x = o;
        break;
      case "arrowup":
        e.y = o;
        break;
      case "arrowdown":
        e.y = -1 * o;
        break;
    }

    this.onControlUpdate("scale");
    const r = v3();

    this.nodes.forEach((o) => {
      o.getScale(r);
      r.x = r.x + e.x;
      r.y = r.y + e.y;
      this.setScaleWithPrecision(o, r, 3);
    });

    utils_1.default.repaintEngine();
    return false;
  }
  onKeyUp(o) {
    var t;
    return (
      !this.nodes ||
      ("arrowleft" !== (t = o.key.toLowerCase()) &&
      t !== "arrowright" &&
      t !== "arrowup" &&
      t !== "arrowdown"
        ? super.onKeyUp(o)
        : (this.onControlEnd("scale"), false))
    );
  }
  setScaleWithPrecision(o, t, e) {
    t = NodeUtils.makeVec3InPrecision(t, e);
    o.setScale(t.x, t.y, t.z);
  }
  checkSnap(t, e) {
    var r = this._controller;
    var r_moveAxisName = r.moveAxisName;
    if (r_moveAxisName) {
      let o = 0;
      o = r_moveAxisName === "xyz" ? t.x : t[r_moveAxisName];
      o = this.getSnappedValue(o, e);

      if (r_moveAxisName === "xyz") {
        t.x = o;
        t.y = o;
        t.z = o;
      } else {
        t[r_moveAxisName] = o;
      }

      e = o * r.scaleFactor;
      r.onAxisSliderMove(r_moveAxisName, e);
    }
  }
  updateDataFromController(t) {
    if (this._controller.updated) {
      this.onControlUpdate("scale");
      let o;
      var e;
      var r = this._controller.getDeltaScale();
      var l = this._controller.transformToolData.snapConfigs;

      if (this.isControlKeyPressed(t) || l.isScaleSnapEnabled) {
        this.checkSnap(r, l.scale);
      }

      var s = v3(1 + r.x, 1 + r.y, 1 + r.z);

      var n = v3();
      var i = this.nodes;
      var a = new cc_1.Vec3();
      for (o = 0; o < this._localScaleList.length; ++o) {
        n.x = this._localScaleList[o].x * s.x;
        n.y = this._localScaleList[o].y * s.y;
        n.z = this._localScaleList[o].z * s.z;
        this.setScaleWithPrecision(i[o], n, 3);

        if (this._controller.transformToolData.pivot === "center") {
          e = v3(
            this._offsetList[o].x * s.x,
            this._offsetList[o].y * s.y,
            this._offsetList[o].z * s.z
          );

          a.set(this._center);
          a.add(e);
          NodeUtils.setWorldPosition3D(i[o], a);
        }
      }
    }
  }
  updateControllerTransform() {
    var t = this.nodes[0];
    if (t) {
      let o;
      var e = tempQuat_a;

      o =
        this._controller.transformToolData.pivot === "center"
          ? GizmoUtils.getCenterWorldPos3D(this.nodes)
          : NodeUtils.getWorldPosition3D(t);

      NodeUtils.getWorldRotation3D(t, e);
      this._controller.setPosition(o);
      this._controller.setRotation(e);
    }
  }
}
exports.default = ScaleGizmo;
