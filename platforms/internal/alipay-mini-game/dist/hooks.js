var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, i, r = i) => {
        Object.defineProperty(e, r, {
          enumerable: true,
          get() {
            return t[i];
          },
        });
      }
    : (e, t, i, r) => {
        e[(r = r === undefined ? i : r)] = t[i];
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
  ((e, n, s, l) =>
    new (s = s || Promise)((i, t) => {
      function r(e) {
        try {
          o(l.next(e));
        } catch (e) {
          t(e);
        }
      }
      function a(e) {
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
          ((t = e.value) instanceof s
            ? t
            : new s((e) => {
                e(t);
              })
          ).then(r, a);
        }
      }
      o((l = l.apply(e, n || [])).next());
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
async function onAfterInit(i, r, a) {
  Editor.Metrics.trackEvent({
    category: "Project",
    action: "BetaPlatforms",
    label: "alipay-minigame",
  });

  if (!window.__manager.taskManager.debug) {
    fs_extra_1.emptyDirSync(r.paths.dir);
  }

  let e = i.packages["alipay-mini-game"].remoteUrl || "";

  if (e && !e.endsWith("/")) {
    e += "/";
  }

  Object.assign(i.appTemplateData, { showFPS: false, server: e });
  i.moveRemoteBundleScript = true;
  Object.assign(i.buildEngineParam, { platform: "ALIPAY" });
  i.buildScriptParam.importMapFormat = "commonjs";
  i.buildScriptParam.polyfills = i.packages["alipay-mini-game"].polyfills;
  i.buildScriptParam.system = { preset: "commonjs-like" };

  if (i.includeModules.includes("gfx-webgl2")) {
    i.includeModules.splice(i.includeModules.indexOf("gfx-webgl2"), 1);
    i.assetSerializeOptions["cc.EffectAsset"].glsl3 = false;
  }

  i.assetSerializeOptions.exportCCON = true;
  var t = {
    orientation: i.packages["alipay-mini-game"].deviceOrientation,
    remoteServerAddress: i.packages["alipay-mini-game"].remoteUrl,
  };
  a.__addStaticsInfo(t);
}
async function onBeforeCompressSettings(e, t, i) {
  t.settings.orientation = e.packages["alipay-mini-game"].deviceOrientation;
}
async function onAfterBuild(i, r, e) {
  var e;
  var t;

  if (r.paths.dir) {
    t = (await Editor.Message.request("engine", "query-info")).path;
    t = path_1.join(t, "platforms/minigame");
    i.buildEngineParam.engineName;
    e = path_1.join(__dirname, "../static/build-template");
    copyAdapter(t, r.paths.dir);
    this.getTaskResult("build-task/script");

    t = {
      polyfillsBundleFile:
        (r.paths.polyfillsJs &&
          Build.Utils.relativeUrl(r.paths.dir, r.paths.polyfillsJs)) ||
        false,
      systemJsBundleFile: Build.Utils.relativeUrl(
        r.paths.dir,
        r.paths.systemJs
      ),
      importMapFile: Build.Utils.relativeUrl(r.paths.dir, r.paths.importMap),
      applicationJs:
        "./" + Build.Utils.relativeUrl(r.paths.dir, r.paths.applicationJS),
    };

    t = await ejs_1.default.renderFile(path_1.join(e, "game.ejs"), t);
    fs_extra_1.writeFileSync(path_1.join(r.paths.dir, "game.js"), t);
    t = path_1.join(Build.buildTemplateDir, i.platform);

    fs_extra_1.existsSync(t) &&
      (fs_extra_1.copySync(t, r.paths.dir),
      console.debug(`Use build-template {link(${t})}.`));

    e = fs_extra_1.readJSONSync(path_1.join(e, "game.json"));

    e.screenOrientation = i.packages["alipay-mini-game"].deviceOrientation;
    t = path_1.join(t, "game.json");

    fs_extra_1.existsSync(t) &&
      ((t = fs_extra_1.readJSONSync(t)), Object.assign(e, t));

    t = path_1.join(r.paths.dir, "game.json");
    fs_extra_1.writeJSONSync(t, e);
  }
}
async function copyAdapter(i, r) {
  var e = await globby(path_1.join(i, "common/**/*"), { nodir: true });

  var e =
    (await Promise.all(
      e.map((e) => {
        var t = compileJS(fs_extra_1.readFileSync(e, "utf8"), e);
        var e = path_1.relative(i, e);
        var e = path_1.join(r, "libs", e);
        fs_extra_1.outputFileSync(e, t, "utf8");
      })
    ).catch((e) => {
      e.stack = "BuildWechatLibTemplate error: " + e.stack;
      console.error(e);
    }),
    await globby(path_1.join(i, "platforms/alipay/wrapper/**/*"), {
      nodir: true,
    }));

  await Promise.all(
    e.map((e) => {
      var t = compileJS(fs_extra_1.readFileSync(e, "utf8"), e);
      var e = path_1.relative(path_1.join(i, "platforms/alipay/"), e);
      var e = path_1.join(r, "libs", e);
      fs_extra_1.outputFileSync(e, t, "utf8");
    })
  ).catch((e) => {
    e.stack = "BuildWechatLibTemplate error: " + e.stack;
    console.error(e);
  });
}
function compileJS(e, t) {
  let i;
  try {
    var r = require("@babel/core");
    i = r.transform(e, {
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
