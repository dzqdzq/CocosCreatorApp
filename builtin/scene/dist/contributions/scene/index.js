var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.infobars = undefined;
exports.toolbars = undefined;
exports.floatWindows = undefined;

const particle_system_1 = __importDefault(
  require("./float-windows/particle-system")
);

const terrain_1 = __importDefault(require("./float-windows/terrain"));
const preview_1 = __importDefault(require("./float-windows/preview"));

exports.floatWindows = [
  particle_system_1.default,
  terrain_1.default,
  preview_1.default,
];

const dimension_1 = __importDefault(require("./toolbars/dimension"));

const gizmo_1 = __importDefault(require("./toolbars/gizmo"));
const camera2d_1 = __importDefault(require("./toolbars/camera2d"));
const camera3d_1 = __importDefault(require("./toolbars/camera3d"));
const terrain_2 = __importDefault(require("./toolbars/terrain"));
const scene_light_1 = __importDefault(require("./toolbars/scene-light"));
const debug_view_1 = __importDefault(require("./toolbars/debug-view"));
const scene_toolbar_1 = __importDefault(require("./toolbars/scene-toolbar"));
const align_2d_1 = __importDefault(require("./toolbars/align-2d"));

exports.toolbars = [
  debug_view_1.default,
  dimension_1.default,
  scene_toolbar_1.default,
  scene_light_1.default,
  camera2d_1.default,
  camera3d_1.default,
  gizmo_1.default,
  align_2d_1.default,
  terrain_2.default,
];

const prefab_mode_1 = __importDefault(require("./infobars/prefab-mode"));

const animation_mode_1 = __importDefault(require("./infobars/animation-mode"));
exports.infobars = [prefab_mode_1.default, animation_mode_1.default];
