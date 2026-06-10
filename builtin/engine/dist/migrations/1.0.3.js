function migrateProject(e) {
  if (e.macroConfig && e.macroConfig.ENABLE_WEBGL_ANTIALIAS === false) {
    e.macroConfig.ENABLE_WEBGL_ANTIALIAS = true;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateProject = migrateProject;
