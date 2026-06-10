Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCocos = buildCocos;
exports.outputSignatureMd5WithPath = outputSignatureMd5WithPath;
exports.outputSignatureMd5WithCode = outputSignatureMd5WithCode;

const {
  existsSync,
  readJSONSync,
  emptyDirSync,
  writeJSONSync,
  outputJSONSync,
  readFileSync,
} = require("fs-extra");

const { join } = require("path");

const { createHash } = require("crypto");

const ccbuild_1 = require("@cocos/ccbuild");

const { buildEngine } = ccbuild_1;

function excludeFeatures(t, e) {
  return t.filter((t) => !e.includes(t));
}
async function buildCocos(t) {
  var e = join(t, "bin/.cache/editor-cache/oppo-mini-game");
  const a = join(e, "cocos");

  var r = excludeFeatures(
    (await ccbuild_1.StatsQuery.create(t)).getFeatures(),
    ["gfx-webgpu", "vendor-google", "spine-4.2", "xr"]
  );

  var t = {
    platform: "OPPO",
    engine: t,
    out: a,
    moduleFormat: "system",
    compress: true,
    split: true,
    nativeCodeBundleMode: "asmjs",
    mode: "BUILD",
    flags: { DEBUG: false, SERVER_MODE: false },
    features: r,
    inlineEnum: false,
  };

  var r = join(e, "options.json");
  if (existsSync(r)) {
    var i = readJSONSync(r);
    if (require("lodash").isEqual(i, t)) {
      return e;
    }
  }
  emptyDirSync(e);
  const o = await buildEngine(t);
  const u = {};

  await Promise.all(
    Object.keys(o.exports).map(async (t) => {
      var e = await outputSignatureMd5WithPath(join(a, o.exports[t]));
      u[o.exports[t]] = e;
    })
  );

  await writeJSONSync(join(e, "meta.json"), Object.assign(o, { md5Map: u }), {
    spaces: 2,
  });

  outputJSONSync(r, t, { spaces: 4 });
  return e;
}
async function outputSignatureMd5WithPath(t) {
  return outputSignatureMd5WithCode(readFileSync(t));
}
async function outputSignatureMd5WithCode(t) {
  return createHash("md5").update(t).digest("hex");
}
