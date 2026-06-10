Object.defineProperty(exports, "__esModule", { value: true });
exports.BitmapHandler = undefined;

const { queryAsset } = require("@editor/asset-db");

const cc_1 = require("cc");

const { existsSync, readFile } = require("fs-extra");

const { basename, join, dirname } = require("path");

const { changeImageDefaultType } = require("./utils/image-utils");

const { getDependUUIDList } = require("../utils");

const fntParser = require("../../../static/utils/fnt-parser");
function getRealFntTexturePath(e, t) {
  e = basename(e);
  t = join(dirname(t.source), e);

  if (!existsSync(t)) {
    console.warn("Parse Error: Unable to find file Texture, the path: " + t);
  }

  return t;
}
const UserFlags = { DoNotNotify: false };
function createBitmapFnt(e) {
  var t = new cc.BitmapFont();
  t.name = basename(e.source, e.extname);
  t.name = e.basename || "";
  t.fontSize = e.userData.fontSize;
  t.fntConfig = e.userData._fntConfig;
  return t;
}

exports.BitmapHandler = {
  name: "bitmap-font",
  assetType: "cc.BitmapFont",
  importer: {
    version: "1.0.6",
    async import(t) {
      var e = await readFile(t.source, "utf8");
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
      e = getRealFntTexturePath(r.atlasName, t);
      t.depend(e);
      e = t._assetDB.pathToUuid(e);
      if (!e) {
        return false;
      }
      t.userData.textureUuid = e;

      if (t.userData.textureUuid) {
        e = queryAsset(t.userData.textureUuid);
        if (!e) {
          return false;
        }
        changeImageDefaultType(e, "sprite-frame");
        var a = createBitmapFnt(t);

        var e =
          ((a.spriteFrame = EditorExtends.serialize.asAsset(
            e.uuid + "@f9941",
            cc_1.SpriteFrame
          )),
          EditorExtends.serialize(a));

        await t.saveToLibrary(".json", e);
        var a = getDependUUIDList(e);

        t.setData("depends", a);
      }

      return true;
    },
  },
  async validate(e) {
    return true;
  },
};

exports.default = exports.BitmapHandler;
