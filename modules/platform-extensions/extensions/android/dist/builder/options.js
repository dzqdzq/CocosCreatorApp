function checkPackageNameValidity(e) {
  return /^[a-zA-Z]\w*(\.[a-zA-Z]\w*)+$/.test(e);
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultOptions = undefined;
exports.checkPackageNameValidity = checkPackageNameValidity;
exports.translate = translate;
exports.verificationFunc = verificationFunc;
exports.checkAndroidAPILevels = checkAndroidAPILevels;
exports.getVerifyMap = getVerifyMap;
exports.checkIsEmpty = checkIsEmpty;

const MaxAspectRatioOptRegex =
  /^\s*(\d+(\.\d+)?)\s*(\(\s*(\d+)\s*:\s*(\d+)\s*\)\s*)?$/;

const MaxAspectRatioFractionRegex = /^\s*(\d+)\s*:\s*(\d+)\s*$/;
function translate(e) {
  return Editor.I18n.t("android." + e);
}
async function verificationFunc(e, t, r) {
  const a = { error: "", newValue: t, level: "error" };
  switch (e) {
    case "packageName": {
      if (checkIsEmpty(t)) {
        a.newValue = exports.defaultOptions.packageName;
        a.error = translate("tips.not_empty");
      } else if (!checkPackageNameValidity(t)) {
        a.newValue = exports.defaultOptions.packageName;
        a.error = translate("tips.package_name_error");
      }

      break;
    }
    case "appABIs": {
      if (t && t.length) {
        break;
      }
      a.error = translate("tips.at_least_one");
      return a;
    }
    case "renderBackEnd": {
      if (!t) {
        a.error = translate("tips.not_empty");
        return a;
      }
      if (Object.keys(t).every((e) => !t[e])) {
        a.error = translate("tips.at_least_one");
        return a;
      }
      break;
    }
    case "apiLevel": {
      return checkAndroidAPILevels(t, r);
    }
    case "maxAspectRatio": {
      if (r.packages.android.resizeableActivity) {
        break;
      }
      if (t && t.trim().length !== 0) {
        var s = t.match(MaxAspectRatioOptRegex);

        var n = (e, t) => {
          e = Number.parseInt(e);
          t = Number.parseInt(t);
          if (e === 0 || t === 0 || e / t < 1.33) {
            a.error = translate("tips.mar_bad_value");
            return a;
          }
        };

        if (s) {
          if (s[3]) {
            a.newValue = s[4] + ":" + s[5];
            n(s[4], s[5]);
          } else {
            a.newValue = s[1];

            Number.parseFloat(a.newValue) < 1.33 &&
              (a.error = translate("tips.mar_bad_value"));
          }
        } else if ((s = t.match(MaxAspectRatioFractionRegex))) {
          a.newValue = s[1] + ":" + s[2];
          n(s[1], s[2]);
        } else {
          a.error = translate("tips.mar_format");
        }
      } else {
        a.error = translate("tips.mar_empty");
      }
      return a;
    }
    case "orientation": {
      if (!t) {
        a.error = translate("tips.not_empty");
        return a;
      }
      if (Object.keys(t).every((e) => !t[e])) {
        a.error = translate("tips.at_least_one");
        return a;
      }
      break;
    }
    case "keystorePath": {
      if (!r.packages.android.useDebugKeystore) {
        if (checkIsEmpty(t)) {
          a.error = translate("KEYSTORE.error.keystore_path_empty");
        }
      }

      break;
    }
    case "keystorePassword":
    case "keystoreAlias":
    case "keystoreAliasPassword": {
      if (!r.packages.android.useDebugKeystore) {
        if (checkIsEmpty(t)) {
          a.error = translate("tips.not_empty");
        }
      }

      break;
    }
    case "remoteUrl": {
      if (!r.packages.android.androidInstant || checkIsEmpty(t)) {
        return a;
      }

      if (!t.startsWith("http")) {
        a.error = "remoteUrl  should start with http";
      }
    }
  }
  return a;
}
async function checkAndroidAPILevels(e, t) {
  var r = { newValue: e, error: "", level: "error" };

  if (checkIsEmpty(e)) {
    r.error = "API Level" + translate("tips.not_empty");
  }

  if (isNaN(e)) {
    r.error = "API Level" + translate("tips.not_empty");
  } else {
    e = e;

    t.packages.android.androidInstant && e < 23
      ? ((r.error =
          Editor.I18n.t("android.tips.when_enable_instant") +
          Editor.I18n.t("android.tips.apilevel_limit", { version: "23" })),
        (r.newValue = 23))
      : t.packages.native.JobSystem === "tbb" && e < 21
      ? ((r.error =
          Editor.I18n.t("android.tips.when_enable_tbb") +
          Editor.I18n.t("android.tips.apilevel_limit", { version: "21" })),
        (r.newValue = 21))
      : "5d45ba66-829a-46d3-948e-2ed3fa7ee421" ===
          (await Editor.Profile.getProject(
            "project",
            "general.renderPipeline"
          )) && e < 21
      ? ((r.error =
          Editor.I18n.t("android.tips.when_enable_deferred") +
          Editor.I18n.t("android.tips.apilevel_limit", { version: "21" })),
        (r.newValue = 21))
      : e < 19 &&
        ((r.error = Editor.I18n.t("android.tips.apilevel_limit", {
          version: "19",
        })),
        (r.newValue = 19));
  }

  return r;
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
  ].forEach((r) => {
    e[r] = (e, t) => verificationFunc(r, e, t);
  });

  return e;
}
function checkIsEmpty(e) {
  return e == null || e === "";
}
exports.defaultOptions = {
  packageName: "",
  resizeableActivity: true,
  maxAspectRatio: "2.4",
  orientation: {
    portrait: false,
    upsideDown: false,
    landscapeRight: true,
    landscapeLeft: true,
  },
  apiLevel: 26,
  appABIs: ["arm64-v8a"],
  useDebugKeystore: true,
  keystorePath: "",
  keystorePassword: "",
  keystoreAlias: "",
  keystoreAliasPassword: "",
  appBundle: false,
  androidInstant: false,
  inputSDK: false,
  isSoFileCompressed: true,
  remoteUrl: "",
  sdkPath: "",
  ndkPath: "",
  javaHome: "",
  javaPath: "",
  renderBackEnd: { vulkan: false, gles3: true, gles2: true },
  swappy: false,
};
