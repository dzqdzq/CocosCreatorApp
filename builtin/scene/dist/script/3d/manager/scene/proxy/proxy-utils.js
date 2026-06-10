var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkClose = checkClose;
exports.serializePrefab = serializePrefab;
exports.serializeScene = serializeScene;
const cc_1 = require("cc");
const utils_1 = require("../../prefab/utils");
const component_1 = __importDefault(require("../../component"));
const scene_cache_1 = require("../scene-cache");
const multi_scene_1 = __importDefault(require("../../multi-scene"));
async function checkClose(e) {
  var a = await cce.Terrain.close();
  return a === 2 ? a : cce.Ipc.request("dirty-dialog", e);
}
async function serializePrefab(e, a) {
  a = _serializePrefabData(a);
  await cce.Ipc.send("save-asset", e, a);
}
async function serializeScene(s_id, a) {
  if (a) {
    a.children.forEach((e) => {
      utils_1.prefabUtils.checkMountedRootData(e, true);
    });

    utils_1.prefabUtils.checkTargetOverridesData(a);
  }

  var c = _serializeSceneData(a);
  if (!(await cce.Ipc.request("query-asset-meta", s_id))) {
    if (!(s_id = await cce.Ipc.send("create-asset", "", c, "scene"))) {
      return;
    }
    await cce.Ipc.send("set-scene", s_id);
  }
  await cce.Ipc.send("save-asset", s_id, c);
  for (const s of JSON.parse(c)) {
    if (s.__type__ === cc.js.getClassName(cc_1.Terrain)) {
      const s_id = s._id;
      var t = component_1.default.query(s_id);

      if (t && t._asset && t._asset._uuid) {
        await cce.Terrain.saveAssetDialog();
      }
    }
  }

  if (s_id !== a.uuid) {
    multi_scene_1.default.multiSceneClose(a.uuid, "scene");
  }

  scene_cache_1.sceneCacheManager.clearSceneCache(a.uuid);
  multi_scene_1.default.broadcastSceneDirty(s_id, "scene");
}
function _serializeSceneData(e) {
  var a = new cc_1.SceneAsset();
  utils_1.prefabUtils.gatherPrefabInstanceRoots(e);
  utils_1.prefabUtils.removeInvalidPrefabData(e);
  a.scene = e;
  return cce.Utils.serialize(a);
}
function _serializePrefabData(e) {
  e = utils_1.prefabUtils.getPrefabForSerialize(e).prefab;
  return cce.Utils.serialize(e);
}
