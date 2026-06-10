var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, a = r) => {
        Object.defineProperty(e, a, {
          enumerable: true,
          get() {
            return t[r];
          },
        });
      }
    : (e, t, r, a) => {
        e[(a = a === undefined ? r : a)] = t[r];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  ((e) => {
    if (e && e.__esModule) {
      return e;
    }
    var t = {};
    if (e != null) {
      for (var r in e) {
        if (r !== "default" && Object.prototype.hasOwnProperty.call(e, r)) {
          __createBinding(t, e, r);
        }
      }
    }
    __setModuleDefault(t, e);
    return t;
  });

Object.defineProperty(exports, "__esModule", { value: true });
exports.TexturePackerImporter = undefined;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const migratesNameToId = __importStar(require("./migrates/name2id"));
const sprite_frame_1 = require("./sprite-frame");
const sprite_atlas_1 = __importStar(require("./sprite-atlas"));
const cc_1 = require("cc");
const utils_1 = require("../utils");
const plist = require("plist");
class TexturePackerImporter extends sprite_atlas_1.default {
  get version() {
    return "1.0.7";
  }
  get migrations() {
    return [{ version: "1.0.4", migrate: migratesNameToId.migrate }];
  }
  async validate(e) {
    try {
      var t = plist.parse(await fs_extra_1.readFile(e.source, "utf8"));
      return t.frames !== undefined && t.metadata !== undefined;
    } catch (e) {
      return false;
    }
  }
  async import(e) {
    path_1.extname(e.source);
    var e_userData = e.userData;
    var a_metadata = await fs_extra_1.readFile(e.source, "utf8");
    var a = plist.parse(a_metadata);
    var a_metadata = a.metadata;
    e_userData.atlasTextureName =
      a_metadata.realTextureFileName || a_metadata.textureFileName;
    e_userData.format = a_metadata.format;
    e_userData.uuid = e.uuid;

    if (this.assetDB) {
      a_metadata = path_1.basename(e_userData.atlasTextureName);
      a_metadata = path_1.join(path_1.dirname(e.source), a_metadata);

      a_metadata =
        (fs_extra_1.existsSync(a_metadata) ||
          console.warn(
            "Parse Error: Unable to find file Texture, the path: " + a_metadata
          ),
        e.depend(a_metadata),
        this.assetDB.pathToUuid(a_metadata));

      if (!a_metadata) {
        return false;
      }
      e_userData.textureUuid =
        a_metadata +
        "@" +
        require("@editor/asset-db/libs/utils").nameToId("texture");
    }

    if (e.userData.textureUuid && this.assetDB) {
      var i = /\.[^.]+$/;
      var a_metadata = Object.keys(a.frames);
      var s = new cc.SpriteAtlas();
      s.name = e.basename || "";
      for (const d of a_metadata) {
        var o = d.replace(i, "");
        var u = a.frames[d];
        var o = await e.createSubAsset(o, "sprite-frame");
        var u = this.fillFrameData(u, e_userData);

        var u =
          ((u.borderBottom = u.borderBottom | o.userData.borderBottom),
          (u.borderTop = u.borderTop | o.userData.borderTop),
          (u.borderLeft = u.borderLeft | o.userData.borderLeft),
          (u.borderRight = u.borderRight | o.userData.borderRight),
          o.assignUserData(u, true),
          (o.userData.imageUuidOrDatabaseUri = u.imageUuidOrDatabaseUri),
          d.split("."));

        var u = (u.pop(), u.join("."));
        s.spriteFrames[u] = EditorExtends.serialize.asAsset(
          o.uuid,
          cc_1.SpriteFrame
        );
      }
      a_metadata = EditorExtends.serialize(s);
      a_metadata =
        (await e.saveToLibrary(".json", a_metadata),
        utils_1.getDependUUIDList(a_metadata));
      e.setData("depends", a_metadata);
    }
    return true;
  }
  fillFrameData(e, t) {
    var t_format = t.format;

    var t = sprite_frame_1.makeDefaultSpriteFrameAssetUserDataFromImageUuid(
      t.textureUuid,
      t.uuid
    );

    let a = false;
    let i = "";
    let s = "";
    let o = "";

    if (t_format === 1 || t_format === 2) {
      a = e.rotated;
      i = e.sourceSize;
      s = e.offset;
      o = e.frame;
    } else if (t_format === 3) {
      a = e.textureRotated;
      i = e.spriteSourceSize;
      s = e.spriteOffset;
      o = e.textureRect;
    }

    t.rotated = a;
    t_format = sprite_atlas_1._parseFloat2(i, cc_1.Size);
    t.rawWidth = t_format.width;
    t.rawHeight = t_format.height;
    e = sprite_atlas_1._parseRect(o);
    t.trimX = e.x;
    t.trimY = e.y;
    t.width = e.width;
    t.height = e.height;
    t_format = sprite_atlas_1._parseFloat2(s, cc_1.Vec2);
    t.offsetX = t_format.x;
    t.offsetY = t_format.y;
    return t;
  }
}
exports.TexturePackerImporter = TexturePackerImporter;
