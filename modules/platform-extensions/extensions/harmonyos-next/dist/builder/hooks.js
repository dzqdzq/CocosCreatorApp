var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwError = undefined;
exports.onBeforeBuild = onBeforeBuild;
exports.onAfterInit = onAfterInit;
exports.onAfterBundleInit = onAfterBundleInit;
exports.onAfterBuild = onAfterBuild;
exports.openWithIDE = openWithIDE;

const {
  outputJSON,
  readFileSync,
  unlinkSync,
  outputFileSync,
  pathExists,
  rm,
  existsSync,
  statSync,
} = require("fs-extra");

const {
  emptyDir,
  ensureDir,
  copy,
  moveSync,
  readdirSync,
  writeFileSync,
  readFile,
} = require("fs-extra");

const { join, dirname, basename, relative } = require("path");

const ejs_1 = __importDefault(require("ejs"));
const json5_1 = __importDefault(require("json5"));
async function generateOptions(e) {
  var e = e.packages["harmonyos-next"];

  e.orientation = e.orientation || {};
  e.deviceTypes = e.deviceTypes || {};

  var t = await Editor.Message.request(
    "program",
    "query-program-info",
    "OpenHarmonySDK"
  );

  var a = await Editor.Message.request(
    "program",
    "query-program-info",
    "OpenHarmonyNDK"
  );

  e.sdkPath = t ? t.path : "";
  e.ndkPath = a ? a.path : "";

  return {
    packageName: e.packageName || "",
    orientation: e.orientation,
    deviceTypes: e.deviceTypes,
    appABIs: e.appABIs || [],
    sdkPath: e.sdkPath || "",
    ndkPath: e.ndkPath || "",
    renderBackEnd: { gles3: e.renderBackEnd?.gles3 ?? true },
    useAotOptimization: e.useAotOptimization,
    jsEngine: e.jsEngine,
    useGamepad: e.useGamepad,
  };
}
async function onBeforeBuild(e, t, a) {
  e.sourceMaps = false;
}
async function onAfterInit(e, t, a) {
  var s = await generateOptions(e);
  const n = (e.packages["harmonyos-next"] = s).renderBackEnd;
  e.buildEngineParam.preserveType = s.useAotOptimization;
  t.staticsInfo.B100005 = s.packageName;
  t.staticsInfo.B100011 = s.orientation;
  const e_cocosParams = e.cocosParams;

  Object.keys(n).forEach((e) => {
    e_cocosParams.cMakeConfig["CC_USE_" + e.toUpperCase()] = n[e];
  });

  switch (s.jsEngine) {
    case "JSVM":
      e_cocosParams.cMakeConfig.USE_SE_V8 = "set(USE_SE_V8 OFF)";
      e_cocosParams.cMakeConfig.USE_SE_NAPI = "set(USE_SE_NAPI OFF)";
      e_cocosParams.cMakeConfig.USE_SE_JSVM = "set(USE_SE_JSVM ON)";
      break;
    case "V8":
      e_cocosParams.cMakeConfig.USE_SE_V8 = "set(USE_SE_V8 ON)";
      e_cocosParams.cMakeConfig.USE_SE_NAPI = "set(USE_SE_NAPI OFF)";
      e_cocosParams.cMakeConfig.USE_SE_JSVM = "set(USE_SE_JSVM OFF)";
      break;
    case "ARK":
      e_cocosParams.cMakeConfig.USE_SE_V8 = "set(USE_SE_V8 OFF)";
      e_cocosParams.cMakeConfig.USE_SE_NAPI = "set(USE_SE_NAPI ON)";
      e_cocosParams.cMakeConfig.USE_SE_JSVM = "set(USE_SE_JSVM OFF)";
      e_cocosParams.encrypted = false;
      break;
  }

  if (s.useGamepad) {
    e_cocosParams.cMakeConfig.USE_GAMEPAD = "set(USE_GAMEPAD ON)";
  } else {
    e_cocosParams.cMakeConfig.USE_GAMEPAD = "set(USE_GAMEPAD OFF)";
  }

  Object.assign(e_cocosParams.platformParams, s);
  await outputJSON(t.paths.compileConfig, e_cocosParams);
}
function onAfterBundleInit(e) {
  if (e.packages["harmonyos-next"].jsEngine === "ARK") {
    e.buildScriptParam.importMapFormat = "esm";
  }

  var t = e.packages["harmonyos-next"].renderBackEnd;
  e.assetSerializeOptions["cc.EffectAsset"].glsl3 = t.gles3 ?? true;
}
async function onAfterBuild(t, a, e) {
  var s = t.packages["harmonyos-next"].useAotOptimization;

  var n =
    (t.packages["harmonyos-next"].jsEngine === "ARK" &&
      ((i = "export default " + (i = readFileSync(a.paths.settings, "utf8"))),
      (i = await Build.Utils.transformCode(i, {
        importMapFormat: "systemjs",
      })),
      unlinkSync(a.paths.settings),
      (n = join(dirname(a.paths.settings), "settings.js")),
      outputFileSync(n, i, "utf8")),
    join(a.paths.dir, "assets"));

  const r = join(
    Editor.Project.path,
    "native/engine",
    t.platform,
    "entry/src/main"
  );
  var i = join(r, "ets/cocos/src/cocos-js/assets");

  var o = join(Editor.Project.path, "native/engine", t.platform, "entry");

  var p = join(o, "src/main/ets/cocos/src/effect.bin");
  var c = join(r, "resources/rawfile/Resources");
  const _ = join(c, "assets");
  var f = join(c, "cocos-js/assets");
  var h = join(c, "src/effect.bin");

  var n =
    (await emptyDir(_),
    await ensureDir(_),
    (await pathExists(n))
      ? await copy(n, _)
      : console.debug(
          `assets directory not found: ${n}, the bundles may be configured as remote bundles.`
        ),
    join(a.paths.dir, "src"));

  await emptyDir(join(r, "ets/cocos/src"));
  await emptyDir(join(r, "ets/cocos/assets"));
  await copy(n, join(r, "ets/cocos/src"));

  if (
    t.packages["harmonyos-next"].jsEngine === "V8" ||
    t.packages["harmonyos-next"].jsEngine === "JSVM"
  ) {
    var u = join(r, "ets/cocos");
    for (const x of ["jsb-adapter", "src"]) {
      var m = join(u, x);
      var d = join(c, x);
      await ensureDir(d);
      await emptyDir(d);
      await copy(m, d);
      await rm(m, { force: true, recursive: true });
    }

    var n = join(r, "ets/cocos", basename(a.paths.applicationJS));

    var n =
      (existsSync(n) && (await rm(n, { force: true, recursive: true })),
      await copy(
        a.paths.applicationJS,
        join(c, basename(a.paths.applicationJS))
      ),
      join(a.paths.dir, "main.js"));

    var l = join(c, "main.js");
    await copy(n, l);
  } else {
    await copy(
      a.paths.applicationJS,
      join(r, "ets/cocos", basename(a.paths.applicationJS))
    );

    this.bundleManager.bundles.forEach((e) => {
      if (!e.isRemote) {
        moveSync(
          join(_, e.name, basename(e.scriptDest)),
          join(r, "ets/cocos/assets", e.name, basename(e.scriptDest))
        );

        t.sourceMaps &&
          moveSync(
            join(_, e.name, "index.js.map"),
            join(r, "ets/cocos/assets", e.name, "index.js.map")
          );
      }
    });

    if (existsSync(i)) {
      await ensureDir(f);
      await emptyDir(f);
      await copy(i, f);
      await rm(i, { force: true, recursive: true });
    }

    if (existsSync(p)) {
      await copy(p, h);
    }
  }

  const E = [];
  this.bundleManager.bundles.forEach((e) => {
    if (!e.isRemote) {
      E.push(e.name + "/" + basename(e.scriptDest));
    }
  });
  var g = [];
  for (const S in a.paths.plugins) {
    var y = a.paths.plugins[S];
    var y = relative(a.paths.dir, y);
    g.push(y.split("\\").join("/"));
  }
  n = t.engineInfo;
  if (t.packages["harmonyos-next"].jsEngine === "ARK") {
    l = join(
      n.typescript.path,
      "templates/harmonyos-next/entry/src/main/ets/cocos/game.ts"
    );

    f = join(r, "ets/cocos/game.ts");
    let e = readdirSync(a.paths.engineDir);
    e = e.filter((e) => !statSync(join(a.paths.engineDir, e)).isDirectory());
    i = a.importMap.imports.cc.slice(2);

    p = {
      importMapUrl: basename(a.paths.importMap),
      applicationUrl: basename(a.paths.applicationJS),
      systemBundleUrl: basename(a.paths.systemJs),
      ccUrls: e,
      systemCCUrl: i,
      bundleJsList: E,
      pluginsJsList: g,
      chunkBundleUrl: "",
      useAotOptimization: s,
    };

    if (
      existsSync(join(a.paths.dir, "src/chunks")) &&
      (h = readdirSync(join(a.paths.dir, "src/chunks")).find(
        (e) => e.startsWith("bundle") && e.endsWith(".js")
      ))
    ) {
      p.chunkBundleUrl = h;
    }

    writeFileSync(f, await ejs_1.default.renderFile(l, p), "utf8");
  } else {
    i = join(r, "ets/cocos/game.ts");

    if (existsSync(i)) {
      await rm(i, { force: true, recursive: true });
    }
  }

  s = join(
    n.typescript.path,
    "templates/harmonyos-next/entry/src/main/ets/workers/cocos_worker.ets"
  );

  h = join(r, "ets/workers/cocos_worker.ets");

  f = {
    useV8:
      t.packages["harmonyos-next"].jsEngine === "V8" ||
      t.packages["harmonyos-next"].jsEngine === "JSVM",
  };

  writeFileSync(h, await ejs_1.default.renderFile(s, f), "utf8");

  l = join(o, "build-profile.json5");
  p = json5_1.default.parse(readFileSync(l, "utf8"));
  writeFileSync(l, json5_1.default.stringify(p, null, 2), "utf8");
}
async function openWithIDE(e) {
  var t = await Editor.Message.request(
    "program",
    "query-program-info",
    "devEcoStudio"
  );

  if (t && t.path) {
    Editor.Message.send(
      "builder",
      "execute-hook-task",
      "native",
      "open",
      e,
      dirname(t.path)
    );
  } else {
    Editor.Dialog.warn(Editor.I18n.t("harmonyos-next.customIcon.ideNotFound"), {
      title: Editor.I18n.t("harmonyos-next.customIcon.openFailed"),
    });
  }
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
    for (const s of e.split("\n")) {
      var a = s.indexOf("#");
      var a = (a < 0 ? s : s.substr(0, a)).trim();

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
exports.throwError = true;
