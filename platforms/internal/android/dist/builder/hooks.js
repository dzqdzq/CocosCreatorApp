Object.defineProperty(exports, "__esModule", { value: true });
exports.onAfterInit = undefined;
exports.throwError = undefined;
const fs_1 = require("fs");
const path_1 = require("path");
const options_1 = require("./options");
async function generateOptions(e) {
  var a;
  var e = e.packages.android;
  e.orientation = e.orientation || {};
  e.sdkPath = (await Editor.Profile.getConfig("program", "android_sdk")) || "";
  e.ndkPath = (await Editor.Profile.getConfig("program", "android_ndk")) || "";

  if (e.sdkPath && e.ndkPath) {
    return {
      packageName: e.packageName || "",
      orientation: {
        landscapeRight: null == (a = e.orientation.landscapeRight) || a,
        landscapeLeft: null == (a = e.orientation.landscapeLeft) || a,
        portrait: null != (a = e.orientation.portrait) && a,
        upsideDown: null != (a = e.orientation.upsideDown) && a,
      },
      apiLevel: e.apiLevel || "",
      appABIs: e.appABIs || [],
      useDebugKeystore: e.useDebugKeystore,
      keystorePath: e.keystorePath || "",
      keystorePassword: e.keystorePassword || "",
      keystoreAlias: e.keystoreAlias || "",
      keystoreAliasPassword: e.keystoreAliasPassword || "",
      appBundle: null != (a = e.appBundle) && a,
      androidInstant: null != (a = e.androidInstant) && a,
      remoteUrl: e.remoteUrl || "",
      sdkPath: e.sdkPath || "",
      ndkPath: e.ndkPath || "",
      renderBackEnd: {
        vulkan:
          null != (a = null == (a = e.renderBackEnd) ? undefined : a.vulkan) &&
          a,
        gles3:
          null == (a = null == (a = e.renderBackEnd) ? undefined : a.gles3) ||
          a,
        gles2:
          null == (e = null == (a = e.renderBackEnd) ? undefined : a.gles2) ||
          e,
      },
    };
  }

  throw new Error(Editor.I18n.t("android.tips.android_sdk_error"));
}
async function onAfterInit(e, a, r) {
  var t = await generateOptions(e);
  var n = (e.packages.android = t).renderBackEnd;

  var n =
    ((e.assetSerializeOptions["cc.EffectAsset"].glsl1 =
      null == (o = n.gles2) || o),
    (e.assetSerializeOptions["cc.EffectAsset"].glsl3 =
      null == (o = n.gles3) || o),
    (e.assetSerializeOptions["cc.EffectAsset"].glsl4 =
      null == (o = n.vulkan) || o),
    { packageName: t.packageName, orientation: t.orientation });

  r.__addStaticsInfo(n);
  var o = await options_1.checkAndroidAPILevels(t.apiLevel, e);

  if (o.error && (console.error(o.error), o.newValue)) {
    t.apiLevel = o.newValue;
  }

  Editor.Metrics.trackEvent({
    category: "Project",
    action: "Rendering Backend",
    label: "Vulkan",
    value: e.packages.android.renderBackEnd.vulkan ? 100 : 0,
  });

  var r = path_1.join(
    Editor.Project.path,
    "native",
    "android",
    "res",
    "values",
    "strings.xml"
  );

  if (fs_1.existsSync(r)) {
    fs_1.readFileSync(r, "utf8");
  }
}
exports.throwError = true;
exports.onAfterInit = onAfterInit;
