var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const external_1 = __importDefault(require("../../utils/external"));
const utils_1 = __importDefault(require("../../utils"));
const camera_1 = __importDefault(require("../../../../3d/manager/camera"));
const lod_group_utils_1 = require("cc/editor/lod-group-utils");
const base_1 = require("../base");
const controller_lod_1 = __importDefault(require("./controller-lod"));
const NodeUtils = external_1.default.NodeUtils;
const tempQuat_a = new cc_1.Quat();
class LODGroupGizmo extends base_1.SelectGizmo {
  _controller;
  init() {
    this.createController();
  }
  onEditorCameraMoved() {
    this.updateController();
  }
  onShow() {
    this._controller.show();
    this.registerCameraMovedEvent();
    this.updateController();
  }
  onHide() {
    this.unregisterCameraMoveEvent();
    this._controller.hide();
  }
  createController() {
    var t = this.getGizmoRoot();
    this._controller = new controller_lod_1.default(t);
    this._controller.onControllerMouseDown =
      this.onControllerMouseDown.bind(this);
    this._controller.onControllerMouseMove =
      this.onControllerMouseMove.bind(this);
    this._controller.onControllerMouseUp = this.onControllerMouseUp.bind(this);
  }
  onControllerMouseDown() {}
  onControllerMouseMove() {}
  onControllerMouseUp() {
    if (this.target) {
      utils_1.default.select(this.target.node.uuid);
    }
  }
  updateControllerData() {
    var t;
    var e;
    var o;

    if (
      this._isInitialized &&
      this.target &&
      this.target instanceof cc_1.LODGroup
    ) {
      ({ x: t, y: e, z: o } = this.target.node.scale);
      t = Math.max(Math.abs(t), Math.abs(e), Math.abs(o));
      e = this.target.objectSize;
      this._controller.show();
      this._controller.updateSize(cc_1.Vec3.ZERO, cc.v2(t * e, t * e));

      o = lod_group_utils_1.LODGroupEditorUtility.getVisibleLOD(
        this.target,
        camera_1.default.camera.camera
      );

      this._controller.setString(
        -1 !== o ? "LOD " + o : Editor.I18n.t("scene.lod.culled")
      );
    }
  }
  updateControllerTransform() {
    var t;

    if (this._isInitialized && this.target !== null) {
      t = this.target.node;
      t = NodeUtils.getWorldPosition3D(t);
      t = (this._controller.setPosition(t), camera_1.default.getCurCameraInfo())
        .rotation;
      tempQuat_a.set(t.x, t.y, t.z, t.w);
      this._controller.setRotation(tempQuat_a);
    }
  }
  updateController() {
    this.updateControllerData();
    this.updateControllerTransform();
    cce.Engine.repaintInEditMode();
  }
  onTargetUpdate() {
    this.updateController();
  }
  onNodeChanged() {
    this.updateController();
  }
}
exports.default = LODGroupGizmo;
