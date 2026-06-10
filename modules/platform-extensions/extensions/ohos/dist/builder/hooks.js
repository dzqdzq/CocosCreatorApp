var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwError = undefined;
exports.onAfterInit = onAfterInit;
exports.onAfterBundleInit = onAfterBundleInit;
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_extra_1 = require("fs-extra");

const { existsSync, accessSync } = fs_extra_1;

function localWhich(t) {
  var e = [t];
  const r = os_1.default.platform() === "win32";

  if (r) {
    e.push(t + ".exe");
  }

  t = r ? process.env.PATH?.split(";") : process.env.PATH?.split(":");
  if (t && t.length !== 0) {
    for (const a of t) {
      if (
        e.filter((t) => {
          if (!existsSync(path_1.default.join(a, t))) {
            return false;
          }
          if (r) {
            return true;
          }
          try {
            accessSync(path_1.default.join(a, t), fs_extra_1.constants.X_OK);

            return true;
          } catch (t) {
            return false;
          }
        }).length > 0
      ) {
        return a;
      }
    }
  }
  return null;
}
async function generateOptions(t) {
  var t = t.packages.ohos;

  t.orientation = t.orientation || {};
  var e = await Editor.Message.request(
    "program",
    "query-program-info",
    "ohosSDK"
  );

  var r = await Editor.Message.request(
    "program",
    "query-program-info",
    "ohosNDK"
  );

  t.sdkPath = e ? e.path : "";
  t.ndkPath = r ? r.path : "";

  if (t.sdkPath && t.ndkPath) {
    return {
      packageName: t.packageName || "",
      orientation: {
        landscapeRight: t.orientation.landscapeRight ?? true,
        landscapeLeft: t.orientation.landscapeLeft ?? true,
        portrait: t.orientation.portrait ?? false,
        upsideDown: t.orientation.upsideDown ?? false,
      },
      apiLevel: t.apiLevel || 26,
      sdkPath: t.sdkPath || "",
      ndkPath: t.ndkPath || "",
      renderBackEnd: { gles3: t.renderBackEnd?.gles3 ?? true },
    };
  }

  throw new Error(Editor.I18n.t("ohos.tips.ohos_sdk_error"));
}
async function onAfterInit(e, t, r) {
  var a = await generateOptions(e);
  const o = (e.packages.ohos = a).renderBackEnd;

  if (o) {
    Object.keys(o).forEach((t) => {
      e.cocosParams.cMakeConfig["CC_USE_" + t.toUpperCase()] = o[t];
    });
  }

  Object.assign(e.cocosParams.platformParams, a);
  t.staticsInfo.B100005 = a.packageName;
  t.staticsInfo.B100011 = a.orientation;
}
function onAfterBundleInit(t) {
  t.packages.ohos.renderBackEnd;
  t.assetSerializeOptions["cc.EffectAsset"].glsl1 = false;
  t.assetSerializeOptions["cc.EffectAsset"].glsl3 = true;
  t.assetSerializeOptions["cc.EffectAsset"].glsl4 = false;
}
exports.throwError = true;
