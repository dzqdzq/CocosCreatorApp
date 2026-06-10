var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, i, a = i) => {
        Object.defineProperty(e, a, {
          enumerable: true,
          get() {
            return t[i];
          },
        });
      }
    : (e, t, i, a) => {
        e[(a = a === undefined ? i : a)] = t[i];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  ((e) => {
    if (e && e.__esModule) {
      return e;
    }
    var t = {};
    if (e != null) {
      for (var i in e) {
        if (i !== "default" && Object.prototype.hasOwnProperty.call(e, i)) {
          __createBinding(t, e, i);
        }
      }
    }
    __setModuleDefault(t, e);
    return t;
  });

var __awaiter =
  (this && this.__awaiter) ||
  ((e, s, n, l) =>
    new (n = n || Promise)((i, t) => {
      function a(e) {
        try {
          o(l.next(e));
        } catch (e) {
          t(e);
        }
      }
      function r(e) {
        try {
          o(l.throw(e));
        } catch (e) {
          t(e);
        }
      }
      function o(e) {
        var t;

        if (e.done) {
          i(e.value);
        } else {
          ((t = e.value) instanceof n
            ? t
            : new n((e) => {
                e(t);
              })
          ).then(a, r);
        }
      }
      o((l = l.apply(e, s || [])).next());
    }));

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });

exports.onAfterBuild = undefined;
exports.onBeforeCompressSettings = undefined;
exports.onAfterInit = undefined;
exports.throwError = undefined;

