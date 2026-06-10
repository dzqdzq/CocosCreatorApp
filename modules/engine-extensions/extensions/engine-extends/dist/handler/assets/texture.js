Object.defineProperty(exports, "__esModule", { value: true });
exports.TextureHandler = undefined;
const asset_db_1 = require("@editor/asset-db");

const { queryAsset } = asset_db_1;

const cc_1 = require("cc");

const { getDependUUIDList } = require("../utils");

const utils_2 = require("./image/utils");

const { makeDefaultTexture2DAssetUserData } = utils_2;

const texture_base_1 = require("./texture-base");

const { applyTextureBaseAssetUserData } = texture_base_1;

function getImageUuid(e) {
  var e = e.userData;
  var e_imageUuidOrDatabaseUri = e.imageUuidOrDatabaseUri;
  return e_imageUuidOrDatabaseUri
    ? e.isUuid
      ? e_imageUuidOrDatabaseUri
      : Manager.Utils.url2uuid(e_imageUuidOrDatabaseUri) || null
    : null;
}
function getImageAsset(e) {
  e = getImageUuid(e);
  return e !== null
    ? EditorExtends.serialize.asAsset(e, cc_1.ImageAsset)
    : null;
}

exports.TextureHandler = {
  name: "texture",
  assetType: "cc.Texture2D",
  iconInfo: {
    default: utils_2.defaultIconConfig,
    generateThumbnail(e) {
      var t;
      var uuid = getImageUuid(e);
      return !uuid || queryAsset(uuid).invalid
        ? utils_2.defaultIconConfig
        : ((t = e.meta.files.find((e) => e !== ".json") || ".png"),
          { type: "image", value: e.library + t });
    },
  },
  importer: {
    version: "1.0.22",
    migrations: [
      { version: "1.0.21", migrate: texture_base_1.migrateAnisotropy },
    ],
    async import(e) {
      var e_userData = e.userData;
      var a = new cc.Texture2D();

      var e_userData =
        (e.parent instanceof asset_db_1.Asset &&
          ((a.name = e.parent.basename || ""), !e_userData.mipfilter) &&
          [".hdr", ".exr"].includes(e.parent.extname) &&
          ((e_userData.mipfilter = "none"),
          (e_userData.minfilter = "nearest"),
          (e_userData.magfilter = "nearest")),
        e.assignUserData(makeDefaultTexture2DAssetUserData()),
        applyTextureBaseAssetUserData(e_userData, a),
        getImageAsset(e));

      if (e_userData) {
        a._mipmaps = [e_userData];
      } else if (e.userData.imageUuidOrDatabaseUri) {
        e.depend(e.userData.imageUuidOrDatabaseUri);
        return false;
      }
      e_userData = EditorExtends.serialize(a);
      await e.saveToLibrary(".json", e_userData);
      a = getDependUUIDList(e_userData);
      e.setData("depends", a);
      return true;
    },
  },
};

exports.default = exports.TextureHandler;
