Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSeparateEngine = generateSeparateEngine;
exports.changePluginJSON = changePluginJSON;

const {
  outputJsonSync,
  statSync,
  readdirSync,
  copy,
  outputJSON,
} = require("fs-extra");

const { join } = require("path");

async function generateSeparateEngine(e) {
  var e = e ? join(e, "app") : join(__dirname, "../../../../");

  var a = join(e, "../resources/3d/engine");

  var n = require(join(
    e,
    "builtin/builder/dist/worker/builder/asset-handler/script/separate-engine"
  )).buildCocos;

  var n = await n({
    engine: a,
    platform: require("../package.json").name,
    platformType: "TAOBAO_MINIGAME",
    pluginFeatures: "default",
    pluginName: "cocos",
    nativeCodeBundleMode: "asmjs",
    signatureProvider: require("./../static/cocos/signature.json").pluginId,
  });

  let t = require(join(e, "package.json")).version;
  t = t.replaceAll(".", "");
  a = new Date();
  e = require(join(__dirname, "../package.json"));

  e.contributions.profile.editor["plugin-version"].default =
    `${a.getFullYear()}.${(a.getMonth() + 1).toString()}${a
      .getDate()
      .toString()
      .padStart(2, "0")}.` + t;

  outputJsonSync(join(__dirname + "../package.json"), e);

  await changePluginJSON(n, n.plugin);
  let i = 0;

  (function a(n) {
    var e = statSync(n);

    if (e.isDirectory()) {
      readdirSync(n).forEach((e) => {
        a(join(n, e));
      });
    } else {
      i += e.size;
    }
  })(n.plugin);

  console.log("淘宝引擎插件包体大小：" + (i / 1024 / 1024).toFixed(2) + " M");
  return n;
}
async function changePluginJSON(e, a) {
  await copy(
    join(__dirname, "../static/cocos/plugin.json"),
    join(a, "plugin.json")
  );
  var n = require("../static/cocos/signature.json");
  n.signature = require(e.signatureJSON).signature;
  await outputJSON(join(a, "signature.json"), n);
}
