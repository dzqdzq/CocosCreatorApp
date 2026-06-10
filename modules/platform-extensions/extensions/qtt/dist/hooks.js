var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, a, i = a) => {
        Object.defineProperty(e, i, {
          enumerable: true,
          get() {
            return t[a];
          },
        });
      }
    : (e, t, a, i) => {
        e[(i = i === undefined ? a : i)] = t[a];
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
      for (var a in e) {
        if (a !== "default" && Object.prototype.hasOwnProperty.call(e, a)) {
          __createBinding(t, e, a);
        }
      }
    }
    __setModuleDefault(t, e);
    return t;
  });

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });

exports.make = undefined;
exports.onAfterBuild = undefined;
exports.onBeforeBuildAssets = undefined;
exports.onAfterInit = undefined;
exports.throwError = undefined;

const fs_1 = require("fs");
const fs_extra_1 = __importStar(require("fs-extra"));
const path_1 = __importStar(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const cpk_utils_1 = require("./utils/cpk-utils");
const const_1 = require("./utils/const");
const hashes_1 = require("./utils/hashes");

const _PROJECT_TEMPLATE_DIR = path_1.default.join(
  Editor.Project.path,
  "build-templates",
  const_1.PLATFORM_NAME
);

const _SUBPACKAGE_PREFIX = "usr_";
async function onAfterInit(e, t, a) {
  if (!window.__manager.taskManager.debug) {
    fs_extra_1.default.emptyDirSync(t.paths.dir);
  }

  e.generateCompileConfig = true;
  e.moveRemoteBundleScript = true;
  e.assetSerializeOptions.exportCCON = true;
  t = e.packages[const_1.PLATFORM_NAME];

  if (e.server && !e.server.endsWith("/")) {
    e.server += "/";
  }

  Object.assign(e.appTemplateData, { showFPS: false });
  Object.assign(e.buildEngineParam, { platform: const_1.PLATFORM });
  e.buildScriptParam.system = { preset: "commonjs-like" };
  t = { orientation: t.deviceOrientation, remoteServerAddress: e.server };
  a.__addStaticsInfo(t);
}
async function onBeforeBuildAssets(e, t) {
  for (var a of t.bundles) {
    if (a.isSubpackage) {
      a.scriptDest = path_1.default.join(a.dest, "main.js");
    }
  }
}
async function onAfterBuild(e, t, a, i) {
  var n = e.packages[const_1.PLATFORM_NAME];
  var r = t.paths.dir;

  var e =
    (fs_extra_1.default.existsSync(_PROJECT_TEMPLATE_DIR) &&
      (fs_extra_1.default.copySync(_PROJECT_TEMPLATE_DIR, r),
      console.debug(`Use build-template {link(${_PROJECT_TEMPLATE_DIR})}.`)),
    await _generate_adapter_by_gulp(e, r),
    await _render_main_js(e, t),
    _generate_game_config_json(r, e, t),
    n.workerPath);

  if (e) {
    t = path_1.default.join(Editor.Project.path, e);
    n = path_1.default.join(r, e);

    fs_extra_1.default.existsSync(t)
      ? fs_extra_1.default.copySync(t, n)
      : console.warn(
          _get_string_i18n("tips.not_empty") +
            " " +
            _get_string_i18n("option.worker_path") +
            " " +
            e
        );
  }
}
async function make(e, t) {
  let a = path_1.default.join(e, "dist", t.name + ".cpk");
  fs_extra_1.emptyDirSync(path_1.dirname(a));
  fs_extra_1.ensureDirSync(path_1.dirname(a));
  var i = ["subpackages", "dist", "cocos.compile.config.json"];
  var n = path_1.default.join(e, Build.SUBPACKAGES_HEADER);
  if (fs_1.existsSync(n)) {
    for (var r of fs_1.readdirSync(n)) {
      i.push(r);
      r = _SUBPACKAGE_PREFIX + r;
      const a = path_1.default.join(n, r + "." + hashes_1.CRC32(r) + ".cpk");
      await _generate_zip(path_1.default.join(n, r), a);
    }
  }

  if (t.server) {
    i.push("remote");
  }

  await _generate_zip(e, a, i);
}
function _get_string_i18n(e) {
  return Editor.I18n.t(const_1.PLATFORM_NAME + "." + e);
}
async function _generate_zip(e, t, a = []) {
  const i = new cpk_utils_1.JsZip();
  i.directory(e);
  for (var n of a) {
    i.remove(n);
  }
  const r = fs_extra_1.default.createWriteStream(t);
  return new Promise((e) => {
    i.generateNodeStream({
      type: "nodebuffer",
      base64: false,
      compression: "DEFLATE",
    })
      .pipe(r)
      .on("finish", () => {
        e();
      });
  });
}
async function _generate_adapter_by_gulp(e, t) {
  var a = (await Editor.Message.request("engine", "query-engine-info"))
    .typescript.path;

  var i = path_1.default.join(
    a,
    "platforms",
    "runtime",
    "platforms",
    e.platform
  );
  var t = path_1.default.join(t, "runtime-adapter");
  var n = path_1.default.join(i, "engine", "index.js");
  var r = path_1.default.join(t, "engine-adapter.js");

  var n =
    (await Build.Utils.createBundle(n, r, { debug: e.debug }),
    path_1.default.join(a, "platforms/runtime/common/web-adapter.js"));

  var r = path_1.default.join(t, "web-adapter.js");

  fs_extra_1.default.copyFileSync(n, r);
  var a = path_1.default.join(i, `ral${e.debug ? "" : ".min"}.js`);

  var n = path_1.default.join(t, "ral.js");
  fs_extra_1.default.copyFileSync(a, n);
}
async function _render_main_js(e, t) {
  var t = t.paths;
  var t_dir = t.dir;

  var e = {
    optionDebug: e.debug,
    polyfillsBundleFile:
      (t.polyfillsJs && Build.Utils.relativeUrl(t_dir, t.polyfillsJs)) || false,
    systemJsBundleFile: Build.Utils.relativeUrl(t_dir, t.systemJs),
    importMapFile: Build.Utils.relativeUrl(t_dir, t.importMap),
    orientationNum:
      e.packages[const_1.PLATFORM_NAME].deviceOrientation === "landscape"
        ? 0
        : 1,
    applicationJs: "./" + Build.Utils.relativeUrl(t_dir, t.applicationJS),
  };

  var t = await ejs_1.default.renderFile(
    path_1.default.join(__dirname, "../static/build-template/main.ejs"),
    e
  );

  fs_extra_1.default.writeFileSync(path_1.default.join(t_dir, "main.js"), t);
}
function _generate_game_config_json(e, t, a) {
  var i = t.packages[const_1.PLATFORM_NAME];

  var t = {
    package: i.package,
    name: t.name,
    versionName: i.versionName,
    versionCode: i.versionCode,
    icon: path_1.basename(i.icon),
  };

  if (i.workerPath) {
    t.workers = i.workerPath;
  }

  var n = {};

  if (i.cameraPermissionHint !== "") {
    n["scope.userLocation"] = i.cameraPermissionHint;
  }

  if (i.userInfoPermissionHint !== "") {
    n["scope.userInfo"] = i.userInfoPermissionHint;
  }

  if (i.locationPermissionHint !== "") {
    n["scope.userLocation"] = i.locationPermissionHint;
  }

  if (i.albumPermissionHint !== "") {
    n["scope.writePhotosAlbum"] = i.albumPermissionHint;
  }

  if (Object.keys(n).length) {
    t.permission = n;
  }

  if (a.bundles.length) {
    var r = [];
    for (const s of a.bundles) {
      if (s.isSubpackage) {
        r.push({
          name: _SUBPACKAGE_PREFIX + s.name,
          root: "" + _SUBPACKAGE_PREFIX + s.name + "/",
        });
      }
    }
    t.subpackages = r;
  }

  i = path_1.default.join(_PROJECT_TEMPLATE_DIR, "game.config.json");

  if (fs_extra_1.default.existsSync(i)) {
    n = fs_extra_1.default.readJSONSync(i);
    Object.assign(t, n);
  }

  a = path_1.default.join(e, "game.config.json");
  fs_extra_1.default.writeJSONSync(a, t);
}
exports.throwError = true;
exports.onAfterInit = onAfterInit;
exports.onBeforeBuildAssets = onBeforeBuildAssets;
exports.onAfterBuild = onAfterBuild;
exports.make = make;
