async function migrateLocal(a) {
  if (a.BuildTaskManager && a.BuildTaskManager.taskMap) {
    for (const o of Object.keys(a.BuildTaskManager.taskMap)) {
      var e = a.BuildTaskManager.taskMap[o];

      if (e && e.options && e.options.buildMode === undefined) {
        e.options.buildMode = "normal";
      }
    }
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
