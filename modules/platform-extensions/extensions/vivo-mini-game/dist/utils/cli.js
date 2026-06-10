Object.defineProperty(exports, "__esModule", { value: true });
exports.initEnvironmentPath = initEnvironmentPath;
exports.isInstallNodeJs = isInstallNodeJs;
exports.isInitVivo = isInitVivo;
exports.isInstallVivoMiniGameTool = isInstallVivoMiniGameTool;
exports.hasCliProject = hasCliProject;
exports.initVivoProject = initVivoProject;
exports.install = install;

const { exec, execSync } = require("child_process");

const { existsSync } = require("fs");

const { join, basename, dirname } = require("path");

const { ensureDirSync, removeSync } = require("fs-extra");

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
    exec("node -v", { env: process_env }, (e) => {
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
    !existsSync(join(e, "node_modules")) ||
    existsSync(join(e, "node_modules", ".staging"))
  );
}
function isInstallVivoMiniGameTool() {
  try {
    execSync("mg -v");
  } catch (e) {
    console.error(e);
    return false;
  }
  return true;
}
function hasCliProject(e) {
  return !!existsSync(join(e, "minigame.config.js"));
}
function initVivoProject(r) {
  ensureDirSync(r);

  return new Promise((n, o) => {
    exec(`mg init ${basename(r)} --force`, { cwd: dirname(r) }, (e) => {
      if (e) {
        console.error("init vivo project tools failed");
        console.error(e);
        removeSync(join(r, "node_modules"));
        o(e);
        return false;
      }
      n(true);
    });
  });
}
function install(r) {
  const e = process.platform === "win32" ? "npm.cmd" : "npm";
  return new Promise((n, o) => {
    exec(e + " install", { cwd: r, env: process_env }, (e) => {
      if (!e) {
        console.log(Editor.I18n.t("builder.npm_installed_success"));
        n(true);
        return true;
      }
      console.error(e);
      console.error(new Error(Editor.I18n.t("builder.npm_install_fail")));
      removeSync(join(r, "node_modules"));
      o(e);
    });
  });
}
