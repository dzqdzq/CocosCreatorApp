var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwError = undefined;
exports.onAfterInit = onAfterInit;
exports.onBeforeBundleInit = onBeforeBundleInit;
exports.onAfterBundleBuildTask = onAfterBundleBuildTask;
exports.onBeforeCompressSettings = onBeforeCompressSettings;
exports.onBeforeCopyBuildTemplate = onBeforeCopyBuildTemplate;
exports.onAfterCopyBuildTemplate = onAfterCopyBuildTemplate;
exports.run = run;

const {
  readFileSync,
  copy,
  writeFileSync,
  outputFileSync,
  readJSONSync,
  outputJSONSync,
  ensureDirSync,
  moveSync,
  existsSync,
  renameSync,
  statSync,
  copyFileSync,
} = require("fs-extra");

const { join, relative, basename, dirname } = require("path");

const ejs_1 = __importDefault(require("ejs"));

const { spawn } = require("child_process");

const share_1 = require("./share");
const fast_glob_1 = __importDefault(require("fast-glob"));
const path = require("path");
const iconv = require("iconv-lite");
async function onAfterInit(e, a, t) {
  var s;
  var r = e.packages.wechatprogram;

  if (e.server && !e.server.endsWith("/")) {
    e.server += "/";
  }

  Object.assign(e.buildEngineParam, {
    platform: "WECHAT_MINI_PROGRAM",
    sourceMaps: e.sourceMaps,
    split: true,
    skip: false,
  });

  e.buildEngineParam.assetURLFormat = "relative-from-out";

  if (
    e.useSplashScreen &&
    (s = await Editor.Profile.getProject(
      "builder",
      "splash-setting.logo.image"
    )) &&
    !(await validRatio(Editor.UI.__protected__.File.resolveToRaw(s)))
  ) {
    console.error("The splash screen image is too large for wechatprogram!");
  }

  a.staticsInfo.B100011 = r.orientation;
  a.staticsInfo.B100013 = r.appid;

  share_1.Paths.internalTemplateDir = join(
    e.engineInfo.typescript.path,
    "templates/wechatprogram"
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
function validRatio(s) {
  return new Promise((e, a) => {
    const t = new Image();

    t.src = "data:image/png;base64," + readFileSync(s).toString("base64");

    t.onload = () => {
      if (t.width > 2048 || t.height > 2048) {
        e(false);
      }

      e(true);
    };

    t.onerror = (e) => {
      a(e);
    };
  });
}
async function onAfterBundleBuildTask(e, a, t) {
  await sortSubPackage(a);
}
async function onBeforeCompressSettings(e, a, t) {
  if (a.paths.dir) {
    a.settings.scripting.scriptPackages = a.scriptPackages.map(
      (e) => "project://" + relative(a.paths.dir, e).replace(/\\/g, "/")
    );
  }
}
async function onBeforeCopyBuildTemplate(e, a, t, s) {
  var r = e.engineInfo.typescript.path;
  for (const i of ["web-adapter", "engine-adapter"]) {
    await copy(
      join(r, "bin/adapter/minigame/wechat", `${i}.${e.debug ? "" : "min."}js`),
      join(a.paths.dir, i + ".js")
    );
  }
  await _buildWeChatTemplate.call(this, e, a);
  await postHandleScript(e, a, t);
}
async function onAfterCopyBuildTemplate(e, a) {
  await buildGameJson(
    a.paths.dir,
    e,
    this.bundleManager.bundles,
    this.buildTemplate.findFile("game.json")
  );

  buildProjectConfig(
    a.paths.dir,
    e,
    this.buildTemplate.findFile("project.config.json")
  );
}
async function postHandleScript(a, s, e) {
  const r = a.debug ? "\n" : "";
  let i =
    "var GameGlobal = getApp().GameGlobal, window = global = globalThis = getApp().GameGlobal, WebAssembly = WXWebAssembly;" +
    r;

  [
    "__globalAdapter",
    "cc",
    "System",
    "document",
    "HTMLElement",
    "HTMLImageElement",
    "HTMLCanvasElement",
    "performance",
    "Image",
    "ImageBitmap",
    "fsUtils",
    "XMLHttpRequest",
    "WebSocket",
  ].forEach((e) => {
    i += `var ${e} = GameGlobal.${e};` + r;
  });

  i =
    (i =
      (i +=
        "var DOMParser = globalThis.DOMParser = GameGlobal.DOMParser;" + r) +
      "var requestAnimationFrame = GameGlobal.canvas.requestAnimationFrame;" +
      r) +
    "var cancelAnimationFrame = GameGlobal.canvas.cancelAnimationFrame;" +
    r;

  a = a.packages.wechatprogram.globalVariable;

  if (a) {
    a.split(",")
      .map((e) => e.trim())
      .forEach((e) => {
        i += `var ${e} = globalThis.${e};` + r;
      });
  }

  const t = s.paths.dir;
  (
    await (0, fast_glob_1.default)(
      [
        "engine-adapter.js",
        "web-adapter.js",
        "assets/**/index.js",
        "src/assets/**/*.js",
        "src/chunks/*.js",
        "src/bundle-scripts/**/index.js",
        "!src/chunks/bundle.js",
      ],
      { cwd: t }
    )
  )
    .map((e) => path.resolve(t, e))
    .forEach((e) => {
      var a = readFileSync(e, "utf8");
      var a = i + a;
      writeFileSync(e, a, "utf8");
    });
  var a = "const global = getApp().GameGlobal;" + r;
  var n = join(s.paths.dir, "src/system.bundle.js");
  var a = a + readFileSync(n, "utf8");
  writeFileSync(n, a, "utf8");
  n = (await (0, fast_glob_1.default)(["cocos-js/*.js"], { cwd: t })).map((e) =>
    path.resolve(t, e)
  );
  const o = /System\.register\((\[.*?\].*?\{)/g;
  n.forEach((e) => {
    var a = relative(s.paths.dir, e).replace(/\\/g, "/");
    let t = readFileSync(e, "utf8");

    if (o.test(t)) {
      console.log("register:" + a);

      t = t.replace(
        o,
        `getApp().GameGlobal.System.register('no-schema:/${a}', $1` + r + i
      );

      writeFileSync(e, t, "utf8");
    }
  });
  let p = "";
  n.forEach((e) => {
    e = relative(s.paths.dir, e).replace(/\\/g, "/");
    p += `    .then(()=>require.async('subpackages/cocos-js/${basename(
      e,
      ".js"
    )}/index.js'))
`;
  });
  (await (0, fast_glob_1.default)(["src/chunks/*.js"], { cwd: t }))
    .map((e) => path.resolve(t, e))
    .forEach((e) => {
      e = relative(s.paths.dir, e).replace(/\\/g, "/");
      p += `    .then(()=>require.async('./${e}'))
`;
    });

  p =
    `${""}export function loadModules() {
    return Promise.resolve()
` + p + "}";

  outputFileSync(join(s.paths.dir, "load-module.js"), p, { encoding: "utf8" });

  const l = readJSONSync(join(s.paths.dir, "app.json"));
  n.forEach((e) => {
    e = relative(s.paths.dir, e).replace(/\\/g, "/");
    l.subPackages.push({
      root: "subpackages/cocos-js/" + basename(e, ".js"),
      pages: ["index"],
    });
  });
  a = join(s.paths.dir, "app.json");
  outputJSONSync(a, l, { spaces: 4 });

  n.forEach((e) => {
    var a = relative(s.paths.dir, e).replace(/\\/g, "/");
    var t = a.substring(0, a.indexOf("."));

    var t =
      (ensureDirSync(join(s.paths.dir, "subpackages/" + t)),
      join(s.paths.dir, `subpackages/${t}/index.js`));

    moveSync(e, t, { overwrite: true });
    e =
      `console.log('加载 ${a} 分包');
` + readFileSync(t, "utf8");
    writeFileSync(t, e, "utf8");
  });

  a = join(s.paths.dir, "application.js");
  if (existsSync(a)) {
    let e = readFileSync(a, "utf8");

    if (o.test(e)) {
      e = e.replace(
        o,
        'getApp().GameGlobal.System.register("no-schema:/application.js", $1' +
          r +
          i
      );
    }

    writeFileSync(a, e, "utf8");
  }
  n = join(s.paths.dir, "src/chunks/bundle.js");
  if (existsSync(n)) {
    let e = readFileSync(n, "utf8");

    if (o.test(e)) {
      e = e.replace(
        o,
        'getApp().GameGlobal.System.register("project://src/chunks/bundle.js", $1' +
          r +
          i
      );
    }

    writeFileSync(n, e, "utf8");
  }
}
function sortSubPackage(e) {
  for (const t of e) {
    var a;

    if (t.isSubpackage) {
      a = join(dirname(t.scriptDest), "game.js");

      existsSync(t.scriptDest)
        ? renameSync(t.scriptDest, a)
        : outputFileSync(
            a,
            `console.log('${name}: no script in subPackage.')`,
            "utf8"
          );

      t.scriptDest = a;
    }
  }
}
async function _buildWeChatTemplate(e, t) {
  var a;
  var s;
  var r;

  if (!this.buildTemplate.findFile("game.js")) {
    a =
      this.buildTemplate.initUrl("game.ejs") ||
      join(share_1.Paths.internalTemplateDir, "game.ejs");

    s = t.settings.engine.macros?.ENABLE_TRANSPARENT_CANVAS;
    r = t.settings.engine.macros?.ENABLE_WEBGL_ANTIALIAS;

    s = {
      engineName: e.buildEngineParam.engineName,
      cocosTemplate: join(
        share_1.Paths.internalTemplateDir,
        "cocos-script.ejs"
      ),
      polyfillsBundleFile:
        (t.paths.polyfillsJs &&
          Build.Utils.relativeUrl(t.paths.dir, t.paths.polyfillsJs)) ||
        false,
      systemJsBundleFile: Build.Utils.relativeUrl(
        t.paths.dir,
        t.paths.systemJs
      ),
      importMapFile: Build.Utils.relativeUrl(t.paths.dir, t.paths.importMap),
      applicationJs:
        "./" + Build.Utils.relativeUrl(t.paths.dir, t.paths.applicationJS),
      engineDir: Build.Utils.relativeUrl(t.paths.dir, t.paths.engineDir),
      alpha: s === undefined ? "default" : s,
      antialias: r === undefined ? "default" : r,
      useWebgl2: e.buildEngineParam.includeModules.includes("gfx-webgl2"),
    };

    r = await ejs_1.default.renderFile(a, s);
    writeFileSync(join(t.paths.dir, "game.js"), r, "utf8");
    e.md5CacheOptions.replaceOnly.push("game.js");
  }

  (
    await (0, fast_glob_1.default)(["*", "!splash.png", "!first-screen.js"], {
      cwd: share_1.Paths.internalTemplateDir,
    })
  )
    .map((e) => path.resolve(share_1.Paths.internalTemplateDir, e))
    .forEach((e) => {
      var a;

      if (statSync(e).isFile()) {
        a = relative(share_1.Paths.internalTemplateDir, e);
        e = readFileSync(e, "utf8");

        outputFileSync(join(t.paths.dir, a), e, {
          encoding: "utf8",
        });
      }
    });

  if (!this.buildTemplate.findFile("splash.png")) {
    copyFileSync(
      join(share_1.Paths.internalTemplateDir, "splash.png"),
      join(t.paths.dir, "splash.png")
    );
  }

  if (this.buildTemplate.findFile("first-screen.js")) {
    copyFileSync(
      join(share_1.Paths.internalTemplateDir, "first-screen.js"),
      join(t.paths.dir, "first-screen.js")
    );
  }

  copyFileSync(join(t.paths.dir, "game.js"), join(t.paths.dir, "index.js"));

  e.md5CacheOptions.replaceOnly.push("index.js");
}
function buildProjectConfig(e, a, t) {
  var s = a.packages.wechatprogram;

  var r = readJSONSync(
    join(share_1.Paths.internalTemplateDir, "project.config.json")
  );

  var t =
    (t && ((t = readJSONSync(t)), Object.assign(r, t)),
    (r.appid = s.appid || "wx2c815291f1aa4d1c"),
    (r.projectname = a.name),
    a.server &&
      a.useBuiltinServer &&
      (r.packOptions = { ignore: [{ type: "folder", value: "remote" }] }),
    join(e, "project.config.json"));

  a.md5CacheOptions.excludes.push("project.config.json");
  outputJSONSync(t, r);
}
async function buildGameJson(e, a, t, s) {
  var a = a.packages.wechatprogram;

  var r = readJSONSync(join(share_1.Paths.internalTemplateDir, "game.json"));

  if (s) {
    s = readJSONSync(s);
    Object.assign(r, s);
  }

  r.deviceOrientation = a.orientation;
  var i = [];

  for (const n of t) {
    if (n.isSubpackage) {
      i.push({ name: n.name, root: `subpackages/${n.name}/` });
    }
  }

  if (i.length > 0) {
    r.subpackages = i;
  }

  s = join(e, "game.json");
  outputJSONSync(s, r, { spaces: 4 });

  t = readJSONSync(join(share_1.Paths.internalTemplateDir, "app.json"));

  t.window.pageOrientation = a.orientation;
  s = join(e, "app.json");
  outputJSONSync(s, t, { spaces: 4 });
}
async function run(e, a) {
  var t = e.match(
    /([`~!#$%^&*+=<>?"{}|,;'·~！#￥%……&*（）+={}|《》？：“”【】、；‘'，。、])/im
  );

  var t =
    (t &&
      console.warn(
        Editor.I18n.t("wechatprogram.tips.build_path_contains_symbol", {
          symbol: t[1],
        })
      ),
    await Editor.Message.request(
      "program",
      "query-program-info",
      "wechatDevtools"
    ));

  let s = t ? t.path : "";
  if (!s || !existsSync(s)) {
    console.warn(
      "" +
        Editor.I18n.t("wechatprogram.tips.wechatprogram_app_path_empty", {
          wechatprogramPath: s,
        })
    );

    if (
      (
        await Editor.Dialog.warn(
          Editor.I18n.t("wechatprogram.tips.wechatprogram_app_path_empty"),
          { buttons: ["Cancel", "Set Wechat DevTools"] }
        )
      ).response === 1
    ) {
      Editor.Message.send("preferences", "open-settings", "program");
    }

    return false;
  }

  if (!statSync(s).isDirectory() && process.platform === "win32") {
    s = dirname(s);
  }

  let r;

  if (process.platform === "darwin") {
    r = join(s, "Contents/Resources/app.nw/bin/cli");

    existsSync(r) || (r = join(s, "Contents/MacOS/cli"));
  } else {
    r = join(s, "cli.bat");
  }

  if (!existsSync(r)) {
    await Editor.Dialog.error(
      Editor.I18n.t("wechatprogram.options.client_path_error")
    );

    return false;
  }

  t = ["-o", e, "-f", "cocos"];
  console.log("Run command : " + t.join(" "));
  e = spawn(r, t);

  if (e && e.stdout) {
    e.stdout.on("data", (e) => {
      console.log("[WeChat Dev Tool] " + iconv.decode(e, "utf8").toString());
    });
  }

  if (e && e.stderr) {
    e.stderr.on("data", (e) => {
      console.error("[WeChat Dev Tool]" + iconv.decode(e, "utf8").toString());
    });
  }
}
exports.throwError = true;
