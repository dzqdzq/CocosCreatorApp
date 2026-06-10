Object.defineProperty(exports, "__esModule", { value: true });
exports.InstantiationAssetHandler = undefined;
exports.zip = zip;

const {
  createWriteStream,
  createReadStream,
  readdirSync,
  existsSync,
  removeSync,
} = require("fs-extra");

const { parse, join } = require("path");

function zip(e, t) {
  var r = require("archiver");
  var e = createWriteStream(e);
  const a = r("zip");

  a.on("error", (e) => {
    throw e;
  });

  a.pipe(e);

  t.forEach((e) => {
    var t = parse(e);
    a.append(createReadStream(e), { name: t.ext.substr(1) });
  });

  a.finalize();
}

exports.InstantiationAssetHandler = {
  name: "instantiation-asset",
  assetType: "cc.Asset",
  importer: {
    version: "1.0.0",
    async import(t) {
      var r = join(t._assetDB.options.temp, t.uuid);

      var e =
        process.platform === "darwin"
          ? "unzip"
          : join(Editor.App.path, "../tools/unzip.exe");

      await Editor.Utils.Process.quickSpawn(e, [t.source, "-d", r]);
      var a = readdirSync(r);

      for (let e = 0; e < a.length; e++) {
        var s = a[e];
        var i = join(r, s);
        await t.copyToLibrary("." + s, i);
      }

      if (existsSync(r)) {
        removeSync(r);
      }

      return true;
    },
  },
};

exports.default = exports.InstantiationAssetHandler;
