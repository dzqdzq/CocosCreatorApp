Object.defineProperty(exports, "__esModule", { value: true });
exports.GltfSkeletonHandler = undefined;
const reader_manager_1 = require("./reader-manager");

const { getDependUUIDList } = require("../../utils");

exports.GltfSkeletonHandler = {
  name: "gltf-skeleton",
  assetType: "cc.Skeleton",
  instantiation: ".skeleton",
  importer: {
    version: "1.0.1",
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
        (t = getDependUUIDList(t)),
        e.setData("depends", t),
        true)
      );
    },
  },
};

exports.default = exports.GltfSkeletonHandler;
