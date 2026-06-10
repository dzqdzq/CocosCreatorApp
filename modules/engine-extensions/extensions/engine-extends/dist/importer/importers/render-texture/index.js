Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderTextureImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const fs_extra_1 = require("fs-extra");
const migrates_1 = require("../scene/migrates");
const texture_base_1 = require("../texture-base");
const cc_1 = require("cc");
const utils_1 = require("../../utils");
function fillUserdata(e, t, r) {
  if (!(t in e.userData)) {
    e.userData[t] = r;
  }
}
var Fliter = Fliter || {};
class RenderTextureImporter extends asset_db_1.Importer {
  get version() {
    return "1.2.2";
  }
  get name() {
    return "render-texture";
  }
  get assetType() {
    return "cc.RenderTexture";
  }
  get assetExtends() {
    return ["cc.TextureBase"];
  }
  get migrations() {
    return migrations;
  }
  get migrationHook() {
    return migrates_1.migrationHook;
  }
  async import(e) {
    var t = await fs_extra_1.readJSON(e.source);
    var t = cc.deserialize(t);

    var t =
      ((t.name = e.basename || ""),
      fillUserdata(e, "width", t.width),
      fillUserdata(e, "height", t.height),
      fillUserdata(e, "anisotropy", t._anisotropy),
      fillUserdata(
        e,
        "minfilter",
        texture_base_1.getFilterString(t._minFilter)
      ),
      fillUserdata(
        e,
        "magfilter",
        texture_base_1.getFilterString(t._magFilter)
      ),
      fillUserdata(
        e,
        "mipfilter",
        texture_base_1.getFilterString(t._mipFilter)
      ),
      fillUserdata(e, "wrapModeS", texture_base_1.getWrapModeString(t._wrapS)),
      fillUserdata(e, "wrapModeT", texture_base_1.getWrapModeString(t._wrapT)),
      t.resize(e.userData.width, e.userData.height),
      texture_base_1.applyTextureBaseAssetUserData(e.userData, t),
      EditorExtends.serialize(t));

    var t = (await e.saveToLibrary(".json", t), utils_1.getDependUUIDList(t));

    var t =
      (e.setData("depends", t),
      await e.createSubAsset("spriteFrame", "rt-sprite-frame", {
        displayName: e.basename,
      }));

    e.userData.redirect = t.uuid;
    t.userData.imageUuidOrDatabaseUri = e.uuid;
    t.userData.width = e.userData.width;
    t.userData.height = e.userData.height;
    return true;
  }
}
exports.RenderTextureImporter = RenderTextureImporter;
const migrations = [
  { version: "1.1.0", migrate: migrateAssetContent },
  { version: "1.2.0", migrate: migrateRenderTextureData },
];
async function migrateAssetContent(e) {
  var t;
  var r;
  var a;
  var i;
  var e = e.getSwapSpace().json || (await fs_extra_1.readJSON(e.source));

  if (e.content) {
    ({ name: t, width: r, height: a } = e.content);
    i = new cc_1.RenderTexture();
    t && (i._name = t);
    r && (i._width = r);
    a && (i._height = a);
    delete e.content;
    Object.assign(e, JSON.parse(EditorExtends.serialize(i)));
  }
}
async function migrateRenderTextureData(e) {
  var e = e.getSwapSpace().json || (await fs_extra_1.readJSON(e.source));
  var { _name, _width, _height } = e;
  e.content = { base: "2,2,0,0,0,0", w: _width, h: _height, n: _name };
  delete e._name;
  delete e._width;
  delete e._height;
}
