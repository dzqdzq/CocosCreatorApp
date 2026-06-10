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
  return Editor.I18n.t("google-play." + e);
}
async function verificationFunc(e, t, a) {
  const r = { error: "", newValue: t, level: "error" };
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
    case "apiLevel": {
      return checkAndroidAPILevels(t, a);
    }
    case "maxAspectRatio": {
      if (a.packages["google-play"].resizeableActivity) {
        break;
      }
      if (t && t.trim().length !== 0) {
        var s = t.match(MaxAspectRatioOptRegex);

        var o = (e, t) => {
          e = Number.parseInt(e);
          t = Number.parseInt(t);
          if (e === 0 || t === 0 || e / t < 1.33) {
            r.error = translate("tips.mar_bad_value");
            return r;
          }
        };

        if (s) {
          if (s[3]) {
            r.newValue = s[4] + ":" + s[5];
            o(s[4], s[5]);
          } else {
            r.newValue = s[1];

            Number.parseFloat(r.newValue) < 1.33 &&
              (r.error = translate("tips.mar_bad_value"));
          }
        } else if ((s = t.match(MaxAspectRatioFractionRegex))) {
          r.newValue = s[1] + ":" + s[2];
          o(s[1], s[2]);
        } else {
          r.error = translate("tips.mar_format");
        }
      } else {
        r.error = translate("tips.mar_empty");
      }
      return r;
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
    case "keystorePath": {
      if (!a.packages["google-play"].useDebugKeystore) {
        if (checkIsEmpty(t)) {
          r.error = translate("KEYSTORE.error.keystore_path_empty");
        }
      }

      break;
    }
    case "keystorePassword":
    case "keystoreAlias":
    case "keystoreAliasPassword": {
      if (!a.packages["google-play"].useDebugKeystore) {
        if (checkIsEmpty(t)) {
          r.error = translate("tips.not_empty");
        }
      }

      break;
    }
    case "remoteUrl": {
      if (!a.packages["google-play"].androidInstant || checkIsEmpty(t)) {
        return r;
      }

      if (!t.startsWith("http")) {
        r.error = "remoteUrl  should start with http";
      }
    }
  }
  return r;
}
async function checkAndroidAPILevels(e, t) {
  var a = { newValue: e, error: "", level: "error" };

  if (checkIsEmpty(e)) {
    a.error = "API Level" + translate("tips.not_empty");
  }

  if (isNaN(e)) {
    a.error = "API Level" + translate("tips.not_empty");
  } else {
    e = e;

    t.packages["google-play"].androidInstant && e < 23
      ? ((a.error =
          Editor.I18n.t("android.tips.when_enable_instant") +
          Editor.I18n.t("android.tips.apilevel_limit", { version: "23" })),
        (a.newValue = 23))
      : t.packages.native.JobSystem === "tbb" && e < 21
      ? ((a.error =
          Editor.I18n.t("android.tips.when_enable_tbb") +
          Editor.I18n.t("android.tips.apilevel_limit", { version: "21" })),
        (a.newValue = 21))
      : "5d45ba66-829a-46d3-948e-2ed3fa7ee421" ===
          (await Editor.Profile.getProject(
            "project",
            "general.renderPipeline"
          )) && e < 21
      ? ((a.error =
          Editor.I18n.t("android.tips.when_enable_deferred") +
          Editor.I18n.t("android.tips.apilevel_limit", { version: "21" })),
        (a.newValue = 21))
      : e < 19 &&
        ((a.error = Editor.I18n.t("android.tips.apilevel_limit", {
          version: "19",
        })),
        (a.newValue = 19));
  }

  return a;
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
  ].forEach((a) => {
    e[a] = (e, t) => verificationFunc(a, e, t);
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
  appBundle: true,
  androidInstant: false,
  googleBilling: true,
  playGames: true,
  inputSDK: false,
  isSoFileCompressed: false,
  remoteUrl: "",
  sdkPath: "",
  ndkPath: "",
  javaHome: "",
  javaPath: "",
  renderBackEnd: { vulkan: true, gles3: false, gles2: false },
  swappy: false,
  adpf: true,
  customIcon: "default",
};
