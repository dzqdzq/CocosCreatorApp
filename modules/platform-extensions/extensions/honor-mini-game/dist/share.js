Object.defineProperty(exports, "__esModule", { value: true });

exports.Paths = undefined;
exports.ICON_NAME = undefined;
exports.CONFIG_NAME = undefined;
exports.subpackagePrefix = undefined;
exports.SUB_MAIN_JS_NAME = undefined;
exports.MAIN_JS_NAME = undefined;
exports.ENGINE_PLUGIN_NAME = undefined;
exports.PLATFORM = undefined;
exports.PLATFORM_NAME = undefined;

const { join } = require("path");

exports.PLATFORM_NAME = "honor-mini-game";
exports.PLATFORM = "HONOR";
exports.ENGINE_PLUGIN_NAME = "cocos-library";
exports.MAIN_JS_NAME = "game.js";
exports.SUB_MAIN_JS_NAME = "main.js";
exports.subpackagePrefix = "usr_";
exports.CONFIG_NAME = "manifest.json";
exports.ICON_NAME = "image/icon";

exports.Paths = {
  packPath: join(Editor.App.path, "../tools", "honor-pack-tools"),
  internalTemplateDir: join(__dirname, "../static/build-template"),
};
