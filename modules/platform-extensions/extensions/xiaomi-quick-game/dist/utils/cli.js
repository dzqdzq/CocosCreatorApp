Object.defineProperty(exports, "__esModule", { value: true });
exports.isInit = isInit;
exports.install = install;

const { existsSync, ensureDirSync } = require("fs-extra");

const { join } = require("path");

function isInit(e) {
  return !!existsSync(join(e, "node_modules/quickgame-cli/lib"));
}
function install(e) {
  ensureDirSync(e);

  return Build.Utils.quickSpawn("npm", ["install"], {
    cwd: e,
    downGradeError: true,
    ignoreLog: true,
    downGradeWaring: true,
    shell: true,
  });
}
