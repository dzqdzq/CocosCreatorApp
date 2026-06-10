Object.defineProperty(exports, "__esModule", { value: true });
exports.onAfterInit = undefined;
exports.throwError = undefined;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
async function generateOptions(t) {
  var e;
  var t = t.packages["open-harmonyos"];
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
      apiLevel: t.apiLevel || "7",
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
async function onAfterInit(t, e, a) {
  fs_extra_1.emptyDirSync(e.paths.dir);
  var r = await generateOptions(t);
  var n = (t.packages["open-harmonyos"] = r).renderBackEnd;

  var n =
    ((t.assetSerializeOptions["cc.EffectAsset"].glsl3 =
      null == (n = n.gles3) || n),
    { packageName: r.packageName, orientation: r.orientation });

  a.__addStaticsInfo(n);
  t.assetSerializeOptions.exportCCON = true;
  t.assetSerializeOptions.allowCCONExtension = true;
  Object.assign(t.appTemplateData, { showFPS: false });

  Object.assign(t.buildEngineParam, {
    platform: "NATIVE",
    engineName: "src/cocos-js",
  });

  let i;
  r = (await Editor.Message.request("engine", "query-info")).nativePath;
  a = await getBrowserslistQuery(r);

  if ((i = a ? a : i)) {
    t.buildEngineParam.targets = i;
    t.buildScriptParam.targets = i;
  }

  t.buildScriptParam.system = { preset: "commonjs-like" };
  await fs_extra_1.emptyDirSync(e.paths.dir);
}
async function getBrowserslistQuery(t) {
  t = path_1.join(t, ".browserslistrc");
  let e;
  try {
    e = await fs_extra_1.readFile(t, "utf8");
  } catch (t) {
    return;
  }
  t = ((t) => {
    var e = [];
    for (const r of t.split("\n")) {
      var a = r.indexOf("#");
      var a = (a < 0 ? r : r.substr(0, a)).trim();

      if (a.length !== 0) {
        e.push(a);
      }
    }
    return e;
  })(e);
  if (t.length !== 0) {
    return t.join(" or ");
  }
}
exports.throwError = true;
exports.onAfterInit = onAfterInit;
