Object.defineProperty(exports, "__esModule", { value: true });
exports.BitmapImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const cc_1 = require("cc");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const image_utils_1 = require("./utils/image-utils");
const utils_1 = require("../utils");
const fntParser = require("../../../static/utils/fnt-parser");
function getRealFntTexturePath(e, t) {
  e = path_1.basename(e);
  t = path_1.join(path_1.dirname(t.source), e);

  if (!fs_extra_1.existsSync(t)) {
    console.warn("Parse Error: Unable to find file Texture, the path: " + t);
  }

  return t;
}
const UserFlags = { DoNotNotify: false };
class BitmapImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.6";
  }
  get name() {
    return "bitmap-font";
  }
  get assetType() {
    return "cc.BitmapFont";
  }
  get assetExtends() {
    return ["cc.Font"];
  }
  async validate(e) {
    return true;
  }
  async import(t) {
    var e = await fs_extra_1.readFile(t.source, "utf8");
    let r;
    try {
      r = fntParser.parseFnt(e);
    } catch (e) {
      console.error(e);
      throw new Error(
        `BitmapFont import failed: ${t.uuid} file parsing failed`
      );
    }
    if (!(t.userData._fntConfig = r).fontSize) {
      console.error(
        `BitmapFont import failed: ${t.uuid} file parsing failed, There is no 'fontSize' in the configuration.`
      );

      return false;
    }
    t.userData.fontSize = r.fontSize;
    var e = getRealFntTexturePath(r.atlasName, t);
    t.depend(e);
    var a = this.assetDB.pathToUuid(e);
    if (!a) {
      return false;
    }
    t.userData.textureUuid = this.assetDB.pathToUuid(e);

    if (t.userData.textureUuid) {
      a = asset_db_1.queryAsset(t.userData.textureUuid);
      if (!a) {
        return false;
      }
      image_utils_1.changeImageDefaultType(a, "sprite-frame");
      e = this.createBitmapFnt(t);

      a =
        ((e.spriteFrame = EditorExtends.serialize.asAsset(
          a.uuid + "@f9941",
          cc_1.SpriteFrame
        )),
        EditorExtends.serialize(e));

      e = (await t.saveToLibrary(".json", a), utils_1.getDependUUIDList(a));
      t.setData("depends", e);
    }

    return true;
  }
  createBitmapFnt(e) {
    var t = new cc.BitmapFont();
    t.name = path_1.basename(e.source, e.extname);
    t.name = e.basename || "";
    t.fontSize = e.userData.fontSize;
    t.fntConfig = e.userData._fntConfig;
    return t;
  }
}
exports.BitmapImporter = BitmapImporter;
