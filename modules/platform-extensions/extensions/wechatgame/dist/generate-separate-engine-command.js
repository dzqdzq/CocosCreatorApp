Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSeparateEngine = generateSeparateEngine;

const { statSync, readdirSync } = require("fs");

const { join } = require("path");

async function generateSeparateEngine(e) {
  var e = e ? join(e, "app") : join(__dirname, "../../../../../");

  var r = join(e, "../resources/3d/engine");

  var e = require(join(
    e,
    "builtin/builder/dist/worker/builder/asset-handler/script/separate-engine"
  )).buildCocos;

  var e = await e({
    engine: r,
    platform: require("../package.json").name,
    platformType: "WECHAT",
    pluginFeatures: "default",
    pluginName: "cocos",
    useCacheForce: false,
    signatureProvider: require("../static/cocos/signature.json").provider,
  });

  let n = 0;

  (function r(a) {
    var e = statSync(a);

    if (e.isDirectory()) {
      readdirSync(a).forEach((e) => {
        r(join(a, e));
      });
    } else {
      n += e.size;
    }
  })(e.plugin);

  if (n > 4194304) {
    console.error("微信引擎插件包体大小超出限制 4 MB，请检查代码是否过大");
  } else {
    console.log("微信引擎插件包体大小：" + (n / 1024 / 1024).toFixed(2) + " M");
  }

  return e;
}
