Object.defineProperty(exports, "__esModule", { value: true });

exports.SelectGizmo = undefined;
exports.PersistentGizmo = undefined;
exports.IconGizmo = undefined;
exports.name = undefined;

const cc_1 = require("cc");
exports.name = cc_1.js.getClassName(cc_1.SkinnedMeshBatchRenderer);
var skinned_mesh_renderer_1 = require("../skinned-mesh-renderer");

Object.defineProperty(exports, "IconGizmo", {
  enumerable: true,
  get() {
    return skinned_mesh_renderer_1.IconGizmo;
  },
});

Object.defineProperty(exports, "PersistentGizmo", {
  enumerable: true,
  get() {
    return skinned_mesh_renderer_1.PersistentGizmo;
  },
});

Object.defineProperty(exports, "SelectGizmo", {
  enumerable: true,
  get() {
    return skinned_mesh_renderer_1.SelectGizmo;
  },
});
