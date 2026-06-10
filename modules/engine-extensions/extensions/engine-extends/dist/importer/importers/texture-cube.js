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

exports.TextureCubeImporter = undefined;
exports.makeDefaultTextureCubeAssetUserData = undefined;

const asset_db_1 = require("@editor/asset-db");
const cc = __importStar(require("cc"));
const load_asset_sync_1 = require("./gltf/load-asset-sync");
const texture_base_1 = require("./texture-base");
const utils_1 = require("../utils");
function makeDefaultTextureCubeAssetUserData() {
  var e = texture_base_1.makeDefaultTextureBaseAssetUserData();
  e.isRGBE = false;
  return e;
}
exports.makeDefaultTextureCubeAssetUserData =
  makeDefaultTextureCubeAssetUserData;
class TextureCubeImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.4";
  }
  get name() {
    return "texture-cube";
  }
  get assetType() {
    return "cc.TextureCube";
  }
  get migrations() {
    return [{ version: "1.0.3", migrate: texture_base_1.migrateAnisotropy }];
  }
  async import(t) {
    if (Object.getOwnPropertyNames(t.userData).length === 0) {
      t.assignUserData(makeDefaultTextureCubeAssetUserData(), true);
      t.userData.isRGBE = false;
    }

    var t_userData = t.userData;
    var a = {};
    for (const n of ["front", "back", "left", "right", "top", "bottom"]) {
      let e = t_userData[n];
      if (!e) {
        var s = `db://internal/default_cubemap/${n}.jpg`;
        var u = asset_db_1.queryUUID(s);
        if (!u) {
          throw new Error(
            `[[internal-error]] Default face url ${s} doesn't exists.`
          );
        }
        e = u;
      }
      s = load_asset_sync_1.loadAssetSync(e, cc.ImageAsset);
      if (!s) {
        throw new Error(`Failed to load ${n} face of ${t.uuid}.`);
      }
      a[n] = s;
    }
    var e = new cc.TextureCube();

    var e =
      (texture_base_1.applyTextureBaseAssetUserData(t_userData, e),
      t.parent instanceof asset_db_1.Asset &&
        (e.name = t.parent.basename || ""),
      (e.isRGBE = t_userData.isRGBE),
      (e._mipmaps = [a]),
      EditorExtends.serialize(e));

    var e = (await t.saveToLibrary(".json", e), utils_1.getDependUUIDList(e));
    t.setData("depends", e);
    return true;
  }
}
exports.TextureCubeImporter = TextureCubeImporter;
