var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwError = undefined;
exports.onBeforeBuild = onBeforeBuild;
exports.onBeforeBundleInit = onBeforeBundleInit;
exports.onAfterInit = onAfterInit;
exports.onAfterBundleBuildTask = onAfterBundleBuildTask;
exports.onBeforeCompressSettings = onBeforeCompressSettings;
exports.onBeforeCopyBuildTemplate = onBeforeCopyBuildTemplate;
exports.onAfterCopyBuildTemplate = onAfterCopyBuildTemplate;
exports.make = make;
const ejs_1 = __importDefault(require("ejs"));

const {
  existsSync,
  renameSync,
  readFile,
  outputFileSync,
  copy,
  readFileSync,
  writeFileSync,
  copySync,
  ensureDirSync,
  copyFileSync,
  removeSync,
  readJSONSync,
  outputJSONSync,
  emptyDirSync,
} = require("fs-extra");

const { join, basename, dirname, extname } = require("path");

const { isInit, install } = require("./utils/cli");

const share_1 = require("./share");
function getTemplatePath(e) {
  return join(share_1.Paths.internalTemplateDir, e);
}
function onBeforeBuild(e) {
  e = e.packages[share_1.PKG_NAME];

  e.certificatePemPath = Editor.UI.__protected__.File.resolveToRaw(
    e.certificatePemPath
  );

  e.privatePemPath = Editor.UI.__protected__.File.resolveToRaw(
    e.privatePemPath
  );
}
function onBeforeBundleInit(e) {
  e.moveRemoteBundleScript = true;

  if (e.polyfills) {
    e.polyfills.asyncFunctions = false;
  }

  e.buildScriptParam.importMapFormat = "commonjs";
  e.buildScriptParam.system = { preset: "commonjs-like" };
}
async function onAfterInit(e, a, t) {
  var s = e.packages[share_1.PKG_NAME];

  var a =
    (Editor.Metrics.trackEvent({
      category: "Project",
      action: "BetaPlatforms",
      label: "xiaomi-runtime",
    }),
    (e.generateCompileConfig = true),
    e.server && !e.server.endsWith("/") && (e.server += "/"),
    (s.icon = Editor.UI.__protected__.File.resolveToRaw(s.icon)),
    s.privatePemPath &&
      (s.privatePemPath = Editor.UI.__protected__.File.resolveToRaw(
        s.privatePemPath
      )),
    s.certificatePemPath &&
      (s.certificatePemPath = Editor.UI.__protected__.File.resolveToRaw(
        s.certificatePemPath
      )),
    Object.assign(e.buildEngineParam, {
      output: join(a.paths.dir, "src/cocos-js"),
    }),
    (a.paths.engineDir = e.buildEngineParam.output),
    (a.paths.applicationJS = join(
      a.paths.dir,
      "src",
      basename(a.paths.applicationJS)
    )),
    (a.staticsInfo.B100011 = s.deviceOrientation),
    (a.staticsInfo.B100005 = s.package),
    e.engineInfo.typescript.path);

  share_1.Paths.internalTemplateDir = join(a, "templates/xiaomi-quick-game");

  e.buildScriptParam.flags.WASM_SUBPACKAGE = s.wasmSubpackage;
}
async function onAfterBundleBuildTask(e, a, t) {
  var s;
  var i = [];
  for (const r of a) {
    if (r.isSubpackage) {
      s = join(dirname(r.scriptDest), share_1.SUB_PACKAGE_JS_NAME);

      existsSync(r.scriptDest) && renameSync(r.scriptDest, s);

      r.scriptDest = s;
      i.push({ name: "usr_" + r.name, root: `subpackages/${r.name}/` });
    }

    await handleScript(r.scriptDest);
  }
  e.packages["xiaomi-quick-game"].subpackages = i;
}
async function handleScript(e) {
  var a;

  if (existsSync(e)) {
    a = await readFile(e, "utf8");

    outputFileSync(
      e,
      `(function() { 
${a}
})()`
    );
  } else {
    outputFileSync(e, "(function() { \n \n })()");
  }
}
async function onBeforeCompressSettings(e, a, t) {
  a.settings.screen.orientation =
    e.packages[share_1.PKG_NAME].deviceOrientation;
}
async function onBeforeCopyBuildTemplate(e, a, t, s) {
  var i = e.engineInfo.typescript.path;
  for (const o of ["web-adapter", "engine-adapter"]) {
    await copy(
      join(i, "bin/adapter/minigame/xiaomi", `${o}.${e.debug ? "" : "min."}js`),
      join(a.paths.dir, o + ".js")
    );
  }
  await copyResFiles.call(this, e, a);
  let r = readFileSync(a.paths.importMap, "utf-8");
  var n = basename(a.paths.engineDir);

  r = r.replace(
    new RegExp("./" + n, "g"),
    "no-schema:/src/" + basename(a.paths.engineDir)
  );

  writeFileSync(a.paths.importMap, r);
}
async function onAfterCopyBuildTemplate(e, a) {
  writeConfigFile(e, a, this.buildTemplate.findFile("manifest.json"));
}
async function make(e, a) {
  var t = {
    name: a.name,
    tinyPackageServer: a.server || "",
    useDebugKey: a.packages[share_1.PKG_NAME].useDebugKey,
  };

  var s =
    (existsSync(share_1.Paths.packPath)
      ? await initPackFiles()
      : (console.debug("start unzip pack tools"),
        (s = require("v-unzip")),
        (i = share_1.Paths.packPath + ".zip"),
        await s.unzip(i, share_1.Paths.packPath)),
    console.debug("Check is install nodejs"),
    await Build.Utils.isInstallNodeJs());

  if (s) {
    console.debug("Check is install pack tools");
    copySync(e, share_1.Paths.packPath);
    await buildRpk(t);
    var i = join(share_1.Paths.packPath, "dist");
    if (!existsSync(i)) {
      throw new Error("compile rpk failed!");
    }
    copySync(i, join(e, "dist"));
    s = join(
      e,
      "dist",
      a.name + (t.useDebugKey ? ".debug." : ".release.") + "rpk"
    );
    console.debug(`compile rpk success {link(${s})}`);
  } else {
    console.error("Please install nodejs in global first!");
  }
}
async function copyResFiles(e, a) {
  var certificatePemPath = e.packages[share_1.PKG_NAME];
  var privatePemPath = a.paths.systemJs;

  var privatePemPath =
    (writeFileSync(
      privatePemPath,
      "var self=window; var navigator=window.navigator;" +
        readFileSync(privatePemPath, "utf8")
    ),
    this.buildTemplate.initUrl("game.ejs") ||
      join(share_1.Paths.internalTemplateDir, "game.ejs"));

  var privatePemPath =
    (await buildGameJs(privatePemPath, e, a),
    join(a.paths.dir, share_1.ICON_NAME + extname(certificatePemPath.icon)));

  var {
    useDebugKey: e,
    privatePemPath,
    certificatePemPath,
  } = (e.md5CacheOptions.excludes.push(share_1.ICON_NAME + extname(t.icon)),
  ensureDirSync(dirname(s)),
  existsSync(t.icon)
    ? copyFileSync(t.icon, s)
    : console.warn("Icon is missing"),
  t);

  handleSign(a.paths.dir, e, privatePemPath, certificatePemPath);
}
async function initPackFiles() {
  if (isInit(share_1.Paths.packPath)) {
    console.debug("use the cache xiaomi pack tools");
  } else {
    if (!existsSync(join(share_1.Paths.packPath, "package.json"))) {
      copySync(
        getTemplatePath("package.json"),
        join(share_1.Paths.packPath, "package.json")
      );

      copySync(
        getTemplatePath("babel.config.js"),
        join(share_1.Paths.packPath, "babel.config.js")
      );
    }

    console.debug("start install xiaomi pack tools");

    if (true !== (await install(share_1.Paths.packPath))) {
      removeSync(join(share_1.Paths.packPath, "node_modules"));

      throw new Error("init xiaomi pack tools failed!");
    }

    console.log("init xiaomi pack tools success");
  }
  removeSync(join(share_1.Paths.packPath, "src"));

  removeSync(join(share_1.Paths.packPath, "libs"));

  removeSync(join(share_1.Paths.packPath, "assets"));

  removeSync(join(share_1.Paths.packPath, "remote"));

  removeSync(join(share_1.Paths.packPath, "dist"));

  removeSync(join(share_1.Paths.packPath, "image"));

  if (existsSync(join(share_1.Paths.packPath, "subpackages"))) {
    removeSync(join(share_1.Paths.packPath, "subpackages"));
  }
}
async function buildRpk(e) {
  let a = e.useDebugKey ? "build" : "release";

  if (e.tinyPackageServer) {
    a += "-ignore-res";
  }

  e = ["run", a, "--cocos-wx-game"];
  if (
    true !==
    (await Build.Utils.quickSpawn("npm", e, {
      cwd: share_1.Paths.packPath,
      shell: true,
    }))
  ) {
    throw new Error("Build rpk failed!");
  }
}
async function buildGameJs(e, a, t) {
  var s = {
    polyfillsBundleFile:
      (t.paths.polyfillsJs &&
        Build.Utils.relativeUrl(t.paths.dir, t.paths.polyfillsJs)) ||
      false,
    systemJsBundleFile:
      t.paths.systemJs &&
      Build.Utils.relativeUrl(t.paths.dir, t.paths.systemJs),
    importMapFile: Build.Utils.relativeUrl(t.paths.dir, t.paths.importMap),
    applicationJs:
      "./" + Build.Utils.relativeUrl(t.paths.dir, t.paths.applicationJS),
  };

  var e = await ejs_1.default.renderFile(e, s);

  writeFileSync(join(t.paths.dir, share_1.SUB_PACKAGE_JS_NAME), e, "utf8");

  a.md5CacheOptions.replaceOnly.push(share_1.SUB_PACKAGE_JS_NAME);
}
function writeConfigFile(e, a, t) {
  var s = e.packages[share_1.PKG_NAME];
  var i = join(a.paths.dir, "manifest.json");

  var {
    versionName,
    versionCode: a,
    minPlatformVersion,
    logLevel,
    icon,
    deviceOrientation,
  } = (e.md5CacheOptions.excludes.push("manifest.json"),
  s.wasmSubpackage &&
    ((r = join(a.paths.engineDir, "./assets/")),
    (a = join(a.paths.engineDir, "./chunks/")),
    existsSync(r) &&
      ((s.subpackages ??= []),
      s.subpackages.push({
        name: "__ccWasmAssetSubpkg__",
        root: "src/cocos-js/assets/",
      }),
      renameSync(join(r, "game.js"), join(r, "main.js"))),
    existsSync(a)) &&
    ((s.subpackages ??= []),
    s.subpackages.push({
      name: "__ccWasmChunkSubpkg__",
      root: "src/cocos-js/chunks/",
    }),
    renameSync(join(a, "game.js"), join(a, "main.js"))),
  s);

  var _ = readJSONSync(
    join(share_1.Paths.internalTemplateDir, "manifest.json")
  );

  if (t) {
    t = readJSONSync(t);
    Object.assign(_, t);
  }

  Object.assign(_, {
    package: s.package,
    name: e.name,
    versionName: versionName,
    versionCode: a,
    minPlatformVersion: minPlatformVersion,
    icon: "/" + share_1.ICON_NAME + extname(icon),
    orientation: deviceOrientation,
    config: { logLevel: logLevel || "log" },
  });

  if (s.subpackages) {
    _.subpackages = s.subpackages;
  }

  outputJSONSync(i, _);
}
function handleSign(e, a, t, s) {
  e = join(e, "sign");
  emptyDirSync(e);

  if (a) {
    a = join(e, "debug");
    ensureDirSync(a);
    copySync(
      getTemplatePath("certificate/certificate.pem"),
      join(a, "certificate.pem")
    );
    copySync(
      getTemplatePath("certificate/private.pem"),
      join(a, "private.pem")
    );
  } else {
    a = join(e, "release");
    ensureDirSync(a);

    existsSync(t) && copySync(t, join(a, "private.pem"));

    existsSync(s) && copySync(s, join(a, "certificate.pem"));
  }
}
exports.throwError = true;
