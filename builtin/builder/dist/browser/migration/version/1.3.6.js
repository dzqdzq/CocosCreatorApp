async function migrateProject(t) {
  var e;

  if (
    t["splash-setting"] &&
    (e = t["splash-setting"].url) &&
    Editor.Utils.Path.contains(Editor.App.path, e)
  ) {
    delete t["splash-setting"].url;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateProject = migrateProject;
