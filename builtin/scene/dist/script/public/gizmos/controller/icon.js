var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const quad_1 = __importDefault(require("./quad"));
const engine_1 = __importDefault(require("../utils/engine"));
const external_1 = __importDefault(require("../utils/external"));
const misc_1 = __importDefault(require("../utils/misc"));
const { setMaterialProperty, setMeshColor, setNodeOpacity } = engine_1.default;
const EditorCamera = external_1.default.EditorCamera;
const tempVec3_a = new cc_1.Vec3();
const tempVec3_b = new cc_1.Vec3();
class IconController extends quad_1.default {
  _is3DIcon = false;
  _visibility = false;
  constructor(e, t) {
    super(e, t);
    this.shape.name = "IconController";
    this.registerOrthoHeightChangedEvent();
    this._baseDist = 50;
    this._lockSize = true;
  }
  setTexture(e) {
    setMaterialProperty(this._quadNode, "mainTexture", e);
  }
  setTextureByUUID(e) {
    cc_1.assetManager.loadAny(e, (e, t) => {
      if (t) {
        this.setTexture(t);
        cce.Engine.repaintInEditMode();
      }
    });
  }
  setColor(e) {
    setMeshColor(this._quadNode, e);
  }
  set is3DIcon(e) {
    this._is3DIcon = e;

    if (!this._is3DIcon) {
      this.resetShapeScale();
    }

    this.onEditorCameraMoved();
  }
  getDistScalar() {
    let e = 1;
    return (e = this.isCameraInOrtho()
      ? this.getDistScalarInOrtho()
      : this.getCameraDistScalar(this.getPosition()));
  }
  resetShapeScale() {
    this.shape.setScale(cc_1.Vec3.ONE);
  }
  onShow() {
    if (!this._eventsRegistered) {
      this.registerCameraMovedEvent();
      this.registerOrthoHeightChangedEvent();
      this._eventsRegistered = true;
    }

    this._visibility = true;
    this.onEditorCameraMoved();
  }
  onHide() {
    if (this._eventsRegistered) {
      this.unregisterCameraMoveEvent();
      this.unregisterOrthoHeightChangedEvent();
      this._eventsRegistered = false;
    }

    this._visibility = false;
  }
  onEditorCameraMoved() {
    super.onEditorCameraMoved();
    var e = tempVec3_a;

    var e =
      (EditorCamera.camera.node.getWorldPosition(e),
      cc_1.Vec3.distance(this.getPosition(tempVec3_b), e));

    var e = 255 * misc_1.default.LimitLerp(0, 1, e, 5, 10);
    setNodeOpacity(this._quadNode, e);

    if (this._visibility) {
      this.shape.active = e >= 50;
    }

    this.adjustControllerSize();
  }
  adjustControllerSize() {
    if (this._is3DIcon) {
      this.resetShapeScale();
    } else {
      super.adjustControllerSize();
    }
  }
}
exports.default = IconController;
