Object.defineProperty(exports, "__esModule", { value: true });
exports.onAfterInit = onAfterInit;
exports.onAfterBundleInit = onAfterBundleInit;

const { executableNameOrDefault } = require("./utils");

async function onAfterInit(e, a, s) {
  const t = e.packages.windows.renderBackEnd;
  a.staticsInfo.B100005 = e.name;

  Editor.Metrics.trackEvent({
    category: "Project",
    action: "Rendering Backend",
    label: "Vulkan",
    value: e.packages.windows.renderBackEnd.vulkan ? 100 : 0,
  });

  const e_cocosParams = e.cocosParams;
  e_cocosParams.platformParams.targetPlatform = "x64";
  e_cocosParams.platformParams.vsVersion = e.packages.windows.vsData || "";

  e_cocosParams.cMakeConfig.USE_SERVER_MODE = `set(USE_SERVER_MODE ${
    e.packages.native.serverMode ? "ON" : "OFF"
  })`;

  a = Number(e.packages.native.netMode);

  e_cocosParams.cMakeConfig.NET_MODE = `set(NET_MODE ${
    isNaN(a) || a > 2 || a < 0 ? 0 : a
  })`;

  e.buildScriptParam.flags.NET_MODE = isNaN(a) || a > 2 || a < 0 ? 0 : a;

  e_cocosParams.cMakeConfig.NET_MODE = `set(NET_MODE ${
    isNaN(a) || a > 2 || a < 0 ? 0 : a
  })`;

  e_cocosParams.executableName = executableNameOrDefault(
    e_cocosParams.projectName,
    e.packages.windows.executableName
  );

  if (e_cocosParams.executableName === "CocosGame") {
    console.warn(
      `The provided project name "${e_cocosParams.projectName}" is not suitable for use as an executable name. 'CocosGame' is applied instead.`
    );
  }

  e_cocosParams.cMakeConfig.CC_EXECUTABLE_NAME = `set(CC_EXECUTABLE_NAME "${e_cocosParams.executableName}")`;

  if (t) {
    Object.keys(t).forEach((e) => {
      e_cocosParams.cMakeConfig["CC_USE_" + e.toUpperCase()] = t[e];
    });
  }
}
async function onAfterBundleInit(e) {
  var a = e.packages.windows.renderBackEnd;

  var a =
    ((e.assetSerializeOptions["cc.EffectAsset"].glsl1 = a.gles2 ?? true),
    (e.assetSerializeOptions["cc.EffectAsset"].glsl3 = a.gles3 ?? true),
    (e.assetSerializeOptions["cc.EffectAsset"].glsl4 = a.vulkan ?? true),
    Number(e.packages.native.netMode));

  e.buildScriptParam.flags.NET_MODE = isNaN(a) || a > 2 || a < 0 ? 0 : a;
  e.buildScriptParam.flags.SERVER_MODE = !!e.packages.windows.serverMode;
}
