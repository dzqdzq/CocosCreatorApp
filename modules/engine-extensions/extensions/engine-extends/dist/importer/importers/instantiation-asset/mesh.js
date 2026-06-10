var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeshImporter = undefined;
const asset_1 = __importDefault(require("./asset"));
class MeshImporter extends asset_1.default {
  get version() {
    return "1.0.0";
  }
  get name() {
    return "instantiation-mesh";
  }
  get assetType() {
    return "cc.Mesh";
  }
}
exports.MeshImporter = MeshImporter;
