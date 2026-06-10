Object.defineProperty(exports, "__esModule", { value: true });

exports.defaultOptions = undefined;
exports.verificationFunc = undefined;
exports.getVerifyFuncMap = undefined;

const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
function getVerifyFuncMap() {
  const e = {};

  [
    "versionName",
    "versionCode",
    "minPlatformVersion",
    "package",
    "privatePemPath",
    "certificatePemPath",
    "icon",
  ].forEach((i) => {
    e[i] = (e, r) => verificationFunc(i, e, r);
  });

  return e;
}
function verificationFunc(e, r, i) {
  var a;
  var t = { error: "", newValue: r };
  switch (e) {
    case "versionName":
    case "versionCode": {
      if (!r) {
        t.error = e + " " + Editor.I18n.t("xiaomi-quick-game.error.not_empty");
        t.newValue = null;
      }

      break;
    }
    case "package": {
      if (r) {
        if (!/^[a-zA-Z]+[0-9a-zA-Z_]*(\.[a-zA-Z]+[0-9a-zA-Z_]*)*$/.test(r)) {
          t.error =
            `Game package(${r})` +
            Editor.I18n.t("xiaomi-quick-game.project_name_not_legal");

          t.newValue = null;
        }
      } else {
        t.error =
          `Game package(${r}) ` +
          Editor.I18n.t("xiaomi-quick-game.error.package_name_error");

        t.newValue = null;
      }

      break;
    }
    case "privatePemPath": {
      if (r) {
        a = Editor.UI.File.resolveToRaw(r);

        (path_1.extname(a) === ".pem" && fs_extra_1.existsSync(a)) ||
          (t.error =
            "privatePemPath" +
            Editor.I18n.t("xiaomi-quick-game.error.private_pem_path_error"));
      } else {
        t.error = Editor.I18n.t(
          "xiaomi-quick-game.error.private_pem_path_error"
        );
      }

      break;
    }
    case "certificatePemPath": {
      if (r) {
        a = Editor.UI.File.resolveToRaw(r);

        (path_1.extname(a) === ".pem" &&
          fs_extra_1.existsSync(Editor.UI.File.resolveToRaw(r))) ||
          (t.error =
            "" +
            r +
            Editor.I18n.t("xiaomi-quick-game.error.private_pem_path_error"));
      } else {
        t.error = Editor.I18n.t(
          "xiaomi-quick-game.error.certificate_pem_path_error"
        );
      }

      break;
    }
    case "icon": {
      if (typeof r != "string") {
        t.error =
          "Icon Path" + Editor.I18n.t("xiaomi-quick-game.error.icon_not_exist");
      } else if (!fs_extra_1.existsSync(Editor.UI.File.resolveToRaw(r))) {
        t.error =
          "Icon Path" + Editor.I18n.t("xiaomi-quick-game.error.icon_not_exist");
      }
    }
  }
  return t;
}
exports.getVerifyFuncMap = getVerifyFuncMap;
exports.verificationFunc = verificationFunc;

exports.defaultOptions = {
  package: "com.xiaomi.cocos",
  icon: Editor.App.icon,
  versionName: Editor.App.version,
  versionCode: Editor.App.version,
  minPlatformVersion: "1056",
  deviceOrientation: "portrait",
  tinyPackageServer: "",
  useDebugKey: true,
  privatePemPath: "",
  certificatePemPath: "",
  logLevel: "log",
  encapsulation: true,
};
