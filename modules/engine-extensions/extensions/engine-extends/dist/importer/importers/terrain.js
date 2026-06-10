var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, r, t, a = t) => {
        Object.defineProperty(e, a, {
          enumerable: true,
          get() {
            return r[t];
          },
        });
      }
    : (e, r, t, a) => {
        e[(a = a === undefined ? t : a)] = r[t];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, r) => {
        Object.defineProperty(e, "default", { enumerable: true, value: r });
      }
    : (e, r) => {
        e.default = r;
      });

var __importStar =
  (this && this.__importStar) ||
  ((e) => {
    if (e && e.__esModule) {
      return e;
    }
    var r = {};
    if (e != null) {
      for (var t in e) {
        if (t !== "default" && Object.prototype.hasOwnProperty.call(e, t)) {
          __createBinding(r, e, t);
        }
      }
    }
    __setModuleDefault(r, e);
    return r;
  });

Object.defineProperty(exports, "__esModule", { value: true });
exports.TerrainImporter = undefined;
const fs = __importStar(require("fs-extra"));
const asset_db_1 = require("@editor/asset-db");
const index_1 = require("./scene/index");
const cc_1 = require("cc");
const utils_1 = require("../utils");
class TerrainImporter extends asset_db_1.Importer {
  get version() {
    return index_1.version;
  }
  get name() {
    return "terrain";
  }
  get assetType() {
    return "cc.TerrainAsset";
  }
  async import(e) {
    await e.copyToLibrary(".bin", e.source);
    var r = new cc_1.TerrainAsset();
    if (r._loadNativeData(fs.readFileSync(e.source))) {
      r.layerInfos.length = r.layerBinaryInfos.length;
      for (let e = 0; e < r.layerInfos.length; ++e) {
        var t = r.layerBinaryInfos[e];
        var a = new cc_1.TerrainLayerInfo();
        a.slot = t.slot;
        a.tileSize = t.tileSize;

        if (t.detailMapId && t.detailMapId != "") {
          a.detailMap = EditorExtends.serialize.asAsset(
            t.detailMapId,
            cc_1.Texture2D
          );
        }

        if (t.normalMapId && t.normalMapId != "") {
          a.normalMap = EditorExtends.serialize.asAsset(
            t.normalMapId,
            cc_1.Texture2D
          );
        }

        a.metallic = t.metallic;
        a.roughness = t.roughness;
        r.layerInfos[e] = a;
      }
    }
    r.name = e.basename;
    r._setRawAsset(".bin");
    var i = EditorExtends.serialize(r);
    var i = (await e.saveToLibrary(".json", i), utils_1.getDependUUIDList(i));
    e.setData("depends", i);
    return true;
  }
}
exports.TerrainImporter = TerrainImporter;
