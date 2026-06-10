Object.defineProperty(exports, "__esModule", { value: true });
exports.throwError = undefined;
exports.onAfterInit = onAfterInit;
exports.onAfterBundleInit = onAfterBundleInit;
exports.openWithIDE = openWithIDE;

const { statSync, existsSync } = require("fs-extra");

const { normalize, join, dirname } = require("path");

const { checkAndroidAPILevels } = require("./options");

const { platform } = require("os");

async function generateOptions(e) {
  var a = e.packages.android;

  a.orientation = a.orientation || {};

  var t = await Editor.Message.request(
    "program",
    "query-program-info",
    "androidSDK"
  );

  var o = await Editor.Message.request(
    "program",
    "query-program-info",
    "androidNDK"
  );

  var r = await Editor.Message.request(
    "program",
    "query-program-info",
    "javaHome"
  );

  a.sdkPath = e.packages.android.sdkPath || t?.path || "";
  a.ndkPath = e.packages.android.ndkPath || o?.path || "";
  a.javaHome = e.packages.android.javaHome || r?.path || "";
  a.javaPath = "";

  if (a.javaHome) {
    try {
      var s;
      var n;
      var i = statSync(a.javaHome);

      if (i.isFile()) {
        a.javaPath = a.javaHome;
        a.javaHome = normalize(join(dirname(a.javaPath), ".."));
      } else if (i.isDirectory()) {
        s = platform() === "win32" ? "java.exe" : "java";
        n = join(a.javaHome, "bin", s);

        existsSync(n)
          ? (a.javaPath = n)
          : console.error(`Java executable not found at ${a.javaHome}/bin`);
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (a.sdkPath && a.ndkPath) {
    if (a.keystorePath) {
      a.keystorePath = Editor.UI.__protected__.File.resolveToRaw(
        a.keystorePath
      );
    }

    return {
      packageName: a.packageName || "",
      resizeableActivity: a.resizeableActivity ?? true,
      maxAspectRatio: a.maxAspectRatio ?? "2.4",
      orientation: {
        landscapeRight: a.orientation.landscapeRight ?? true,
        landscapeLeft: a.orientation.landscapeLeft ?? true,
        portrait: a.orientation.portrait ?? false,
        upsideDown: a.orientation.upsideDown ?? false,
      },
      apiLevel: a.apiLevel,
      appABIs: a.appABIs || [],
      isSoFileCompressed: a.isSoFileCompressed ?? true,
      useDebugKeystore: a.useDebugKeystore,
      keystorePath: a.keystorePath || "",
      keystorePassword: a.keystorePassword || "",
      keystoreAlias: a.keystoreAlias || "",
      keystoreAliasPassword: a.keystoreAliasPassword || "",
      appBundle: a.appBundle ?? false,
      androidInstant: a.androidInstant ?? false,
      inputSDK: a.inputSDK ?? false,
      remoteUrl: a.remoteUrl || "",
      sdkPath: a.sdkPath || "",
      ndkPath: a.ndkPath || "",
      javaHome: a.javaHome || "",
      javaPath: a.javaPath || "",
      swappy: a.swappy || false,
      renderBackEnd: {
        vulkan: a.renderBackEnd?.vulkan ?? true,
        gles3: a.renderBackEnd?.gles3 ?? true,
        gles2: a.renderBackEnd?.gles2 ?? true,
      },
    };
  }
  throw new Error(Editor.I18n.t("android.tips.android_sdk_error"));
}
async function onAfterInit(a, e, t) {
  var o = await generateOptions(a);
  const r = (a.packages.android = o).renderBackEnd;
  e.staticsInfo.B100005 = o.packageName;
  e.staticsInfo.B100011 = o.orientation;
  e = await checkAndroidAPILevels(o.apiLevel, a);

  if (e.error && (console.error(e.error), e.newValue)) {
    o.apiLevel = e.newValue;
  }

  Editor.Metrics.trackEvent({
    category: "Project",
    action: "Rendering Backend",
    label: "Vulkan",
    value: a.packages.android.renderBackEnd.vulkan ? 100 : 0,
  });

  if (o.useDebugKeystore) {
    o.keystorePath = join(Editor.App.path, "../tools/keystore/debug.keystore");
    o.keystoreAlias = "debug_keystore";
    o.keystorePassword = "123456";
    o.keystoreAliasPassword = "123456";
  }

  Object.assign(a.cocosParams.platformParams, o);

  if (r) {
    Object.keys(r).forEach((e) => {
      a.cocosParams.cMakeConfig["CC_USE_" + e.toUpperCase()] = r[e];
    });
  }

  a.cocosParams.cMakeConfig.CC_ENABLE_SWAPPY = !!o.swappy;
  a.cocosParams.cMakeConfig.USE_ADPF = true;
}
function onAfterBundleInit(e) {
  var a = e.packages.android.renderBackEnd;
  e.assetSerializeOptions["cc.EffectAsset"].glsl1 = a.gles2 ?? true;
  e.assetSerializeOptions["cc.EffectAsset"].glsl3 = a.gles3 ?? true;
  e.assetSerializeOptions["cc.EffectAsset"].glsl4 = a.vulkan ?? true;
}
async function openWithIDE(e) {
  var a = await Editor.Message.request(
    "program",
    "query-program-info",
    "androidStudio"
  );

  if (a && a.path) {
    Editor.Message.send(
      "builder",
      "execute-hook-task",
      "native",
      "open",
      e,
      dirname(a.path)
    );
  } else {
    Editor.Dialog.warn(Editor.I18n.t("android.customIcon.ideNotFound"), {
      title: Editor.I18n.t("android.customIcon.openFailed"),
    });
  }
}
exports.throwError = true;
