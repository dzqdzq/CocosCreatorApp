function checkPackageNameValidity(e) {
  return /^[a-zA-Z]\w*(\.[a-zA-Z]\w*)+$/.test(e);
}
function translate(e) {
  return Editor.I18n.t("android." + e);
}
async function verificationFunc(e, r, t) {
  var a = { error: "", newValue: r };
  switch (e) {
    case "packageName": {
      if (checkIsEmpty(r)) {
        a.newValue = exports.defaultOptions.packageName;
        a.error = translate("tips.not_empty");
      } else if (!checkPackageNameValidity(r)) {
        a.newValue = exports.defaultOptions.packageName;
        a.error = translate("tips.package_name_error");
      }

      break;
    }
    case "appABIs": {
      if (r && r.length) {
        break;
      }
      a.error = translate("tips.at_least_one");
      return a;
    }
    case "renderBackEnd": {
      if (!r) {
        a.error = translate("tips.not_empty");
        return a;
      }
      if (Object.keys(r).every((e) => !r[e])) {
        a.error = translate("tips.at_least_one");
        return a;
      }
      break;
    }
    case "apiLevel": {
      return checkAndroidAPILevels(r, t);
    }
    case "keystorePath": {
      if (!t.packages.android.useDebugKeystore) {
        if (checkIsEmpty(r)) {
          a.error = translate("KEYSTORE.error.keystore_path_empty");
        }
      }

      break;
    }
    case "keystorePassword":
    case "keystoreAlias":
    case "keystoreAliasPassword": {
      if (!t.packages.android.useDebugKeystore) {
        if (checkIsEmpty(r)) {
          a.error = translate("tips.not_empty");
        }
      }

      break;
    }
    case "remoteUrl": {
      if (!t.packages.android.androidInstant || checkIsEmpty(r)) {
        return a;
      }

      if (!r.startsWith("http")) {
        a.error = "remoteUrl  should start with http";
      }
    }
  }
  return a;
}
async function checkAndroidAPILevels(e, r) {
  var t = { newValue: e, error: "" };

  var e =
    (checkIsEmpty(e) && (t.error = "API Level" + translate("tips.not_empty")),
    e.match(/^android-([0-9]*)/));

  if (e) {
    e = Number(e[1]);

    r.packages.android.androidInstant && e < 23
      ? ((t.error =
          Editor.I18n.t("android.tips.when_enable_instant") +
          Editor.I18n.t("android.tips.apilevel_limit", { version: "23" })),
        (t.newValue = "android-23"))
      : r.packages.native.JobSystem === "tbb" && e < 21
      ? ((t.error =
          Editor.I18n.t("android.tips.when_enable_tbb") +
          Editor.I18n.t("android.tips.apilevel_limit", { version: "21" })),
        (t.newValue = "android-21"))
      : "5d45ba66-829a-46d3-948e-2ed3fa7ee421" ===
          (await Editor.Profile.getProject(
            "project",
            "general.renderPipeline"
          )) && e < 21
      ? ((t.error =
          Editor.I18n.t("android.tips.when_enable_deferred") +
          Editor.I18n.t("android.tips.apilevel_limit", { version: "21" })),
        (t.newValue = "android-21"))
      : e < 18 &&
        ((t.error = Editor.I18n.t("android.tips.apilevel_limit", {
          version: "18",
        })),
        (t.newValue = "android-18"));
  } else {
    t.error = "API Level" + translate("tips.not_empty");
  }

  return t;
}
function getVerifyMap() {
  const e = {};

  [
    "packageName",
    "apiLevel",
    "keystorePath",
    "keystorePassword",
    "keystoreAlias",
    "keystoreAliasPassword",
  ].forEach((t) => {
    e[t] = (e, r) => verificationFunc(t, e, r);
  });

  return e;
}
function checkIsEmpty(e) {
  return e == null || e === "";
}
Object.defineProperty(exports, "__esModule", { value: true });

exports.checkIsEmpty = undefined;
exports.getVerifyMap = undefined;
exports.checkAndroidAPILevels = undefined;
exports.verificationFunc = undefined;
exports.translate = undefined;
exports.defaultOptions = undefined;
exports.checkPackageNameValidity = undefined;

exports.checkPackageNameValidity = checkPackageNameValidity;

exports.defaultOptions = {
  packageName: "",
  orientation: {
    portrait: false,
    upsideDown: false,
    landscapeRight: true,
    landscapeLeft: true,
  },
  apiLevel: "android-26",
  appABIs: ["arm64-v8a"],
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
  renderBackEnd: { vulkan: false, gles3: true, gles2: true },
};

exports.translate = translate;
exports.verificationFunc = verificationFunc;
exports.checkAndroidAPILevels = checkAndroidAPILevels;
exports.getVerifyMap = getVerifyMap;
exports.checkIsEmpty = checkIsEmpty;
