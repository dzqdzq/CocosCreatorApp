Object.defineProperty(exports, "__esModule", { value: true });

exports.TextureImporter = undefined;
exports.makeDefaultTexture2DAssetUserDataFromImageUuid = undefined;
exports.makeDefaultTexture2DAssetUserDataFromImagePath = undefined;
exports.makeDefaultTexture2DAssetUserData = undefined;

const asset_db_1 = require("@editor/asset-db");
const texture_base_1 = require("./texture-base");
const cc_1 = require("cc");
const utils_1 = require("../utils");
function makeDefaultTexture2DAssetUserData() {
  return texture_base_1.makeDefaultTextureBaseAssetUserData();
}
function makeDefaultTexture2DAssetUserDataFromImagePath(e) {
  return Object.assign(texture_base_1.makeDefaultTextureBaseAssetUserData(), {
    isUuid: false,
    imageUuidOrDatabaseUri: e,
  });
}
function makeDefaultTexture2DAssetUserDataFromImageUuid(e) {
  return Object.assign(texture_base_1.makeDefaultTextureBaseAssetUserData(), {
    isUuid: true,
    imageUuidOrDatabaseUri: e,
  });
}
exports.makeDefaultTexture2DAssetUserData = makeDefaultTexture2DAssetUserData;
exports.makeDefaultTexture2DAssetUserDataFromImagePath =
  makeDefaultTexture2DAssetUserDataFromImagePath;
exports.makeDefaultTexture2DAssetUserDataFromImageUuid =
  makeDefaultTexture2DAssetUserDataFromImageUuid;
class TextureImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.22";
  }
  get name() {
    return "texture";
  }
  get assetType() {
    return "cc.Texture2D";
  }
  get migrations() {
    return [{ version: "1.0.21", migrate: texture_base_1.migrateAnisotropy }];
  }
  get assetExtends() {
    return ["cc.TextureBase"];
  }
  async import(e) {
    e.assignUserData(makeDefaultTexture2DAssetUserData());
    var e_userData = e.userData;
    var a = new cc.Texture2D();

    var e_userData =
      (texture_base_1.applyTextureBaseAssetUserData(e_userData, a),
      e.parent instanceof asset_db_1.Asset &&
        (a.name = e.parent.basename || ""),
      this._getImageAsset(e));

    var e_userData =
      (e_userData && (a._mipmaps = [e_userData]), EditorExtends.serialize(a));
    await e.saveToLibrary(".json", e_userData);
    var a = utils_1.getDependUUIDList(e_userData);
    e.setData("depends", a);
    return true;
  }
  _getImageAsset(t) {
    var t_userData = t.userData;
    var t_userData_imageUuidOrDatabaseUri = t_userData.imageUuidOrDatabaseUri;
    if (t_userData_imageUuidOrDatabaseUri) {
      let e = null;

      if (t_userData.isUuid) {
        e = t_userData_imageUuidOrDatabaseUri;
      } else if (
        !(e = asset_db_1.queryUUID(t_userData_imageUuidOrDatabaseUri))
      ) {
        console.warn(
          `Cannot find image ${
            asset_db_1.queryPath(t_userData_imageUuidOrDatabaseUri) || ""
          }.`
        );

        t.depend(t_userData_imageUuidOrDatabaseUri);
      }

      if (e !== null) {
        return EditorExtends.serialize.asAsset(e, cc_1.ImageAsset);
      }
    }
    return null;
  }
}
exports.TextureImporter = TextureImporter;
