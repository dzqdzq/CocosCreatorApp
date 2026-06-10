Object.defineProperty(exports, "__esModule", { value: true });

exports.defaultOptions = undefined;
exports.verificationFunc = undefined;
exports.getVerifyFuncMap = undefined;

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
  ].forEach((r) => {
    e[r] = (e, i) => verificationFunc(r, e, i);
  });

  return e;
}
function verificationFunc(e, i, r) {
  var t = { error: "", newValue: i };
  switch (e) {
    case "versionName":
    case "versionCode":
    case "minPlatformVersion": {
      if (!i) {
        t.error = e + " " + Editor.I18n.t("vivo-mini-game.tips.not_empty");
        t.newValue = null;
      }

      break;
    }
    case "package": {
      if (i) {
        if (!/^[a-zA-Z]+[0-9a-zA-Z_]*(\.[a-zA-Z]+[0-9a-zA-Z_]*)*$/.test(i)) {
          t.error =
            `Game package(${i})` +
            Editor.I18n.t("vivo-mini-game.tips.project_name_not_legal");

          t.newValue = null;
        }
      } else {
        t.error =
          `Game package(${i}) ` +
          Editor.I18n.t("vivo-mini-game.tips.package_name_error");

        t.newValue = null;
      }

      break;
    }
    case "privatePemPath": {
      if (i) {
        if (!fs_extra_1.existsSync(i)) {
          t.error =
            "" + i + Editor.I18n.t("vivo-mini-game.tips.signature_not_exist");
        }
      } else {
        t.error = Editor.I18n.t("vivo-mini-game.tips.private_pem_path_error");
      }

      break;
    }
    case "certificatePemPath": {
      if (i) {
        if (!fs_extra_1.existsSync(i)) {
          t.error =
            "" + i + Editor.I18n.t("vivo-mini-game.tips.signature_not_exist");
        }
      } else {
        t.error = Editor.I18n.t(
          "vivo-mini-game.tips.certificate_pem_path_error"
        );
      }

      break;
    }
    case "icon": {
      if (typeof i != "string") {
        t.error =
          "Icon Path" + Editor.I18n.t("vivo-mini-game.tips.icon_not_exist");
      } else if (!fs_extra_1.existsSync(i)) {
        t.error =
          "Icon Path" + Editor.I18n.t("vivo-mini-game.tips.icon_not_exist");
      }
    }
  }
  return t;
}
exports.getVerifyFuncMap = getVerifyFuncMap;
exports.verificationFunc = verificationFunc;

exports.defaultOptions = {
  package: "com.vivo.cocos",
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
};
