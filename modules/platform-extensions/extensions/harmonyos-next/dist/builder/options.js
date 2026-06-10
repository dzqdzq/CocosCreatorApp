function checkPackageNameValidity(e) {
  return /^(?:[a-zA-Z](?:\w*[0-9a-zA-Z])?)(?:\.[0-9a-zA-Z](?:\w*[0-9a-zA-Z])?){2,}$/.test(
    e
  );
}
function findKeywordsTokenAware(e) {
  var t = ["openharmony", "harmonyos", "harmony", "system", "ohos", "oh"];
  var e = e.toLowerCase().split(".");
  var a = new Set();
  for (const r of e) {
    for (const n of t) {
      if (new RegExp(`(?:^|_)${n}(?:$|_)`).test(r)) {
        a.add(n);
      }
    }
  }
  return [...a];
}
function translate(e) {
  return Editor.I18n.t("harmonyos-next." + e);
}
function verificationFunc(e, t, a) {
  var r = { error: "", newValue: t, level: "error" };
  switch (e) {
    case "packageName": {
      if (checkIsEmpty(t)) {
        r.newValue = exports.defaultOptions.packageName;
        r.error = translate("tips.not_empty");
      } else if (checkPackageNameValidity(t)) {
        if (t.length < 7 || t.length > 128) {
          r.newValue = exports.defaultOptions.packageName;
          r.error = translate("tips.package_name_length");
        } else if (findKeywordsTokenAware(t).length > 0) {
          r.newValue = exports.defaultOptions.packageName;
          r.error = translate("tips.package_name_contains_sensitive_words");
        }
      } else {
        r.newValue = exports.defaultOptions.packageName;
        r.error = translate("tips.package_name_error");
      }

      break;
    }
    case "appABIs": {
      if (t && t.length) {
        break;
      }
      r.error = translate("tips.at_least_one");
      return r;
    }
    case "renderBackEnd": {
      if (!t) {
        r.error = translate("tips.not_empty");
        return r;
      }
      if (Object.keys(t).every((e) => !t[e])) {
        r.error = translate("tips.at_least_one");
        return r;
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
      break;
    }
    case "deviceTypes": {
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

  ["packageName"].forEach((a) => {
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
exports.findKeywordsTokenAware = findKeywordsTokenAware;
exports.translate = translate;
exports.verificationFunc = verificationFunc;
exports.getVerifyMap = getVerifyMap;
exports.checkIsEmpty = checkIsEmpty;

exports.defaultOptions = {
  packageName: "com.cocos.test",
  orientation: {
    portrait: false,
    upsideDown: false,
    landscapeRight: true,
    landscapeLeft: true,
  },
  deviceTypes: {
    phone: false,
    tablet: false,
    pc_2in1: false,
    tv: false,
    wearable: false,
    car: false,
    default: true,
  },
  appABIs: ["arm64-v8a"],
  sdkPath: "",
  ndkPath: "",
};
