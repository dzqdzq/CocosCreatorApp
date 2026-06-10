var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, n, i = n) => {
        var s = Object.getOwnPropertyDescriptor(t, n);

        if (
          !s ||
          (!("get" in s) ? !s.writable && !s.configurable : t.__esModule)
        ) {
          s = {
            enumerable: true,
            get() {
              return t[n];
            },
          };
        }

        Object.defineProperty(e, i, s);
      }
    : (e, t, n, i) => {
        e[(i = i === undefined ? n : i)] = t[n];
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
  (() => {
    var s = (e) =>
      (s =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var n = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              n[n.length] = t;
            }
          }
          return n;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var n = s(e), i = 0; i < n.length; i++) {
          if (n[i] !== "default") {
            __createBinding(t, e, n[i]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

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
const fs_extra_1 = __importStar(require("fs-extra"));

const { join, basename } = require("path");

const JsZip_1 = require("./utils/JsZip");
const remote_1 = require("@electron/remote");
async function onAfterInit(e, t, n) {
  Editor.Metrics.trackEvent({
    category: "Project",
    action: "BetaPlatforms",
    label: "fb-instant-games",
    value: { orientation: e.packages["fb-instant-games"].orientation },
  });

  if (e.server && !e.server.endsWith("/")) {
    e.server += "/";
  }

  e.buildEngineParam.split = false;
  e.buildEngineParam.assetURLFormat = "runtime-resolved";
  e = e.packages["fb-instant-games"];
  t.staticsInfo.B100011 = e.orientation;
}
function onAfterBundleInit(e) {
  e.buildScriptParam.system = { preset: "web" };
}
async function onBeforeCompressSettings(e, t, n) {
  if (t.paths.dir) {
    e = e.packages["fb-instant-games"];
    t.settings.screen.orientation = e.orientation;
  }
}
async function onBeforeCopyBuildTemplate(e, t) {
  var n = e.packages["fb-instant-games"];
  var i = e.engineInfo.typescript.path;
  var i = join(i, "templates/fb-instant-games");

  var s =
    this.buildTemplate.initUrl("index.js.ejs", "indexEjs") ||
    join(i, "index.js.ejs");

  var s = await ejs_1.default.renderFile(s, {
    applicationJS:
      "./" + Build.Utils.relativeUrl(t.paths.dir, t.paths.applicationJS),
  });

  var s = await Build.Utils.transformCode(s, { importMapFormat: "systemjs" });
  if (!s) {
    throw new Error("Unable to generate index.js");
  }
  var r = join(t.paths.dir, "index.js");

  var s =
    ((0, fs_extra_1.outputFileSync)(r, s, "utf-8"),
    e.md5CacheOptions.includes.push("index.js"),
    join(t.paths.dir, "style.css"));

  e.md5CacheOptions.includes.push("style.css");

  if (!this.buildTemplate.findFile("style.css")) {
    (0, fs_extra_1.copyFileSync)(join(i, "style.css"), s);
  }

  let a = "";

  if (n.embedWebDebugger) {
    n = join(t.paths.dir, "vconsole.min.js");
    e.md5CacheOptions.excludes.push("vconsole.min.js");

    this.buildTemplate.findFile("vconsole.min.js") ||
      (0, fs_extra_1.copyFileSync)(join(i, "vconsole.min.js"), n);

    a = "./vconsole.min.js";
  }

  n = (0, fs_extra_1.readJSONSync)(join(i, "fbapp-config.json"));

  if (n && n.instant_games) {
    n.instant_games.orientation =
      e.packages["fb-instant-games"].orientation.toUpperCase();
    n.instant_games.override_web_orientation =
      e.packages["fb-instant-games"].orientation.toUpperCase();

    (0, fs_extra_1.writeJsonSync)(join(t.paths.dir, "fbapp-config.json"), n);

    e.md5CacheOptions.excludes.push("fbapp-config.json");
  }

  n = {
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
    indexJsName: basename(r),
    cssUrl: basename(s),
  };

  r = this.buildTemplate.initUrl("index.ejs", "index") || join(i, "index.ejs");

  s = await ejs_1.default.renderFile(r, n);
  join(t.paths.dir, "index.html");

  (0, fs_extra_1.outputFileSync)(join(t.paths.dir, "index.html"), s, "utf8");

  e.md5CacheOptions.replaceOnly.push("index.html");
}
async function onAfterBuild(e, n) {
  n.settings.plugins.jsList.forEach((e, t) => {
    n.settings.plugins.jsList[t] = e
      .split("/")
      .map(encodeURIComponent)
      .join("/");
  });

  (0, fs_extra_1.outputFileSync)(
    n.paths.settings,
    JSON.stringify(n.settings, null, e.debug ? 4 : 0)
  );

  const t = join(n.paths.dir, e.name.concat(".zip"));
  await _generate_zip(n.paths.dir, t)
    .then(() => {
      remote_1.shell.showItemInFolder(t);
    })
    .catch((e) => {
      console.error(`Zip failed, error: ${e}.`);
    });
}
async function _generate_zip(e, t, n = []) {
  const i = new JsZip_1.JsZip();
  i.directory(e, basename(e));
  for (const r of n) {
    i.remove(r);
  }
  const s = fs_extra_1.default.createWriteStream(t);
  return new Promise((e) => {
    i.generateNodeStream({
      type: "nodebuffer",
      base64: false,
      compression: "DEFLATE",
    })
      .pipe(s)
      .on("finish", () => {
        e();
      });
  });
}
exports.throwError = true;
