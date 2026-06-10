var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = __importDefault(require("../../../utils/node"));
const math_1 = __importDefault(require("../../../utils/math"));
const camera_1 = __importDefault(require("../../../3d/manager/camera"));
const aabb_1 = __importDefault(require("../../../utils/aabb"));
class External {
  NodeUtils = node_1.default;
  EditorMath = math_1.default;
  EditorCamera = camera_1.default;
  GeometryUtils = {
    aabb: aabb_1.default,
    calculateNormals: EditorExtends.GeometryUtils.calculateNormals,
  };
}
const external = new External();
exports.default = external;
