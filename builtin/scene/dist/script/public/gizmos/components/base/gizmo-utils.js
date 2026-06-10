var __importDefault =
  (this && this.__importDefault) ||
  ((i) => (i && i.__esModule ? i : { default: i }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.gizmoVisibilityCheck = gizmoVisibilityCheck;
const cc_1 = require("cc");
const config_1 = __importDefault(require("../../utils/config"));

const showOnDisableGizmoTools = [
  "RotationGizmo",
  "PositionGizmo",
  "ScaleGizmo",
  "RectGizmo",
  "TerrainGizmo",
  "TransformGizmo",
];

function gizmoVisibilityCheck(i) {
  if ((cce.Gizmo && cce.Gizmo.is2D) || config_1.default.toolsVisibility3d) {
    return true;
  }
  const o = cc_1.js.getClassName(i);
  return Boolean(showOnDisableGizmoTools.find((i) => i === o));
}
