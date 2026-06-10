var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

exports.onAfterBuild = undefined;
exports.onAfterInit = undefined;
exports.onBeforeBuild = undefined;
exports.throwError = undefined;

const fs_extra_1 = require("fs-extra");
const fs_extra_2 = require("fs-extra");
const path_1 = require("path");
const ejs_1 = __importDefault(require("ejs"));
async function generateOptions(e) {
  var e = e.packages.openharmony;
  e.orientation = e.orientation || {};

  e.sdkPath =
    e.sdkPath ||
    (await Editor.Profile.getConfig("program", "openharmony_sdk")) ||
    "";

  return {
    packageName: e.packageName || "",
    orientation: e.orientation,
    apiLevel: Number(e.apiLevel) || 9,
    appABIs: e.appABIs || [],
    sdkPath: e.sdkPath || "",
    renderBackEnd: {
      gles3:
        null == (e = null == (e = e.renderBackEnd) ? undefined : e.gles3) || e,
    },
  };
}
async function onBeforeBuild(e, t, a) {
  e.sourceMaps = false;
}
async function onAfterInit(e, t, a) {
  var s = await generateOptions(e);
  e.buildEngineParam.forceJitValue = false;
  const r = (e.packages.openharmony = s).renderBackEnd;
  e.assetSerializeOptions["cc.EffectAsset"].glsl3 = null == (n = r.gles3) || n;
  var n = { packageName: s.packageName, orientation: s.orientation };
  a.__addStaticsInfo(n);
  const t_compileOptions = t.compileOptions;

  Object.keys(r).forEach((e) => {
    t_compileOptions.cMakeConfig["CC_USE_" + e.toUpperCase()] = r[e];
  });

  e.buildScriptParam.importMapFormat = "commonjs";
  Object.assign(t_compileOptions.platformParams, s);
  await fs_extra_1.outputJSON(t.paths.compileConfig, t_compileOptions);
  checkSDKEnv(e);
}
async function onAfterBuild(t, e, a) {
  var s = path_1.join(e.paths.dir, "assets");

  const r = path_1.join(
    Editor.Project.path,
    "native/engine",
    t.platform,
    "entry/src/main"
  );

  const n = path_1.join(r, "resources/rawfile/Resources/assets");
  await fs_extra_2.emptyDir(n);
  await fs_extra_2.ensureDir(n);
  await fs_extra_2.copy(s, n);
  s = path_1.join(e.paths.dir, "src");
  await fs_extra_2.emptyDir(path_1.join(r, "ets/cocos/src"));
  await fs_extra_2.emptyDir(path_1.join(r, "ets/cocos/assets"));
  await fs_extra_2.copy(s, path_1.join(r, "ets/cocos/src"));
  const o = [];
  e.bundles.forEach((e) => {
    if (!e.isRemote) {
      o.push(e.name + "/" + path_1.basename(e.scriptDest));

      fs_extra_2.moveSync(
        path_1.join(n, e.name, path_1.basename(e.scriptDest)),
        path_1.join(
          r,
          "ets/cocos/assets",
          e.name,
          path_1.basename(e.scriptDest)
        )
      );

      t.sourceMaps &&
        fs_extra_2.moveSync(
          path_1.join(n, e.name, "index.js.map"),
          path_1.join(r, "ets/cocos/assets", e.name, "index.js.map")
        );
    }
  });

  var s = await Editor.Message.request(
    "engine",
    "query-info",
    Editor.Project.type
  );

  var s = path_1.join(
    s.path,
    "templates/openharmony/entry/src/main/ets/cocos/game.ts"
  );

  var i = path_1.join(r, "ets/cocos/game.ts");
  var p = fs_extra_2.readdirSync(e.paths.engineDir);

  var p = {
    importMapUrl: path_1.basename(e.paths.importMap),
    applicationUrl: path_1.basename(e.paths.applicationJS),
    systemBundleUrl: path_1.basename(e.paths.systemJs),
    ccUrls: p,
    bundleJsList: o,
    chunkBundleUrl: "",
  };

  if (
    fs_extra_1.existsSync(path_1.join(e.paths.dir, "src/chunks")) &&
    (e = fs_extra_2
      .readdirSync(path_1.join(e.paths.dir, "src/chunks"))
      .find((e) => e.startsWith("bundle") && e.endsWith(".js")))
  ) {
    p.chunkBundleUrl = e;
  }

  fs_extra_2.writeFileSync(i, await ejs_1.default.renderFile(s, p), "utf8");
}
async function getBrowserslistQuery(e) {
  e = path_1.join(e, ".browserslistrc");
  let t;
  try {
    t = await fs_extra_2.readFile(e, "utf8");
  } catch (e) {
    return;
  }
  e = ((e) => {
    var t = [];
    for (const s of e.split("\n")) {
      var a = s.indexOf("#");
      var a = (a < 0 ? s : s.substr(0, a)).trim();

      if (a.length !== 0) {
        t.push(a);
      }
    }
    return t;
  })(t);
  if (e.length !== 0) {
    return e.join(" or ");
  }
}
function checkSDKEnv(e) {
  e = e.packages.openharmony;
  if (!process.env.OHOS_SDK_HOME && !e.sdkPath) {
    throw new Error(Editor.I18n.t("openharmony.tips.ohos_sdk_error"));
  }

  if (process.env.OHOS_SDK_HOME) {
    e.sdkPath = process.env.OHOS_SDK_HOME;
  } else {
    process.env.OHOS_SDK_HOME = e.sdkPath;
  }
}
exports.throwError = true;
exports.onBeforeBuild = onBeforeBuild;
exports.onAfterInit = onAfterInit;
exports.onAfterBuild = onAfterBuild;
