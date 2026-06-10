async function migrateLocal(e) {
  if (
    e.options &&
    e.options["web-mobile"] &&
    (e.options["web-mobile"].remoteServerAddress ||
      e.options["web-mobile"].polyfills) &&
    (e.common || (e.common = {}),
    e.options["web-mobile"].remoteServerAddress &&
      ((e.common.server = e.options["web-mobile"].remoteServerAddress),
      delete e.options["web-mobile"].remoteServerAddress),
    e.options["web-mobile"].polyfills)
  ) {
    e.common.polyfills = e.options["web-mobile"].polyfills;
    delete e.options["web-mobile"].polyfills;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
