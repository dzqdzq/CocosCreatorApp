var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwError = undefined;
exports.onAfterInit = onAfterInit;
exports.onBeforeBundleInit = onBeforeBundleInit;
exports.onBeforeCompressSettings = onBeforeCompressSettings;
exports.onBeforeCopyBuildTemplate = onBeforeCopyBuildTemplate;
exports.onAfterCopyBuildTemplate = onAfterCopyBuildTemplate;

const {
  copy,
  writeFileSync,
  readJSONSync,
  existsSync,
  renameSync,
  outputFileSync,
  writeJSONSync,
} = require("fs-extra");

const { join, dirname } = require("path");

const ejs_1 = __importDefault(require("ejs"));
const share_1 = require("./share");
async function onAfterInit(e, a, i) {
  Editor.Metrics.trackEvent({
    category: "Project",
    action: "BetaPlatforms",
    label: "alipay-minigame",
    value: { orientation: e.packages["alipay-mini-game"].deviceOrientation },
  });
  var t = e.packages["alipay-mini-game"];

  if (t.separateEngine) {
    e.buildEngineParam.separateEngineOptions = {
      useCacheForce: Editor.App.isPackaged,
      pluginFeatures: "default",
      outputLocalPlugin: true,
      pluginName: "cocos",
      checkVersionValid: true,
    };

    e.buildEngineParam.nativeCodeBundleMode = "wasm";
  }

  if (e.server && !e.server.endsWith("/")) {
    e.server += "/";
  }

  a.staticsInfo.B100011 = e.packages["alipay-mini-game"].deviceOrientation;
  e.buildScriptParam.flags.WASM_SUBPACKAGE = t.wasmSubpackage;
}
function onBeforeBundleInit(e) {
  if (e.polyfills) {
    e.polyfills.asyncFunctions = false;
  }

  e.moveRemoteBundleScript = true;
  e.buildScriptParam.importMapFormat = "commonjs";
  e.buildScriptParam.system = { preset: "commonjs-like" };
}
async function onBeforeCompressSettings(e, a, i) {
  a.settings.screen.orientation =
    e.packages["alipay-mini-game"].deviceOrientation;
}
async function onBeforeCopyBuildTemplate(e, a, i) {
  var t;
  var s;
  var n = e.engineInfo.typescript.path;
  share_1.Paths.internalTemplateDir = join(n, "templates/alipay-mini-game");
  for (const r of ["web-adapter", "engine-adapter"]) {
    await copy(
      join(n, "bin/adapter/minigame/alipay", `${r}.${e.debug ? "" : "min."}js`),
      join(a.paths.dir, r + ".js")
    );
  }

  if (!this.buildTemplate.findFile("game.js")) {
    s =
      this.buildTemplate.initUrl("game.ejs") ||
      join(share_1.Paths.internalTemplateDir, "game.ejs");

    t = {
      polyfillsBundleFile:
        (a.paths.polyfillsJs &&
          Build.Utils.relativeUrl(a.paths.dir, a.paths.polyfillsJs)) ||
        false,
      systemJsBundleFile: Build.Utils.relativeUrl(
        a.paths.dir,
        a.paths.systemJs
      ),
      importMapFile: Build.Utils.relativeUrl(a.paths.dir, a.paths.importMap),
      applicationJs:
        "./" + Build.Utils.relativeUrl(a.paths.dir, a.paths.applicationJS),
    };

    s = await ejs_1.default.renderFile(s, t);
    writeFileSync(join(a.paths.dir, "game.js"), s);
    e.md5CacheOptions.replaceOnly.push("game.js");
  }
}
async function onAfterCopyBuildTemplate(e, a, i) {
  var t = readJSONSync(join(share_1.Paths.internalTemplateDir, "game.json"));

  var s = this.buildTemplate.findFile("game.json");

  var s =
    (s && ((s = readJSONSync(s)), Object.assign(t, s)),
    (t.screenOrientation = e.packages["alipay-mini-game"].deviceOrientation),
    e.packages["alipay-mini-game"]);

  if (s.separateEngine) {
    var n = join(Build.buildTemplateDir, "patch.json");
    let e = Editor.App.version;

    if (existsSync(n)) {
      e =
        (await Editor.Profile.getConfig(
          "alipay-mini-game",
          "plugin-version"
        )) || Editor.App.version;
    }

    t.plugins = {
      cocos: {
        version: e,
        pluginId: require(join(__dirname, "../static/cocos/signature.json"))
          .pluginId,
        path: "cocos",
      },
    };
  }
  var r;
  var o = [];
  for (const p of this.bundleManager.bundles) {
    if (p.isSubpackage) {
      r = join(dirname(p.scriptDest), "game.js");

      existsSync(p.scriptDest)
        ? renameSync(p.scriptDest, r)
        : outputFileSync(
            r,
            `console.log('${p.name}: no script in subPackage.')`,
            "utf8"
          );

      p.scriptDest = r;
      o.push({ name: p.name, root: `subpackages/${p.name}/` });
    }
  }

  if (
    s.wasmSubpackage &&
    ((n = join(a.paths.engineDir, "./assets/")),
    (s = join(a.paths.engineDir, "./chunks/")),
    existsSync(n) &&
      o.push({ name: "__ccWasmAssetSubpkg__", root: "cocos-js/assets/" }),
    existsSync(s))
  ) {
    o.push({ name: "__ccWasmChunkSubpkg__", root: "cocos-js/chunks/" });
  }

  if (o.length > 0) {
    t.subpackages = o;
  }

  n = join(a.paths.dir, "game.json");
  e.md5CacheOptions.excludes.push("game.json");
  writeJSONSync(n, t);
}
exports.throwError = true;
