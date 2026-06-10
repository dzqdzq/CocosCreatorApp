var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBuildDist = getBuildDist;
exports.migrateLocal = migrateLocal;
exports.migrateProject = migrateProject;

const { isAbsolute, join, relative } = require("path");

const sharp_1 = __importDefault(require("sharp"));
function getBuildDist(t) {
  return isAbsolute(t) ? t : join(Editor.Project.path, t);
}
function getNewBuildPath(t) {
  if (t.startsWith("project://")) {
    return t;
  }
  let e = getBuildDist(t);
  return (e = Editor.Utils.Path.contains(Editor.Project.path, e)
    ? "project://" + relative(Editor.Project.path, e)
    : e);
}
function migrateLocal(t) {
  if (t.common && t.common.buildPath) {
    t.common.buildPath = getNewBuildPath(t.common.buildPath);
  }

  if (t.BuildTaskManager && t.BuildTaskManager.taskMap) {
    Object.values(t.BuildTaskManager.taskMap).forEach((t) => {
      if (t.options && t.options.buildPath) {
        t.options.buildPath = getNewBuildPath(t.options.buildPath);
      }
    });
  }
}
async function migrateProject(t) {
  var e;
  var t = t["splash-setting"];

  if (t && t.base64src) {
    e = Buffer.from(t.base64src.split(",")[1], "base64");
    delete t.base64src;
    t.url = "project://settings/splash-settings.png";

    await (0, sharp_1.default)(e).toFile(
      join(Editor.Project.path, "settings", "splash-settings.png")
    );
  }
}
