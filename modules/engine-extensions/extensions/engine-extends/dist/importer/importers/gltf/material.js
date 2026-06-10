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

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.dumpMaterial = undefined;
exports.GltfMaterialImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const cc = __importStar(require("cc"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const asset_finder_1 = require("./asset-finder");
const load_asset_sync_1 = require("./load-asset-sync");
const reader_manager_1 = require("./reader-manager");
const utils_1 = require("../../utils");
class GltfMaterialImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.14";
  }
  get name() {
    return "gltf-material";
  }
  get assetType() {
    return "cc.Material";
  }
  get instantiation() {
    return ".material";
  }
  async import(e) {
    if (!e.parent) {
      return false;
    }
    if (
      null != (t = null == (t = e.parent.meta) ? undefined : t.userData) &&
      t.materials
    ) {
      var t = e.parent.meta.userData.materials[e.uuid];
      if (t) {
        console.log(
          "Importer: Reuse previously edited material data. " + e.uuid
        );
        const a = JSON.stringify(t);
        await e.saveToLibrary(".json", a);
        const i = utils_1.getDependUUIDList(a);
        e.setData("depends", i);
        return true;
      }
    }
    var t = await reader_manager_1.glTfReaderManager.getOrCreate(e.parent);
    var r = e.parent.userData;

    var t = createMaterial(
      e.userData.gltfIndex,
      t,
      new asset_finder_1.DefaultGltfAssetFinder(r.assetFinder),
      r
    );

    const a = EditorExtends.serialize(t);
    await e.saveToLibrary(".json", a);
    const i = utils_1.getDependUUIDList(a);
    e.setData("depends", i);
    return true;
  }
}
function createMaterial(e, t, r, a) {
  return t.createMaterial(
    e,
    r,
    (e) => {
      e = asset_db_1.queryUUID(e);
      return load_asset_sync_1.loadAssetSync(e, cc.EffectAsset);
    },
    {
      useVertexColors: a.useVertexColors,
      depthWriteInAlphaModeBlend: a.depthWriteInAlphaModeBlend,
      smartMaterialEnabled:
        null !=
          (e = null == (t = a.fbx) ? undefined : t.smartMaterialEnabled) && e,
    }
  );
}
async function dumpMaterial(e, t, r, a, i) {
  var e_userData = e.userData;
  let n = null;

  if (
    e_userData.materialDumpDir &&
    !(n = asset_db_1.queryPath(e_userData.materialDumpDir))
  ) {
    console.warn(
      "The specified dump directory of materials is not valid. Default directory is used."
    );
  }

  if (!n) {
    n = path_1.default.join(
      path_1.default.dirname(e.source),
      "Materials_" + e.basename
    );

    e_userData.materialDumpDir = await asset_db_1.queryUrl(n);
  }

  fs_extra_1.default.ensureDirSync(n);
  i = path_1.default.join(n, i);

  if (!fs_extra_1.default.existsSync(i)) {
    a = createMaterial(a, r, t, e_userData);
    r = EditorExtends.serialize(a);
    fs_extra_1.default.writeFileSync(i, r);
  }

  e._assetDB.refresh(i);
  t = asset_db_1.queryUrl(i);
  if (t) {
    e_userData = asset_db_1.queryUUID(t);
    if (e_userData && typeof e_userData == "string") {
      return e_userData;
    }
  }
  e.depend(i);
  return null;
}
exports.GltfMaterialImporter = GltfMaterialImporter;
exports.dumpMaterial = dumpMaterial;
