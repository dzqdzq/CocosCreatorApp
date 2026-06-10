var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const controller_shape_1 = __importDefault(
  require("../utils/controller-shape")
);
const controller_utils_1 = __importDefault(
  require("../utils/controller-utils")
);
const base_1 = __importDefault(require("./base"));
const engine_1 = __importDefault(require("../utils/engine"));
const { getModel, setMeshColor, updatePositions } = engine_1.default;
class TriangleController extends base_1.default {
  _edgesNode;
  _edgesMR = null;
  _indices = [0, 1, 1, 2, 2, 0];
  constructor(e) {
    super(e);
    this.initShape();
  }
  setColor(e) {
    this._color = e;
    setMeshColor(this._edgesNode, e);
  }
  initShape() {
    this.createShapeNode("TriangleController");

    this._edgesNode = controller_utils_1.default.lines(
      [new cc_1.Vec3(), new cc_1.Vec3(), new cc_1.Vec3()],
      this._indices,
      this._color,
      { unlit: true }
    );

    this._edgesMR = getModel(this._edgesNode);
    this._edgesNode.parent = this.shape;
  }
  updateData(e, t, s) {
    e = controller_shape_1.default.calcLinesData([e, t, s], this._indices);

    if (this._edgesMR) {
      updatePositions(this._edgesMR, e.positions);
    }
  }
  getDistScalar() {
    return 1;
  }
}
exports.default = TriangleController;
