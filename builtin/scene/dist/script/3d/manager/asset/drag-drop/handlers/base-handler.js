var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseHandler = undefined;
const cc_1 = require("cc");

const { adjustXY } = require("./utils");

const node_1 = __importDefault(require("../../../../../utils/node"));
const camera_1 = __importDefault(require("../../../camera"));
class BaseHandler {
  acceptedTypes = [];
  excludedTypes = [];
  canDrop(t) {
    return (
      t.length !== 0 &&
      !!(
        this.acceptedTypes.length === 0 ||
        this.acceptedTypes.includes(t[0].type)
      ) &&
      !t.some((e) => this.excludedTypes.includes(e.type)) &&
      t.every((e) => e.type === t[0].type)
    );
  }
  getRaycastResultNodes(e, t) {
    e = adjustXY(e, t);

    t = cc_1.Layers.makeMaskExclude([
      cc_1.Layers.BitMask.GIZMOS,
      cc_1.Layers.Enum.SCENE_GIZMO,
    ]);

    return node_1.default.getFilteredRaycastNodes(
      camera_1.default.getCamera(),
      e.x,
      e.y,
      t
    );
  }
}
exports.BaseHandler = BaseHandler;
