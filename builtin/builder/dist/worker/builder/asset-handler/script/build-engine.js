Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSeparateEngine = undefined;
exports.buildEngineCommand = buildEngineCommand;
const ccbuild_1 = require("@cocos/ccbuild");

const { buildEngine } = ccbuild_1;

const { dirname, join } = require("path");

const { remove, ensureDir, writeFile, writeJSON } = require("fs-extra");

const defaultOptions = {
  engine: "",
  out: "",
  platform: "INVALID_PLATFORM",
  moduleFormat: "system",
  compress: true,
  split: false,
  nativeCodeBundleMode: "both",
  assetURLFormat: "runtime-resolved",
  noDeprecatedFeatures: false,
  sourceMap: false,
  features: [],
  loose: false,
  mode: "BUILD",
  flags: { DEBUG: false },
  metaFile: "",
  mangleProperties: false,
  inlineEnum: true,
};

async function buildEngineCommand(e) {
  var t;
  var a = Object.assign({}, defaultOptions, e || {});
  var { features, out } = a;

  var out =
    (await remove(out),
    await ensureDir(dirname(out)),
    console.debug("start build engine with options: " + JSON.stringify(a)),
    await buildEngine(a));

  var features =
    (a.split &&
      ((t = await ccbuild_1.StatsQuery.create(a.engine)),
      (t = await ccbuild_1.buildEngine.transform(
        t.evaluateIndexModuleSource(t.getUnitsOfFeatures(features)),
        "system"
      )),
      (features = join(e.out, "cc.js")),
      await ensureDir(dirname(features)),
      await writeFile(features, t.code, "utf8"),
      (out.exports.cc = "cc.js")),
    out);

  if (e.mangleConfigJsonMtime !== 0) {
    features.mangleConfigJsonMtime = e.mangleConfigJsonMtime;
  }

  await ensureDir(dirname(a.metaFile));
  await writeJSON(a.metaFile, features, { spaces: 2 });
}
var separate_engine_1 = require("./separate-engine");
Object.defineProperty(exports, "buildSeparateEngine", {
  enumerable: true,
  get() {
    return separate_engine_1.buildSeparateEngine;
  },
});
