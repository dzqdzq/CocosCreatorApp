Object.defineProperty(exports, "__esModule", { value: true });
exports.assetOutputPathCache = undefined;
exports.AssetCache = undefined;
exports.calcMd5 = calcMd5;

const { copy } = require("fs-extra");

const { join, extname } = require("path");

const HASH_LEN = 5;
function calcMd5(e) {
  e = Array.isArray(e) ? e : [e];
  var t = require("crypto").createHash;
  const a = t("md5");

  e.forEach((e) => {
    a.update(e);
  });

  return a.digest("hex").slice(0, HASH_LEN);
}
class AssetCache {
  _cacheMap = {};
  _getCacheFilePath(e, t) {
    return join(
      Editor.Project.tmpDir,
      "asset-db",
      e.uuid.slice(0, 2),
      e.uuid,
      t
    );
  }
  async add(e, t, a) {
    var t = calcMd5(JSON.stringify(t));
    var r = this._getCacheFilePath(e, t + extname(a));
    try {
      await copy(a, r);
      this._cacheMap[e.uuid] = { path: a, md5Key: t };
    } catch (e) {
      console.warn(e);
      return false;
    }
    return true;
  }
  query(e, t) {
    t = JSON.stringify(t);
    e = this._cacheMap[e];
    return e.md5Key === t ? e.path : null;
  }
}
exports.AssetCache = AssetCache;
exports.assetOutputPathCache = new AssetCache();
