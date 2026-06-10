var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAfterBuild = undefined;
exports.onAfterInit = undefined;
exports.throwError = undefined;
const path_1 = require("path");
const fs_1 = require("fs");
const fs_extra_1 = require("fs-extra");
const ejs_1 = __importDefault(require("ejs"));
const utils_1 = require("./utils");
const xcode_proj_injection_1 = require("../xcode-proj-injection");
const console_1 = __importDefault(require("console"));
async function onAfterInit(e, t) {
  var i = e.packages["ios-app-clip"].mainPackagePath;
  if (typeof i != "string") {
    throw new Error(Editor.I18n.t("ios-app-clip.tips.ios_app_path_error"));
  }
  if (!fs_1.existsSync(i)) {
    throw new Error(`path ${i} does not exist!`);
  }
  fs_extra_1.ensureDir(path_1.join(i, "ios-app-clip"));
  t.paths.dir = path_1.join(i, "ios-app-clip");

  e.includeModules = e.includeModules.filter(
    (e) => !["gfx-webgl2", "gfx-webgl"].includes(e)
  );

  e.assetSerializeOptions["cc.EffectAsset"].glsl3 = false;
  e.assetSerializeOptions["cc.EffectAsset"].glsl4 = false;

  if (e.server && !e.server.endsWith("/")) {
    e.server += "/";
  }

  Object.assign(e.appTemplateData, { showFPS: false });

  Object.assign(e.buildEngineParam, {
    platform: "NATIVE",
    engineName: "src/cocos-js",
  });

  fs_extra_1.ensureDirSync(t.paths.dir);
  fs_extra_1.emptyDirSync(t.paths.dir);
  i = (await Editor.Message.request("engine", "query-engine-info")).native.path;
  let s;
  i = await utils_1.getBrowserslistQuery(i);

  if (
    (s = i ? i : s) &&
    ((e.buildEngineParam.targets = s),
    (e.buildScriptParam.targets = s),
    e.buildScriptParam.polyfills || (e.buildScriptParam.polyfills = {}),
    (e.buildScriptParam.polyfills.targets = s),
    "asyncFunctions" in e.buildScriptParam.polyfills)
  ) {
    delete e.buildScriptParam.polyfills.asyncFunctions;
  }

  e.buildScriptParam.system = { preset: "commonjs-like" };
  await utils_1.outputJSBAdapter(t.paths.dir, { targets: s });
}
async function onAfterBuild(e, t) {
  var i = e.packages["ios-app-clip"].mainPackagePath;
  var s = e.packages["ios-app-clip"].embedXcodeprojTarget;

  var r = (await Editor.Message.request("engine", "query-engine-info")).native
    .builtin;

  var a = path_1.join(
    r,
    "templates/js-template-link/frameworks/runtime-src/proj.ios_mac"
  );

  var o = utils_1.findXcodeProjects(a);
  if (o.length !== 1) {
    throw new Error(o.length + ` xcode projects found in ${a}, 1 expected`);
  }
  a = path_1.join(a, o[0]);
  let n = null;
  try {
    if (s) {
      console_1.default.log(`injection AppClip into Xcode project '${s}'`);

      n = new xcode_proj_injection_1.XcodeProjModifer({
        appName: e.name,
        refXcodeProject: a,
        inputXcodeProj: s,
        doBackup: true,
        cocosRoot: r,
        projectResDir: i,
      });
    }
  } catch (e) {
    if (!e.message.includes("already loaded")) {
      throw e;
    }
    console_1.default.log("[warning] " + e.message);
    n = null;
  }

  if (
    !fs_1.existsSync(path_1.join(i, "project.json")) &&
    fs_1.existsSync(path_1.join(r, "templates/js-template-link/project.json"))
  ) {
    fs_1.copyFileSync(
      path_1.join(r, "templates/js-template-link/project.json"),
      path_1.join(i, "project.json")
    );
  }

  o = path_1.join(Build.buildTemplateDir, "ios-app-clip");

  if (fs_1.existsSync(o)) {
    fs_extra_1.copySync(o, t.paths.dir);
    console_1.default.debug(o);
  }

  await fs_extra_1.move(
    path_1.join(t.paths.dir, "application.js"),
    path_1.join(t.paths.dir, "src", "application.js")
  );

  e = path_1.join(__dirname, "../../static/builder/index.ejs");

  a = {
    polyfillsBundleFile:
      (t.paths.polyfillsJs &&
        Build.Utils.relativeUrl(t.paths.dir, t.paths.polyfillsJs)) ||
      false,
    systemJsBundleFile: Build.Utils.relativeUrl(t.paths.dir, t.paths.systemJs),
    importMapFile: "src/import-map.json",
  };

  s = (await ejs_1.default.renderFile(e, a)).toString();
  await fs_extra_1.writeFile(path_1.join(t.paths.dir, "main.js"), s, "utf8");

  if (n !== null) {
    n.write();
    console_1.default.log("injection done");
  }
}
exports.throwError = true;
exports.onAfterInit = onAfterInit;
exports.onAfterBuild = onAfterBuild;
