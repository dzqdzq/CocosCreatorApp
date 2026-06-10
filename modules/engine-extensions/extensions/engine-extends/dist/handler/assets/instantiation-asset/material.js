var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialHandler = undefined;
const asset_1 = __importDefault(require("./asset"));

exports.MaterialHandler = {
  name: "instantiation-material",
  assetType: "cc.Material",
  importer: { ...asset_1.default.importer, version: "1.0.0" },
};

exports.default = exports.MaterialHandler;
