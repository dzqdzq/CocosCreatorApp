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
exports.DragonBonesAtlasImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const fse = __importStar(require("fs-extra"));
const cc_1 = require("cc");
const utils_1 = require("../../utils");
function basenameNoExt(e) {
  var t = path.basename(e);
  var e = path.extname(e);
  return t.substring(0, t.length - e.length);
}
class DragonBonesAtlasImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.2";
  }
  get name() {
    return "dragonbones-atlas";
  }
  get assetType() {
    return "dragonBones.DragonBonesAtlasAsset";
  }
  async validate(e) {
    e = e.source;
    let t;
    e = fs.readFileSync(e, "utf8");
    try {
      t = JSON.parse(e);
    } catch (e) {
      return false;
    }
    return typeof t.imagePath == "string" && Array.isArray(t.SubTexture);
  }
  async import(e) {
    var e_source = e.source;
    var r = fse.readFileSync(e_source, { encoding: "utf8" });
    var a = JSON.parse(r);
    var s = path.resolve(path.dirname(e_source), a.imagePath);
    e.depend(s);
    var n = asset_db_1.queryAsset(s);

    if (n && !n.init) {
      e._assetDB.taskManager.pause(e.task);
      await n.waitInit();
      e._assetDB.taskManager.resume(e.task);
    }

    if (!n || !n.imported) {
      console.warn(
        utils_1.i18nTranslate(
          "asset-db.importers.dragonbones_atlas.texture_not_imported",
          { texture: s }
        ) + ` {asset(${e.uuid})}`
      );

      return false;
    }

    if (fs.existsSync(s)) {
      s = new cc_1.dragonBones.DragonBonesAtlasAsset();
      s.name = basenameNoExt(e_source);
      s.atlasJson = r;

      s.texture = EditorExtends.serialize.asAsset(
        n.uuid + "@6c48a",
        cc_1.Texture2D
      );

      r = EditorExtends.serialize(s);
      await e.saveToLibrary(".json", r);
      n = utils_1.getDependUUIDList(r);
      e.setData("depends", n);
      return true;
    }
    throw new Error(
      utils_1.i18nTranslate(
        "asset-db.importers.dragonbones_atlas.texture_not_found",
        { atlas: e_source, texture: a.imagePath }
      ) + ` {asset(${e.uuid})}`
    );
  }
}
exports.DragonBonesAtlasImporter = DragonBonesAtlasImporter;
