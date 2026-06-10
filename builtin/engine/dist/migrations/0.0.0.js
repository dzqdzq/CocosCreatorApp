Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateProject = migrateProject;

const { migrateProject: migrateProject_2 } = require("./1.0.6");

async function migrateProject(e) {
  var o = await Editor.Profile.getProject("project", "macroConfig", "project");

  var r = await Editor.Profile.getProject(
    "builder",
    "projectSetting.modules",
    "project"
  );

  if (o && !e.macroConfig) {
    e.macroConfig = o;
  }

  if (r && !e.modules) {
    e.modules = r;
  }

  await Editor.Profile.removeProject("project", "macroConfig");
  await Editor.Profile.removeProject("builder", "projectSetting.modules");
  migrateProject_2(e);
}
