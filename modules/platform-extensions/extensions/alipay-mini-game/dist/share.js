Object.defineProperty(exports, "__esModule", { value: true });
exports.Paths = undefined;
exports.PLATFORM = undefined;

const { join } = require("path");

exports.PLATFORM = "alipay-mini-game";

exports.Paths = {
  internalTemplateDir: join(
    __dirname,
    "../../../../../../resources/3d/engine/templates/" + exports.PLATFORM
  ),
};
