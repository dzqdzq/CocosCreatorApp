Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssetPathInfo = getAssetPathInfo;
exports.getJsonPath = getJsonPath;
exports.getImportPathInfo = getImportPathInfo;
exports.resolveImportPath = resolveImportPath;
exports.resolveNativePath = resolveNativePath;
exports.getRawAssetPaths = getRawAssetPaths;

const { basename, join } = require("path");

const asset_library_1 = require("../../manager/asset-library");

const {
  getResImportPath,
  getLibraryDir,
  getUuidFromPath,
  getResRawAssetsPath,
} = require("../../utils");

const { hasCCONFormatAssetInLibrary } = require("../../utils/cconb");

function getAssetPathInfo(t, e) {
  var s;
  return e.containsAsset(t, true) &&
    ((s = getImportPathInfo(t, e)), (t = getRawAssetPaths(t, e)), s || t.length)
    ? ((e = {}), s && Object.assign(e, s), t.length && (e.raw = t), e)
    : null;
}
function getJsonPath(t, e) {
  return getImportPathInfo(t, e)?.json || "";
}
function getImportPathInfo(e, t) {
  var s;
  var r;
  return t.containsAsset(e) &&
    (s = asset_library_1.buildAssetLibrary.getAsset(e)) &&
    (s = getImportExtName(s))
    ? ((t = resolveImportPath(
        (r = t.groups.find((t) => t.uuids.includes(e))) ? r.name : e,
        t,
        s
      )),
      r
        ? { import: t, [s.replace(".", "")]: t, groupIndex: r.uuids.indexOf(e) }
        : { import: t, [s.replace(".", "")]: t })
    : null;
}
function resolveImportPath(t, e, s) {
  return getResImportPath(
    e.dest,
    t + (e.assetVer.import[t] ? "." + e.assetVer.import[t] : ""),
    s
  );
}
function resolveNativePath(t, e, s) {
  var r = basename(t, e);
  var r = s.assetVer.native[r];

  var t = t.replace(getLibraryDir(t), join(s.dest, Build.NATIVE_HEADER));

  return r ? t.replace(e, "." + r + e) : t;
}
function getImportExtName(t) {
  return hasCCONFormatAssetInLibrary(t)
    ? ".bin"
    : t.meta.files.includes(".json")
    ? ".json"
    : "";
}
function getRawAssetPaths(e, s) {
  if (!s.containsAsset(e, true)) {
    return [];
  }
  const r = asset_library_1.buildAssetLibrary.getAsset(e);
  if (!r) {
    console.error(`Can't get assetInfo of uuid {asset(${e})}`);
    return [];
  }
  const a = getImportExtName(r);

  var t = r.meta.files.filter((t) => t !== a);

  var n = asset_library_1.buildAssetLibrary.getAssetProperty(r, "type");
  if (n === "cc.Script") {
    return [s.scriptDest];
  }
  if (n === "cc.ImageAsset" && s.compressRes[e]) {
    const p = s.assetVer.native[e];
    return s.compressRes[e].map((t) => t.replace(e, p ? e + "." + p : ""));
  }
  if (["cc.ImageAsset", "cc.SpriteFrame", "cc.SpriteAtlas"].includes(n)) {
    var o =
      (s.atlasRes.assetsToImage[e]
        ? [s.atlasRes.assetsToImage[e]]
        : s.atlasRes.atlasToImages[e]) || [];
    if (o.length) {
      var i = [];
      for (const u of o) {
        if (u && s.containsAsset(u)) {
          const c = s.assetVer.native[u];

          if (s.compressRes[u]) {
            i.push(
              ...s.compressRes[u].map((t) => {
                var e = getUuidFromPath(t);
                return t.replace(e, c ? e + "." + c : "");
              })
            );
          } else {
            i.push(getResRawAssetsPath(s.dest, u, c ? `.${c}.png` : ".png"));
          }
        }
      }
      return i;
    }
  }

  if (n === "cc.TTFFont" && s.assetVer.native[e]) {
    return t.map((t) =>
      getResRawAssetsPath(s.dest, `${e}.${s.assetVer.native[e]}/`, t)
    );
  }

  if (t.length) {
    return t.map((t) => resolveNativePath(r.library + t, t, s));
  }

  return [];
}
