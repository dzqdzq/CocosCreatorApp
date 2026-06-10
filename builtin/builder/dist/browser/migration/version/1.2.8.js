function migrateGlobal(e) {
  if (typeof e == "object") {
    delete e.common;
    delete e.projectSettings;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateGlobal = migrateGlobal;
