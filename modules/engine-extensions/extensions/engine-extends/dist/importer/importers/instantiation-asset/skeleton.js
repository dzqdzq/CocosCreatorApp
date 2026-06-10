var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkeletonImporter = undefined;
const asset_1 = __importDefault(require("./asset"));
class SkeletonImporter extends asset_1.default {
  get version() {
    return "1.0.0";
  }
  get name() {
    return "instantiation-skeleton";
  }
  get assetType() {
    return "cc.Skeleton";
  }
}
exports.SkeletonImporter = SkeletonImporter;
