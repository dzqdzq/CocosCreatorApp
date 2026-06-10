Object.defineProperty(exports, "__esModule", { value: true });
exports.Paths = undefined;
exports.OPEN_DATA_CONTEXT_ROOT = undefined;
exports.PLATFORM = undefined;

const { join } = require("path");

exports.PLATFORM = "wechatgame";
exports.OPEN_DATA_CONTEXT_ROOT = "openDataContext";

exports.Paths = {
  internalTemplateDir: join(
    __dirname,
    "../../../../../../resources/3d/engine/templates/" + exports.PLATFORM
  ),
};
