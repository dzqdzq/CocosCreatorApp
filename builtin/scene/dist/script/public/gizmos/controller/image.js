var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const base_1 = __importDefault(require("./base"));
const controller_utils_1 = __importDefault(
  require("../utils/controller-utils")
);
const controller_shape_1 = __importDefault(
  require("../utils/controller-shape")
);
const engine_1 = __importDefault(require("../utils/engine"));
const { setMaterialProperty, updatePositions, getModel } = engine_1.default;
class ImageController extends base_1.default {
  _center = new cc_1.Vec3();
  _size = new cc_1.Vec2(100, 100);
  _imageNode = null;
  _imageMR = null;
  constructor(e, t) {
    super(e);
    this.initShape(t);
  }
  initShape(e) {
    this.createShapeNode("ImageController");

    this._imageNode = controller_utils_1.default.quad(
      this._center,
      this._size.x,
      this._size.y,
      cc_1.Vec3.UNIT_Z,
      cc.Color.WHITE,
      e
    );

    this._imageNode.parent = this.shape;
    this._imageNode.position = new cc_1.Vec3(0, 0, -0.01);
    this._imageMR = getModel(this._imageNode);
    this.initHandle(this._imageNode, e?.name);
  }
  setTexture(e) {
    setMaterialProperty(this._imageNode, "mainTexture", e);
  }
  setTextureByUUID(e) {
    cc_1.assetManager.loadAny(e, (e, t) => {
      if (t) {
        this.setTexture(t);
        cce.Engine.repaintInEditMode();
      }
    });
  }
  updateSize(e, t) {
    this._center = e;
    this._size = t;
    e = controller_shape_1.default.calcQuadData(
      this._center,
      this._size.x,
      this._size.y,
      cc_1.Vec3.UNIT_Z
    );

    if (this._imageMR && this._imageMR.model) {
      this._imageMR.model.createBoundingShape(e.minPos, e.maxPos);
      this._imageMR.model.updateWorldBound();
      updatePositions(this._imageMR, e.positions);
    }
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
}
exports.default = ImageController;
