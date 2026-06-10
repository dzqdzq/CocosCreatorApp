Object.defineProperty(exports, "__esModule", { value: true });
exports.throwError = undefined;
exports.onAfterInit = onAfterInit;
exports.onAfterBundleInit = onAfterBundleInit;

const { statSync, existsSync } = require("fs-extra");

const { normalize, join, dirname } = require("path");

const { checkAndroidAPILevels } = require("./options");

const { getCustomIconInfo } = require("./customIcon");

const { platform } = require("os");

async function generateOptions(e) {
  var e = e.packages["google-play"];

  e.orientation = e.orientation || {};

  var a = await Editor.Message.request(
    "program",
    "query-program-info",
    "androidSDK"
  );

  var o = await Editor.Message.request(
    "program",
    "query-program-info",
    "androidNDK"
  );

  var t = await Editor.Message.request(
    "program",
    "query-program-info",
    "javaHome"
  );

  e.sdkPath = e.sdkPath || a?.path || "";
  e.ndkPath = e.ndkPath || o?.path || "";
  e.javaHome = e.javaHome || t?.path || "";
  e.javaPath = "";

  if (e.javaHome) {
    try {
      var r;
      var s;
      var n = statSync(e.javaHome);

      if (n.isFile()) {
        e.javaPath = e.javaHome;
        e.javaHome = normalize(join(dirname(e.javaPath), ".."));
      } else if (n.isDirectory()) {
        r = platform() === "win32" ? "java.exe" : "java";
        s = join(e.javaHome, "bin", r);

        existsSync(s)
          ? (e.javaPath = s)
          : console.error(`Java executable not found at ${e.javaHome}/bin`);
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (e.sdkPath && e.ndkPath) {
    return {
      packageName: e.packageName || "",
      resizeableActivity: e.resizeableActivity ?? true,
      maxAspectRatio: e.maxAspectRatio ?? "2.4",
      orientation: {
        landscapeRight: e.orientation.landscapeRight ?? true,
        landscapeLeft: e.orientation.landscapeLeft ?? true,
        portrait: e.orientation.portrait ?? false,
        upsideDown: e.orientation.upsideDown ?? false,
      },
      apiLevel: e.apiLevel,
      appABIs: e.appABIs || [],
      useDebugKeystore: e.useDebugKeystore,
      keystorePath: e.keystorePath || "",
      keystorePassword: e.keystorePassword || "",
      keystoreAlias: e.keystoreAlias || "",
      keystoreAliasPassword: e.keystoreAliasPassword || "",
      isSoFileCompressed: e.isSoFileCompressed ?? false,
      appBundle: e.appBundle ?? true,
      androidInstant: e.androidInstant ?? false,
      googleBilling: e.googleBilling ?? true,
      playGames: e.playGames ?? true,
      inputSDK: e.inputSDK ?? false,
      remoteUrl: e.remoteUrl || "",
      sdkPath: e.sdkPath || "",
      ndkPath: e.ndkPath || "",
      javaHome: e.javaHome || "",
      javaPath: e.javaPath || "",
      swappy: e.swappy || false,
      adpf: e.adpf || false,
      renderBackEnd: {
        vulkan: e.renderBackEnd?.vulkan ?? true,
        gles3: e.renderBackEnd?.gles3 ?? true,
        gles2: e.renderBackEnd?.gles2 ?? true,
      },
      customIcon: e.customIcon,
    };
  }
  throw new Error(Editor.I18n.t("googlePlay.tips.android_sdk_error"));
}
async function onAfterInit(a, e, o) {
  var t = await generateOptions(a);
  const r = (a.packages["google-play"] = t).renderBackEnd;
  e.staticsInfo.B100005 = t.packageName;
  e.staticsInfo.B100011 = t.orientation;
  e = await checkAndroidAPILevels(t.apiLevel, a);

  if (e.error && (console.error(e.error), e.newValue)) {
    t.apiLevel = e.newValue;
  }

  Editor.Metrics.trackEvent({
    category: "Project",
    action: "Rendering Backend",
    label: "Vulkan",
    value: a.packages["google-play"].renderBackEnd.vulkan ? 100 : 0,
  });

  if (t.useDebugKeystore) {
    t.keystorePath = join(Editor.App.path, "../tools/keystore/debug.keystore");
    t.keystoreAlias = "debug_keystore";
    t.keystorePassword = "123456";
    t.keystoreAliasPassword = "123456";
  }

  Object.assign(a.cocosParams.platformParams, t);

  if (r) {
    Object.keys(r).forEach((e) => {
      a.cocosParams.cMakeConfig["CC_USE_" + e.toUpperCase()] = r[e];
    });
  }

  a.cocosParams.cMakeConfig.CC_ENABLE_SWAPPY = !!t.swappy;
  a.cocosParams.cMakeConfig.USE_ADPF = !!t.adpf;

  if (!a.includeModules.includes("vendor-google")) {
    a.includeModules.push("vendor-google");
    t.googleBilling && (a.cocosParams.cMakeConfig.USE_GOOGLE_BILLING = true);
    t.playGames && (a.cocosParams.cMakeConfig.USE_GOOGLE_PLAY_GAMES = true);
  }

  a.cocosParams.platformParams.customIconInfo = getCustomIconInfo(
    t.customIcon,
    a.outputName
  );
}
function onAfterBundleInit(e) {
  var a = e.packages["google-play"].renderBackEnd;
  e.assetSerializeOptions["cc.EffectAsset"].glsl1 = a.gles2 ?? true;
  e.assetSerializeOptions["cc.EffectAsset"].glsl3 = a.gles3 ?? true;
  e.assetSerializeOptions["cc.EffectAsset"].glsl4 = a.vulkan ?? true;
}
exports.throwError = true;
