async function migrateProject(e) {
  var t = await Editor.Profile.getConfig("asset-db", "ignoreGlob");

  if (t) {
    e.ignoreGlobList = t.replace(/^!/, "");
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateProject = migrateProject;
