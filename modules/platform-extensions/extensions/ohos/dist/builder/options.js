function checkPackageNameValidity(e) {
  return /^[a-zA-Z]\w*(\.[a-zA-Z]\w*)+$/.test(e);
}
function translate(e) {
  return Editor.I18n.t("ohos." + e);
}
function verificationFunc(e, t, a) {
  var r = { error: "", newValue: t, level: "error" };
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

      break;
    }
    case "orientation": {
      if (!t) {
        r.error = translate("tips.not_empty");
        return r;
      }
      if (Object.keys(t).every((e) => !t[e])) {
        r.error = translate("tips.at_least_one");
        return r;
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
exports.defaultOptions = undefined;
exports.checkPackageNameValidity = checkPackageNameValidity;
exports.translate = translate;
exports.verificationFunc = verificationFunc;
exports.getVerifyMap = getVerifyMap;
exports.checkIsEmpty = checkIsEmpty;

exports.defaultOptions = {
  packageName: "com.cocos.ohos",
  orientation: {
    portrait: false,
    upsideDown: false,
    landscapeRight: true,
    landscapeLeft: true,
  },
  apiLevel: "5",
  appABIs: [],
  useDebugKeystore: true,
  keystorePath: "",
  keystorePassword: "",
  keystoreAlias: "",
  keystoreAliasPassword: "",
  appBundle: false,
  androidInstant: false,
  remoteUrl: "",
  sdkPath: "",
  ndkPath: "",
};
