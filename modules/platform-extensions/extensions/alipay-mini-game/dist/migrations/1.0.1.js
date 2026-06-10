async function migrateLocal(e) {
  if (
    e.options &&
    e.options["alipay-mini-game"] &&
    e.options["alipay-mini-game"].remoteUrl
  ) {
    e.common || (e.common = {});
    e.common.server = e.options["alipay-mini-game"].remoteUrl;
    delete e.options["alipay-mini-game"].remoteUrl;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
