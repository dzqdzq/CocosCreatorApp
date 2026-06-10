var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const gizmo_select_1 = __importDefault(require("./gizmo-select"));
const external_1 = __importDefault(require("../../utils/external"));
const config_1 = __importDefault(require("../../utils/config"));
const utils_1 = __importDefault(require("../../utils"));
const icon_1 = __importDefault(require("../../controller/icon"));
const NodeUtils = external_1.default.NodeUtils;
const tempQuat_a = new cc_1.Quat();
class IconGizmoBase extends gizmo_select_1.default {
  _controller;
  _isIconGizmoVisible = false;
  disableOnSelected = false;
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
  setIconGizmoVisible(e) {
    if ((this._isIconGizmoVisible = e)) {
      this.show();
    } else {
      this.hide();
    }
  }
  setIconGizmo3D(e) {
    if (this._controller && (this._controller.is3DIcon = e)) {
      this._controller.updateSize(config_1.default.iconGizmoSize);
    }
  }
  setIconGizmoSize(e) {
    if (this._controller) {
      this._controller.updateSize(e);
    }
  }
  createController() {
    var e = this.getGizmoRoot();
    this._controller = new icon_1.default(e, { texture: true });
    this._controller.onControllerMouseDown =
      this.onControllerMouseDown.bind(this);
    this._controller.onControllerMouseMove =
      this.onControllerMouseMove.bind(this);
    this._controller.onControllerMouseUp = this.onControllerMouseUp.bind(this);
    this._controller.is3DIcon = config_1.default.isIconGizmo3D;
    this._controller.updateSize(config_1.default.iconGizmoSize);

    if (!this._isIconGizmoVisible) {
      this._controller.hide();
    }
  }
  onControllerMouseDown() {}
  onControllerMouseMove() {}
  onControllerMouseUp() {
    if (this.target) {
      utils_1.default.select(this.target.node.uuid);
    }
  }
  updateController() {
    this.updateControllerTransform();
  }
  updateControllerTransform() {
    var e;
    var t;
    var o;

    if (this._isInitialized && this.target !== null) {
      e = this.target.node;
      t = NodeUtils.getWorldPosition3D(e);
      o = tempQuat_a;
      NodeUtils.getWorldRotation3D(e, o);
      this._controller.setPosition(t);
      this._controller.setRotation(o);
      this._controller.onEditorCameraMoved();
    }
  }
  onTargetUpdate() {
    this.updateController();
  }
  onNodeChanged(e) {
    this.updateController();
  }
  onNodeSelectionChanged(e) {
    super.onNodeSelectionChanged(e);

    if (e && this.disableOnSelected) {
      this.hide();
    } else if (!e) {
      this.show();
    }
  }
  checkVisible() {
    return (
      !(
        !this.target ||
        !this._isIconGizmoVisible ||
        (this._nodeSelected && this.disableOnSelected) ||
        this.target.node.objFlags & cc.Object.Flags.LockedInEditor
      ) && super.checkVisible()
    );
  }
}
exports.default = IconGizmoBase;
