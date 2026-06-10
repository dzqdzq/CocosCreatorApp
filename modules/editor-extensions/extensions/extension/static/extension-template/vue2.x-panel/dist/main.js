var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.unload = undefined;
exports.load = undefined;
exports.methods = undefined;
const package_json_1 = __importDefault(require("../package.json"));
function load() {}
function unload() {}

exports.methods = {
  openPanel() {
    Editor.Panel.open(package_json_1.default.name);
  },
};

exports.load = load;
exports.unload = unload;
