var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPathConfig = getPathConfig;
exports.readConfigs = readConfigs;
const path_1 = __importDefault(require("path"));
function getPathConfig() {
  return {
    project: path_1.default.join(Editor.Project.path, "extensions"),
    global: path_1.default.join(
      Editor.App.home,
      "builtin-extensions",
      Editor.App.version
    ),
    builtin: Editor.App.path,
  };
}
async function readConfigs() {
  var t = getPathConfig();
  let e = await Editor.Profile.getConfig("extension", "sdk-domain", "global");
  if (typeof e == "string") {
    try {
      new URL(e);
    } catch (t) {
      console.warn(
        `Invalid custom extension sdk domain "${e}", use default value instead.`
      );

      e = undefined;
    }
  }
  return {
    customSdkDomain: typeof e == "string" ? e : undefined,
    extensionPaths: t,
  };
}
