Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoAtlasImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const texture_base_1 = require("./texture-base");
const migrations_1 = require("./image/migrations");
const utils_1 = require("../utils");

const defaultAutoAtlasUserData = {
  maxWidth: 1024,
  maxHeight: 1024,
  padding: 2,
  allowRotation: true,
  forceSquared: false,
  powerOfTwo: false,
  algorithm: "MaxRects",
  format: "png",
  quality: 80,
  contourBleed: true,
  paddingBleed: true,
  filterUnused: true,
  removeTextureInBundle: true,
  removeImageInBundle: true,
  removeSpriteAtlasInBundle: true,
  compressSettings: {},
  textureSetting: texture_base_1.makeDefaultTextureBaseAssetUserData(),
};

class AutoAtlasImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.8";
  }
  get name() {
    return "auto-atlas";
  }
  get assetType() {
    return "cc.SpriteAtlas";
  }
  get migrations() {
    return [
      { version: "1.0.5", migrate: migrations_1.migratePlatformSettings },
      {
        version: "1.0.6",
        migrate: (e) => {
          const e_userData = e.userData;
          [
            "removeTextureInBundle",
            "removeImageInBundle",
            "removeSpriteAtlasInBundle",
          ].forEach((e) => {
            if (typeof e_userData[e] != "boolean") {
              e_userData[e] = false;
            }
          });
        },
      },
      {
        version: "1.0.8",
        migrate: (e) => {
          e = e.userData;

          if (!e.allowRotation) {
            e.allowRotation = true;
          }

          if (!e.algorithm || e.algorithm !== "MaxRects") {
            e.algorithm = "MaxRects";
          }
        },
      },
    ];
  }
  async import(e) {
    const e_userData = e.userData;
    Object.keys(defaultAutoAtlasUserData).forEach((e) => {
      if (!(e in e_userData)) {
        e_userData[e] = defaultAutoAtlasUserData[e];
      }
    });
    var a = new cc.SpriteAtlas();
    var a = ((a.name = e.basename || ""), EditorExtends.serialize(a));
    var a = (await e.saveToLibrary(".json", a), utils_1.getDependUUIDList(a));
    e.setData("depends", a);
    return true;
  }
}
exports.AutoAtlasImporter = AutoAtlasImporter;
