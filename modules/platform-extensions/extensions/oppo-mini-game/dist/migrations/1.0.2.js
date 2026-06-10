async function migrateLocal(e) {
  if (
    e.options &&
    e.options["oppo-mini-game"] &&
    e.options["oppo-mini-game"].startSceneAssetBundle
  ) {
    e.common || (e.common = {});
    e.common.startSceneAssetBundle =
      e.options["oppo-mini-game"].startSceneAssetBundle;
    delete e.options["oppo-mini-game"].startSceneAssetBundle;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
