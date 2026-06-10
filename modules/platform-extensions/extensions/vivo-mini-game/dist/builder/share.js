Object.defineProperty(exports, "__esModule", { value: true });

exports.CONFIG_NAME = undefined;
exports.subpackagePrefix = undefined;
exports.Paths = undefined;
exports.ICON_NAME = undefined;
exports.REAL_MAIN_JS_PATH = undefined;
exports.REAL_MAIN_JS_NAME = undefined;
exports.MAIN_JS_NAME = undefined;
exports.ENGINE_PLUGIN_NAME = undefined;
exports.PLATFORM = undefined;

const { join } = require("path");

exports.PLATFORM = "vivo-mini-game";
exports.ENGINE_PLUGIN_NAME = "cocos-library";
exports.MAIN_JS_NAME = "game.js";
exports.REAL_MAIN_JS_NAME = "externs-game.js";
exports.REAL_MAIN_JS_PATH = exports.REAL_MAIN_JS_NAME;
exports.ICON_NAME = "image/icon";

exports.Paths = {
  temp: join(Editor.Project.tmpDir, "builder", "vivo-mini-game"),
  packPath: join(Editor.App.path, "../tools", "vivo-pack-tools"),
  internalTemplateDir: join(__dirname, "../../static/build-template"),
};

exports.subpackagePrefix = "usr_";
exports.CONFIG_NAME = "manifest.json";
