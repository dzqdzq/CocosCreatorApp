Object.defineProperty(exports, "__esModule", { value: true });
exports.GltfMeshImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const reader_manager_1 = require("./reader-manager");
const utils_1 = require("../../utils");
class GltfMeshImporter extends asset_db_1.Importer {
  get version() {
    return "1.1.0";
  }
  get name() {
    return "gltf-mesh";
  }
  get assetType() {
    return "cc.Mesh";
  }
  get instantiation() {
    return ".mesh";
  }
  async import(e) {
    var t;
    var r;
    return (
      !!e.parent &&
      (((r = (
        await reader_manager_1.glTfReaderManager.getOrCreate(e.parent)
      ).createMesh(e.userData.gltfIndex)).allowDataAccess =
        null == (t = e.parent.userData.allowMeshDataAccess) || t),
      r.data.byteLength !== 0 &&
        (r._setRawAsset(".bin"),
        await e.saveToLibrary(".bin", Buffer.from(r.data))),
      (t = EditorExtends.serialize(r)),
      await e.saveToLibrary(".json", t),
      (r = utils_1.getDependUUIDList(t)),
      e.setData("depends", r),
      true)
    );
  }
}
exports.GltfMeshImporter = GltfMeshImporter;
