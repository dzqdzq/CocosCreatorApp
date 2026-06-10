async function migrateLocal(e) {
  if (
    e.options &&
    e.options.wechatgame &&
    e.options.wechatgame.remoteServerAddress
  ) {
    e.common || (e.common = {});
    e.common.server = e.options.wechatgame.remoteServerAddress;
    delete e.options.wechatgame.remoteServerAddress;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
