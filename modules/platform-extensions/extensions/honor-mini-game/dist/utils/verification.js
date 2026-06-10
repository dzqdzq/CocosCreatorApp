Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultOptions = undefined;
exports.getVerifyFuncMap = getVerifyFuncMap;
exports.verificationFunc = verificationFunc;

const { extname } = require("path");

const { existsSync } = require("fs-extra");

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
  let o = "";
  switch (e) {
    case "versionName":
    case "versionCode":
    case "minPlatformVersion": {
      if (!r) {
        i.error = e + " " + Editor.I18n.t("honor-mini-game.tips.not_empty");
        i.newValue = null;
      }

      break;
    }
    case "package": {
      if (r) {
        if (!/^[a-zA-Z]+[0-9a-zA-Z_]*(\.[a-zA-Z]+[0-9a-zA-Z_]*)*$/.test(r)) {
          i.error =
            `Game package(${r})` +
            Editor.I18n.t("honor-mini-game.tips.project_name_not_legal");

          i.newValue = null;
        }
      } else {
        i.error =
          `Game package(${r}) ` +
          Editor.I18n.t("honor-mini-game.tips.package_name_error");

        i.newValue = null;
      }

      break;
    }
    case "privatePemPath": {
      if (r) {
        o = Editor.UI.__protected__.File.resolveToRaw(r);

        (extname(o) === ".pem" && existsSync(o)) ||
          (i.error = Editor.I18n.t(
            "honor-mini-game.tips.private_pem_path_error"
          ));
      } else {
        i.error = Editor.I18n.t(
          "honor-mini-game.options.private_pem_path_hint"
        );
      }

      break;
    }
    case "certificatePemPath": {
      if (r) {
        o = Editor.UI.__protected__.File.resolveToRaw(r);

        (extname(o) === ".pem" && existsSync(o)) ||
          (i.error = Editor.I18n.t(
            "honor-mini-game.tips.certificate_pem_path_error"
          ));
      } else {
        i.error = Editor.I18n.t(
          "honor-mini-game.options.certificate_pem_path_hint"
        );
      }

      break;
    }
    case "icon": {
      if (typeof r != "string") {
        i.error =
          "Icon Path" + Editor.I18n.t("honor-mini-game.tips.icon_not_exist");
      } else if (!existsSync(r)) {
        i.error =
          "Icon Path" + Editor.I18n.t("honor-mini-game.tips.icon_not_exist");
      }
    }
  }
  return i;
}
exports.defaultOptions = {
  package: "com.honor.cocos",
  icon: Editor.App.icon,
  versionName: Editor.App.version,
  versionCode: Editor.App.version,
  minPlatformVersion: "1080",
  deviceOrientation: "portrait",
  useDebugKey: true,
  privatePemPath: "",
  certificatePemPath: "",
  logLevel: "log",
};
