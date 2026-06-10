function checkPackageNameValidity(e) {
  return /^[a-zA-Z]\w*(\.[a-zA-Z]\w*)+$/.test(e);
}
function translate(e) {
  return Editor.I18n.t("openharmony." + e);
}
function verificationFunc(e, t, a) {
  var r = { error: "", newValue: t, level: true };
  switch (e) {
    case "packageName": {
      if (checkIsEmpty(t)) {
        r.newValue = exports.defaultOptions.packageName;
        r.error = translate("tips.not_empty");
      } else if (!checkPackageNameValidity(t)) {
        r.newValue = exports.defaultOptions.packageName;
        r.error = translate("tips.package_name_error");
      }

      break;
    }
    case "apiLevel": {
      if (checkIsEmpty(t)) {
        r.error = "API Level" + translate("tips.not_empty");
      }

      if (Number(t) < 7) {
        r.error = "API Level needs to be higher than 7";
      }
    }
  }
  return r;
}
function getVerifyMap() {
  const e = {};

  ["packageName", "apiLevel"].forEach((a) => {
    e[a] = (e, t) => verificationFunc(a, e, t);
  });

  return e;
}
function checkIsEmpty(e) {
  return e == null || e === "";
}
Object.defineProperty(exports, "__esModule", { value: true });

exports.checkIsEmpty = undefined;
exports.getVerifyMap = undefined;
exports.verificationFunc = undefined;
exports.translate = undefined;
exports.defaultOptions = undefined;
exports.checkPackageNameValidity = undefined;

exports.checkPackageNameValidity = checkPackageNameValidity;

exports.defaultOptions = {
  packageName: "com.cocos.openharmony",
  orientation: {
    portrait: false,
    upsideDown: false,
    landscapeRight: true,
    landscapeLeft: true,
  },
  apiLevel: "7",
  appABIs: ["arm64-v8a"],
  sdkPath: "",
  ndkPath: "",
};

exports.translate = translate;
exports.verificationFunc = verificationFunc;
exports.getVerifyMap = getVerifyMap;
exports.checkIsEmpty = checkIsEmpty;
