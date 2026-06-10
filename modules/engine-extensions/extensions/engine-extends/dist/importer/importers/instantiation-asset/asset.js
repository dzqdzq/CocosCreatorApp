Object.defineProperty(exports, "__esModule", { value: true });
exports.zip = undefined;
const asset_db_1 = require("@editor/asset-db");
const child_process_1 = require("child_process");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
class AssetImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.0";
  }
  get name() {
    return "instantiation-asset";
  }
  get assetType() {
    return "cc.Asset";
  }
  async import(s) {
    const a = path_1.join(s._assetDB.options.temp, s.uuid);
    let e;
    e = process.platform === "win32" ? unzipOfWin32 : unzipOfDarwin;

    if (fs_extra_1.existsSync(a)) {
      fs_extra_1.removeSync(a);
    }

    await new Promise((r, t) => {
      e(s.source, a, (e) => {
        if (e) {
          return t(e);
        }
        r();
      });
    });

    var r = fs_extra_1.readdirSync(a);
    for (let e = 0; e < r.length; e++) {
      var t = r[e];
      var n = path_1.join(a, t);
      await s.copyToLibrary("." + t, n);
    }

    if (fs_extra_1.existsSync(a)) {
      fs_extra_1.removeSync(a);
    }

    return true;
  }
}
function zip(e, r) {
  var t = require("archiver");
  var e = fs_extra_1.createWriteStream(e);
  const s = t("zip");

  s.on("error", (e) => {
    throw e;
  });

  s.pipe(e);

  r.forEach((e) => {
    var r = path_1.parse(e);
    s.append(fs_extra_1.createReadStream(e), { name: r.ext.substr(1) });
  });

  s.finalize();
}
exports.default = AssetImporter;
exports.zip = zip;

const unzipOfDarwin = (e, r, t) => {
  var s = path_1.dirname(r);

  var s =
    (fs_extra_1.ensureDirSync(s), child_process_1.spawn("unzip", [e, "-d", r]));

  let a = "";

  s.stderr.on("data", (e) => {
    a += e;
  });

  let n = "";

  s.stdout.on("data", (e) => {
    n += e;
  });

  s.on("close", (e) => {
    if (n) {
      console.log(n);
    }

    if (a) {
      console.warn(a);
    }

    let r = null;

    if (e !== 0) {
      r = new Error("The decompression has failed");
    }

    t(r);
  });
};

const unzipOfWin32 = (e, r, t) => {
  var s = path_1.dirname(r);

  var s =
    (fs_extra_1.ensureDirSync(s),
    child_process_1.spawn(path_1.join(Editor.App.path, "../tools/unzip.exe"), [
      e,
      "-d",
      r,
    ]));

  let a = "";

  s.stderr.on("data", (e) => {
    a += e;
  });

  let n = "";

  s.stdout.on("data", (e) => {
    n += e;
  });

  s.on("close", (e) => {
    if (n) {
      console.log(n);
    }

    if (a) {
      console.warn(a);
    }

    let r = null;

    if (e !== 0) {
      r = new Error("The decompression has failed");
    }

    t(r);
  });
};
