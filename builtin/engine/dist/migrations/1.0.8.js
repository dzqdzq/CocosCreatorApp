async function migrateProject(e) {
  if (e.macroConfig && e.macroConfig.DOWNLOAD_MAX_CONCURRENT) {
    await Editor.Profile.setProject(
      "project",
      "general.downloadMaxConcurrency",
      e.macroConfig.DOWNLOAD_MAX_CONCURRENT
    );

    delete e.macroConfig.DOWNLOAD_MAX_CONCURRENT;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateProject = migrateProject;
