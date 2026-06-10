async function migrateLocal(e) {
  if (
    e.options &&
    e.options["vivo-mini-game"] &&
    e.options["vivo-mini-game"].startSceneAssetBundle
  ) {
    e.common || (e.common = {});
    e.common.startSceneAssetBundle =
      e.options["vivo-mini-game"].startSceneAssetBundle;
    delete e.options["vivo-mini-game"].startSceneAssetBundle;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
