Object.defineProperty(exports, "__esModule", { value: true });

exports.Paths = undefined;
exports.ICON_NAME = undefined;
exports.SUB_PACKAGE_JS_NAME = undefined;
exports.PLATFORM = undefined;
exports.PKG_NAME = undefined;

const { join } = require("path");

exports.PKG_NAME = "xiaomi-quick-game";
exports.PLATFORM = exports.PKG_NAME;
exports.SUB_PACKAGE_JS_NAME = "main.js";
exports.ICON_NAME = "image/icon";

exports.Paths = {
  temp: join(Editor.Project.tmpDir, exports.PKG_NAME),
  packPath: join(Editor.App.path, "../tools", "xiaomi-pack-tools"),
  internalTemplateDir: join(
    __dirname,
    "../../../../../../resources/3d/engine/templates/" + exports.PLATFORM
  ),
};
