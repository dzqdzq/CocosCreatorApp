Object.defineProperty(exports, "__esModule", { value: true });

exports.SUB_PACKAGE_JS_NAME = undefined;
exports.Paths = undefined;
exports._DOWNLOAD_URL_NOT_FILE_NAME = undefined;
exports._ENGINE_PLUGIN_NAME = undefined;
exports.subpackagePrefix = undefined;
exports.PLATFORM = undefined;

const { join } = require("path");

exports.PLATFORM = "fb-instant-games";
exports.subpackagePrefix = "usr_";
exports._ENGINE_PLUGIN_NAME = "cocos-library";
exports._DOWNLOAD_URL_NOT_FILE_NAME =
  "http://runtime-res.cocos.org/engine-plugin/";

exports.Paths = {
  temp: join(Editor.Project.path, "temp", "builder", "huawei", "tempTinyRes"),
  packPath: join(Editor.App.path, "../tools/huawei-rpk-tools"),
  buildDir: join(Editor.App.path, "../tools/huawei-rpk-tools", "build"),
  internalTemplateDir: join(__dirname, "../static/build-template"),
  localPluginLibraryPath: "",
  localPluginSignPath: "",
  localPluginPath: "",
};

exports.SUB_PACKAGE_JS_NAME = "game.js";
