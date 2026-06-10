Object.defineProperty(exports, "__esModule", { value: true });
exports.GLOBAL_CACHE_DIR = undefined;
exports.LOCAL_CACHE_DIR = undefined;

const { join } = require("path");

exports.LOCAL_CACHE_DIR = join(Editor.Project.tmpDir, "builder");
exports.GLOBAL_CACHE_DIR = join(Editor.App.temp, "builder");
