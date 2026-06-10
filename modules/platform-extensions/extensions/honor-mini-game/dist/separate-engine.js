Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCocos = buildCocos;
exports.outputSignatureMd5WithPath = outputSignatureMd5WithPath;
exports.outputSignatureMd5WithCode = outputSignatureMd5WithCode;
const ccbuild_1 = require("@cocos/ccbuild");

const { buildEngine } = ccbuild_1;

const { join } = require("path");

const {
  existsSync,
  readJSONSync,
  emptyDirSync,
  writeJSONSync,
  outputJSONSync,
  readFileSync,
} = require("fs-extra");

const { createHash } = require("crypto");

function excludeFeatures(e, t) {
  return e.filter((e) => !t.includes(e));
}
async function buildCocos(e) {
  var e =
    e ||
    (Editor
      ? join(Editor.App.path, "../resources/3d/engine")
      : join(__dirname, "../../../../../../../../resources/3d/engine"));

  var t = join(e, "bin/.cache/editor-cache/honor-mini-game");
  const r = join(t, "cocos");

  var a = excludeFeatures(
    (await ccbuild_1.StatsQuery.create(e)).getFeatures(),
    ["gfx-webgpu", "vendor-google", "spine-4.2", "xr"]
  );

  var e = {
    platform: "HONOR",
    engine: e,
    out: r,
    moduleFormat: "system",
    compress: true,
    split: true,
    mode: "BUILD",
    nativeCodeBundleMode: "asmjs",
    flags: { DEBUG: false, SERVER_MODE: false },
    features: a,
    inlineEnum: false,
  };

  var a = join(t, "options.json");
  if (existsSync(a)) {
    var i = readJSONSync(a);
    if (require("lodash").isEqual(i, e)) {
      return t;
    }
  }
  emptyDirSync(t);
  const o = await buildEngine(e);
  const u = {};

  await Promise.all(
    Object.keys(o.exports).map(async (e) => {
      var t = await outputSignatureMd5WithPath(join(r, o.exports[e]));
      u[o.exports[e]] = t;
    })
  );

  await writeJSONSync(join(t, "meta.json"), Object.assign(o, { md5Map: u }), {
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
