Object.defineProperty(exports, "__esModule", { value: true });
exports.HUAWEI_CONFIG_PATH = undefined;
exports.HUAWEI_CONFIG_BASE_NAME = undefined;
exports.getNameFromConfig = getNameFromConfig;

const { readJSONSync } = require("fs-extra");

const { join } = require("path");

function getNameFromConfig() {
  try {
    var e = readJSONSync(exports.HUAWEI_CONFIG_PATH);
    if (e && e.client.package_name) {
      return e.client.package_name;
    }
  } catch (e) {
    console.error(e);
  }
  return "";
}
exports.HUAWEI_CONFIG_BASE_NAME = "agconnect-services.json";

exports.HUAWEI_CONFIG_PATH = join(
  Editor.Project.path,
  "settings",
  exports.HUAWEI_CONFIG_BASE_NAME
);
