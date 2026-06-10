var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
function _getProjectPath() {
  return path_1.default.dirname(Manager.AssetWorker.assets.options.target);
}
