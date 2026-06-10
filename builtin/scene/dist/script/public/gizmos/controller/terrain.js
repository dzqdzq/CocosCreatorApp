var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = __importDefault(require("./base"));
const controller_shape_1 = __importDefault(
  require("../utils/controller-shape")
);
const controller_utils_1 = __importDefault(
  require("../utils/controller-utils")
);
const engine_1 = __importDefault(require("../utils/engine"));
const external_1 = __importDefault(require("../utils/external"));

const {
  getModel,
  updatePositions,
  AttributeName,
  updateBoundingBox,
  setNodeOpacity,
} = engine_1.default;

const EditorCamera = external_1.default.EditorCamera;
const NodeUtils = external_1.default.NodeUtils;
const v3_up = cc.v3(0, 1, 0);
class TerrainController extends base_1.default {
  _quadNode = null;
  _quadMR = null;
  _size = 10;
  constructor(e, t = {}) {
    super(e);
    this.initShape(t);
  }
  initShape(e) {
    this.createShapeNode("TerrainController");
    e = controller_utils_1.default.quad(
      cc.v3(),
      this._size,
      this._size,
      v3_up,
      cc.Color.WHITE,
      e
    );
    e.parent = this.shape;
    this._quadNode = e;
    this._quadMR = getModel(this._quadNode);
    setNodeOpacity(this._quadNode, 0);
    this.registerMouseEvents(this._quadNode, "quad");
  }
  onMouseDown(e) {
    if (this.onControllerMouseDown) {
      this.onControllerMouseDown(e);
    }
  }
  onMouseMove(e) {
    if (this.onControllerMouseMove) {
      this.onControllerMouseMove(e);
    }
  }
  onMouseUp(e) {
    if (this.onControllerMouseUp) {
      this.onControllerMouseUp(e);
    }
  }
  onHoverIn(e) {}
  onHoverOut(e) {
    if (this.onControllerHoverOut) {
      this.onControllerHoverOut(e);
    }
  }
  onShow() {
    if (!this._eventsRegistered) {
      this.registerCameraMovedEvent();
      this._eventsRegistered = true;
    }
  }
  onHide() {
    if (this._eventsRegistered) {
      this.unregisterCameraMoveEvent();
      this._eventsRegistered = false;
    }
  }
  updateWorldPosition(e) {
    if (this._quadNode) {
      this._quadNode.setWorldPosition(e);
    }
  }
  updateSize(e, t) {
    var o = cc.v3(e / 2, 0, t / 2);
    var o = controller_shape_1.default.calcQuadData(o, e, t, v3_up);

    if (this._quadMR) {
      updatePositions(this._quadMR, o.positions);
      updateBoundingBox(this._quadMR, o.minPos, o.maxPos);
    }
  }
}
exports.default = TerrainController;
