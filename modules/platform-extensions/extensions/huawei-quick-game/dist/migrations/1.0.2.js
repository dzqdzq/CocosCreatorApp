async function migrateLocal(e) {
  if (
    e.options &&
    e.options["huawei-quick-game"] &&
    e.options["huawei-quick-game"].startSceneAssetBundle
  ) {
    e.common || (e.common = {});
    e.common.startSceneAssetBundle =
      e.options["huawei-quick-game"].startSceneAssetBundle;
    delete e.options["huawei-quick-game"].startSceneAssetBundle;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
