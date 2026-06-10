async function migrateLocal(e) {
  if (
    e.options &&
    e.options["bytedance-mini-game"] &&
    e.options["bytedance-mini-game"].startSceneAssetBundle
  ) {
    e.common || (e.common = {});
    e.common.startSceneAssetBundle =
      e.options["bytedance-mini-game"].startSceneAssetBundle;
    delete e.options["bytedance-mini-game"].startSceneAssetBundle;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
