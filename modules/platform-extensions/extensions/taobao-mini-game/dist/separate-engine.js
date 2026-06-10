Object.defineProperty(exports, "__esModule", { value: true });
exports.separateEnginPaths = undefined;
exports.outDir = undefined;
exports.buildCocos = buildCocos;
exports.getPluginFeatures = getPluginFeatures;
exports.generateCocos = generateCocos;
exports.querySignatureMd5 = querySignatureMd5;
exports.outputSignatureMd5WithPath = outputSignatureMd5WithPath;
exports.calcCodeMd5 = calcCodeMd5;

const {
  existsSync,
  readJSONSync,
  emptyDirSync,
  writeJSONSync,
  ensureDirSync,
  copyFileSync,
  outputJSONSync,
  readFileSync,
} = require("fs-extra");

const { join, dirname, basename } = require("path");

const { createHash } = require("crypto");

const ccbuild_1 = require("@cocos/ccbuild");

const { buildEngine } = ccbuild_1;

const engineRoot =
  Editor && Editor.App.path
    ? join(Editor.App.path, "../resources/3d/engine")
    : join(__dirname, "../../../../../../resources/3d/engine");

function excludeFeatures(e, t) {
  return e.filter((e) => !t.includes(e));
}
async function buildCocos(e = false) {
  var t = exports.separateEnginPaths.internalEngine;
  var n = exports.separateEnginPaths.outDir;
  const a = exports.separateEnginPaths.cacheCocos;
  if (!e || !existsSync(a)) {
    var e = await ccbuild_1.StatsQuery.create(t);

    var r = excludeFeatures(e.getFeatures(), [
      "gfx-webgpu",
      "vendor-google",
      "spine-4.2",
      "xr",
    ]);

    var r = {
      platform: "TAOBAO_MINIGAME",
      engine: t,
      out: a,
      moduleFormat: "system",
      compress: true,
      split: true,
      mode: "BUILD",
      nativeCodeBundleMode: "asmjs",
      flags: { SERVER_MODE: false, DEBUG: false },
      features: r,
      inlineEnum: false,
    };

    var i = join(n, "options.json");
    if (existsSync(i)) {
      var o = readJSONSync(i);
      if (require("lodash").isEqual(o, r)) {
        return a;
      }
    }
    emptyDirSync(n);
    const s = await buildEngine(r);
    const c = {};

    await Promise.all(
      Object.keys(s.exports).map(async (e) => {
        var t = calcCodeMd5(join(a, s.exports[e]));
        c[s.exports[e]] = t;
      })
    );

    await writeJSONSync(join(n, "meta.json"), Object.assign(s, { md5Map: c }), {
      spaces: 2,
    });

    await writeJSONSync(i, r, { spaces: 2 });
    o = getPluginFeatures(t);
    i = join(n, "plugin");
    r = e.getUnitsOfFeatures(o);
    await generateCocos(
      ccbuild_1.buildEngine.enumerateDependentChunks(s, r),
      i
    );
  }
  return a;
}
function getPluginFeatures(e = exports.separateEnginPaths.internalEngine) {
  e = join(e, "editor", "engine-features", "render-config.json");
  if (!existsSync(e)) {
    throw new Error("render-config.json is not exist in engine!");
  }
  const n = readJSONSync(e).features;
  const a = [];
  function r(e, t) {
    if (e.enginePlugin) {
      a.push(t);
    }
  }

  Object.keys(n).forEach((e) => {
    const t = n[e];

    if ("options" in t) {
      Object.keys(t.options).forEach((e) => r(t.options[e], e));
    } else {
      r(t, e);
    }
  });

  return a;
}
async function generateCocos(e, r) {
  if (!e.length) {
    return [];
  }

  const i = readJSONSync(join(__dirname, "../static/cocos", "signature.json"));

  const o = readJSONSync(join(exports.separateEnginPaths.outDir, "meta.json"));

  ensureDirSync(r);

  await Promise.all(
    e.map(async (e, t) => {
      var n = join(exports.separateEnginPaths.cacheCocos, e);
      var a = join(r, e);

      if (o.md5Map[e]) {
        i.signature.push({ md5: o.md5Map[e], path: e });
      } else {
        await outputSignatureMd5WithPath(i, n);
      }

      ensureDirSync(dirname(a));
      copyFileSync(n, a);
    })
  );

  outputJSONSync(join(r, "signature.json"), i);

  copyFileSync(
    join(__dirname, "./../static/cocos/plugin.json"),
    join(r, "plugin.json")
  );

  return e;
}
function querySignatureMd5() {}
async function outputSignatureMd5WithPath(e, t) {
  var n = calcCodeMd5(t);
  e.signature.push({ md5: n, path: basename(t) });
  return n;
}
function calcCodeMd5(e) {
  return createHash("md5").update(readFileSync(e)).digest("hex");
}

exports.outDir = join(engineRoot, "bin/.cache/editor-cache/taobao-mini-game");

exports.separateEnginPaths = {
  internalEngine: engineRoot,
  outDir: exports.outDir,
  plugin: join(exports.outDir, "plugin"),
  cacheCocos: join(exports.outDir, "cocos"),
};
