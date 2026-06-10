async function migrateLocal(e) {
  if (e.BuildTaskManager && e.BuildTaskManager.taskMap) {
    for (const s of Object.keys(e.BuildTaskManager.taskMap)) {
      var a = e.BuildTaskManager.taskMap[s].options;
      if (typeof a.useSplashScreen == "boolean") {
        break;
      }
      a.useSplashScreen = true;
      delete a.replaceSplashScreen;
    }
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
