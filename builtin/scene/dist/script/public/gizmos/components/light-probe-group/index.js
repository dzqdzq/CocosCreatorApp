var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.SelectGizmo = undefined;
exports.PersistentGizmo = undefined;
exports.IconGizmo = undefined;
exports.name = undefined;

const cc_1 = require("cc");
const gizmo_icon_1 = __importDefault(require("./gizmo-icon"));
const gizmo_select_1 = __importDefault(require("./gizmo-select"));

const {
  changeEditMode,
  getEditMode,
  lightProbeInfoChanged,
} = require("./manager");

exports.name = cc_1.js.getClassName(cc_1.LightProbeGroup);
exports.IconGizmo = gizmo_icon_1.default;
exports.PersistentGizmo = null;
exports.SelectGizmo = gizmo_select_1.default;

exports.methods = {
  changeEditMode(e) {
    changeEditMode(e);
  },
  getEditMode() {
    return getEditMode();
  },
  lightProbeInfoChanged() {
    lightProbeInfoChanged();
  },
};
