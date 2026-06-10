var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.serialize = serialize;
exports.serializeCompiled = serializeCompiled;
const builder_1 = require("./compiled/builder");
const pack_jsons_1 = __importDefault(require("./compiled/pack-jsons"));
const parser_1 = __importDefault(require("./parser"));
const dynamic_builder_1 = require("./dynamic-builder");
function serialize(e, i) {
  i = Object.assign({ builder: "dynamic" }, i);
  return (0, parser_1.default)(e, i);
}
function serializeCompiled(e, i) {
  i = Object.assign({ builder: "compiled", dontStripDefault: false }, i);
  return (0, parser_1.default)(e, i);
}
serialize.asAsset = dynamic_builder_1.asAsset;
serialize.setName = dynamic_builder_1.setName;
serialize.findRootObject = dynamic_builder_1.findRootObject;
serializeCompiled.getRootData = builder_1.getRootData;
serializeCompiled.packJSONs = pack_jsons_1.default;
