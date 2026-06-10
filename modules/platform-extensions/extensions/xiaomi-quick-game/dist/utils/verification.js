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
  var i;
  var o = { error: "", newValue: r };
  switch (e) {
    case "versionName":
    case "versionCode": {
      if (!r) {
        o.error = e + " " + Editor.I18n.t("xiaomi-quick-game.error.not_empty");
        o.newValue = null;
      }

      break;
    }
    case "package": {
      if (r) {
        if (!/^[a-zA-Z]+[0-9a-zA-Z_]*(\.[a-zA-Z]+[0-9a-zA-Z_]*)*$/.test(r)) {
          o.error =
            `Game package(${r})` +
            Editor.I18n.t("xiaomi-quick-game.project_name_not_legal");

          o.newValue = null;
        }
      } else {
        o.error =
          `Game package(${r}) ` +
          Editor.I18n.t("xiaomi-quick-game.error.package_name_error");

        o.newValue = null;
      }

      break;
    }
    case "privatePemPath": {
      if (r) {
        i = Editor.UI.__protected__.File.resolveToRaw(r);

        (extname(i) === ".pem" && existsSync(i)) ||
          (o.error = Editor.I18n.t(
            "xiaomi-quick-game.error.private_pem_path_error"
          ));
      } else {
        o.error = Editor.I18n.t(
          "xiaomi-quick-game.options.private_pem_path_hint"
        );
      }

      break;
    }
    case "certificatePemPath": {
      if (r) {
        i = Editor.UI.__protected__.File.resolveToRaw(r);

        (extname(i) === ".pem" && existsSync(i)) ||
          (o.error = Editor.I18n.t(
            "xiaomi-quick-game.error.certificate_pem_path_error"
          ));
      } else {
        o.error = Editor.I18n.t(
          "xiaomi-quick-game.options.certificate_pem_path_hint"
        );
      }

      break;
    }
    case "icon": {
      if (typeof r != "string") {
        o.error =
          "Icon Path" + Editor.I18n.t("xiaomi-quick-game.error.icon_not_exist");
      } else if (!existsSync(Editor.UI.__protected__.File.resolveToRaw(r))) {
        o.error =
          "Icon Path" + Editor.I18n.t("xiaomi-quick-game.error.icon_not_exist");
      }
    }
  }
  return o;
}
exports.defaultOptions = {
  package: "com.xiaomi.cocos",
  icon: Editor.App.icon,
  versionName: Editor.App.version,
  versionCode: Editor.App.version,
  minPlatformVersion: "1056",
  deviceOrientation: "portrait",
  useDebugKey: true,
  privatePemPath: "",
  certificatePemPath: "",
  logLevel: "log",
  encapsulation: true,
};
