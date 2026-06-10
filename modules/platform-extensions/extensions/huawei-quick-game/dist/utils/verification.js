Object.defineProperty(exports, "__esModule", { value: true });
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
  ].forEach((r) => {
    e[r] = (e, t) => verificationFunc(r, e, t);
  });

  return e;
}
const MIN_PLATFORM_VERSION = 1091;
function verificationFunc(e, t, r) {
  var a = { error: "", newValue: t };
  let i = "";
  switch (e) {
    case "versionName":
    case "versionCode": {
      if (!t) {
        a.error = e + " " + Editor.I18n.t("huawei-quick-game.tips.not_empty");
        a.newValue = null;
      }

      break;
    }
    case "minPlatformVersion": {
      var n;
      var o = r.packages["huawei-quick-game"].separateEngine;

      if (t) {
        if ((n = t.match(/^[0-9]*$/))) {
          n = Number(n[0]);

          o &&
            n < MIN_PLATFORM_VERSION &&
            ((a.error = Editor.I18n.t(
              "huawei-quick-game.tips.support_min_platform_limit",
              { version: "" + MIN_PLATFORM_VERSION }
            )),
            (a.newValue = null));
        } else {
          a.error = e + " " + Editor.I18n.t("huawei-quick-game.tips.not_empty");
          a.newValue = null;
        }
      } else {
        a.error = e + " " + Editor.I18n.t("huawei-quick-game.tips.not_empty");
        a.newValue = null;
      }

      break;
    }
    case "package": {
      if (t) {
        if (!/^[a-zA-Z]+[0-9a-zA-Z_]*(\.[a-zA-Z]+[0-9a-zA-Z_]*)*$/.test(t)) {
          a.error =
            `Game package(${t})` +
            Editor.I18n.t("huawei-quick-game.tips.project_name_not_legal");

          a.newValue = null;
        }
      } else {
        a.error =
          `Game package(${t}) ` +
          Editor.I18n.t("huawei-quick-game.tips.package_name_error");

        a.newValue = null;
      }

      break;
    }
    case "privatePemPath": {
      if (t) {
        i = Editor.UI.__protected__.File.resolveToRaw(t);

        (extname(i) === ".pem" && existsSync(i)) ||
          (a.error = Editor.I18n.t(
            "huawei-quick-game.tips.private_pem_path_error"
          ));
      } else {
        a.error = Editor.I18n.t(
          "huawei-quick-game.options.private_pem_path_hint"
        );
      }

      break;
    }
    case "certificatePemPath": {
      if (t) {
        i = Editor.UI.__protected__.File.resolveToRaw(t);

        (extname(i) === ".pem" && existsSync(i)) ||
          (a.error = Editor.I18n.t(
            "huawei-quick-game.tips.certificate_pem_path_error"
          ));
      } else {
        a.error = Editor.I18n.t(
          "huawei-quick-game.options.certificate_pem_path_hint"
        );
      }

      break;
    }
    case "icon": {
      if (typeof t != "string") {
        a.error =
          "Icon Path" + Editor.I18n.t("huawei-quick-game.tips.icon_not_exist");
      } else if (!existsSync(t)) {
        a.error =
          "Icon Path" + Editor.I18n.t("huawei-quick-game.tips.icon_not_exist");
      }
    }
  }
  return a;
}
