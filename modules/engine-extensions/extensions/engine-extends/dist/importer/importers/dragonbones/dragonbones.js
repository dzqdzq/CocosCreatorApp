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
exports.DragonBonesImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const fse = __importStar(require("fs-extra"));
const cc_1 = require("cc");
const utils_1 = require("../../utils");
const DRAGONBONES_ENCODING = { encoding: "utf8" };
function basenameNoExt(e) {
  var t = path.basename(e);
  var e = path.extname(e);
  return t.substring(0, t.length - e.length);
}
class DragonBonesImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.2";
  }
  get name() {
    return "dragonbones";
  }
  get assetType() {
    return "dragonBones.DragonBonesAsset";
  }
  async validate(e) {
    let t;
    e = e.source;
    if (e.endsWith(".json")) {
      var r = fs.readFileSync(e, "utf8");
      try {
        t = JSON.parse(r);
      } catch (e) {
        return false;
      }
    } else {
      r = fs.readFileSync(e);
      try {
        var a = r.buffer.slice(r.byteOffset, r.byteOffset + r.byteLength);
        t =
          cc_1.dragonBones.BinaryDataParser.getInstance().parseDragonBonesData(
            a
          );
      } catch (e) {
        return false;
      }
    }
    return !!t && (Array.isArray(t.armature) || !!t.armatures);
  }
  async import(e) {
    var e_source = e.source;
    var r = await fse.readFile(e_source, DRAGONBONES_ENCODING);
    var a = new cc_1.dragonBones.DragonBonesAsset();

    var r =
      ((a.name = basenameNoExt(e_source)),
      e_source.endsWith(".json")
        ? (a.dragonBonesJson = r)
        : (await e.copyToLibrary(".dbbin", e_source), a._setRawAsset(".dbbin")),
      EditorExtends.serialize(a));

    await e.saveToLibrary(".json", r);
    var e_source = utils_1.getDependUUIDList(r);
    e.setData("depends", e_source);
    return true;
  }
}
exports.DragonBonesImporter = DragonBonesImporter;
