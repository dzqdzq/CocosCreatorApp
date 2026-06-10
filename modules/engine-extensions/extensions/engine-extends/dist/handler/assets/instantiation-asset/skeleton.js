var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkeletonHandler = undefined;
const asset_1 = __importDefault(require("./asset"));

exports.SkeletonHandler = {
  name: "instantiation-skeleton",
  assetType: "cc.Skeleton",
  importer: { ...asset_1.default.importer, version: "1.0.0" },
};

exports.default = exports.SkeletonHandler;
