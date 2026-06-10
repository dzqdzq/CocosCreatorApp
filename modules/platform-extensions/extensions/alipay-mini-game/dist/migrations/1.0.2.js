async function migrateLocal(e) {
  if (
    e.options &&
    e.options["alipay-mini-game"] &&
    e.options["alipay-mini-game"].startSceneAssetBundle
  ) {
    e.common || (e.common = {});
    e.common.startSceneAssetBundle =
      e.options["alipay-mini-game"].startSceneAssetBundle;
    delete e.options["alipay-mini-game"].startSceneAssetBundle;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
