var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const external_1 = __importDefault(require("../../utils/external"));
const base_1 = require("../base");
const controller_joint_2d_1 = require("./controller-joint-2d");
const NodeUtils = external_1.default.NodeUtils;
const tempVec2_a = new cc_1.Vec2();
const tempVec3_a = new cc_1.Vec3();
const tempVec3_b = new cc_1.Vec3();
const tempQuat_a = new cc_1.Quat();
const tempMat4 = new cc_1.Mat4();
class Joint2DGizmo extends base_1.SelectGizmo {
  _anchorController;
  _connectedAnchorController;
  _anchor = new cc_1.Vec2();
  _connectedAnchor = new cc_1.Vec2();
  _propPath = null;
  _anchorColor = new cc_1.Color(16, 180, 245);
  _connectedAnchorColor = new cc_1.Color(207, 105, 40);
  init() {
    this.createController();
  }
  createController() {
    var t = this.getGizmoRoot();
    this._anchorController = new controller_joint_2d_1.Joint2DController(t);
    this._anchorController.editable = true;
    this._anchorController.edit = true;
    this._anchorController.setColor(this._anchorColor);
    this._anchorController.onControllerMouseDown =
      this.onAnchorControllerMouseDown.bind(this);
    this._anchorController.onControllerMouseMove =
      this.onAnchorControllerMouseMove.bind(this);
    this._anchorController.onControllerMouseUp =
      this.onAnchorControllerMouseUp.bind(this);
    this._connectedAnchorController =
      new controller_joint_2d_1.Joint2DController(t);
    this._connectedAnchorController.editable = true;
    this._connectedAnchorController.edit = true;
    this._connectedAnchorController.setColor(this._connectedAnchorColor);
    this._connectedAnchorController.onControllerMouseDown =
      this.onConnectedAnchorControllerMouseDown.bind(this);
    this._connectedAnchorController.onControllerMouseMove =
      this.onConnectedAnchorControllerMouseMove.bind(this);
    this._connectedAnchorController.onControllerMouseUp =
      this.onAnchorControllerMouseUp.bind(this);
  }
  onShow() {
    this._anchorController.show();
    this.updateControllerData();
  }
  onHide() {
    this._anchorController.hide();
    this._connectedAnchorController.hide();
  }
  onAnchorControllerMouseDown() {
    if (this.target) {
      this._anchor.set(this.target.anchor);
      this._propPath = this.getCompPropPath("anchor");
    }
  }
  onAnchorControllerMouseMove() {
    var t;
    var o;

    if (this._anchorController.updated && this.target) {
      this.onControlUpdate(this._propPath);
      t = this.target.node;
      o = this._anchorController.getDeltaPos();
      tempVec3_a.set(o);

      t &&
        (t.getWorldMatrix(tempMat4),
        cc_1.Mat4.invert(tempMat4, tempMat4),
        cc_1.Vec3.transformMat4(tempVec3_a, tempVec3_a, tempMat4));

      NodeUtils.makeVec3InPrecision(tempVec3_a, 1);
      this.target.anchor.set(tempVec3_a.x, tempVec3_a.y);
      this.onComponentChanged(t);
    }
  }
  onAnchorControllerMouseUp() {
    this.onControlEnd(this._propPath);
  }
  onConnectedAnchorControllerMouseDown() {
    if (this._isInitialized && this.target !== null) {
      this._connectedAnchor.set(this.target.connectedAnchor);
      this._propPath = this.getCompPropPath("connectedAnchor");
    }
  }
  onConnectedAnchorControllerMouseMove() {
    var t;
    var o;

    if (this._connectedAnchorController.updated && this.target) {
      this.onControlUpdate(this._propPath);
      t = this.target.node;
      o = this._connectedAnchorController.getDeltaPos();
      tempVec3_a.set(o);

      (o = this.target).connectedBody?.node &&
        (o.connectedBody?.node.getWorldMatrix(tempMat4),
        cc_1.Mat4.invert(tempMat4, tempMat4),
        cc_1.Vec3.transformMat4(tempVec3_a, tempVec3_a, tempMat4));

      NodeUtils.makeVec3InPrecision(tempVec3_a, 1);
      this.target.connectedAnchor.set(tempVec3_a.x, tempVec3_a.y);
      this.onComponentChanged(t);
    }
  }
  updateControllerData() {
    if (this._isInitialized && this.target !== null) {
      this.updateAnchorControllerData();
    }
  }
  updateAnchorControllerData() {
    if (this.target) {
      var o = this.target;
      var o_anchor = o.anchor;
      var o_anchor =
        (tempVec3_a.set(o_anchor.x, o_anchor.y, 0), this.target.node);
      o_anchor.getWorldMatrix(tempMat4);
      let t = o_anchor.getWorldPosition();
      cc_1.Vec3.transformMat4(tempVec3_a, tempVec3_a, tempMat4);
      this._anchorController.updatePosition(t, tempVec3_a);
      this._connectedAnchorController.show();
      o_anchor = o.connectedAnchor;
      tempVec3_a.set(o_anchor.x, o_anchor.y, 0);

      t = o.connectedBody
        ? (o.connectedBody.node.getWorldMatrix(tempMat4),
          cc_1.Vec3.transformMat4(tempVec3_a, tempVec3_a, tempMat4),
          o.connectedBody.node.getWorldPosition())
        : new cc_1.Vec3(0, 0, 0);

      this._connectedAnchorController.updatePosition(t, tempVec3_a);
    }
  }
  onTargetUpdate() {
    this.updateControllerData();
  }
  onNodeChanged() {
    this.updateControllerData();
  }
}
exports.default = Joint2DGizmo;
