var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwError = undefined;
exports.onBeforeBuild = onBeforeBuild;
exports.onAfterInit = onAfterInit;
exports.onAfterBundleInit = onAfterBundleInit;
exports.onAfterBundleDataTask = onAfterBundleDataTask;
exports.onAfterCompressSettings = onAfterCompressSettings;
exports.onAfterBuild = onAfterBuild;
exports.onBeforeMake = onBeforeMake;
exports.make = make;
exports.run = run;
exports.open = open;
const os_1 = __importDefault(require("os"));
const ejs_1 = __importDefault(require("ejs"));

const { join, dirname, resolve } = require("path");

const {
  existsSync,
  mkdir,
  readFile,
  emptyDirSync,
  symlinkSync,
  copy,
  writeFile,
  removeSync,
  moveSync,
  readJSON,
  outputJSON,
} = require("fs-extra");

const native_utils_1 = require("./native-utils");
function fixPath(e) {
  return os_1.default.platform() === "win32"
    ? e.replace(/\\/g, "/").replace(/\/+/, "/")
    : e;
}
async function getCmakePath() {
  var e = await Editor.Message.request(
    "program",
    "query-program-info",
    "cmake"
  );

  var e = e ? e.path : "";
  return (
    e ||
    ((e = join(Editor.App.path, "../tools/cmake")),
    process.platform === "win32"
      ? join(e, "bin/cmake.exe")
      : join(e, "bin/cmake"))
  );
}
async function genCocosParams(t, e) {
  var { name, engineInfo, packages } = t;

  var o = await Editor.Profile.getProject("engine", "macroConfig");

  const n = {
    buildDir: dirname(e.paths.dir),
    buildAssetsDir: e.paths.dir,
    projDir: Editor.Project.path,
    cmakePath: await getCmakePath(),
    nativeEnginePath: engineInfo.native.path,
    enginePath: engineInfo.typescript.path,
    projectName: name,
    debug: t.debug,
    encrypted: t.packages.native.encrypted,
    xxteaKey: t.packages.native.xxteaKey,
    compressZip: t.packages.native.compressZip,
    cMakeConfig: {
      APP_NAME: `set(APP_NAME "${name}")`,
      COCOS_X_PATH: `set(COCOS_X_PATH "${fixPath(engineInfo.native.path)}")`,
      USE_JOB_SYSTEM_TASKFLOW: packages.native.JobSystem === "taskFlow",
      USE_JOB_SYSTEM_TBB: packages.native.JobSystem === "tbb",
      ENABLE_FLOAT_OUTPUT: o.ENABLE_FLOAT_OUTPUT,
    },
    platformParams: {},
    platform: t.platform,
    packageName:
      (t.packages[t.platform] && t.packages[t.platform].packageName) || "",
  };

  if (t.debug && n.encrypted) {
    console.warn(Editor.I18n.t("native.encrypt.disable_tips"));
    n.encrypted = false;
  }

  if (engineInfo.native.type === "custom") {
    n.cMakeConfig.BUILTIN_COCOS_X_PATH = `set(BUILTIN_COCOS_X_PATH "${fixPath(
      engineInfo.native.builtin
    )}")`;
  }

  const s = (await Editor.Message.request("engine", "query-modules-config"))
    .moduleCmakeConfig;

  Object.keys(s).forEach((e) => {
    if (s[e].native) {
      n.cMakeConfig[s[e].native] = `set(${s[e].native} ${
        t.includeModules.includes(e) ? "ON" : "OFF"
      })`;
    }
  });

  if (!existsSync(n.buildDir)) {
    await mkdir(n.buildDir);
  }

  return n;
}
async function getBrowserslistQuery(e) {
  e = join(e, ".browserslistrc");
  let t;
  try {
    t = await readFile(e, "utf8");
  } catch (e) {
    return;
  }
  e = ((e) => {
    var t = [];
    for (const i of e.split("\n")) {
      var a = i.indexOf("#");
      var a = (a < 0 ? i : i.substr(0, a)).trim();

      if (a.length !== 0) {
        t.push(a);
      }
    }
    return t;
  })(t);
  if (e.length !== 0) {
    return e.join(" or ");
  }
}
function onBeforeBuild(e) {
  e.useCache = true;
}
async function onAfterInit(e, t) {
  if (e.server && !e.server.endsWith("/")) {
    e.server += "/";
  }

  var {
    native: { path: a },
    typescript: { path: i },
  } = e.engineInfo;

  var i =
    (native_utils_1.packToolHandler.init(i),
    console.debug("Native engine root:" + a),
    join(t.paths.dir, "assets"));

  t.paths.dir = join(t.paths.dir, "data");
  var a = t.paths.dir;

  if (e.buildMode === "normal") {
    await emptyDirSync(a);
  }

  Object.assign(e.buildEngineParam, {
    output: join(t.paths.dir, "src/cocos-js"),
  });

  t.paths.engineDir = e.buildEngineParam.output;
  try {
    if (!existsSync(i)) {
      symlinkSync(a, i, "junction");
    }
  } catch (e) {
    console.error("Failed to create symbolic link " + i);
    console.error(e);
  }
  var r = await genCocosParams(e, t);
  e.cocosParams = r;
  (t.compileOptions = e).generateCompileConfig = true;
  for (const o of ["web-adapter", "engine-adapter"]) {
    await copy(
      join(
        r.enginePath,
        "bin/adapter/native",
        `${o}.${e.debug ? "" : "min."}js`
      ),
      join(t.paths.dir, "jsb-adapter", o + ".js")
    );
  }
}
async function onAfterBundleInit(e) {
  var t = (
    e.engineInfo ||
    (await Editor.Message.request("engine", "query-engine-info"))
  ).native.path;
  e.buildScriptParam.hotModuleReload = e.packages.native.hotModuleReload;

  if (e.polyfills) {
    e.polyfills.asyncFunctions = false;
  }

  let a;
  t = await getBrowserslistQuery(t);

  if (
    (a = t ? t : a) &&
    ((e.buildScriptParam.targets = a),
    e.buildScriptParam.polyfills || (e.buildScriptParam.polyfills = {}),
    (e.buildScriptParam.polyfills.targets = a),
    "asyncFunctions" in e.buildScriptParam.polyfills)
  ) {
    delete e.buildScriptParam.polyfills.asyncFunctions;
  }

  e.buildScriptParam.system = { preset: "commonjs-like" };
}
async function onAfterBundleDataTask(e, t, a) {
  for (const i of t) {
    i.configOutPutName = "cc.config";
  }
}
async function onAfterCompressSettings(e, t) {
  var a = join(e.engineInfo.typescript.path, "templates/native");

  var i = {
    polyfillsBundleFile:
      (t.paths.polyfillsJs &&
        Build.Utils.relativeUrl(t.paths.dir, t.paths.polyfillsJs)) ||
      false,
    systemJsBundleFile: Build.Utils.relativeUrl(t.paths.dir, t.paths.systemJs),
    importMapFile: Build.Utils.relativeUrl(t.paths.dir, t.paths.importMap),
    applicationJs:
      "./" + Build.Utils.relativeUrl(t.paths.dir, t.paths.applicationJS),
  };

  var a = this.buildTemplate.initUrl("index.ejs") || join(a, "index.ejs");

  var a = (await ejs_1.default.renderFile(a, i)).toString();

  await writeFile(join(t.paths.dir, "main.js"), a, "utf8");
  e.md5CacheOptions.replaceOnly.push("main.js");
  var i = await native_utils_1.packToolHandler.runTask("create", e.cocosParams);
  e.packages.native.projectDistPath =
    await native_utils_1.packToolHandler.getProjectBuildPath(i);
  var a = e.server || "";

  var i = resolve(t.paths.dir, "../remote");
  removeSync(i);

  if (a && existsSync(t.paths.remote)) {
    try {
      moveSync(t.paths.remote, i);
      t.paths.remote = i;
    } catch (e) {
      console.error(e);
    }
  }
}
async function onAfterBuild(e, t) {
  await native_utils_1.packToolHandler.runTask("generate", e.cocosParams);
}
async function onBeforeMake(e, t) {
  if (!t.cocosParams) {
    if (!t.cMakeConfig || !this.buildTaskOptions) {
      throw new Error(
        "Get cache build options form cocos.compile.json failed! Please recompile the build task again."
      );
    }
    this.options = this.buildTaskOptions;
    this.options.cocosParams = JSON.parse(JSON.stringify(t));
    await this.saveOptions();
  }
}
async function make(e, t) {
  await native_utils_1.packToolHandler.runTask("make", t.cocosParams);
}
async function run(e, t) {
  await native_utils_1.packToolHandler.runTask("run", t.cocosParams);
}
async function open(t, a) {
  try {
    var i;
    var r = await Build.Utils.getBuildPath(t);
    let e = (t = await readJSON(join(r, "cocos.compile.config.json"))).packages
      .native.projectDistPath;
    return (e ||
      ((i = await native_utils_1.packToolHandler.initPackTool(t.cocosParams)),
      (e = await native_utils_1.packToolHandler.getProjectBuildPath(i)),
      (t.packages.native.projectDistPath = e),
      await outputJSON(join(r, "cocos.compile.config.json"), t)),
    existsSync(e))
      ? await native_utils_1.packToolHandler.openWithIDE(t.platform, e, a)
      : (console.error(
          Editor.I18n.t("native.tips.projectNotFound", { path: e })
        ),
        false);
  } catch (e) {
    console.error(e);
    console.error("open failed! Please check the log above for details.");
    return false;
  }
}
exports.throwError = true;
