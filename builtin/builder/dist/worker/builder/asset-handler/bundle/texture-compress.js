Object.defineProperty(exports, "__esModule", { value: true });
exports.bundleDataTask = bundleDataTask;
exports.bundleOutputTask = bundleOutputTask;

const { existsSync, copy } = require("fs-extra");

const { join, basename } = require("path");

const asset_library_1 = require("../../manager/asset-library");
function bundleDataTask(a, t) {
  a.assetsWithoutRedirect.forEach((s) => {
    var s = asset_library_1.buildAssetLibrary.getAsset(s);
    var e = t.addTaskWithAssetInfo(s);

    if (e) {
      a.compressTask[s.uuid] = e;
    }
  });

  console.debug(
    `init image compress task ${
      Object.keys(a.compressTask).length
    } in bundle ` + a.name
  );
}
async function bundleOutputTask(i, e) {
  await Promise.all(
    Object.keys(i.compressTask).map(async (t) => {
      const r = i.compressTask[t];
      if (r.dest && r.dest.length) {
        const n = [];
        i.compressRes[t] = [];

        await Promise.all(
          r.dest.map(async (s, e) => {
            var a;

            if (existsSync(s)) {
              a = join(i.dest, i.nativeBase, t.substr(0, 2), basename(s));
              await copy(s, a);
              n.push(r.suffix[e]);
              i.compressRes[t].push(a);
            }
          })
        );

        var s = await e.getInstance(t);
        s._exportedExts = n.sort();
        e.addInstance(s);
      } else {
        delete i.compressTask[t];
      }
    })
  );
}
