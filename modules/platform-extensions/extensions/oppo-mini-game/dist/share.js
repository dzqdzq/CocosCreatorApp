Object.defineProperty(exports, "__esModule", { value: true });

exports.subpackagePrefix = undefined;
exports.ICON_NAME = undefined;
exports.Paths = undefined;
exports.ENGINE_PLUGIN_NAME = undefined;
exports.PLATFORM = undefined;

const { join } = require("path");

exports.PLATFORM = "oppo-mini-game";
exports.ENGINE_PLUGIN_NAME = "cocos-library";

exports.Paths = {
  temp: join(Editor.Project.path, "temp", "builder", exports.PLATFORM, "temp"),
  packPath: join(Editor.App.path, "../tools/quickgame-toolkit"),
  internalTemplateDir: join(__dirname, "../static/build-template"),
};

exports.ICON_NAME = "logo";
exports.subpackagePrefix = "usr_";
