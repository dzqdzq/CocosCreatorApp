Object.defineProperty(exports, "__esModule", { value: true });

exports.install = undefined;
exports.initVivoProject = undefined;
exports.hasCliProject = undefined;
exports.isInstallVivoMiniGameTool = undefined;
exports.isInitVivo = undefined;
exports.isInstallNodeJs = undefined;
exports.initEnvironmentPath = undefined;

const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
let process_env = process.env;
function initEnvironmentPath(e, n) {
  if (e) {
    console.log(Editor.I18n.t("builder.custom_npm_path_config"), e);

    process.platform === "win32"
      ? (process_env.Path = e)
      : ((process_env.PATH = e),
        (process_env.PATH += ":/usr/bin:/bin:/usr/sbin:/sbin"));
  } else {
    n && console.log(Editor.I18n.t("builder.custom_npm_path_not_config"));
    process_env = process.env;
  }
}
function isInstallNodeJs() {
  return new Promise((n, o) => {
    child_process_1.exec("node -v", { env: process_env }, (e) => {
      if (e) {
        console.error(e);

        process.platform === "win32"
          ? console.error(
              new Error(Editor.I18n.t("builder.window_default_npm_path_error"))
            )
          : console.error(
              new Error(Editor.I18n.t("builder.mac_default_npm_path_error"))
            );

        o(false);
      } else {
        n(true);
      }
    });
  });
}
function isInitVivo(e) {
  return !(
    !fs_1.existsSync(path_1.join(e, "node_modules")) ||
    fs_1.existsSync(path_1.join(e, "node_modules", ".staging"))
  );
}
function isInstallVivoMiniGameTool() {
  try {
    child_process_1.execSync("mg -v");
  } catch (e) {
    console.error(e);
    return false;
  }
  return true;
}
function hasCliProject(e) {
  return !!fs_1.existsSync(path_1.join(e, "minigame.config.js"));
}
function initVivoProject(t) {
  fs_extra_1.ensureDirSync(t);

  return new Promise((n, o) => {
    child_process_1.exec(
      `mg init ${path_1.basename(t)} --force`,
      { cwd: path_1.dirname(t) },
      (e) => {
        if (e) {
          o(false);
          console.error(e);
          console.log("init vivo project tools failed");
          fs_extra_1.removeSync(path_1.join(t, "node_modules"));
          return false;
        }
        n(true);
      }
    );
  });
}
function install(t) {
  const e = process.platform === "win32" ? "npm.cmd" : "npm";
  return new Promise((n, o) => {
    child_process_1.exec(e + " install", { cwd: t, env: process_env }, (e) => {
      if (!e) {
        console.log(Editor.I18n.t("builder.npm_installed_success"));
        n(true);
        return true;
      }
      console.error(e);
      console.error(new Error(Editor.I18n.t("builder.npm_install_fail")));
      fs_extra_1.removeSync(path_1.join(t, "node_modules"));
      o(e);
    });
  });
}
exports.initEnvironmentPath = initEnvironmentPath;
exports.isInstallNodeJs = isInstallNodeJs;
exports.isInitVivo = isInitVivo;
exports.isInstallVivoMiniGameTool = isInstallVivoMiniGameTool;
exports.hasCliProject = hasCliProject;
exports.initVivoProject = initVivoProject;
exports.install = install;
