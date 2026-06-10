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

const ejs_1 = __importDefault(require("ejs"));
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const Editor = __importStar(require("editor"));
const babel = __importStar(require("@babel/core"));
const preset_env_1 = __importDefault(require("@babel/preset-env"));
const buildStaticDir = path_1.join(__dirname, "../../static/build-template");
async function onAfterInit(i, r, s) {
  if (!window.__manager.taskManager.debug) {
    fs_extra_1.emptyDirSync(r.paths.dir);
  }

  var e = i.packages["web-mobile"];

  var e = {
    orientation: e.orientation,
    remoteServerAddress: e.remoteServerAddress,
  };

  s.__addStaticsInfo(e);
  i.buildScriptParam.polyfills = i.packages["web-mobile"].polyfills;
  i.buildScriptParam.system = { preset: "web" };
  i.buildEngineParam.split = false;
  i.buildEngineParam.ammoJsWasm = "fallback";
  i.buildEngineParam.assetURLFormat = "runtime-resolved";
  let t = i.packages["web-mobile"].remoteServerAddress || "";

  if (t && !t.endsWith("/")) {
    t += "/";
  }

  Object.assign(i.appTemplateData, { server: t });
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
async function onBeforeCompressSettings(t, r, e) {
  if (r.paths.dir) {
    var e = t.packages["web-mobile"];
    const r_settings = r.settings;
    r_settings.orientation = e.orientation;

    r_settings.jsList.forEach((e, t) => {
      r_settings.jsList[t] = e.split("/").map(encodeURIComponent).join("/");
    });
  }
}
async function onAfterBuild(n, l) {
  var e = n.packages["web-mobile"];

  var t = await ejs_1.default.renderFile(
    path_1.join(buildStaticDir, "index.js.ejs"),
    {
      applicationJS:
        "./" + Build.Utils.relativeUrl(l.paths.dir, l.paths.applicationJS),
    }
  );

  var t = await babel.transformAsync(t, {
    presets: [[preset_env_1.default, { modules: "systemjs" }]],
  });

  if (!t || !t.code) {
    throw new Error("无法生成 index.js");
  }
  let i = "";

  if (n.md5Cache) {
    i = "." + Build.Utils.calcMd5(t.code);
  }

  var r = path_1.join(l.paths.dir, `index${i}.js`);
  fs_extra_1.outputFileSync(r, t.code, "utf-8");
  let s = path_1.join(l.paths.dir, "style.css");
  fs_extra_1.copyFileSync(path_1.join(buildStaticDir, "style.css"), s);

  if (n.md5Cache) {
    t = await Build.Utils.appendMd5ToPaths([s]);
    s = t.paths[0];
  }

  t = {
    polyfillsBundleFile:
      (l.paths.polyfillsJs &&
        Build.Utils.relativeUrl(l.paths.dir, l.paths.polyfillsJs)) ||
      false,
    systemJsBundleFile: Build.Utils.relativeUrl(l.paths.dir, l.paths.systemJs),
    projectName: n.name,
    orientation: e.orientation,
    engineName: n.buildEngineParam.engineName,
    webDebuggerSrc: "",
    cocosTemplate: path_1.join(buildStaticDir, "index-plugin.ejs"),
    importMapFile: Build.Utils.relativeUrl(l.paths.dir, l.paths.importMap),
    indexJsName: path_1.basename(r),
    cssUrl: path_1.basename(s),
  };
  if (e.embedWebDebugger) {
    t.webDebuggerSrc = "./vconsole.min.js";
    try {
      fs_extra_1.copySync(
        path_1.join(buildStaticDir, "vconsole.min.js"),
        path_1.join(l.paths.dir, "vconsole.min.js")
      );
    } catch (e) {
      console.warn("Copy vconsole failed.");
    }
  }
  let a = true;
  let o = path_1.join(Build.buildTemplateDir, n.platform, "index.ejs");

  if (!fs_extra_1.existsSync(o)) {
    o = path_1.join(buildStaticDir, "index.ejs");
    a = false;
  }

  r = await ejs_1.default.renderFile(o, t);

  fs_extra_1.outputFileSync(path_1.join(l.paths.dir, "index.html"), r, "utf8");

  e = path_1.join(Editor.Project.path, "build-templates", n.platform);

  if (fs_extra_1.existsSync(e)) {
    fs_extra_1.copySync(e, l.paths.dir);
    console.debug(`Use build-template {link(${e})}.`);
  }

  if (a) {
    fs_extra_1.removeSync(path_1.join(l.paths.dir, "index.ejs"));
  }

  Editor.Message.request("web-mobile", "set-preview-path", l.paths.dir);
}
exports.throwError = true;
exports.onAfterInit = onAfterInit;
exports.onBeforeBuildAssets = onBeforeBuildAssets;
exports.onBeforeCompressSettings = onBeforeCompressSettings;
exports.onAfterBuild = onAfterBuild;
