var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialImporter = undefined;
const asset_1 = __importDefault(require("./asset"));
class MaterialImporter extends asset_1.default {
  get version() {
    return "1.0.0";
  }
  get name() {
    return "instantiation-material";
  }
  get assetType() {
    return "cc.Material";
  }
}
exports.MaterialImporter = MaterialImporter;
