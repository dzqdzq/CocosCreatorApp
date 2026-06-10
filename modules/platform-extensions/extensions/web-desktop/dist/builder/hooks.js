var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwError = undefined;
exports.onAfterInit = onAfterInit;
exports.onAfterBundleInit = onAfterBundleInit;
exports.onBeforeCompressSettings = onBeforeCompressSettings;
exports.onBeforeCopyBuildTemplate = onBeforeCopyBuildTemplate;
exports.onAfterBuild = onAfterBuild;
exports.run = run;

const { copyFileSync, outputFileSync } = require("fs-extra");

const { join } = require("path");

const ejs_1 = __importDefault(require("ejs"));
function onAfterInit(e, t, s) {
  e.packages["web-desktop"];
  e.buildEngineParam.assetURLFormat = "runtime-resolved";

  if (e.server && !e.server.endsWith("/")) {
    e.server += "/";
  }
}
function onAfterBundleInit(e) {
  e.buildScriptParam.system = { preset: "web" };
  var t = e.packages["web-desktop"].useWebGPU;

  if ((e.buildScriptParam.flags.WEBGPU = t)) {
    e.includeModules.includes("gfx-webgpu") ||
      e.includeModules.push("gfx-webgpu");

    e.assetSerializeOptions["cc.EffectAsset"].glsl4 = true;
  } else if (e.includeModules.includes("gfx-webgpu")) {
    t = e.includeModules.indexOf("gfx-webgpu");
    e.includeModules.splice(t, 1);
  }
}
async function onBeforeCompressSettings(e, t, s) {
  if (t.paths.dir) {
    t.settings.screen.exactFitScreen = false;
  }
}
async function onBeforeCopyBuildTemplate(e, t) {
  var s = join(e.engineInfo.typescript.builtin, "templates/web-desktop");

  var i = e.packages["web-desktop"];
  var n = join(t.paths.dir, "style.css");

  var n =
    (e.md5CacheOptions.includes.push("style.css"),
    this.buildTemplate.findFile("style.css") ||
      copyFileSync(join(s, "style.css"), n),
    this.buildTemplate.findFile("favicon.ico") ||
      copyFileSync(join(s, "favicon.ico"), join(t.paths.dir, "favicon.ico")),
    this.buildTemplate.initUrl("index.js.ejs", "indexJs") ||
      join(s, "index.js.ejs"));

  var n = await ejs_1.default.renderFile(n, {
    applicationJS:
      "./" + Build.Utils.relativeUrl(t.paths.dir, t.paths.applicationJS),
  });

  var n = await Build.Utils.transformCode(n, { importMapFormat: "systemjs" });
  if (!n) {
    throw new Error("Cannot generate index.js");
  }
  var r = join(t.paths.dir, "index.js");

  var r =
    ((t.paths.indexJs = r),
    e.md5CacheOptions.includes.push("index.js"),
    outputFileSync(r, n, "utf8"),
    this.buildTemplate.initUrl("index.ejs") || join(s, "index.ejs"));

  var n = {
    polyfillsBundleFile:
      (t.paths.polyfillsJs &&
        Build.Utils.relativeUrl(t.paths.dir, t.paths.polyfillsJs)) ||
      false,
    systemJsBundleFile: Build.Utils.relativeUrl(t.paths.dir, t.paths.systemJs),
    projectName: e.name,
    engineName: e.buildEngineParam.engineName,
    previewWidth: i.resolution.designWidth,
    previewHeight: i.resolution.designHeight,
    cocosTemplate: join(s, "index-plugin.ejs"),
    importMapFile: Build.Utils.relativeUrl(t.paths.dir, t.paths.importMap),
    indexJsName: "./index.js",
    cssUrl: "./style.css",
  };

  var i = await ejs_1.default.renderFile(r, n);
  t.paths.indexHTML = join(t.paths.dir, "index.html");
  outputFileSync(t.paths.indexHTML, i, "utf8");
  e.md5CacheOptions.replaceOnly.push("index.html");
  Editor.Message.request("web-desktop", "set-preview-path", t.paths.dir);
}
async function onAfterBuild(e, s) {
  s.settings.plugins.jsList.forEach((e, t) => {
    s.settings.plugins.jsList[t] = e
      .split("/")
      .map(encodeURIComponent)
      .join("/");
  });

  outputFileSync(
    s.paths.settings,
    JSON.stringify(s.settings, null, e.debug ? 4 : 0)
  );
}
function run(e, t) {
  Editor.Message.request(
    "web-desktop",
    "preview",
    e,
    t.packages["web-desktop"].useWebGPU
  );
}
exports.throwError = true;
