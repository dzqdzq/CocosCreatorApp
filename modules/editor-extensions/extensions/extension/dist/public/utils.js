Object.defineProperty(exports, "__esModule", { value: true });

exports.CancelError = undefined;
exports.sleep = undefined;
exports.throttle = undefined;
exports.FAKE_AUTHOR_ID = undefined;
exports.INTERNAL_EXTENSION_NAME = undefined;

exports.matchInternalName = matchInternalName;
exports.handleDecompressFail = handleDecompressFail;
exports.handleCancelImport = handleCancelImport;
exports.handleInvalidPath = handleInvalidPath;
exports.handleManualInstall = handleManualInstall;
exports.handleUnexpectedImportError = handleUnexpectedImportError;
exports.getPackageType = getPackageType;
exports.recursive = recursive;
exports.formatDate = formatDate;
exports.checkPackagePathType = checkPackagePathType;
exports.isOnlineExtension = isOnlineExtension;
exports.hasOwn = hasOwn;

const { existsSync, statSync, readdirSync } = require("fs-extra");

const { join } = require("path");

const packageJson = require("../../package.json");
function matchInternalName(e) {
  return e === exports.INTERNAL_EXTENSION_NAME;
}
async function handleDecompressFail(e, t, n) {
  if (
    (
      await Editor.Dialog.info(Editor.I18n.t("extension.menu.decompressFail"), {
        cancel: 0,
        buttons: [
          Editor.I18n.t("extension.store.cancel"),
          Editor.I18n.t("extension.store.confirm"),
        ],
      })
    ).response
  ) {
    var r = await Editor.Dialog.select({
      title: Editor.I18n.t("extension.menu.copyPackageTitle", {
        extensionName: t + ".zip",
      }),
      type: "directory",
    });
    if (r.canceled) {
      if (!n) {
        throw new Error("cancel");
      }
      handleCancelImport();
    } else if (r.filePaths[0]) {
      r = join(r.filePaths[0], t + ".zip");
      await Editor.Utils.File.copy(e, r);
      console.log(`[extension] copy ${t}.zip to ` + r);

      if (!n) {
        throw new Error("manual install");
      }

      handleManualInstall();
    }
  } else {
    if (!n) {
      throw new Error("cancel");
    }
    handleCancelImport();
  }
}
function handleCancelImport() {
  Editor.Task.addNotice({
    title: Editor.I18n.t("extension.store.install_cancel"),
    type: "log",
    source: "extension",
    timeout: 8000 /* 8e3 */,
  });
}
function handleInvalidPath(e) {
  Editor.Task.addNotice({
    title: Editor.I18n.t("extension.menu.invalidPath", { path: e }),
    type: "error",
    source: "extension",
    timeout: 8000 /* 8e3 */,
  });
}
function handleManualInstall() {
  console.log(
    Editor.I18n.t("extension.store.install_manual_guide", {
      url: Editor.App.urls.manual,
    })
  );

  Editor.Task.addNotice({
    title: Editor.I18n.t("extension.store.install_manual_title"),
    message: Editor.I18n.t("extension.store.install_manual_content"),
    source: "extension",
    type: "warn",
  });
}
function handleUnexpectedImportError(e) {
  Editor.Task.addNotice({
    title: Editor.I18n.t("extension.store.install_fail"),
    message: e?.message,
    type: "error",
    source: "extension",
    timeout: 10000 /* 1e4 */,
  });
}
function getPackageType(e) {
  let t;
  return (t = Editor.Utils.Path.contains(Editor.App.path, e)
    ? "internal"
    : Editor.Utils.Path.contains(Editor.Project.path, e)
    ? "project"
    : Editor.Utils.Path.contains(Editor.App.home, e)
    ? "global"
    : "develop");
}
function recursive(e, r) {
  !(function t(n) {
    if (existsSync(n)) {
      if (statSync(n).isDirectory()) {
        readdirSync(n).forEach((e) => {
          t(join(n, e));
        });
      } else {
        r(n);
      }
    }
  })(e);
}
function formatDate(e, t) {
  if (e) {
    t = t || "yyyy-MM-dd";

    switch (typeof e) {
      case "string": {
        e = new Date(e.replace(/-/g, "/"));
        break;
      }
      case "number": {
        e = new Date(e);
      }
    }

    if (e instanceof Date) {
      const n = {
        yyyy: e.getFullYear(),
        M: e.getMonth() + 1,
        d: e.getDate(),
        H: e.getHours,
        m: e.getMinutes(),
        s: e.getSeconds(),
        MM: ("" + (e.getMonth() + 101)).substr(1),
        dd: ("" + (e.getDate() + 100)).substr(1),
        HH: ("" + (e.getHours() + 100)).substr(1),
        mm: ("" + (e.getMinutes() + 100)).substr(1),
        ss: ("" + (e.getSeconds() + 100)).substr(1),
      };
      return t.replace(/(yyyy|MM?|dd?|HH?|ss?|mm?)/g, (...e) => n[e[0]]);
    }
  }
}
exports.INTERNAL_EXTENSION_NAME = packageJson.name;
exports.FAKE_AUTHOR_ID = -1;
const throttle = (r, o, e = false) => {
  if (e) {
    let n = 0;
    return (...e) => {
      var t = Date.now();

      if (t - n >= o) {
        r.apply(this, e);
        n = t;
      }
    };
  }
  {
    let t = null;
    return (...e) => {
      if (!t) {
        r.apply(this, e);

        t = window.setTimeout(() => {
          if (t) {
            clearTimeout(t);
          }

          t = null;
        }, o);
      }
    };
  }
};
function checkPackagePathType(e) {
  return Editor.Package.__protected__.checkType(e);
}
exports.throttle = throttle;
const sleep = (r = 100) => {
  let o = () => {};
  var e = new Promise((e, t) => {
    const n = window.setTimeout(() => {
      e();
    }, r);
    o = () => {
      window.clearTimeout(n);
      t(new Error("cancel"));
    };
  });
  e.abort = o;
  return e;
};
function isOnlineExtension(e) {
  return "latest_version" in e;
}
function hasOwn(e, t) {
  return Object.prototype.hasOwnProperty.call(e, t);
}
exports.sleep = sleep;
const cancelSymbol = Symbol.for("cancel");
class CancelError extends Error {
  static isCancel(e) {
    return e instanceof Error && e[cancelSymbol] === true;
  }
  [cancelSymbol] = true;
}
exports.CancelError = CancelError;
