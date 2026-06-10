var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

exports.SelectGizmo = undefined;
exports.PersistentGizmo = undefined;
exports.IconGizmo = undefined;
exports.name = undefined;

const cc_1 = require("cc");
const gizmo_persistent_1 = __importDefault(require("./gizmo-persistent"));
exports.name = cc_1.js.getClassName(cc_1.WebView);
exports.IconGizmo = null;
exports.PersistentGizmo = gizmo_persistent_1.default;
exports.SelectGizmo = null;
