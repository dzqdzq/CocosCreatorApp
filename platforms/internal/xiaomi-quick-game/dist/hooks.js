var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

exports.run = undefined;
exports.make = undefined;
exports.onAfterBuild = undefined;
exports.onBeforeCompressSettings = undefined;
exports.onAfterInit = undefined;
exports.onBeforeBuild = undefined;
exports.throwError = undefined;

const ejs_1 = __importDefault(require("ejs"));
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const cli_1 = require("./utils/cli");
const globby = require("globby");
const PKG_NAME = "xiaomi-quick-game";
const SUB_PACKAGE_JS_NAME = "main.js";
const ICON_NAME = "image/icon";

const Paths = {
  temp: path_1.join(Build.projectTempDir, PKG_NAME),
  packPath: path_1.join(Editor.App.path, "../tools", "xiaomi-pack-tools"),
  userTemplateDir: path_1.join(Build.buildTemplateDir, PKG_NAME),
};

const templateDir = path_1.join(__dirname, "../static/build-template");
function getTemplatePath(e) {
  return path_1.join(templateDir, e);
}
function onBeforeBuild(e) {
  e = e.packages[PKG_NAME];
  e.certificatePemPath = Editor.UI.File.resolveToRaw(e.certificatePemPath);
  e.privatePemPath = Editor.UI.File.resolveToRaw(e.privatePemPath);
}
async function onAfterInit(e, a, t) {
  var i = e.packages[PKG_NAME];

  Editor.Metrics.trackEvent({
    category: "Project",
    action: "BetaPlatforms",
    label: "xiaomi-runtime",
  });

  if (!window.__manager.taskManager.debug) {
    fs_extra_1.emptyDirSync(a.paths.dir);
  }

  e.moveRemoteBundleScript = true;
  e.generateCompileConfig = true;

  if (e.packages[PKG_NAME].makeAfterBuild) {
    e.nextTasks = ["make"];
  }

  if (e.includeModules.includes("gfx-webgl2")) {
    e.includeModules.splice(e.includeModules.indexOf("gfx-webgl2"), 1);
    e.assetSerializeOptions["cc.EffectAsset"].glsl3 = false;
  }

  e.assetSerializeOptions.exportCCON = true;
  let s = i.tinyPackageServer || "";

  if (s && !s.endsWith("/")) {
    s += "/";
  }

  Object.assign(e.appTemplateData, { showFPS: false, server: s });

  e.packages["xiaomi-quick-game"].icon = Editor.UI.File.resolveToRaw(
    e.packages["xiaomi-quick-game"].icon
  );

  Object.assign(e.buildEngineParam, {
    platform: "XIAOMI",
    engineName: "src/cocos-js",
  });

  e.buildScriptParam.importMapFormat = "commonjs";
  e.buildScriptParam.system = { preset: "commonjs-like" };

  a.paths.applicationJS = path_1.join(
    a.paths.dir,
    "src",
    path_1.basename(a.paths.applicationJS)
  );

  e = {
    orientation: i.deviceOrientation,
    remoteServerAddress: i.tinyPackageServer,
    packageName: i.package,
  };
  t.__addStaticsInfo(e);
}
async function onBeforeCompressSettings(e, a, t) {
  sortSubPackage(e, a, t);
  a.settings.orientation = e.packages[PKG_NAME].deviceOrientation;
}
async function onAfterBuild(a, t, e, i) {
  var s;
  var r = a.packages[PKG_NAME];
  if (t.paths.dir) {
    await buildAdapters(t.paths.dir);
    await copyResFiles(a, t);

    if (r.encapsulation || r.encapsulation === undefined) {
      for (const o of t.bundles) {
        if (fs_extra_1.existsSync(o.scriptDest)) {
          s = await fs_extra_1.readFile(o.scriptDest, "utf8");

          fs_extra_1.outputFileSync(
            o.scriptDest,
            `(function() { 
${s}
 })()`
          );
        }
      }
    }

    if (fs_extra_1.existsSync(Paths.userTemplateDir)) {
      fs_extra_1.copySync(Paths.userTemplateDir, t.paths.dir);
      console.debug(`Use build-template {link(${Paths.userTemplateDir})}.`);
    }

    writeConfigFile(t.paths.dir, a, t);
    let e = fs_extra_1.readFileSync(t.paths.importMap, "utf-8");
    r = path_1.basename(t.paths.engineDir);

    e = e.replace(
      new RegExp("./" + r, "g"),
      "no-schema:/src/" + path_1.basename(t.paths.engineDir)
    );

    fs_extra_1.writeFileSync(t.paths.importMap, e);
  }
}
async function make(e, a) {
  var t = {
    name: a.name,
    tinyPackageServer: a.packages[PKG_NAME].tinyPackageServer,
    useDebugKey: a.packages[PKG_NAME].useDebugKey,
  };

  var i =
    (fs_extra_1.existsSync(Paths.packPath)
      ? await initPackFiles()
      : (console.debug("start unzip pack tools"),
        (i = require("v-unzip")),
        (s = Paths.packPath + ".zip"),
        await i.unzip(s, Paths.packPath)),
    console.debug("Check is install nodejs"),
    await Build.Utils.isInstallNodeJs());

  if (i) {
    console.debug("Check is install pack tools");
    fs_extra_1.copySync(e, Paths.packPath);
    await buildRpk(t);
    var s = path_1.join(Paths.packPath, "dist");
    if (!fs_extra_1.existsSync(s)) {
      throw new Error("compile rpk failed!");
    }
    fs_extra_1.copySync(s, path_1.join(e, "dist"));
    i = path_1.join(
      e,
      "dist",
      a.name + (t.useDebugKey ? ".debug." : ".release.") + "rpk"
    );
    console.debug(`compile rpk success {link(${i})}`);
  } else {
    console.error("Please install nodejs in global first!");
  }
}
async function copyResFiles(e, a) {
  var certificatePemPath = e.packages[PKG_NAME];
  var privatePemPath = a.paths.systemJs;

  var privatePemPath =
    (fs_extra_1.writeFileSync(
      privatePemPath,
      "var self=window; var navigator=window.navigator;" +
        fs_extra_1.readFileSync(privatePemPath, "utf8")
    ),
    await buildGameJs(e, a),
    path_1.join(
      a.paths.dir,
      ICON_NAME + path_1.extname(certificatePemPath.icon)
    ));

  var {
    useDebugKey: e,
    privatePemPath,
    certificatePemPath,
  } = (fs_extra_1.ensureDirSync(path_1.dirname(i)),
  fs_extra_1.existsSync(t.icon)
    ? fs_extra_1.copyFileSync(t.icon, i)
    : console.warn("Icon is missing"),
  t);

  handleSign(a.paths.dir, e, privatePemPath, certificatePemPath);
}
async function initPackFiles() {
  if (cli_1.isInit(Paths.packPath)) {
    console.debug("use the cache xiaomi pack tools");
  } else {
    if (!fs_extra_1.existsSync(path_1.join(Paths.packPath, "package.json"))) {
      fs_extra_1.copySync(
        path_1.join(templateDir, "package.json"),
        path_1.join(Paths.packPath, "package.json")
      );

      fs_extra_1.copySync(
        path_1.join(templateDir, "babel.config.js"),
        path_1.join(Paths.packPath, "babel.config.js")
      );
    }

    console.debug("start install xiaomi pack tools");

    if (true !== (await cli_1.install(Paths.packPath))) {
      fs_extra_1.removeSync(path_1.join(Paths.packPath, "node_modules"));
      throw new Error("init xiaomi pack tools failed!");
    }

    console.log("init xiaomi pack tools success");
  }
  fs_extra_1.removeSync(path_1.join(Paths.packPath, "src"));
  fs_extra_1.removeSync(path_1.join(Paths.packPath, "libs"));
  fs_extra_1.removeSync(path_1.join(Paths.packPath, "assets"));
  fs_extra_1.removeSync(path_1.join(Paths.packPath, "remote"));
  fs_extra_1.removeSync(path_1.join(Paths.packPath, "dist"));
  fs_extra_1.removeSync(path_1.join(Paths.packPath, "image"));

  if (fs_extra_1.existsSync(path_1.join(Paths.packPath, "subpackages"))) {
    fs_extra_1.removeSync(path_1.join(Paths.packPath, "subpackages"));
  }
}
async function buildRpk(e) {
  let a = e.useDebugKey ? "build" : "release";

  if (e.tinyPackageServer) {
    a += "-ignore-res";
  }

  e = ["run", a, "--cocos-wx-game"];
  if (
    true !== (await Build.Utils.quickSpawn("npm", e, { cwd: Paths.packPath }))
  ) {
    throw new Error("Build rpk failed!");
  }
}
async function buildAdapters(t) {
  var e = (await Editor.Message.request("engine", "query-info")).path;
  const i = path_1.join(e, "platforms/minigame");
  e = await globby(path_1.join(i, "common/**/*"), { nodir: true });

  await Promise.all(
    e.map((e) => {
      var a = compileJS(fs_extra_1.readFileSync(e, "utf8"), e);
      var e = path_1.relative(i, e);
      var e = path_1.join(t, "libs", e);
      fs_extra_1.outputFileSync(e, a, "utf8");
    })
  ).catch((e) => {
    e.stack = "BuildWechatLibTemplate error: " + e.stack;
    console.error(e);
  });

  e = await globby(path_1.join(i, "platforms/xiaomi/wrapper/**/*"), {
    nodir: true,
  });

  await Promise.all(
    e.map((e) => {
      var a = compileJS(fs_extra_1.readFileSync(e, "utf8"), e);
      var e = path_1.relative(path_1.join(i, "platforms/xiaomi/"), e);
      var e = path_1.join(t, "libs", e);
      fs_extra_1.outputFileSync(e, a, "utf8");
    })
  ).catch((e) => {
    e.stack = "BuildWechatLibTemplate error: " + e.stack;
    console.error(e);
  });
}
async function buildGameJs(e, a) {
  e.packages[PKG_NAME];
  e.buildEngineParam.engineName;

  e = {
    polyfillsBundleFile:
      (a.paths.polyfillsJs &&
        Build.Utils.relativeUrl(a.paths.dir, a.paths.polyfillsJs)) ||
      false,
    systemJsBundleFile:
      a.paths.systemJs &&
      Build.Utils.relativeUrl(a.paths.dir, a.paths.systemJs),
    importMapFile: Build.Utils.relativeUrl(a.paths.dir, a.paths.importMap),
    applicationJs:
      "./" + Build.Utils.relativeUrl(a.paths.dir, a.paths.applicationJS),
  };

  e = await ejs_1.default.renderFile(path_1.join(templateDir, "game.ejs"), e);

  fs_extra_1.writeFileSync(
    path_1.join(a.paths.dir, SUB_PACKAGE_JS_NAME),
    e,
    "utf8"
  );
}
function compileJS(e, a) {
  let t;
  try {
    var i = require("@babel/core");
    t = i.transform(e, {
      ast: false,
      highlightCode: false,
      sourceMaps: false,
      compact: false,
      filename: a,
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
  return t.code;
}
function sortSubPackage(e, a, t) {
  for (const s of a.bundles) {
    var i;

    if (s.isSubpackage) {
      i = path_1.join(path_1.dirname(s.scriptDest), SUB_PACKAGE_JS_NAME);

      fs_extra_1.existsSync(s.scriptDest)
        ? fs_extra_1.renameSync(s.scriptDest, i)
        : fs_extra_1.outputFileSync(i, "");

      s.scriptDest = i;
    }
  }
}
function writeConfigFile(e, a, t) {
  var i = a.packages[PKG_NAME];
  var s = path_1.join(e, "manifest.json");

  var {
    versionName,
    versionCode,
    minPlatformVersion,
    logLevel,
    icon,
    deviceOrientation,
  } = i;

  var i = {
    package: i.package,
    name: a.name,
    versionName: versionName,
    versionCode: versionCode,
    minPlatformVersion: minPlatformVersion,
    icon: "/" + ICON_NAME + path_1.extname(icon),
    orientation: deviceOrientation,
    type: "game",
    config: { logLevel: logLevel },
    display: {},
  };

  var _ = [];
  for (const u of t.bundles) {
    if (u.isSubpackage) {
      _.push({ name: "usr_" + u.name, root: `subpackages/${u.name}/` });
    }
  }

  if (_.length > 0) {
    i.subpackages = _;
  }

  a = s.replace(e, Paths.userTemplateDir);

  if (fs_extra_1.existsSync(a)) {
    versionName = fs_extra_1.readJSONSync(a);
    Object.assign(i, versionName);
  }

  fs_extra_1.outputJSONSync(s, i);
}
function handleSign(e, a, t, i) {
  e = path_1.join(e, "sign");
  fs_extra_1.emptyDirSync(e);

  if (a) {
    a = path_1.join(e, "debug");
    fs_extra_1.ensureDirSync(a);

    fs_extra_1.copySync(
      getTemplatePath("certificate/certificate.pem"),
      path_1.join(a, "certificate.pem")
    );

    fs_extra_1.copySync(
      getTemplatePath("certificate/private.pem"),
      path_1.join(a, "private.pem")
    );
  } else {
    a = path_1.join(e, "release");
    fs_extra_1.ensureDirSync(a);

    fs_extra_1.existsSync(t) &&
      fs_extra_1.copySync(t, path_1.join(a, "private.pem"));

    fs_extra_1.existsSync(i) &&
      fs_extra_1.copySync(i, path_1.join(a, "certificate.pem"));
  }
}
async function run(e, a) {
  a = a.packages[PKG_NAME];

  e = path_1.join(
    e,
    "dist",
    `${a.package}${a.useDebugKey ? ".debug." : ".release."}rpk`
  );

  return fs_extra_1.existsSync(e)
    ? (await Editor.Panel.open("xiaomi-quick-game.preview"),
      Editor.Message.send(PKG_NAME, "update-rpk-path", e),
      true)
    : (console.error(
        `xiaomi rpk (${e}) does not exist, please build before preview!`
      ),
      false);
}
exports.throwError = true;
exports.onBeforeBuild = onBeforeBuild;
exports.onAfterInit = onAfterInit;
exports.onBeforeCompressSettings = onBeforeCompressSettings;
exports.onAfterBuild = onAfterBuild;
exports.make = make;
exports.run = run;
