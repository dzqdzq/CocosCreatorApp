Object.defineProperty(exports, "__esModule", { value: true });
exports.GltfSkeletonImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const reader_manager_1 = require("./reader-manager");
const utils_1 = require("../../utils");
class GltfSkeletonImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.1";
  }
  get name() {
    return "gltf-skeleton";
  }
  get assetType() {
    return "cc.Skeleton";
  }
  get instantiation() {
    return ".skeleton";
  }
  async import(e) {
    var t;
    return (
      !!e.parent &&
      ((t = (
        await reader_manager_1.glTfReaderManager.getOrCreate(e.parent)
      ).createSkeleton(e.userData.gltfIndex)),
      (e.userData.jointsLength = t.joints.length),
      (t = EditorExtends.serialize(t)),
      await e.saveToLibrary(".json", t),
      (t = utils_1.getDependUUIDList(t)),
      e.setData("depends", t),
      true)
    );
  }
}
exports.GltfSkeletonImporter = GltfSkeletonImporter;
