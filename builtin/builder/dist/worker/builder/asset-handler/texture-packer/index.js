var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.TexturePacker = undefined;
exports.packAutoAtlas = packAutoAtlas;
exports.queryAutoAtlasFileCache = queryAutoAtlasFileCache;
exports.querySpriteToAutoAtlas = querySpriteToAutoAtlas;

const {
  emptyDirSync,
  outputJSONSync,
  existsSync,
  readJSONSync,
} = require("fs-extra");

const lodash_1 = __importDefault(require("lodash"));

const { join, dirname } = require("path");

const asset_library_1 = require("../../manager/asset-library");
const config_1 = require("./config");
const pac_info_1 = require("./pac-info");

const { packer } = require("./packer");

class TexturePacker {
  pacInfos = [];
  static useCache = true;
  static getCacheDirWithUuid(e, t = "build") {
    return join(
      asset_library_1.buildAssetLibrary.getAssetTempDirByUuid(e),
      "texture-packer" + t
    );
  }
  static async packSingle(e, t) {
    e = await new pac_info_1.PacInfo(e, t).initSpriteFramesWithRange();
    return TexturePacker.internalPack(e);
  }
  static queryPacStoredPath(e) {
    e = TexturePacker.getCacheDirWithUuid(e.uuid, e.packOptions.mode);
    return join(e, "pac-info.json");
  }
  async init(e, t) {
    const r = [];

    await Promise.all(
      e.map(async (e) => {
        if (!e.url.startsWith("db://internal/default_file_content")) {
          if (
            (e = await new pac_info_1.PacInfo(e).initSpriteFramesWithRange(t))
              .spriteFrameInfos.length !== 0
          ) {
            r.push(e);
          }
        }
      })
    );

    this.pacInfos = r;
    return this;
  }
  async pack() {
    return Promise.all(this.pacInfos.map((e) => TexturePacker.internalPack(e)));
  }
  static async internalPack(e) {
    let t = null;
    var r = TexturePacker.queryPacStoredPath(e);
    if (TexturePacker.useCache) {
      var a = TexturePacker.getPacResFromCache(e, r);
      if (a.result) {
        e.result = a.result;
        e.dirty = false;
        return e;
      }
      t = a;
      e.dirty = true;
    }
    a = this.getCacheDirWithUuid(e.uuid, e.packOptions.mode);
    emptyDirSync(a);

    if (e.spriteFrameInfos && e.spriteFrameInfos.length) {
      a = await packer(e.spriteFrameInfos, {
        ...e.packOptions,
        destDir: a,
        name: e.name,
      });
      e.result = a;

      if (TexturePacker.useCache) {
        t = t || TexturePacker.genNewStoredInfo(e);
        t.result = a;
        try {
          outputJSONSync(r, t, { spaces: 2 });
        } catch (e) {
          console.debug("write pac info cache failed");
          console.error(e);
        }
      }
    }

    return e;
  }
  static getStoredPacInfo(e, t) {
    t = t || TexturePacker.queryPacStoredPath(e);
    e = {
      newStoredPacInfo: TexturePacker.genNewStoredInfo(e),
      storedPacInfo: null,
    };
    if (existsSync(t)) {
      try {
        e.storedPacInfo = readJSONSync(t);
      } catch (e) {
        console.debug(e);
      }
    }
    return e;
  }
  static genNewStoredInfo(e) {
    var t = {
      md5: "",
      versionDev: config_1.versionDev,
      sharpMd5: Build.Utils.calcMd5(JSON.stringify(require("sharp").versions)),
    };

    e.storeInfo.sprites = lodash_1.default.sortBy(e.storeInfo.sprites, "uuid");

    t.md5 = Build.Utils.calcMd5(
      JSON.stringify({
        packStoreInfo: e.storeInfo,
        versionDev: config_1.versionDev,
        sharpMd5: t.sharpMd5,
      })
    );

    return t;
  }
  static getPacResFromCache(t, e) {
    var { storedPacInfo: e, newStoredPacInfo } = TexturePacker.getStoredPacInfo(
      t,
      e
    );

    var a = !e || newStoredPacInfo.md5 !== e.md5;
    if (!a) {
      try {
        for (const s of e.result.atlases) {
          if (!existsSync(s.imagePath)) {
            break;
          }
        }
        newStoredPacInfo.result = e.result;
      } catch (e) {
        console.warn(`Get Cache info of pac failed {asset(${t.uuid})}`);
        console.warn(e);
      }
      console.debug(`Get Cache info of pac success {asset(${t.uuid})}`);
    }
    return newStoredPacInfo;
  }
  static async queryPacCache(e) {
    var e = new pac_info_1.PacInfo(
      asset_library_1.buildAssetLibrary.getAsset(e)
    );

    e.packOptions.mode = "preview";
    await e.initSpriteFramesWithRange();
    var t = TexturePacker.getStoredPacInfo(e);

    return t &&
      t.storedPacInfo &&
      t.storedPacInfo.result &&
      t.storedPacInfo.md5 === t.newStoredPacInfo.md5
      ? {
          unpackedImages: t.storedPacInfo.result.unpackedImages,
          dirty: false,
          atlasImagePaths: t.storedPacInfo.result.atlases.map(
            (e) => e.imagePath
          ),
          atlases: t.storedPacInfo.result.atlases,
          storeInfo: e.storeInfo,
        }
      : null;
  }
}
async function packAutoAtlas(e, t) {
  t = t || {};
  t.mode = "preview";
  try {
    var r = await TexturePacker.packSingle(
      asset_library_1.buildAssetLibrary.getAsset(e),
      t
    );

    if (!r.spriteFrames.length) {
      console.warn(
        `No invalid SpriteFrame found in folder [{link(${dirname(
          r.path
        )})}]. Please check the AutoAtlas [{link(${r.path})}].`
      );
    }

    return r.result
      ? {
          atlasImagePaths: r.result.atlases.map((e) => e.imagePath),
          unpackedImages: r.result.unpackedImages,
          dirty: r.dirty,
          storeInfo: r.storeInfo,
          atlases: r.result.atlases,
        }
      : null;
  } catch (e) {
    console.error(e);
  }
  return null;
}
function queryAutoAtlasFileCache(e) {
  return TexturePacker.queryPacCache(e);
}
async function querySpriteToAutoAtlas(t) {
  var e;
  var r = asset_library_1.buildAssetLibrary.getAsset(t);
  return !r.url.startsWith("db://internal") &&
    (r = asset_library_1.buildAssetLibrary.queryAssetsByOptions({
      pattern: `db://${r._assetDB.options.name}/**/*.pac`,
    })).length &&
    (await (e = new TexturePacker()).init(r),
    (r = e.pacInfos.find(
      (e) => !!e.spriteFrameInfos.find((e) => e.uuid === t)
    )))
    ? { url: r.path, uuid: r.uuid }
    : null;
}
exports.TexturePacker = TexturePacker;
