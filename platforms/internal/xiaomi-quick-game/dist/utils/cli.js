Object.defineProperty(exports, "__esModule", { value: true });
exports.install = undefined;
exports.isInit = undefined;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
function isInit(e) {
  return !!fs_extra_1.existsSync(
    path_1.join(e, "node_modules/quickgame-cli/lib")
  );
}
function install(e) {
  fs_extra_1.ensureDirSync(e);

  return Build.Utils.quickSpawn("npm", ["install"], {
    cwd: e,
    downGradeError: true,
    ignoreLog: true,
    downGradeWaring: true,
  });
}
exports.isInit = isInit;
exports.install = install;
