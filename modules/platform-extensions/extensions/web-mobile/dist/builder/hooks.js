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
const ejs_1 = __importDefault(require("ejs"));

const { copyFileSync, outputFileSync } = require("fs-extra");

const { join, basename } = require("path");

async function onAfterInit(e, t, i) {
  var s = e.packages["web-mobile"];
  t.staticsInfo.orientation = s.orientation;
  e.buildEngineParam.split = false;
  e.buildEngineParam.assetURLFormat = "runtime-resolved";

  if (e.server && !e.server.endsWith("/")) {
    e.server += "/";
  }
}
function onAfterBundleInit(e) {
  e.buildScriptParam.system = { preset: "web" };
  var t = e.packages["web-mobile"].useWebGPU;

  if ((e.buildScriptParam.flags.WEBGPU = t)) {
    e.includeModules.includes("gfx-webgpu") ||
      e.includeModules.push("gfx-webgpu");

    e.assetSerializeOptions["cc.EffectAsset"].glsl4 = true;
  } else if (e.includeModules.includes("gfx-webgpu")) {
    t = e.includeModules.indexOf("gfx-webgpu");
    e.includeModules.splice(t, 1);
  }
}
async function onBeforeCompressSettings(e, t, i) {
  if (t.paths.dir) {
    e = e.packages["web-mobile"];
    t.settings.screen.orientation = e.orientation;
  }
}
async function onBeforeCopyBuildTemplate(e, t) {
  var i = join(e.engineInfo.typescript.builtin, "templates/web-mobile");

  var s = e.packages["web-mobile"];
  var n = join(t.paths.dir, "style.css");
  e.md5CacheOptions.includes.push("style.css");

  if (!this.buildTemplate.findFile("style.css")) {
    copyFileSync(join(i, "style.css"), n);
  }

  let a = "";

  if (s.embedWebDebugger) {
    s = join(t.paths.dir, "vconsole.min.js");

    this.buildTemplate.findFile("vconsole.min.js") ||
      (copyFileSync(join(i, "vconsole.min.js"), s),
      e.md5CacheOptions.excludes.push("vconsole.min.js"));

    a = "./vconsole.min.js";
  }

  s =
    this.buildTemplate.initUrl("index.js.ejs", "indexJs") ||
    join(i, "index.js.ejs");

  s = await ejs_1.default.renderFile(s, {
    applicationJS:
      "./" + Build.Utils.relativeUrl(t.paths.dir, t.paths.applicationJS),
  });

  s = await Build.Utils.transformCode(s, { importMapFormat: "systemjs" });
  if (!s) {
    throw new Error("Cannot generate index.js");
  }
  var l = join(t.paths.dir, "index.js");

  var s =
    ((t.paths.indexJs = l),
    e.md5CacheOptions.includes.push("index.js"),
    outputFileSync(l, s, "utf8"),
    this.buildTemplate.initUrl("index.ejs") || join(i, "index.ejs"));

  var i = {
    polyfillsBundleFile:
      (t.paths.polyfillsJs &&
        Build.Utils.relativeUrl(t.paths.dir, t.paths.polyfillsJs)) ||
      false,
    systemJsBundleFile: Build.Utils.relativeUrl(t.paths.dir, t.paths.systemJs),
    projectName: e.name,
    engineName: e.buildEngineParam.engineName,
    webDebuggerSrc: a,
    cocosTemplate: join(i, "index-plugin.ejs"),
    importMapFile: Build.Utils.relativeUrl(t.paths.dir, t.paths.importMap),
    indexJsName: basename(l),
    cssUrl: basename(n),
  };

  var l = await ejs_1.default.renderFile(s, i);
  t.paths.indexHTML = join(t.paths.dir, "index.html");
  outputFileSync(t.paths.indexHTML, l, "utf8");
  e.md5CacheOptions.replaceOnly.push("index.html");
  Editor.Message.request("web-mobile", "set-preview-path", t.paths.dir);
}
async function onAfterBuild(e, i) {
  i.settings.plugins.jsList.forEach((e, t) => {
    i.settings.plugins.jsList[t] = e
      .split("/")
      .map(encodeURIComponent)
      .join("/");
  });

  outputFileSync(
    i.paths.settings,
    JSON.stringify(i.settings, null, e.debug ? 4 : 0)
  );
}
exports.throwError = true;
