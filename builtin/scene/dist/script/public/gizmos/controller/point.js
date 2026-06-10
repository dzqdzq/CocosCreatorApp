var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const controller_utils_1 = __importDefault(
  require("../utils/controller-utils")
);
const base_1 = __importDefault(require("./base"));
const engine_1 = __importDefault(require("../utils/engine"));
const { setMeshColor, setNodeOpacity } = engine_1.default;
class PointController extends base_1.default {
  _pointNode = null;
  constructor(e) {
    super(e);
    this._color = cc_1.Color.GREEN;
    this.initShape();
  }
  setColor(e) {
    this._color = e;
    setMeshColor(this._pointNode, e);
  }
  initShape() {
    this.createShapeNode("PointController");

    this._pointNode = controller_utils_1.default.sphere(
      new cc_1.Vec3(),
      0.05,
      this._color,
      { unlit: true }
    );

    this._pointNode.parent = this.shape;
  }
  updateData(e) {
    this._pointNode?.setPosition(e);
  }
}
exports.default = PointController;
