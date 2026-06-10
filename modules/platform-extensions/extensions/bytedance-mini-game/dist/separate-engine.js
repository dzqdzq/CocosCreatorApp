Object.defineProperty(exports, "__esModule", { value: true });
exports.separateEnginPaths = undefined;
exports.outDir = undefined;
exports.buildCocos = buildCocos;
exports.getByteDancePluginFeatures = getByteDancePluginFeatures;
exports.generateCocos = generateCocos;
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

const engineRoot = join(__dirname, "../../../../../../resources/3d/engine");

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
      platform: "BYTEDANCE",
      engine: t,
      out: a,
      moduleFormat: "system",
      compress: true,
      split: true,
      mode: "BUILD",
      nativeCodeBundleMode: "wasm",
      flags: { SERVER_MODE: false, DEBUG: false },
      features: r,
      inlineEnum: false,
    };

    var s = join(n, "options.json");
    if (existsSync(s)) {
      var i = readJSONSync(s);
      if (require("lodash").isEqual(i, r)) {
        return a;
      }
    }
    emptyDirSync(n);
    const o = await buildEngine(r);
    const c = {};

    await Promise.all(
      Object.keys(o.exports).map(async (e) => {
        var t = calcCodeMd5(join(a, o.exports[e]));
        c[o.exports[e]] = t;
      })
    );

    await writeJSONSync(join(n, "meta.json"), Object.assign(o, { md5Map: c }), {
      spaces: 2,
    });

    await writeJSONSync(s, r, { spaces: 2 });
    i = getByteDancePluginFeatures(t);
    s = join(n, "plugin");
    r = e.getUnitsOfFeatures(i);
    await generateCocos(
      ccbuild_1.buildEngine.enumerateDependentChunks(o, r),
      s
    );
  }
  return a;
}
function getByteDancePluginFeatures(
  e = exports.separateEnginPaths.internalEngine
) {
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

  const s = readJSONSync(join(__dirname, "../static/cocos", "signature.json"));

  const i = readJSONSync(join(exports.separateEnginPaths.outDir, "meta.json"));

  ensureDirSync(r);

  await Promise.all(
    e.map(async (e, t) => {
      var n = join(exports.separateEnginPaths.cacheCocos, e);
      var a = join(r, e);

      if (i.md5Map[e]) {
        s.signature.push({ md5: i.md5Map[e], path: e });
      } else {
        await outputSignatureMd5WithPath(s, n);
      }

      ensureDirSync(dirname(a));
      copyFileSync(n, a);
    })
  );

  outputJSONSync(join(r, "signature.json"), s);

  copyFileSync(
    join(__dirname, "./../static/cocos/plugin.json"),
    join(r, "plugin.json")
  );

  return e;
}
async function outputSignatureMd5WithPath(e, t) {
  var n = calcCodeMd5(t);
  e.signature.push({ md5: n, path: basename(t) });
  return n;
}
function calcCodeMd5(e) {
  return createHash("md5").update(readFileSync(e)).digest("hex");
}

exports.outDir = join(
  engineRoot,
  "bin/.cache/editor-cache/bytedance-mini-game"
);

exports.separateEnginPaths = {
  internalEngine: engineRoot,
  outDir: exports.outDir,
  plugin: join(exports.outDir, "plugin"),
  cacheCocos: join(exports.outDir, "cocos"),
};
