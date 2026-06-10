Object.defineProperty(exports, "__esModule", { value: true });
exports.throwError = undefined;
exports.onAfterInit = onAfterInit;
exports.onAfterBundleInit = onAfterBundleInit;

const { join } = require("path");

exports.throwError = true;
let nativePackToolManager = null;
async function onAfterInit(e, a, t) {
  const n = (e.packages.linux.renderBackEnd = {
    gles2: false,
    gles3: false,
    metal: true,
  });

  const e_cocosParams = e.cocosParams;

  Object.keys(n).forEach((e) => {
    e_cocosParams.cMakeConfig["CC_USE_" + e.toUpperCase()] = n[e];
  });

  e_cocosParams.cMakeConfig.USE_SERVER_MODE = `set(USE_SERVER_MODE ${
    e.packages.native.serverMode ? "ON" : "OFF"
  })`;

  var o = Number(e.packages.native.netMode);
  e.packages.native.netMode = isNaN(o) || o > 2 || o < 0 ? 0 : o;
  e_cocosParams.cMakeConfig.NET_MODE = `set(NET_MODE ${e.buildScriptParam.flags.NET_MODE})`;
  await getNativePackToolMg(
    e_cocosParams.enginePath || e.engineInfo.typescript.path
  );
}
function onAfterBundleInit(e) {
  var a = Number(e.packages.native.netMode);
  var a = (e.packages.native.netMode = isNaN(a) || a > 2 || a < 0 ? 0 : a);
  e.buildScriptParam.flags.SERVER_MODE = !!e.packages.native.serverMode;
  e.buildScriptParam.flags.NET_MODE = a;
}
async function getNativePackToolMg(e = "") {
  if (!nativePackToolManager) {
    var a = require(join(
      e,
      "scripts/native-pack-tool/dist/index"
    )).NativePackTool;

    var { NativePackToolManager: e, nativePackToolMg } = require(join(
      e,
      "scripts/native-pack-tool/dist/index"
    ));

    class n extends a {
      async create() {
        await this.copyCommonTemplate();
        await this.copyPlatformTemplate();
        await this.generateCMakeConfig();
        await this.executeCocosTemplateTask();
        this.generateCMakeConfig();
        await this.encryptScripts();
        return true;
      }
    }
    e.register("linux", n);
    nativePackToolManager = nativePackToolMg;
  }
  return nativePackToolManager;
}
