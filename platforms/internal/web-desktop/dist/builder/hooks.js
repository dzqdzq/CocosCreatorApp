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
  ((e, o, n, l) =>
    new (n = n || Promise)((i, t) => {
      function r(e) {
        try {
          a(l.next(e));
        } catch (e) {
          t(e);
        }
      }
      function s(e) {
        try {
          a(l.throw(e));
        } catch (e) {
          t(e);
        }
      }
      function a(e) {
        var t;

        if (e.done) {
          i(e.value);
        } else {
          ((t = e.value) instanceof n
            ? t
            : new n((e) => {
                e(t);
              })
          ).then(r, s);
        }
      }
      a((l = l.apply(e, o || [])).next());
    }));

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });

exports.onAfterBuild = undefined;
exports.onBeforeCompressSettings = undefined;
exports.onBeforeBuildAssets = undefined;
exports.onAfterInit = undefined;
exports.throwError = undefined;

const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const ejs_1 = __importDefault(require("ejs"));
const Editor = __importStar(require("editor"));
const babel = __importStar(require("@babel/core"));
const preset_env_1 = __importDefault(require("@babel/preset-env"));
const buildStaticDir = path_1.join(__dirname, "../../static/build-template");
function onAfterInit(e, t, i) {
  if (!window.__manager.taskManager.debug) {
    fs_extra_1.emptyDirSync(t.paths.dir);
  }

  e.buildScriptParam.polyfills = e.packages["web-desktop"].polyfills;
  e.buildScriptParam.system = { preset: "web" };
  e.buildEngineParam.ammoJsWasm = "fallback";
  e.buildEngineParam.assetURLFormat = "runtime-resolved";
  let r = e.packages["web-desktop"].remoteServerAddress || "";

  if (r && !r.endsWith("/")) {
    r += "/";
  }

  Object.assign(e.appTemplateData, { server: r });
  t = { remoteServerAddress: r };
  i.__addStaticsInfo(t);
}
async function onBeforeBuildAssets(e, r, s) {
  for (const i of s.scriptUuids) {
    var e = s.getAssetInfo(i);
    var t = await s.getMeta(i);

    if (e) {
      if (t) {
        if (t.userData.isPlugin && t.userData.loadPluginInWeb) {
          r.addPlugin(e);
        }
      } else {
        console.error(`Get meta of script {asset(${e.url})} failed!`);
      }
    } else {
      console.error(`Get asset info of script {asset(${i})} failed!`);
    }
  }
}
async function onBeforeCompressSettings(e, t, i) {
  if (t.paths.dir) {
    const t_settings = t.settings;
    t_settings.exactFitScreen = false;

    t_settings.jsList.forEach((e, t) => {
      t_settings.jsList[t] = e.split("/").map(encodeURIComponent).join("/");
    });
  }
}
async function onAfterBuild(l, d, e, t) {
  var e = l.packages["web-desktop"];
  var t = buildStaticDir;

  var i = await ejs_1.default.renderFile(path_1.join(t, "index.js.ejs"), {
    applicationJS:
      "./" + Build.Utils.relativeUrl(d.paths.dir, d.paths.applicationJS),
  });

  var i = await babel.transformAsync(i, {
    presets: [[preset_env_1.default, { modules: "systemjs" }]],
  });

  if (!i || !i.code) {
    throw new Error("无法生成 index.js");
  }
  let r = "";

  if (l.md5Cache) {
    r = "." + Build.Utils.calcMd5(i.code);
  }

  var s = path_1.join(d.paths.dir, `index${r}.js`);
  fs_extra_1.outputFileSync(s, i.code, "utf8");
  let a = path_1.join(d.paths.dir, "style.css");

  fs_extra_1.copyFileSync(path_1.join(t, "style.css"), a);

  if (l.md5Cache) {
    i = await Build.Utils.appendMd5ToPaths([a]);
    a = i.paths[0];
  }

  fs_extra_1.copyFileSync(
    path_1.join(t, "favicon.ico"),
    path_1.join(d.paths.dir, "favicon.ico")
  );

  let o = path_1.join(Build.buildTemplateDir, l.platform, "index.ejs");

  let n = true;

  if (!fs_extra_1.existsSync(o)) {
    o = path_1.join(t, "index.ejs");
    n = false;
  }

  i = {
    polyfillsBundleFile:
      (d.paths.polyfillsJs &&
        Build.Utils.relativeUrl(d.paths.dir, d.paths.polyfillsJs)) ||
      false,
    systemJsBundleFile: Build.Utils.relativeUrl(d.paths.dir, d.paths.systemJs),
    projectName: l.name,
    engineName: l.buildEngineParam.engineName,
    previewWidth: e.resolution.designWidth,
    previewHeight: e.resolution.designHeight,
    cocosTemplate: path_1.join(t, "index-plugin.ejs"),
    importMapFile: Build.Utils.relativeUrl(d.paths.dir, d.paths.importMap),
    indexJsName: path_1.basename(s),
    cssUrl: path_1.basename(a),
  };

  e = await ejs_1.default.renderFile(o, i);

  fs_extra_1.outputFileSync(path_1.join(d.paths.dir, "index.html"), e, "utf8");

  t = path_1.join(Editor.Project.path, "build-templates", l.platform);

  if (fs_extra_1.existsSync(t)) {
    fs_extra_1.copySync(t, d.paths.dir);
    console.debug(`Use build-template {link(${t})}.`);
  }

  if (n) {
    fs_extra_1.removeSync(path_1.join(d.paths.dir, "index.ejs"));
  }

  Editor.Message.request("web-desktop", "set-preview-path", d.paths.dir);
}
exports.throwError = true;
exports.onAfterInit = onAfterInit;
exports.onBeforeBuildAssets = onBeforeBuildAssets;
exports.onBeforeCompressSettings = onBeforeCompressSettings;
exports.onAfterBuild = onAfterBuild;
