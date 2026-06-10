async function migrateProject(e) {
  await migratePreserveSymlinks(e);
}
async function migratePreserveSymlinks(e) {
  var r = await Editor.Project.__protected__.getLastEditorVersion();

  if (r && compareVersion("3.8.1", r)) {
    e.script || (e.script = {});
    e.script.preserveSymlinks = true;
  }
}
function compareVersion(e, r, t = ".") {
  return (
    typeof e != "string" ||
    typeof r != "string" ||
    ((e = e.replace(t, "").padStart(3, "0")),
    (r = r.replace(t, "").padStart(3, "0")),
    Number(e) > Number(r))
  );
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateProject = migrateProject;
exports.migratePreserveSymlinks = migratePreserveSymlinks;
