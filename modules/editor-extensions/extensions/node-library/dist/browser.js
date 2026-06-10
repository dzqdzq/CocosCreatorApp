var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;
exports.unload = unload;
const packageJson = require("../package.json");
const semver_1 = __importDefault(require("semver"));
async function load() {
  var e;
  var o;

  if (
    semver_1.default.gt(packageJson.version, "1.0.0") &&
    ((e = await Editor.Profile.getConfig("node-library", "custom")),
    (o = await Editor.Profile.getProject("node-library", "custom")),
    !(e && e[0] && e[0].items && e[0].items.length)) &&
    o &&
    o[0] &&
    o[0].items &&
    o.items.length
  ) {
    await Editor.Profile.setConfig("node-library", "custom", o);
  }
}
function unload() {}
exports.methods = {
  open() {
    Editor.Panel.open("node-library.panel");
  },
};
