async function migrateProject(e) {
  await migrateDesignResolution(e);
}
async function migrateDesignResolution(e) {
  var t = await Editor.Project.__protected__.getLastEditorVersion();

  if (t && compareVersion("3.8.0", t)) {
    if (
      !e.general ||
      !e.general.designResolution ||
      !e.general.designResolution.width ||
      !e.general.designResolution.height
    ) {
      e.general = e.general || {};
      e.general.designResolution = e.general.designResolution || {};
      e.general.designResolution.width =
        e.general.designResolution.width || 960;
      e.general.designResolution.height =
        e.general.designResolution.height || 640;
    }
  }
}
function compareVersion(e, t, i = ".") {
  return (
    typeof e != "string" ||
    typeof t != "string" ||
    ((e = e.replace(i, "").padStart(3, "0")),
    (t = t.replace(i, "").padStart(3, "0")),
    Number(e) > Number(t))
  );
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateProject = migrateProject;
exports.migrateDesignResolution = migrateDesignResolution;
