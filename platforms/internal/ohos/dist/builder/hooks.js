var __importDefault =
  (this && this.__importDefault) ||
  ((t) => (t && t.__esModule ? t : { default: t }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAfterInit = undefined;
exports.throwError = undefined;
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_1 = require("fs");
function localWhich(t) {
  var e = [t];
  const n = os_1.default.platform() === "win32";

  if (n) {
    e.push(t + ".exe");
  }

  t = n
    ? null == (t = process.env.PATH)
      ? undefined
      : t.split(";")
    : null == (t = process.env.PATH)
    ? undefined
    : t.split(":");
  if (t && t.length !== 0) {
    for (const r of t) {
      if (
        e.filter((t) => {
          if (!fs_1.existsSync(path_1.default.join(r, t))) {
            return false;
          }
          if (n) {
            return true;
          }
          try {
            fs_1.accessSync(path_1.default.join(r, t), fs_1.constants.X_OK);
            return true;
          } catch (t) {
            return false;
          }
        }).length > 0
      ) {
        return r;
      }
    }
  }
  return null;
}
async function generateOptions(t) {
  var e;
  var t = t.packages.ohos;
  t.orientation = t.orientation || {};
  t.sdkPath = (await Editor.Profile.getConfig("program", "ohos_sdk")) || "";
  t.ndkPath = (await Editor.Profile.getConfig("program", "ohos_ndk")) || "";

  if (t.sdkPath && t.ndkPath) {
    return {
      packageName: t.packageName || "",
      orientation: {
        landscapeRight: null == (e = t.orientation.landscapeRight) || e,
        landscapeLeft: null == (e = t.orientation.landscapeLeft) || e,
        portrait: null != (e = t.orientation.portrait) && e,
        upsideDown: null != (e = t.orientation.upsideDown) && e,
      },
      apiLevel: t.apiLevel || "",
      sdkPath: t.sdkPath || "",
      ndkPath: t.ndkPath || "",
      renderBackEnd: {
        gles3:
          null == (t = null == (e = t.renderBackEnd) ? undefined : e.gles3) ||
          t,
      },
    };
  }

  throw new Error(Editor.I18n.t("ohos.tips.ohos_sdk_error"));
}
async function onAfterInit(t, e, n) {
  var r = await generateOptions(t);
  var o = (t.packages.ohos = r).renderBackEnd;

  var o =
    ((t.assetSerializeOptions["cc.EffectAsset"].glsl3 =
      null == (t = o.gles3) || t),
    { packageName: r.packageName, orientation: r.orientation });

  n.__addStaticsInfo(o);
}
exports.throwError = true;
exports.onAfterInit = onAfterInit;
