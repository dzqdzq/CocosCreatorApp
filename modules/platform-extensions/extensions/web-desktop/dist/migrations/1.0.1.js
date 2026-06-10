async function migrateLocal(e) {
  if (
    e.options &&
    e.options["web-desktop"] &&
    e.options["web-desktop"].remoteServerAddress
  ) {
    e.common || (e.common = {});
    e.common.server = e.options["web-desktop"].remoteServerAddress;
    delete e.options["web-desktop"].remoteServerAddress;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
