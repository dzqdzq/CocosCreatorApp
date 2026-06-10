var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const controller_utils_1 = __importDefault(
  require("../../utils/controller-utils")
);
const base_1 = __importDefault(require("../../controller/base"));
const engine_1 = __importDefault(require("../../utils/engine"));
const setNodeOpacity = engine_1.default.setNodeOpacity;
const tempVec3_a = new cc_1.Vec3();
const tempQuat_a = new cc_1.Quat();
class PlaneController extends base_1.default {
  _planeNode = null;
  _arrowNode = null;
  constructor(e) {
    super(e);
    this._color = cc_1.Color.GREEN;
    this._lockSize = true;
    this.initShape();
    this.registerCameraMovedEvent();
  }
  initShape() {
    this.createShapeNode("PlaneController");

    this._planeNode = controller_utils_1.default.quad(
      cc_1.Vec3.ZERO,
      200,
      200,
      cc_1.Vec3.UNIT_Y,
      this._color,
      { unlit: true }
    );

    setNodeOpacity(this._planeNode, 128);
    this._planeNode.parent = this.shape;

    this._arrowNode = controller_utils_1.default.lineTo(
      cc_1.Vec3.ZERO,
      new cc_1.Vec3(0, 100, 0),
      this._color,
      { forwardPipeline: true }
    );

    this._arrowNode.parent = this.shape;
  }
  updateData(e, t) {
    this._planeNode?.setPosition(e);
    this._arrowNode?.setPosition(e);
    cc_1.Vec3.normalize(tempVec3_a, t);
    cc_1.Quat.rotationTo(tempQuat_a, cc_1.Vec3.UNIT_Y, tempVec3_a);
    this._planeNode?.setRotation(tempQuat_a);
    this._arrowNode?.setRotation(tempQuat_a);
  }
}
exports.default = PlaneController;
