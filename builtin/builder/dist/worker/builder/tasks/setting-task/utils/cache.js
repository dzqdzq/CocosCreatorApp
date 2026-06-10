Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;

const { readJSON } = require("fs-extra");

async function handle(e) {
  e = await readJSON(e);
  if (e) {
    var { uuids, rawAssets, assetTypes, scenes, packedAssets, subpackages } = e;

    var a = (e.rawAssets = {});
    for (const h in rawAssets) {
      var n = rawAssets[h];
      var o = (a[h] = {});
      for (const y in n) {
        var u = n[y];
        var [, f] = u;

        if (typeof f == "number") {
          u[1] = assetTypes[f];
        }

        o[uuids[y] || y] = u;
      }
    }
    for (let e = 0; e < scenes.length; ++e) {
      var c = scenes[e];

      if (typeof c.uuid == "number") {
        c.uuid = uuids[c.uuid];
      }
    }
    for (const b in packedAssets) {
      var l = packedAssets[b];
      for (let e = 0; e < l.length; ++e) {
        if (typeof l[e] == "number") {
          l[e] = uuids[l[e]];
        }
      }
    }
    for (const g in subpackages) {
      var v = subpackages[g].uuids;
      if (v) {
        for (let e = 0, rawAssets = v.length; e < rawAssets; e++) {
          if (typeof v[e] == "number") {
            v[e] = uuids[v[e]];
          }
        }
      }
    }
    return e;
  }
  console.error("can't get cache settings...");
}
