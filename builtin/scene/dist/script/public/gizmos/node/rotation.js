var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = __importDefault(require("../utils"));
const external_1 = __importDefault(require("../utils/external"));
const cc_1 = require("cc");
const transform_base_1 = __importDefault(require("./transform-base"));
const rotation_controller_1 = __importDefault(require("./rotation-controller"));
const NodeUtils = external_1.default.NodeUtils;
const GizmoUtils = utils_1.default.GizmoUtils;
const EditorMath = external_1.default.EditorMath;
const q_a = new cc_1.Quat();
const q_b = new cc_1.Quat();
const q_c = new cc_1.Quat();
const v3_a = new cc_1.Vec3();
const v3_b = new cc_1.Vec3();
const q_d = new cc_1.Quat();
let _controller;
function minAngularDistance(t, o) {
  return (
    Math.min(
      Math.abs(t.x - o.x),
      Math.abs((t.x < 0 ? 360 + t.x : t.x) - (o.x < 0 ? 360 + o.x : o.x))
    ) +
    Math.min(
      Math.abs(t.y - o.y),
      Math.abs((t.y < 0 ? 360 + t.y : t.y) - (o.y < 0 ? 360 + o.y : o.y))
    ) +
    Math.min(
      Math.abs(t.z - o.z),
      Math.abs((t.z < 0 ? 360 + t.z : t.z) - (o.z < 0 ? 360 + o.z : o.z))
    )
  );
}
class RotationGizmo extends transform_base_1.default {
  _rotList = [];
  _offsetList = [];
  _center = new cc_1.Vec3(0, 0);
  _rotating = false;
  _keydownDelta = null;
  _curDeltaAngle = 0;
  _curDeltaRotation = new cc_1.Quat();
  isNodeLocked(t) {
    return (
      !!t &&
      t.components.some(
        (t) => t._objFlags & cc_1.CCObject.Flags.IsRotationLocked
      )
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
    var t;

    if (_controller) {
      this._controller = _controller;
    } else {
      t = new rotation_controller_1.default(this.getGizmoRoot());
      this._controller = _controller = t;
    }

    this._controller.onControllerMouseDown =
      this.onControllerMouseDown.bind(this);
    this._controller.onControllerMouseMove =
      this.onControllerMouseMove.bind(this);
    this._controller.onControllerMouseUp = this.onControllerMouseUp.bind(this);
  }
  onControllerMouseDown() {
    if (this._controller) {
      this._controller.isLock = this.nodes.some((t) => this.isNodeLocked(t));
    }

    this._rotating = true;
    this._rotList = [];
    this._curDeltaAngle = 0;
    this._curDeltaRotation.set(0, 0, 0, 1);
    var o = this.nodes;
    for (let t = 0; t < o.length; ++t) {
      var e = NodeUtils.getWorldRotation3D(o[t]);
      this._rotList.push(e);
    }
    if (this._controller.transformToolData.pivot === "center") {
      this._center = GizmoUtils.getCenterWorldPos3D(this.nodes);
      for (let t = (this._offsetList.length = 0); t < o.length; ++t) {
        var r = NodeUtils.getWorldPosition3D(o[t]);
        var r = new cc_1.Vec3(r);
        r.subtract(this._center);
        this._offsetList.push(r);
      }
    }
    var t = this._controller.transformToolData.snapConfigs;
    var t = Math.max(t.rotation, 5);
    this._controller.setGraduation(t);
    utils_1.default.requestPointerLock();
  }
  onControllerMouseMove(t) {
    this.updateDataFromController(t);
  }
  onControllerMouseUp() {
    var t;

    if (this._controller.transformToolData.pivot === "center") {
      t = GizmoUtils.getCenterWorldPos3D(this.nodes);
      this._controller.setPosition(t);
      this._controller.setRotation(cc_1.Quat.IDENTITY);
    }

    this._rotating = false;

    if (this._controller.updated) {
      this.onControlEnd("rotation");
    }

    this.updateControllerTransform();
    utils_1.default.exitPointerLock();
    this._controller.hideGraduation();
    this._curDeltaRotation.set(0, 0, 0, 1);
  }
  onKeyDown(o) {
    if (this.nodes && this.nodes.length !== 0) {
      var e = o.key.toLowerCase();
      if (
        e !== "arrowleft" &&
        e !== "arrowright" &&
        e !== "arrowup" &&
        e !== "arrowdown"
      ) {
        return super.onKeyDown(o);
      }
      this._rotating = true;
      let t = o.shiftKey ? 10 : 1;

      if (e === "arrowright" || e === "arrowdown") {
        t *= -1;
      }

      if (!this._keydownDelta) {
        this._keydownDelta = 0;
        var r = this.nodes;
        this._rotList = [];
        for (let t = 0; t < r.length; ++t) {
          this._rotList.push(r[t].angle);
        }
      }

      this._keydownDelta += t;
      this._curDeltaAngle = this._keydownDelta;
      o = EditorMath.deg2rad(this._curDeltaAngle);
      cc_1.Quat.fromAxisAngle(this._curDeltaRotation, cc_1.Vec3.UNIT_Z, o);
      this.onControlUpdate("rotation");
      this.updateRotationByZDeltaAngle(this._keydownDelta);
      utils_1.default.repaintEngine();
      return false;
    }
  }
  onKeyUp(t) {
    var o;
    return (
      !this.nodes ||
      this.nodes.length === 0 ||
      ("arrowleft" !== (o = t.key.toLowerCase()) &&
      o !== "arrowright" &&
      o !== "arrowup" &&
      o !== "arrowdown"
        ? super.onKeyUp(t)
        : (this._controller.transformToolData.pivot === "center" &&
            ((o = GizmoUtils.getCenterWorldPos3D(this.nodes)),
            this._controller.setPosition(o),
            this._controller.setRotation(cc_1.Quat.IDENTITY)),
          (this._keydownDelta = null),
          (this._rotating = false),
          this.onControlEnd("rotation"),
          this.updateControllerTransform(),
          utils_1.default.repaintEngine(),
          false))
    );
  }
  updateDataFromController(t) {
    this.updateDataFromController3D(t);
  }
  getLocalRotFromWorldRot(t, o, e) {
    if (t.parent) {
      t.parent.getWorldRotation(q_c);
      cc_1.Quat.multiply(e, cc_1.Quat.conjugate(q_c, q_c), o);
    } else {
      e = o;
    }

    return e;
  }
  repeat(t, o) {
    return t - Math.floor(t / o) * o;
  }
  setNodeWorldRotation3D(t, o) {
    var e = q_b;
    var o = (this.getLocalRotFromWorldRot(t, o, e), t.eulerAngles);

    var e =
      (cc_1.Quat.toEuler(v3_a, e, false),
      cc_1.Quat.toEuler(v3_b, e, true),
      minAngularDistance(v3_a, o) < minAngularDistance(v3_b, o) ? v3_a : v3_b);

    e.x = this.repeat(e.x - o.x + 180, 360) + o.x - 180;
    e.y = this.repeat(e.y - o.y + 180, 360) + o.y - 180;
    e.z = this.repeat(e.z - o.z + 180, 360) + o.z - 180;
    NodeUtils.makeVec3InPrecision(e, 3);
    t.eulerAngles = e;
  }
  checkSnap(t, o, e, r) {
    this._curDeltaAngle = this.getSnappedValue(o, r);
    o = EditorMath.deg2rad(this._curDeltaAngle);
    cc_1.Quat.fromAxisAngle(t, e, o);
    return t;
  }
  updateDataFromController3D(o) {
    if (this._controller.updated) {
      this.onControlUpdate("rotation");
      let t;
      var e = q_b;
      var r = this._controller;
      this._curDeltaAngle = r.getDeltaAngle();
      var n = r.getDeltaRotation();
      var l = this.nodes;
      var i = this._controller.transformToolData.snapConfigs;

      if (this.isControlKeyPressed(o) || i.isRotationSnapEnabled) {
        this.checkSnap(n, r.getDeltaAngle(), r.getHandleAxisDir(), i.rotation);

        r.showGraduation();
      }

      cc_1.Quat.copy(this._curDeltaRotation, n);

      if (this._controller.transformToolData.pivot === "center") {
        for (t = 0; t < l.length; ++t) {
          var a = this._rotList[t];
          if (a === null) {
            return;
          }

          if (this._controller.transformToolData.coordinate === "global") {
            cc_1.Quat.multiply(e, n, a);
          } else {
            cc_1.Quat.multiply(e, a, n);
          }

          a = v3_b;
          cc_1.Vec3.transformQuat(a, this._offsetList[t], n);
          v3_a.set(this._center);
          v3_a.add(a);
          NodeUtils.setWorldPosition3D(l[t], v3_a);
          this.setNodeWorldRotation3D(l[t], e);
        }
      } else {
        for (t = 0; t < l.length; ++t) {
          if (this._controller.transformToolData.coordinate === "global") {
            cc_1.Quat.multiply(e, n, this._rotList[t]);
          } else {
            cc_1.Quat.multiply(e, this._rotList[t], n);
          }

          this.setNodeWorldRotation3D(l[t], e);
        }
      }
    }
  }
  updateDataFromController2D(o) {
    if (this._controller.updated) {
      this.onControlUpdate("rotation");
      let t = this._controller.getDeltaAngle();
      var e = this._controller.transformToolData.snapConfigs;

      if (o.ctrlKey || e.isRotationSnapEnabled) {
        t = this.getSnappedValue(t, e.rotation);
      }

      this.updateRotationByZDeltaAngle(t);
    }
  }
  updateRotationByZDeltaAngle(t) {
    let o;
    t = EditorMath.toPrecision(t, 3);
    var e = q_a;
    var r = this.nodes;
    if (this._controller.transformToolData.pivot === "center") {
      for (o = 0; o < r.length; ++o) {
        var n = this._rotList[o];
        if (n === null) {
          return;
        }
        r[o].angle = n + t;
        cc_1.Quat.fromEuler(e, 0, 0, t);
        n = new cc_1.Vec3();
        cc_1.Vec3.transformQuat(n, this._offsetList[o], e);
        v3_a.set(this._center);
        v3_a.add(n);
        NodeUtils.setWorldPosition3D(r[o], v3_a);
      }
    } else {
      for (o = 0; o < r.length; ++o) {
        var l = this._rotList[o] + t;
        r[o].angle = l;
      }
    }
  }
  updateControllerTransform() {
    var o = this.nodes[0];
    if (o) {
      let t;
      var e = q_a;
      cc_1.Quat.identity(e);

      if (this._controller.transformToolData.pivot === "center") {
        if (this._rotating) {
          return;
        }
        t = GizmoUtils.getCenterWorldPos3D(this.nodes);
      } else {
        t = NodeUtils.getWorldPosition3D(o);
      }

      var r = this._controller;

      if (this._controller.transformToolData.coordinate === "global") {
        if (this._rotating) {
          cc_1.Quat.copy(e, this._curDeltaRotation);
        }
      } else {
        NodeUtils.getWorldRotation3D(o, e);
        this._controller.setRotation(e);
      }

      if (this._rotating) {
        r.updateRotationIndicator(
          r.transformAxisDir,
          r.indicatorStartDir,
          EditorMath.deg2rad(this._curDeltaAngle)
        );
      }

      this._controller.setPosition(t);
      this._controller.setRotation(e);
    }
  }
}
exports.default = RotationGizmo;
