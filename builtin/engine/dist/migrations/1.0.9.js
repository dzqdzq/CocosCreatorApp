async function migrateProject(e) {
  if (e.modules && e.modules.cache && e.modules.cache.graphcis) {
    e.modules.cache.graphics = e.modules.cache.graphcis;
    delete e.modules.cache.graphcis;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateProject = migrateProject;
