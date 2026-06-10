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
  ].forEach((t) => {
    e[t] = (e, r) => verificationFunc(t, e, r);
  });

  return e;
}
function verificationFunc(e, r, t) {
  var i = { error: "", newValue: r };
  switch (e) {
    case "versionName":
    case "versionCode":
    case "minPlatformVersion": {
      if (!r) {
        i.error = e + " " + Editor.I18n.t("oppo-mini-game.tips.not_empty");
        i.newValue = null;
      }

      break;
    }
    case "package": {
      if (r) {
        if (!/^[a-zA-Z]+[0-9a-zA-Z_]*(\.[a-zA-Z]+[0-9a-zA-Z_]*)*$/.test(r)) {
          i.error =
            `Game package(${r})` +
            Editor.I18n.t("oppo-mini-game.tips.package_name_error");

          i.newValue = null;
        }
      } else {
        i.error =
          `Game package(${r}) ` +
          Editor.I18n.t("oppo-mini-game.tips.package_name_error");

        i.newValue = null;
      }

      break;
    }
    case "privatePemPath": {
      if (r) {
        if (!fs_extra_1.existsSync(r)) {
          i.error =
            "" + r + Editor.I18n.t("oppo-mini-game.tips.signature_not_exist");
        }
      } else {
        i.error = Editor.I18n.t("oppo-mini-game.tips.private_pem_path_error");
      }

      break;
    }
    case "certificatePemPath": {
      if (r) {
        if (!fs_extra_1.existsSync(r)) {
          i.error =
            "" + r + Editor.I18n.t("oppo-mini-game.tips.signature_not_exist");
        }
      } else {
        i.error = Editor.I18n.t(
          "oppo-mini-game.tips.certificate_pem_path_error"
        );
      }

      break;
    }
    case "icon": {
      if (typeof r != "string") {
        i.error =
          "Icon Path" + Editor.I18n.t("oppo-mini-game.tips.icon_not_exist");
      } else if (!fs_extra_1.existsSync(r)) {
        i.error =
          "Icon Path" + Editor.I18n.t("oppo-mini-game.tips.icon_not_exist");
      }
    }
  }
  return i;
}
exports.getVerifyFuncMap = getVerifyFuncMap;
exports.verificationFunc = verificationFunc;

exports.defaultOptions = {
  package: "com.oppo.coco",
  icon: Editor.App.icon,
  versionName: Editor.App.version,
  versionCode: "1056",
  minPlatformVersion: "1056",
  deviceOrientation: "portrait",
  tinyPackageMode: false,
  tinyPackageServer: "",
  useDebugKey: true,
  privatePemPath: "",
  certificatePemPath: "",
  logLevel: "log",
};
