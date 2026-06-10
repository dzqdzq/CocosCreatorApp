async function migrateLocal(e) {
  if (
    e.options &&
    e.options["link-sure"] &&
    e.options["link-sure"].resourceURL
  ) {
    e.common || (e.common = {});
    e.common.server = e.options["link-sure"].resourceURL;
    delete e.options["link-sure"].resourceURL;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = undefined;
exports.migrateLocal = migrateLocal;
