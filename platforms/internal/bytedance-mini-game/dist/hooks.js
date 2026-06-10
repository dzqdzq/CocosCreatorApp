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
  ((e, n, o, p) =>
    new (o = o || Promise)((i, t) => {
      function a(e) {
        try {
          s(p.next(e));
        } catch (e) {
          t(e);
        }
      }
      function r(e) {
        try {
          s(p.throw(e));
        } catch (e) {
          t(e);
        }
      }
      function s(e) {
        var t;

        if (e.done) {
          i(e.value);
        } else {
          ((t = e.value) instanceof o
            ? t
            : new o((e) => {
                e(t);
              })
          ).then(a, r);
        }
      }
      s((p = p.apply(e, n || [])).next());
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
async function onAfterInit(s, n, o) {
  var e = s.packages["bytedance-mini-game"];

  if (s.includeModules.includes("gfx-webgl2")) {
    s.includeModules.splice(
      s.includeModules.indexOf("gfx-webgl2"),
      1,
      "gfx-webgl"
    );
  }

  s.assetSerializeOptions.exportCCON = true;

  if (
    e.physX.use === "physX" &&
    -1 !==
      (i = s.includeModules.findIndex(
        (e) => e.startsWith("physics-") && !e.startsWith("physics-2d")
      ))
  ) {
    s.includeModules.splice(i, 1, "physics-physx");
  }

  if (s.includeModules.includes("physics-physx") && !e.appid) {
    console.error(Editor.I18n.t("bytedance-mini-game.tips.require_appid"));
  }

  s.moveRemoteBundleScript = true;
  s.includeModules = Array.from(new Set(s.includeModules));
  let t = e.remoteServerAddress || "";

  if (t && !t.endsWith("/")) {
    t += "/";
  }

  Object.assign(s.appTemplateData, { showFPS: false, server: t });

  Object.assign(s.buildEngineParam, {
    platform: "BYTEDANCE",
    moduleStyle: "cjs",
  });

  s.buildScriptParam.importMapFormat = "commonjs";
  s.buildScriptParam.system = { preset: "commonjs-like" };
  s.buildScriptParam.flags.NOT_PACK_PHYSX_LIBS = !!e.physX.notPackPhysXLibs;
  Object.assign(s.physicsConfig, { physX: e.physX });
  delete s.physicsConfig.physX.use;
  var i = path_1.join(n.paths.dir, OPEN_DATA_CONTEXT_ROOT);

  var a = path_1.join(
    Editor.Project.tmpDir,
    "builder/bytedance-mini-game",
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

  o.__addStaticsInfo(r);

  if (!window.__manager.taskManager.debug) {
    fs_extra_1.emptyDirSync(n.paths.dir);
  }

  if (fs_extra_1.existsSync(a)) {
    fs_extra_1.moveSync(a, i);
  } else if (e.buildOpenDataContextTemplate) {
    r = (await Editor.Message.request("engine", "query-info")).path;
    a = path_1.join(r, "platforms/minigame", OPEN_DATA_CONTEXT_ROOT);
    fs_extra_1.copySync(a, i);
  }
}
async function onBeforeCompressSettings(e, t) {
  if (t.paths.dir) {
    await buildAdapters(t.paths.dir);
  }
}
async function onAfterBuild(t, i, e, a) {
  var e = path_1.join(i.paths.dir, "src/" + t.buildScriptParam.outputName);

  if (!fs_extra_1.existsSync(e)) {
    fs_extra_1.outputFileSync(
      e,
      "console.log('There is no script in project.')",
      "utf-8"
    );
  }

  await copyResFiles(t, i, a);
}
async function buildAdapters(a) {
  var e = (await Editor.Message.request("engine", "query-info")).path;
  const i = path_1.join(e, "platforms/minigame");
  e = await globby(path_1.join(i, "common/**/*"), { nodir: true });

  await Promise.all(
    e.map((e) => {
      var t = compileJS(fs_extra_1.readFileSync(e, "utf-8"), e);
      var e = path_1.relative(i, e);
      var e = path_1.join(a, "libs", e);
      fs_extra_1.outputFileSync(e, t, "utf-8");
    })
  ).catch((e) => {
    e.stack = "BuildWechatLibTemplate error: " + e.stack;
    console.error(e);
  });

  e = await globby(path_1.join(i, "platforms/bytedance/wrapper/**/*"), {
    nodir: true,
  });

  await Promise.all(
    e.map((e) => {
      var t = compileJS(fs_extra_1.readFileSync(e, "utf-8"), e);
      var e = path_1.relative(path_1.join(i, "platforms/bytedance/"), e);
      var e = path_1.join(a, "libs", e);
      fs_extra_1.outputFileSync(e, t, "utf-8");
    })
  ).catch((e) => {
    e.stack = "BuildByteDanceLibTemplate error: " + e.stack;
    console.error(e);
  });
}
async function copyResFiles(r, s, n) {
  var e = r.packages["bytedance-mini-game"];
  var t = r.buildEngineParam.engineName;
  var i = path_1.join(templateDir, "build-template");
  var a = path_1.join(i, "game.ejs");

  var t = {
    engineName: t,
    polyfillsBundleFile:
      (s.paths.polyfillsJs &&
        Build.Utils.relativeUrl(s.paths.dir, s.paths.polyfillsJs)) ||
      false,
    systemJsBundleFile: Build.Utils.relativeUrl(s.paths.dir, s.paths.systemJs),
    importMapFile: Build.Utils.relativeUrl(s.paths.dir, s.paths.importMap),
    applicationJs:
      "./" + Build.Utils.relativeUrl(s.paths.dir, s.paths.applicationJS),
    appid: e.appid,
    isUsePhysX: r.includeModules.includes("physics-physx"),
  };

  var e = await ejs_1.default.renderFile(a, t);

  fs_extra_1.writeFileSync(path_1.join(s.paths.dir, "game.js"), e, "utf-8");

  var a = path_1.join(Build.buildTemplateDir, r.platform);

  if (fs_extra_1.existsSync(a)) {
    fs_extra_1.copySync(a, s.paths.dir);
  }

  buildGameJson(i, s, r, n, a);
  buildProjectJson(i, s.paths.dir, r, a);
}
function buildGameJson(e, t, i, a, r) {
  var s;
  var n = t.paths.dir;
  var i = i.packages["bytedance-mini-game"];
  var e = fs_extra_1.readJSONSync(path_1.join(e, "game.json"));

  var i =
    ((i.orientation !== "landscapeRight" &&
      i.orientation !== "landscapeLeft") ||
      (i.orientation = "landscape"),
    (e.deviceOrientation = i.orientation),
    i.buildOpenDataContextTemplate
      ? (e.openDataContext = OPEN_DATA_CONTEXT_ROOT)
      : delete e.openDataContext,
    path_1.join(r, "game.json"));

  if (fs_extra_1.existsSync(i)) {
    r = fs_extra_1.readJSONSync(i);
    Object.assign(e, r);
  }

  var o = [];

  for (const p of t.bundles) {
    if (p.isSubpackage) {
      s = path_1.join(path_1.dirname(p.scriptDest), "game.js");

      fs_extra_1.existsSync(p.scriptDest)
        ? fs_extra_1.renameSync(p.scriptDest, s)
        : fs_extra_1.outputFileSync(
            s,
            `console.log('${name}: no script in subPackage.')`,
            "utf8"
          );

      p.scriptDest = s;
      o.push({ name: p.name, root: `subpackages/${p.name}/` });
    }
  }

  if (o.length > 0) {
    e.subpackages = o;
  }

  i = path_1.join(n, "game.json");
  fs_extra_1.outputJSONSync(i, e, { spaces: 4 });
}
function buildProjectJson(e, t, i, a) {
  e = fs_extra_1.readJSONSync(path_1.join(e, "project.config.json"));
  e.appid = i.packages["bytedance-mini-game"].appid || "testappid";
  e.projectname = i.name;
  i = path_1.join(t, "project.config.json");
  t = path_1.join(a, "project.config.json");

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
exports.throwError = true;
exports.onAfterInit = onAfterInit;
exports.onBeforeCompressSettings = onBeforeCompressSettings;
exports.onAfterBuild = onAfterBuild;
