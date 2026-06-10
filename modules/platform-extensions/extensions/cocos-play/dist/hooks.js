var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, i, n = i) => {
        Object.defineProperty(e, n, {
          enumerable: true,
          get() {
            return t[i];
          },
        });
      }
    : (e, t, i, n) => {
        e[(n = n === undefined ? i : n)] = t[i];
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

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });

exports.make = undefined;
exports.onAfterBuild = undefined;
exports.onBeforeBuildAssets = undefined;
exports.onAfterInit = undefined;
exports.throwError = undefined;

const fs_extra_1 = __importStar(require("fs-extra"));
const path_1 = __importStar(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const cpk_utils_1 = require("./utils/cpk-utils");
const const_1 = require("./utils/const");

const _PROJECT_TEMPLATE_DIR = path_1.default.join(
  Editor.Project.path,
  "build-templates",
  const_1.PLATFORM_NAME
);

const subpackagePrefix = "usr_";

const PLATFORM_SETTINGS = {
  runtimeVersion: "1.0.0",
  deviceOrientation: "portrait",
  statusbarDisplay: false,
  startSceneAssetBundle: false,
  workerPath: "",
  XHRTimeout: 60000 /* 6e4 */,
  WSTimeout: 60000 /* 6e4 */,
  uploadFileTimeout: 60000 /* 6e4 */,
  downloadFileTimeout: 60000 /* 6e4 */,
  cameraPermissionHint: "",
  userInfoPermissionHint: "",
  locationPermissionHint: "",
  albumPermissionHint: "",
};

async function onAfterInit(e, t, i) {
  if (e.polyfills) {
    e.polyfills.asyncFunctions = false;
  }

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

  Object.assign(e.buildEngineParam, { platform: const_1.PLATFORM });
  e.buildScriptParam.system = { preset: "commonjs-like" };
  t = { orientation: t.deviceOrientation, remoteServerAddress: e.server };
  i.__addStaticsInfo(t);
}
async function onBeforeBuildAssets(e, t) {
  for (const i of t.bundles) {
    if (i.isSubpackage) {
      i.scriptDest = path_1.default.join(i.dest, "main.js");
    }
  }
}
async function onAfterBuild(e, t, i, n) {
  var r = e.packages[const_1.PLATFORM_NAME];
  var a = t.paths.dir;

  var e =
    (await generateAdapter(e, a),
    await _render_main_js(e, t),
    fs_extra_1.default.existsSync(_PROJECT_TEMPLATE_DIR) &&
      (fs_extra_1.default.copySync(_PROJECT_TEMPLATE_DIR, a),
      console.debug(`Use build-template {link(${_PROJECT_TEMPLATE_DIR})}.`)),
    _generate_game_config_json(a, e, t),
    r.workerPath);

  if (e) {
    t = path_1.default.join(Editor.Project.path, e);
    r = path_1.default.join(a, e);

    fs_extra_1.default.existsSync(t)
      ? fs_extra_1.default.copySync(t, r)
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
  var i = path_1.default.join(e, "dist", t.name + ".cpk");

  fs_extra_1.emptyDirSync(path_1.dirname(i));
  fs_extra_1.ensureDirSync(path_1.dirname(i));
  var n = ["subpackages", "cocos.compile.config.json", "dist"];

  if (t.server) {
    n.push("remote");
  }

  await _generate_zip(e, i, n);
}
function _get_string_i18n(e) {
  return Editor.I18n.t(const_1.PLATFORM_NAME + "." + e);
}
async function _generate_zip(e, t, i = []) {
  const n = new cpk_utils_1.JsZip();
  n.directory(e);
  for (const a of i) {
    n.remove(a);
  }
  const r = fs_extra_1.default.createWriteStream(t);
  return new Promise((e) => {
    n.generateNodeStream({
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
async function generateAdapter(e, t) {
  var t = path_1.join(t, "runtime-adapter");

  var i = (await Editor.Message.request("engine", "query-engine-info"))
    .typescript.path;

  var e_platform = e.platform;
  var i = path_1.join(i, "bin/adapter/runtime");

  fs_extra_1.ensureDirSync(t);
  var r = path_1.join(
    i,
    e_platform,
    `engine-adapter${e.debug ? "" : ".min"}.js`
  );

  var a = path_1.join(t, "engine-adapter.js");

  var r =
    (fs_extra_1.copyFileSync(r, a),
    path_1.join(i, `web-adapter${e.debug ? "" : ".min"}.js`));

  var a = path_1.join(t, "web-adapter.js");

  var r =
    (fs_extra_1.copyFileSync(r, a),
    path_1.join(i, e_platform, `ral${e.debug ? "" : ".min"}.js`));

  var a = path_1.join(t, "ral.js");
  fs_extra_1.copyFileSync(r, a);
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
function _generate_game_config_json(e, t, i) {
  var t = Object.assign(PLATFORM_SETTINGS, t.packages[const_1.PLATFORM_NAME]);

  var n = {
    runtimeVersion: t.runtimeVersion,
    deviceOrientation: t.deviceOrientation,
    showStatusBar: t.statusbarDisplay,
    networkTimeout: {
      request: t.XHRTimeout,
      connectSocket: t.WSTimeout,
      uploadFile: t.uploadFileTimeout,
      downloadFile: t.downloadFileTimeout,
    },
  };

  if (t.workerPath) {
    n.workers = t.workerPath;
  }

  var r = {};

  if (t.cameraPermissionHint !== "") {
    r["scope.userLocation"] = t.cameraPermissionHint;
  }

  if (t.userInfoPermissionHint !== "") {
    r["scope.userInfo"] = t.userInfoPermissionHint;
  }

  if (t.locationPermissionHint !== "") {
    r["scope.userLocation"] = t.locationPermissionHint;
  }

  if (t.albumPermissionHint !== "") {
    r["scope.writePhotosAlbum"] = t.albumPermissionHint;
  }

  if (Object.keys(r).length) {
    n.permission = r;
  }

  if (i.bundles.length) {
    var a = [];
    for (const s of i.bundles) {
      if (s.isSubpackage) {
        a.push({
          name: subpackagePrefix + s.name,
          root: "" + subpackagePrefix + s.name + "/",
        });
      }
    }
    n.subpackages = a;
  }

  t = path_1.default.join(_PROJECT_TEMPLATE_DIR, "game.config.json");

  if (fs_extra_1.default.existsSync(t)) {
    r = fs_extra_1.default.readJSONSync(t);
    Object.assign(n, r);
  }

  i = path_1.default.join(e, "game.config.json");
  fs_extra_1.default.writeJSONSync(i, n);
}
exports.throwError = true;
exports.onAfterInit = onAfterInit;
exports.onBeforeBuildAssets = onBeforeBuildAssets;
exports.onAfterBuild = onAfterBuild;
exports.make = make;
