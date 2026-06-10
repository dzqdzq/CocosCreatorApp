async function migrateProject(e) {
  if (
    e["splash-setting"] &&
    typeof e["splash-setting"].url == "string" &&
    e["splash-setting"].url.includes("app.asar")
  ) {
    delete e["splash-setting"].url;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateProject = migrateProject;
