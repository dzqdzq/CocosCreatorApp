Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSeparateEngine = generateSeparateEngine;

const { stat, createWriteStream } = require("fs-extra");

const { join, basename } = require("path");

async function generateSeparateEngine(e, r = false) {
  var e = e ? join(e, "app") : join(__dirname, "../../../../../");

  var i = join(e, "../resources/3d/engine");

  var e = require(join(
    e,
    "builtin/builder/dist/worker/builder/asset-handler/script/separate-engine"
  )).buildCocos;

  var e = await zipDirectory(
    (
      await e({
        engine: i,
        platform: require("../package.json").name,
        platformType: "BYTEDANCE",
        pluginFeatures: "default",
        pluginName: "cocos",
        nativeCodeBundleMode: "asmjs",
        signatureProvider: require("./../static/cocos/signature.json").provider,
      })
    ).plugin
  );

  var i = await stat(e);

  if (i.size > 6291456) {
    console.error("引擎插件包体大小超出限制 6 MB，请检查代码是否过大");
  } else {
    console.log("引擎插件包体大小：" + i.size / 1024 / 1024 + " M");
  }

  if (r) {
    console.log("开始上传引擎插件包");
    i = require(join(__dirname, "../static/upload-plugin")).uploadZipFile;

    await i(
      e,
      require("../static/cocos/signature.json").provider,
      require("../../../../../package.json").version,
      "https://developer.toutiao.com/api/developer/ide/microgame/v1/upload_game_plugin"
    );
  }
}
async function zipDirectory(i) {
  const a = join(i, "../", basename(i) + ".zip");
  const o = createWriteStream(a);
  const t = require("archiver")("zip", { zlib: { level: 9 } });
  return new Promise((e, r) => {
    o.on("close", () => {
      console.log(`抖音引擎分离包压缩完成: ${a}（总字节: ${t.pointer()}）`);
      e(a);
    });

    t.on("error", (e) => r(e));

    t.pipe(o);
    t.directory(i + "/", false);
    t.finalize();
  });
}
