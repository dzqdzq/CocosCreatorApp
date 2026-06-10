var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const base_1 = __importDefault(require("./base"));
const controller_utils_1 = __importDefault(
  require("../utils/controller-utils")
);
const engine_1 = __importDefault(require("../utils/engine"));
const external_1 = __importDefault(require("../utils/external"));
const setMaterialProperty = engine_1.default.setMaterialProperty;
const EditorCamera = external_1.default.EditorCamera;
const tempQuat_a = new cc_1.Quat();
class QuadController extends base_1.default {
  _quadNode = null;
  _defaultSize = 1;
  _size = this._defaultSize;
  _hoverColor = cc_1.Color.GREEN;
  constructor(e, t) {
    super(e);
    this.initShape(t);
    this.registerCameraMovedEvent();
    this._eventsRegistered = true;
  }
  get hoverColor() {
    return this._hoverColor;
  }
  set hoverColor(e) {
    this._hoverColor = e;
  }
  initShape(e) {
    this.createShapeNode("QuadController");
    let t = this._defaultSize;

    if (e && e.size) {
      t = e.size;
    }

    e = controller_utils_1.default.quad(
      cc.v3(),
      this._defaultSize,
      this._defaultSize,
      cc.v3(0, 0, 1),
      cc.Color.WHITE,
      e
    );
    e.parent = this.shape;
    this._quadNode = e;
    this.updateSize(t);
    this.registerMouseEvents(this._quadNode, "quad");
  }
  onMouseDown(e) {
    e.propagationStopped = true;

    if (this.onControllerMouseDown) {
      this.onControllerMouseDown(e);
    }
  }
  onMouseMove(e) {
    e.propagationStopped = true;

    if (this.onControllerMouseMove) {
      this.onControllerMouseMove(e);
    }
  }
  onMouseUp(e) {
    e.propagationStopped = true;

    if (this.onControllerMouseUp) {
      this.onControllerMouseUp(e);
    }
  }
  onHoverIn(e) {}
  onHoverOut() {}
  onEditorCameraMoved() {
    var e = EditorCamera.camera.node;
    var t = tempQuat_a;
    e.getWorldRotation(t);
    this._quadNode.setWorldRotation(t);
  }
  onShow() {
    if (!this._eventsRegistered) {
      this.registerCameraMovedEvent();
      this._eventsRegistered = true;
    }

    this.onEditorCameraMoved();
  }
  onHide() {
    if (this._eventsRegistered) {
      this.unregisterCameraMoveEvent();
      this._eventsRegistered = false;
    }
  }
  updateSize(e) {
    var t = e / this._defaultSize;
    this._size = e;
    this._quadNode.setScale(cc.v3(t, t, t));
  }
  setMaterialProperty(e, t) {
    setMaterialProperty(this._quadNode, e, t);
  }
}
exports.default = QuadController;
