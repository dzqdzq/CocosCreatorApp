Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCocos = buildCocos;

const { join } = require("path");

const {
  existsSync,
  readJSONSync,
  emptyDirSync,
  removeSync,
  writeJSONSync,
  outputJSONSync,
  readFileSync,
} = require("fs-extra");

const { createHash } = require("crypto");

const ccbuild_1 = require("@cocos/ccbuild");

const { buildEngine } = ccbuild_1;

function excludeFeatures(e, t) {
  return e.filter((e) => !t.includes(e));
}
async function buildCocos() {
  var e = join(Editor.App.path, "../resources/3d/engine");
  var t = join(e, "bin/.cache/editor-cache/huawei-quick-game");
  const r = join(t, "cocos");

  var a = excludeFeatures(
    (await ccbuild_1.StatsQuery.create(e)).getFeatures(),
    ["gfx-webgpu", "vendor-google", "spine-4.2", "xr"]
  );

  var e = {
    platform: "HUAWEI",
    engine: e,
    out: r,
    moduleFormat: "system",
    mode: "BUILD",
    compress: true,
    split: true,
    nativeCodeBundleMode: "asmjs",
    flags: { DEBUG: false, SERVER_MODE: false },
    features: a,
    inlineEnum: false,
  };

  var a = join(t, "options.json");
  var s = join(t, "meta.json");
  if (existsSync(a)) {
    var i = readJSONSync(a);
    if (require("lodash").isEqual(i, e)) {
      return t;
    }
  }
  emptyDirSync(r);
  removeSync(s);
  removeSync(a);
  const o = await buildEngine(e);
  const n = {};

  await Promise.all(
    Object.keys(o.exports).map(async (e) => {
      var t = await outputSignatureMd5WithPath(join(r, o.exports[e]));
      n[o.exports[e]] = t;
    })
  );

  writeJSONSync(s, Object.assign(o, { md5Map: n }), {
    spaces: 2,
  });

  outputJSONSync(a, e, { spaces: 4 });
  return t;
}
async function outputSignatureMd5WithPath(e) {
  return outputSignatureMd5WithCode(readFileSync(e));
}
async function outputSignatureMd5WithCode(e) {
  return createHash("md5").update(e).digest("hex");
}
