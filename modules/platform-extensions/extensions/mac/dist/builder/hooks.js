Object.defineProperty(exports, "__esModule", { value: true });
exports.throwError = undefined;
exports.onAfterInit = onAfterInit;
exports.onAfterBundleInit = onAfterBundleInit;

const { executableNameOrDefault } = require("./utils");

async function onAfterInit(e, a, t) {
  const s = (e.packages.mac.renderBackEnd = {
    gles2: false,
    gles3: false,
    metal: true,
  });
  var c = e.packages.mac;
  const e_cocosParams = e.cocosParams;

  e_cocosParams.cMakeConfig.TARGET_OSX_VERSION = `set(TARGET_OSX_VERSION ${
    c.targetVersion || "10.14"
  })`;

  e_cocosParams.cMakeConfig.CUSTOM_COPY_RESOURCE_HOOK =
    c.skipUpdateXcodeProject;
  e_cocosParams.cMakeConfig.MACOSX_BUNDLE_GUI_IDENTIFIER = `set(MACOSX_BUNDLE_GUI_IDENTIFIER ${c.packageName})`;
  e_cocosParams.platformParams.skipUpdateXcodeProject =
    c.skipUpdateXcodeProject;

  e_cocosParams.executableName = executableNameOrDefault(
    e_cocosParams.projectName,
    e.packages.mac.executableName
  );

  if (e_cocosParams.executableName === "CocosGame") {
    console.warn(
      `The provided project name "${e_cocosParams.projectName}" is not suitable for use as an executable name. 'CocosGame' is applied instead.`
    );
  }

  e_cocosParams.cMakeConfig.CC_EXECUTABLE_NAME = `set(CC_EXECUTABLE_NAME "${e_cocosParams.executableName}")`;
  e_cocosParams.platformParams.bundleId = c.packageName;

  Object.keys(s).forEach((e) => {
    e_cocosParams.cMakeConfig["CC_USE_" + e.toUpperCase()] = s[e];
  });

  e_cocosParams.cMakeConfig.USE_SERVER_MODE = `set(USE_SERVER_MODE ${
    e.packages.native.serverMode ? "ON" : "OFF"
  })`;

  c = Number(e.packages.native.netMode);
  c = e.packages.native.netMode = isNaN(c) || c > 2 || c < 0 ? 0 : c;
  e_cocosParams.cMakeConfig.NET_MODE = `set(NET_MODE ${c})`;
  a.staticsInfo.B100005 = e.packages.mac.packageName;
}
function onAfterBundleInit(e) {
  var a = e.packages.mac.renderBackEnd;

  var a =
    ((e.assetSerializeOptions["cc.EffectAsset"].glsl1 = a.gles2 ?? true),
    (e.assetSerializeOptions["cc.EffectAsset"].glsl3 = a.gles3 ?? true),
    (e.assetSerializeOptions["cc.EffectAsset"].glsl4 = a.metal ?? true),
    Number(e.packages.native.netMode));

  var a = (e.packages.native.netMode = isNaN(a) || a > 2 || a < 0 ? 0 : a);
  e.buildScriptParam.flags.SERVER_MODE = !!e.packages.native.serverMode;
  e.buildScriptParam.flags.NET_MODE = e.packages.native.netMode;
}
exports.throwError = true;
