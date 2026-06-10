async function migrateLocal(e) {
  if (
    e.options &&
    e.options["xiaomi-quick-game"] &&
    e.options["xiaomi-quick-game"].startSceneAssetBundle
  ) {
    e.common || (e.common = {});
    e.common.startSceneAssetBundle =
      e.options["xiaomi-quick-game"].startSceneAssetBundle;
    delete e.options["xiaomi-quick-game"].startSceneAssetBundle;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
