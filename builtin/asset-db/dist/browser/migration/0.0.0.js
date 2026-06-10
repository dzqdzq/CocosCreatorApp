async function migrateProject(e) {
  var t = await Editor.Profile.getConfig("asset-db", "ignoreGlob");

  if (
    t &&
    !Editor.Utils.Parse.compareVersion(
      await Editor.Project.__protected__.getLastEditorVersion(),
      "3.8.7"
    )
  ) {
    e.ignoreGlobList = t.replace(/^!/, "");
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateProject = migrateProject;
