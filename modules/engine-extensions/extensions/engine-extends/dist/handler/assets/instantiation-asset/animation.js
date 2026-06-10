var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimationHandler = undefined;
const asset_1 = __importDefault(require("./asset"));

exports.AnimationHandler = {
  name: "instantiation-animation",
  assetType: "cc.AnimationClip",
  importer: { ...asset_1.default.importer, version: "1.0.0" },
};

exports.default = exports.AnimationHandler;
