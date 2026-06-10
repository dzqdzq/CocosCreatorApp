var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
const camera_1 = __importDefault(require("./camera"));
const utils_1 = require("./camera/utils");
const gizmos_1 = __importDefault(require("../../public/gizmos"));
const message_1 = require("./message");

gizmos_1.default.on("init", () => {
  camera_1.default.controller.on("camera-move-mode", (e) => {
    if (e === utils_1.CameraMoveMode.IDLE) {
      gizmos_1.default.lockGizmoTool(false);
    } else if (e === utils_1.CameraMoveMode.WANDER) {
      gizmos_1.default.lockGizmoTool(true);
    }
  });

  gizmos_1.default.transformToolData.addListener("dimension-changed", (e) => {
    camera_1.default.is2D = e;
    gizmos_1.default.onDimensionChanged(e);
    message_1.messageManager.broadcast("scene:dimension-changed", e);
  });
});

exports.default = gizmos_1.default;