const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const ejs_1 = __importDefault(require("ejs"));
const Editor = __importStar(require("editor"));
const globby = require("globby");
const templateDir = path_1.join(__dirname, "../static");
const OPEN_DATA_CONTEXT_ROOT = "openDataContext";
async function onAfterInit(o, s, n) {
  var e = o.packages["baidu-mini-game"];

  if (o.includeModules.includes("gfx-webgl2")) {
    o.includeModules.splice(o.includeModules.indexOf("gfx-webgl2"), 1);
    o.assetSerializeOptions["cc.EffectAsset"].glsl3 = false;
  }

  o.assetSerializeOptions.exportCCON = true;
  o.moveRemoteBundleScript = true;
  let t = e.remoteServerAddress || "";

  if (t && !t.endsWith("/")) {
    t += "/";
  }

  Object.assign(o.appTemplateData, { showFPS: false, server: t });
  Object.assign(o.buildEngineParam, { platform: "BAIDU" });
  o.buildScriptParam.importMapFormat = "commonjs";
  o.buildScriptParam.system = { preset: "commonjs-like" };
  var i = path_1.join(s.paths.dir, OPEN_DATA_CONTEXT_ROOT);

  var a = path_1.join(
    Editor.Project.tmpDir,
    "builder/baidu-mini-game",
    OPEN_DATA_CONTEXT_ROOT
  );

  if (fs_extra_1.existsSync(i)) {
    fs_extra_1.existsSync(a) && fs_extra_1.removeSync(a);
    fs_extra_1.copySync(i, a);
  }

  var r = {
    orientation: e.orientation,
    appid: e.appid,
    remoteServerAddress: e.remoteServerAddress,
  };

  n.__addStaticsInfo(r);

  if (!window.__manager.taskManager.debug) {
    fs_extra_1.emptyDirSync(s.paths.dir);
  }

  if (fs_extra_1.existsSync(a)) {
    fs_extra_1.moveSync(a, i);
  } else if (e.buildOpenDataContextTemplate) {
    r = (await Editor.Message.request("engine", "query-info")).path;
    a = path_1.join(r, "platforms/minigame", OPEN_DATA_CONTEXT_ROOT);
    fs_extra_1.copySync(a, i);
  }
}
async function onBeforeCompressSettings(e, t, i) {
  if (t.paths.dir) {
    sortSubPackage(e, t, i);
    await buildAdapters(t.paths.dir);
  }
}
async function onAfterBuild(t, i, e) {
  var e = await Build.Utils.getModuleFiles(i);
  await Promise.all(e.map(attachSystemGlobal));
  await copyResFiles(t, i);
}
function sortSubPackage(e, t, i) {
  for (const a of t.bundles) {
    if (fs_extra_1.existsSync(a.scriptDest)) {
      attachSystemGlobal(a.scriptDest);
    } else {
      fs_extra_1.outputFileSync(a.scriptDest, "");
    }
  }
}
async function buildAdapters(a) {
  var e = (await Editor.Message.request("engine", "query-info")).path;
  const i = path_1.join(e, "platforms/minigame");
  e = await globby(path_1.join(i, "common/**/*"), { nodir: true });

  await Promise.all(
    e.map((e) => {
      var t = compileJS(fs_extra_1.readFileSync(e, "utf8"), e);
      var e = path_1.relative(i, e);
      var e = path_1.join(a, "libs", e);
      fs_extra_1.outputFileSync(e, t, "utf8");
    })
  ).catch((e) => {
    e.stack = "BuildWechatLibTemplate error: " + e.stack;
    console.error(e);
  });

  e = await globby(path_1.join(i, "platforms/baidu/wrapper/**/*"), {
    nodir: true,
  });

  await Promise.all(
    e.map((e) => {
      var t = compileJS(fs_extra_1.readFileSync(e, "utf8"), e);
      var e = path_1.relative(path_1.join(i, "platforms/baidu/"), e);
      var e = path_1.join(a, "libs", e);
      fs_extra_1.outputFileSync(e, t, "utf8");
    })
  ).catch((e) => {
    e.stack = "BuildBaiduLibTemplate error: " + e.stack;
    console.error(e);
  });
}
async function copyResFiles(a, r) {
  a.packages["baidu-mini-game"];
  var e = a.buildEngineParam.engineName;
  var t = path_1.join(templateDir, "build-template");
  var i = path_1.join(t, "game.ejs");

  var e = {
    engineName: e,
    polyfillsBundleFile:
      (r.paths.polyfillsJs &&
        Build.Utils.relativeUrl(r.paths.dir, r.paths.polyfillsJs)) ||
      false,
    systemJsBundleFile: Build.Utils.relativeUrl(r.paths.dir, r.paths.systemJs),
    importMapFile: Build.Utils.relativeUrl(r.paths.dir, r.paths.importMap),
    applicationJs:
      "./" + Build.Utils.relativeUrl(r.paths.dir, r.paths.applicationJS),
  };

  var i = await ejs_1.default.renderFile(i, e);

  fs_extra_1.writeFileSync(path_1.join(r.paths.dir, "game.js"), i, "utf8");

  var e = path_1.join(Build.buildTemplateDir, a.platform);

  if (fs_extra_1.existsSync(e)) {
    fs_extra_1.copySync(e, r.paths.dir);
    console.debug(`Use build-template {link(${e})}.`);
  }

  buildGameJson(t, r.paths.dir, a, r, e);
  buildProjectJson(t, r.paths.dir, a, e);
}
function buildGameJson(e, t, i, a, r) {
  var i = i.packages["baidu-mini-game"];
  var e = fs_extra_1.readJSONSync(path_1.join(e, "game.json"));

  e.deviceOrientation = i.orientation;

  if (i.buildOpenDataContextTemplate) {
    e.openDataContext = OPEN_DATA_CONTEXT_ROOT;
  } else {
    delete e.openDataContext;
  }

  var o = [];

  for (const s of a.bundles) {
    if (s.isSubpackage) {
      o.push({ name: s.name, root: `subpackages/${s.name}/` });
    }
  }

  if (o.length > 0) {
    e.subpackages = o;
  }

  i = path_1.join(r, "game.json");

  if (fs_extra_1.existsSync(i)) {
    a = fs_extra_1.readJSONSync(i);
    Object.assign(e, a);
  }

  r = path_1.join(t, "game.json");
  fs_extra_1.outputJSONSync(r, e, { spaces: 4 });
}
function buildProjectJson(e, t, i, a) {
  e = fs_extra_1.readJSONSync(path_1.join(e, "project.swan.json"));
  e.appid = i.packages["baidu-mini-game"].appid || "testappid";
  e.projectname = i.name;
  i = path_1.join(t, "project.swan.json");
  t = path_1.join(a, "project.swan.json");

  if (fs_extra_1.existsSync(t)) {
    a = fs_extra_1.readJSONSync(t);
    Object.assign(e, a);
  }

  fs_extra_1.outputJSONSync(i, e);
}
function compileJS(e, t) {
  let i;
  try {
    var a = require("@babel/core");
    i = a.transform(e, {
      ast: false,
      highlightCode: false,
      sourceMaps: false,
      compact: false,
      filename: t,
      presets: [require("@babel/preset-env")],
      plugins: [
        [require("@babel/plugin-proposal-decorators"), { legacy: true }],
        [require("@babel/plugin-proposal-class-properties"), { loose: true }],
        [require("babel-plugin-add-module-exports")],
        [require("@babel/plugin-proposal-export-default-from")],
      ],
    });
  } catch (e) {
    e.stack = `Compile ${name} error: ` + e.stack;
    throw e;
  }
  return i.code;
}
function attachSystemGlobal(e) {
  if (fs_extra_1.existsSync(e) && !fs_extra_1.statSync(e).isDirectory()) {
    fs_extra_1.writeFileSync(
      e,
      "var System=window.System;" + fs_extra_1.readFileSync(e, "utf8")
    );
  }
}
exports.throwError = true;
exports.onAfterInit = onAfterInit;
exports.onBeforeCompressSettings = onBeforeCompressSettings;
exports.onAfterBuild = onAfterBuild;
