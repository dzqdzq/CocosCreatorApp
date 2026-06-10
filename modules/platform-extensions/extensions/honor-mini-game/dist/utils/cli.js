Object.defineProperty(exports, "__esModule", { value: true });
exports.isInitHonor = isInitHonor;
exports.isInstallHonorMiniGameTool = isInstallHonorMiniGameTool;
exports.install = install;

const { execSync } = require("child_process");

const { existsSync } = require("fs");

const { join } = require("path");

const { ensureDirSync } = require("fs-extra");

function isInitHonor(e) {
  return !!existsSync(join(e, "node_modules/quickgame-cli/lib"));
}
function isInstallHonorMiniGameTool() {
  try {
    execSync("minigame -V");
  } catch (e) {
    console.error(e);
    return false;
  }
  return true;
}
function install(e) {
  ensureDirSync(e);

  return Build.Utils.quickSpawn("npm", ["install", "--no-package-lock"], {
    cwd: e,
    downGradeError: true,
    ignoreLog: true,
    downGradeWaring: true,
    shell: true,
  });
}
