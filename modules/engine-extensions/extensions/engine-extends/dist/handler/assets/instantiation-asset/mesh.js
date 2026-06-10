var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeshHandler = undefined;
const asset_1 = __importDefault(require("./asset"));

exports.MeshHandler = {
  name: "instantiation-mesh",
  assetType: "cc.Mesh",
  importer: { ...asset_1.default.importer, version: "1.0.0" },
};

exports.default = exports.MeshHandler;
