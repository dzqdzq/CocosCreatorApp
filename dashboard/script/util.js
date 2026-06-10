const { app, shell } = require("electron");
exports.app = app;
exports.i18n = require("@base/electron-i18n");
exports.metrics = require("@editor/creator/dist/metrics");
const setting = require("@editor/setting");
const Manager = require("@editor/extension-sdk").Manager;
const Dialog = require("@editor/creator/dist/dialog").Dialog;
const I18n = require("@editor/creator/dist/i18n").I18n;
const Utils = require("@editor/creator/dist/utils").Utils;
const { existsSync, readJSONSync } = require("fs-extra");
const { basename, extname, join } = require("path");
const spawn = require("child_process").spawn;
const lt = require("semver").lt;
const DOWNLOAD = "https://www.cocos.com/creator-download";
const DASHBOARD_PROTOCOL = "cocos-dashboard://";

exports.basenameNoExt = (e) => basename(e, extname(e));
exports.getName = Utils.File.getName;
const languages = { zh: require("../i18n/zh"), en: require("../i18n/en") };

let initializedI18n = false;
function registerI18n() {
  initializedI18n = true;
  exports.i18n.register(languages.en, "en");
  exports.i18n.register(languages.zh, "zh");

  if (app.getLocale().startsWith("zh")) {
    exports.i18n.switch("zh");
  }
}
exports.initI18n = async (e) => {
  if (!initializedI18n) {
    e ||
      app.isReady() ||
      (await new Promise((e) => {
        app.once("ready", e);
      }));

    registerI18n();
  }
};

const t = (exports.t = (e, t) => I18n.t(e, t));

exports.queryDashboardPath = async () => {
  try {
    var e = await app.getApplicationInfoForProtocol(DASHBOARD_PROTOCOL);
    if (existsSync(e.path)) {
      return e.path;
    }
  } catch (e) {}
  return "";
};

exports.openDashboard = async () => {
  try {
    var e = exports.queryDashboardPath();
    if (e) {
      await shell.openPath(e);
      exports.exitApp();
      return true;
    }
  } catch (e) {}
  return false;
};

exports.goToInstall = async () => {
  await shell.openExternal(DOWNLOAD);
};

const projectMap = (exports.projectMap = new Map());
function getDependNames(t) {
  let n = "";
  for (let e = 0; e < t.length; e++) {
    n += `${e + 1}.${t[e]}\n`;
  }
  return n;
}

exports.exitApp = () => {
  if (projectMap.size === 0) {
    app.exit(0);
  }
};

exports.warnAlreadyOpened = async (e) => {
  await Dialog.warn(t("project_opened"), {
    title: t("info"),
    detail: e,
    buttons: [t("confirm")],
  });
};

exports.errorDialog = async (e, n) => {
  await Dialog.error(e, { detail: n || "", buttons: [t("confirm")] });
};

exports.warnDuplicateProject = async () => {
  await Dialog.warn(t("message.duplicate_project"), {
    title: t("warn"),
    buttons: [t("confirm")],
  });
};

exports.chooseProjectPath = async (e) => {
  e = await Dialog.select({ type: "directory", title: e });
  return e && e.filePaths && e.filePaths[0];
};

exports.warnInstallDependFailed = async (e, n, a) => {
  var r;

  console.warn(
    t("message.install_depend_list_error", { list: getDependNames(e) })
  );

  return setting.args.build
    ? -1
    : ((r = [t("main.button.quit")]),
      a || r.push(t("main.button.continue")),
      (
        await Dialog.warn(t("message.install_depend_error"), {
          title: t("main.title"),
          detail: "" + getDependNames(e),
          buttons: r,
          default: 1,
        })
      ).response);
};

exports.showMainDialog = async (e) =>
  (
    await Dialog.info(t("main.message"), {
      title: t("main.title"),
      detail: t("main.detail"),
      buttons: [
        e ? t("main.button.dashboard") : t("main.button.install"),
        t("main.button.empty"),
        t("main.button.open"),
        t("main.button.quit"),
      ],
      default: 0,
      cancel: 3,
    })
  ).response;

exports.installProjectDepend = async (u) =>
  new Promise(async (t, e) => {
    if (process.send !== undefined && process.env.COCOS_DASHBOARD_VERSION) {
      return t();
    }
    var n = join(u, "extensions");
    var n = new Manager({ extensionPaths: [n] });
    var a = await n.queryDepends([u]);
    var r = await n.scanLocalExtensions();
    const i = [];
    for (const d of a) {
      var s = r.find((e) => d.name === e.name);
      if (!s || lt(s.version, d.version)) {
        i.push(d.name);
        break;
      }
    }
    if (i.length === 0) {
      return t();
    }
    await exports.initI18n();
    n = await exports.queryDashboardPath();
    if (!n) {
      return 0 ===
        (await exports.warnInstallDependFailed(
          i,
          new Error(
            "Failed to install dependencies, the dashboard does not exist."
          )
        ))
        ? void exports.exitApp()
        : t();
    }
    try {
      var o =
        process.platform === "win32" ? "../resources" : "Contents/Resources";
      readJSONSync(join(n, o, "dashboard.json"));
    } catch (e) {
      return 0 ===
        (await exports.warnInstallDependFailed(
          i,
          new Error(
            "Failed to install dependencies, the dashboard does not support this feature."
          )
        ))
        ? void exports.exitApp()
        : t();
    }
    let p = [];

    if (setting.args.build) {
      p.push("--project-install-silence");
    }

    p = p.concat(["--project-install-plugins", "--project=" + u]);
    a =
      n +
      (process.platform === "win32" ? "" : "/Contents/MacOS/CocosDashboard");
    const l = spawn(a, p, { stdio: [0, 1, 2, "ipc"] });
    let c = false;

    l.on("exit", async () => {
      var e;

      if (!c) {
        e = `>>> Failed to install the dependency plugin(s): [ ${i.join(
          ","
        )} ], Please open the project using CocosDashboard. <<<`;

        await exports.warnInstallDependFailed(i, e, true);
        exports.exitApp();
      }
    });

    l.on("message", async (e) => {
      if (
        e.channel === "dashboard-install-project-plugin" &&
        ((c = true),
        l.kill(),
        e.stack && 0 === (await exports.warnInstallDependFailed(i, e.stack)))
      ) {
        return void exports.exitApp();
      }
      return t();
    });

    l.on("error", async (e) => {
      e = await exports.warnInstallDependFailed(i, e);
      if (e !== 0) {
        return t();
      }
      exports.exitApp();
    });
  });
