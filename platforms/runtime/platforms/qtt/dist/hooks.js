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

var __awaiter =
  (this && this.__awaiter) ||
  ((e, o, s, _) =>
    new (s = s || Promise)((i, t) => {
      function n(e) {
        try {
          a(_.next(e));
        } catch (e) {
          t(e);
        }
      }
      function r(e) {
        try {
          a(_.throw(e));
        } catch (e) {
          t(e);
        }
      }
      function a(e) {
        var t;

        if (e.done) {
          i(e.value);
        } else {
          ((t = e.value) instanceof s
            ? t
            : new s((e) => {
                e(t);
              })
          ).then(n, r);
        }
      }
      a((_ = _.apply(e, o || [])).next());
    }));

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
const hashes_1 = require("./utils/hashes");
const fs_1 = require("fs");

const _PROJECT_TEMPLATE_DIR = path_1.default.join(
  Editor.Project.path,
  "build-templates",
  const_1.PLATFORM_NAME
);

const _SUBPACKAGE_PREFIX = "usr_";
async function onAfterInit(i, n, r) {
  if (!window.__manager.taskManager.debug) {
    fs_extra_1.default.emptyDirSync(n.paths.dir);
  }

  i.nextTasks = ["make"];
  i.generateCompileConfig = true;
  i.moveRemoteBundleScript = true;
  i.assetSerializeOptions.exportCCON = true;
  var e = i.packages[const_1.PLATFORM_NAME];
  let t = e.resourceURL || "";

  if (t && !t.endsWith("/")) {
    t += "/";
  }

  Object.assign(i.appTemplateData, { showFPS: false, server: t });
  Object.assign(i.buildEngineParam, { platform: const_1.PLATFORM });
  i.buildScriptParam.system = { preset: "commonjs-like" };
  e = {
    orientation: e.deviceOrientation,
    remoteServerAddress: e.resourceURL,
  };
  r.__addStaticsInfo(e);
}
async function onBeforeBuildAssets(e, t) {
  for (var e of t.bundles) {
    if (e.isSubpackage) {
      e.scriptDest = path_1.default.join(e.dest, "main.js");
    }
  }
}
async function onAfterBuild(n, r, e, t) {
  var e;
  var t = n.packages[const_1.PLATFORM_NAME];
  var i = r.paths.dir;

  if (fs_extra_1.default.existsSync(_PROJECT_TEMPLATE_DIR)) {
    fs_extra_1.default.copySync(_PROJECT_TEMPLATE_DIR, i);

    console.debug(`Use build-template {link(${_PROJECT_TEMPLATE_DIR})}.`);
  }

  await _generate_adapter_by_gulp(n, i);
  await _render_main_js(n, r);
  _generate_game_config_json(i, n, r);
  var t = t.workerPath;

  if (t) {
    e = path_1.default.join(Editor.Project.path, t);
    i = path_1.default.join(i, t);

    fs_extra_1.default.existsSync(e)
      ? fs_extra_1.default.copySync(e, i)
      : console.warn(
          _get_string_i18n("tips.not_empty") +
            " " +
            _get_string_i18n("option.worker_path") +
            " " +
            t
        );
  }
}
async function make(r, a) {
  let e = path_1.default.join(r, "dist", a.name + ".cpk");
  fs_extra_1.emptyDirSync(path_1.dirname(e));
  fs_extra_1.ensureDirSync(path_1.dirname(e));
  var t = ["subpackages", "dist", "cocos.compile.config.json"];
  var i = path_1.default.join(r, Build.SUBPACKAGES_HEADER);
  if (fs_1.existsSync(i)) {
    for (var n of fs_1.readdirSync(i)) {
      t.push(n);
      n = _SUBPACKAGE_PREFIX + n;
      const e = path_1.default.join(i, n + "." + hashes_1.CRC32(n) + ".cpk");
      await _generate_zip(path_1.default.join(i, n), e);
    }
  }

  if (a.packages.qtt.resourceURL) {
    t.push("remote");
  }

  await _generate_zip(r, e, t);
}
function _get_string_i18n(e) {
  return Editor.I18n.t(const_1.PLATFORM_NAME + "." + e);
}
async function _generate_zip(n, r, a = []) {
  const t = new cpk_utils_1.JsZip();
  t.directory(n);
  for (var e of a) {
    t.remove(e);
  }
  const i = fs_extra_1.default.createWriteStream(r);
  return new Promise((e) => {
    t.generateNodeStream({
      type: "nodebuffer",
      base64: false,
      compression: "DEFLATE",
    })
      .pipe(i)
      .on("finish", () => {
        e();
      });
  });
}
async function _generate_adapter_by_gulp(a, o) {
  var e = (await Editor.Message.request("engine", "query-info")).path;

  var t = path_1.default.join(
    e,
    "platforms",
    "runtime",
    "platforms",
    a.platform
  );

  var i = path_1.default.join(o, "runtime-adapter");
  var n = path_1.default.join(t, "engine", "index.js");
  var r = path_1.default.join(i, "engine-adapter.js");

  var n =
    (await Build.Utils.createBundle(n, r, { debug: a.debug }),
    path_1.default.join(e, "platforms/runtime/common/web-adapter.js"));

  var r = path_1.default.join(i, "web-adapter.js");

  fs_extra_1.default.copyFileSync(n, r);
  var e = path_1.default.join(t, `ral${a.debug ? "" : ".min"}.js`);

  var n = path_1.default.join(i, "ral.js");
  fs_extra_1.default.copyFileSync(e, n);
}
async function _render_main_js(i, n) {
  var n_paths = n.paths;
  var n_paths_dir = n_paths.dir;

  var n_paths = {
    optionDebug: i.debug,
    polyfillsBundleFile:
      (n_paths.polyfillsJs &&
        Build.Utils.relativeUrl(n_paths_dir, n_paths.polyfillsJs)) ||
      false,
    systemJsBundleFile: Build.Utils.relativeUrl(n_paths_dir, n_paths.systemJs),
    importMapFile: Build.Utils.relativeUrl(n_paths_dir, n_paths.importMap),
    orientationNum:
      i.packages[const_1.PLATFORM_NAME].deviceOrientation === "landscape"
        ? 0
        : 1,
    applicationJs:
      "./" + Build.Utils.relativeUrl(n_paths_dir, n_paths.applicationJS),
  };

  var n_paths = await ejs_1.default.renderFile(
    path_1.default.join(__dirname, "../static/build-template/main.ejs"),
    n_paths
  );

  fs_extra_1.default.writeFileSync(
    path_1.default.join(n_paths_dir, "main.js"),
    n_paths
  );
}
function _generate_game_config_json(e, t, i) {
  var n = t.packages[const_1.PLATFORM_NAME];

  var t = {
    package: n.package,
    name: t.name,
    versionName: n.versionName,
    versionCode: n.versionCode,
    icon: path_1.basename(n.icon),
  };

  if (n.workerPath) {
    t.workers = n.workerPath;
  }

  var r = {};

  if (n.cameraPermissionHint !== "") {
    r["scope.userLocation"] = n.cameraPermissionHint;
  }

  if (n.userInfoPermissionHint !== "") {
    r["scope.userInfo"] = n.userInfoPermissionHint;
  }

  if (n.locationPermissionHint !== "") {
    r["scope.userLocation"] = n.locationPermissionHint;
  }

  if (n.albumPermissionHint !== "") {
    r["scope.writePhotosAlbum"] = n.albumPermissionHint;
  }

  if (Object.keys(r).length) {
    t.permission = r;
  }

  if (i.bundles.length) {
    var a = [];
    for (const o of i.bundles) {
      if (o.isSubpackage) {
        a.push({
          name: _SUBPACKAGE_PREFIX + o.name,
          root: "" + _SUBPACKAGE_PREFIX + o.name + "/",
        });
      }
    }
    t.subpackages = a;
  }

  n = path_1.default.join(_PROJECT_TEMPLATE_DIR, "game.config.json");

  if (fs_extra_1.default.existsSync(n)) {
    r = fs_extra_1.default.readJSONSync(n);
    Object.assign(t, r);
  }

  i = path_1.default.join(e, "game.config.json");
  fs_extra_1.default.writeJSONSync(i, t);
}
exports.throwError = true;
exports.onAfterInit = onAfterInit;
exports.onBeforeBuildAssets = onBeforeBuildAssets;
exports.onAfterBuild = onAfterBuild;
exports.make = make;
