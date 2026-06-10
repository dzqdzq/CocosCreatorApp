async function migrateProject(e) {
  if (e.textureCompressConfig && e.textureCompressConfig.userPreset) {
    Object.values(e.textureCompressConfig.userPreset).forEach((e) => {
      Object.values(e.options).forEach((t) => {
        Object.keys(t).forEach((e) => {
          if (!t[e].quality) {
            t[e] = { quality: t[e] };
          }
        });
      });
    });
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateProject = migrateProject;
