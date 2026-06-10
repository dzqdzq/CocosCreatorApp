var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, a, t, n = t) => {
        var r = Object.getOwnPropertyDescriptor(a, t);

        if (
          !r ||
          (!("get" in r) ? !r.writable && !r.configurable : a.__esModule)
        ) {
          r = {
            enumerable: true,
            get() {
              return a[t];
            },
          };
        }

        Object.defineProperty(e, n, r);
      }
    : (e, a, t, n) => {
        e[(n = n === undefined ? t : n)] = a[t];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, a) => {
        Object.defineProperty(e, "default", { enumerable: true, value: a });
      }
    : (e, a) => {
        e.default = a;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var r = (e) =>
      (r =
        Object.getOwnPropertyNames ||
        ((e) => {
          var a;
          var t = [];
          for (a in e) {
            if (Object.prototype.hasOwnProperty.call(e, a)) {
              t[t.length] = a;
            }
          }
          return t;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var a = {};
      if (e != null) {
        for (var t = r(e), n = 0; n < t.length; n++) {
          if (t[n] !== "default") {
            __createBinding(a, e, t[n]);
          }
        }
      }
      __setModuleDefault(a, e);
      return a;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.onAfterInit = onAfterInit;
exports.onBeforeBundleInit = onBeforeBundleInit;
exports.onAfterBundleDataTask = onAfterBundleDataTask;
exports.onBeforeCopyBuildTemplate = onBeforeCopyBuildTemplate;
exports.make = make;
const path_1 = __importStar(require("path"));
const fs_extra_1 = __importStar(require("fs-extra"));
const ejs_1 = __importDefault(require("ejs"));

const { install } = require("./utils/cli");

const share_1 = require("./share");
async function onAfterInit(e, a, t) {
  if (!window.__manager.taskManager.debug) {
    fs_extra_1.default.emptyDirSync(a.paths.dir);
  }

  e.generateCompileConfig = true;
  e.moveRemoteBundleScript = true;

  if (e.server && !e.server.endsWith("/")) {
    e.server += "/";
  }

  var n = e.packages[share_1.PLATFORM_NAME];
  a.staticsInfo.B100011 = n.deviceOrientation;
  a.staticsInfo.B100005 = n.package;
  e.buildScriptParam.flags.WASM_SUBPACKAGE =
    n.wasmSubpackage && !n.separateEngine;

  if (n.separateEngine) {
    e.buildEngineParam.separateEngineOptions = {
      pluginFeatures: "all",
      outputLocalPlugin: true,
      pluginName: share_1.ENGINE_PLUGIN_NAME,
    };

    e.buildEngineParam.nativeCodeBundleMode = "asmjs";
  }
}
function onBeforeBundleInit(e) {
  if (e.polyfills) {
    e.polyfills.asyncFunctions = false;
  }

  e.moveRemoteBundleScript = true;
  e.buildScriptParam.system = { preset: "commonjs-like" };
}
async function onAfterBundleDataTask(e, a, t) {
  const n = [];

  a.forEach((e) => {
    var a;

    if (e.isSubpackage) {
      e.scriptDest = path_1.default.join(e.dest, share_1.SUB_MAIN_JS_NAME);
      a = "" + share_1.subpackagePrefix + e.name;
      n.push({ name: a, root: e.name + "/" });
    }
  });

  if (n.length) {
    e.packages[share_1.PLATFORM_NAME].subpackages = n;
  }
}
async function handleImportMap(e, a) {
  var a = a.paths.importMap;
  var t = await (0, fs_extra_1.readJson)(a);
  t.imports.cc = "./../cocos-js/cc.js";
  (0, fs_extra_1.writeJson)(a, t, { spaces: 2 });
}
async function handleIconName(e, a, t) {
  var n = e.packages[share_1.PLATFORM_NAME];
  var t = (0, path_1.join)(t, share_1.ICON_NAME + (0, path_1.extname)(n.icon));
  (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(t));
  (0, fs_extra_1.copyFileSync)(n.icon, t);

  e.md5CacheOptions.excludes.push(
    share_1.ICON_NAME + (0, path_1.extname)(n.icon)
  );
}
function getResPath(e) {
  return (0, path_1.join)(share_1.Paths.internalTemplateDir, "res", e);
}
function handleSign(e, a, t, n) {
  e = (0, path_1.join)(e, "sign");
  (0, fs_extra_1.emptyDirSync)(e);

  if (a) {
    a = (0, path_1.join)(e, "debug");
    (0, fs_extra_1.ensureDirSync)(a);

    fs_extra_1.default.copySync(
      getResPath("certificate.pem"),
      (0, path_1.join)(a, "certificate.pem")
    );

    fs_extra_1.default.copySync(
      getResPath("private.pem"),
      (0, path_1.join)(a, "private.pem")
    );
  } else {
    a = (0, path_1.join)(e, "release");
    (0, fs_extra_1.ensureDirSync)(a);

    (0, fs_extra_1.existsSync)(t) &&
      fs_extra_1.default.copySync(t, (0, path_1.join)(a, "private.pem"));

    (0, fs_extra_1.existsSync)(n) &&
      fs_extra_1.default.copySync(n, (0, path_1.join)(a, "certificate.pem"));
  }
}
async function onBeforeCopyBuildTemplate(e, a, t) {
  var n = a.paths.dir;

  await _generate_adapter(e, n);

  var useDebugKey =
    this.buildTemplate.initUrl("game.ejs") ||
    path_1.default.join(__dirname, "../static/build-template/game.ejs");

  var { useDebugKey, privatePemPath, certificatePemPath } =
    (await _render_game_js(r, e, a),
    await handleIconName(e, a, n),
    e.packages[share_1.PLATFORM_NAME]);

  handleSign(a.paths.dir, useDebugKey, privatePemPath, certificatePemPath);
  _generate_game_config_json(n, e, a);
}
async function buildRpk(e) {
  e = e.packages[share_1.PLATFORM_NAME].useDebugKey ? "build" : "release";
  if (
    true !==
    (await Build.Utils.quickSpawn("npm", ["run", e], {
      cwd: share_1.Paths.packPath,
      shell: true,
    }))
  ) {
    throw new Error("Build rpk failed!");
  }
}
const _retainFiles = ["node_modules", "package-lock.json", "package.json"];
async function initPackTools() {
  if (true !== (await install(share_1.Paths.packPath))) {
    fs_extra_1.default.removeSync(
      (0, path_1.join)(share_1.Paths.packPath, "node_modules")
    );

    throw new Error(
      "honor pack tools npm install @@honor-minigame/cli failed!"
    );
  }
  console.log("init honor pack tools success");
  console.debug("clear resources in pack tools");
  var e = fs_extra_1.default
    .readdirSync(share_1.Paths.packPath)
    .filter((e) => !_retainFiles.includes(e));
  try {
    await Promise.all(
      e.map(async (e) => {
        e = path_1.default.join(share_1.Paths.packPath, e);

        if ((0, fs_extra_1.existsSync)(e)) {
          await fs_extra_1.default.remove(e);
        }
      })
    );
  } catch (e) {
    console.warn(e);
  }
}
async function make(t, e) {
  var a;
  console.debug("Check is install nodejs");

  if (await Build.Utils.isInstallNodeJs()) {
    console.debug("Check is install pack tools");

    if (!(0, fs_extra_1.existsSync)(share_1.Paths.packPath)) {
      console.debug("start unzip pack tools");
      n = require("v-unzip");
      a = share_1.Paths.packPath + ".zip";
      await n.unzip(a, share_1.Paths.packPath);
    }

    await initPackTools();
    const r = path_1.default.join(t, "subpackages");

    if (
      fs_extra_1.default.existsSync(r) &&
      fs_extra_1.default.lstatSync(r).isDirectory()
    ) {
      fs_extra_1.default.readdirSync(r).forEach((e) => {
        var a = path_1.default.join(r, e);
        var e = path_1.default.join(t, e);
        fs_extra_1.default.moveSync(a, e);
      });

      fs_extra_1.default.rmdirSync(r);
    }

    fs_extra_1.default.copySync(t, share_1.Paths.packPath);
    await buildRpk(e);
    var n = path_1.default.join(share_1.Paths.packPath, "dist");
    if (!(0, fs_extra_1.existsSync)(n)) {
      throw new Error("build rpk failed!");
    }
    fs_extra_1.default.copySync(n, (0, path_1.join)(t, "dist"));
  } else {
    console.error("Please install nodejs in global first!");
  }
}
async function _generate_adapter(e, a) {
  var t = e.engineInfo.typescript.path;
  var t = path_1.default.join(t, "bin/adapter/runtime");
  var a = path_1.default.join(a, "runtime-adapter");
  var n = path_1.default.join(__dirname, "../static/adapter");

  var t = path_1.default.join(
    t,
    e.platform,
    `engine-adapter${e.debug ? "" : ".min"}.js`
  );

  var r = path_1.default.join(a, "engine-adapter.js");

  var t =
    (fs_extra_1.default.copySync(t, r),
    path_1.default.join(n, `web-adapter${e.debug ? "" : ".min"}.js`));

  var r = path_1.default.join(a, "web-adapter.js");

  var t =
    (fs_extra_1.default.copySync(t, r),
    path_1.default.join(n, e.platform, `ral${e.debug ? "" : ".min"}.js`));

  var r = path_1.default.join(a, "ral.js");
  fs_extra_1.default.copySync(t, r);
  e.md5CacheOptions.includes.push("runtime-adapter/*.js");
}
async function _render_game_js(e, a, t) {
  var t = t.paths;
  var t_dir = t.dir;

  var t = {
    optionDebug: a.debug,
    polyfillsBundleFile:
      (t.polyfillsJs && Build.Utils.relativeUrl(t_dir, t.polyfillsJs)) || false,
    systemJsBundleFile: Build.Utils.relativeUrl(t_dir, t.systemJs),
    importMapFile: Build.Utils.relativeUrl(t_dir, t.importMap),
    orientationNum:
      a.packages[share_1.PLATFORM_NAME].deviceOrientation === "landscape"
        ? 0
        : 1,
    applicationJs: "./" + Build.Utils.relativeUrl(t_dir, t.applicationJS),
  };

  var e = await ejs_1.default.renderFile(e, t);

  fs_extra_1.default.writeFileSync(
    path_1.default.join(t_dir, share_1.MAIN_JS_NAME),
    e
  );

  a.md5CacheOptions.replaceOnly.push(share_1.MAIN_JS_NAME);
}
function _generate_game_config_json(e, a, t) {
  var n = a.packages[share_1.PLATFORM_NAME];

  var n = {
    package: n.package,
    name: a.name,
    versionName: n.versionName,
    versionCode: n.versionCode,
    minPlatformVersion: n.minPlatformVersion,
    orientation: n.deviceOrientation,
    icon: "/" + share_1.ICON_NAME + (0, path_1.extname)(n.icon),
  };

  if (a.packages[share_1.PLATFORM_NAME].subpackages) {
    n.subpackages = a.packages[share_1.PLATFORM_NAME].subpackages;
  }

  var e = path_1.default.join(e, share_1.CONFIG_NAME);

  fs_extra_1.default.writeJSONSync(e, n);
  a.md5CacheOptions.excludes.push(share_1.CONFIG_NAME);
}
