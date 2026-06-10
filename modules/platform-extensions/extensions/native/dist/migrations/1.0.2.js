async function migrateLocal(e) {
  if (e.options) {
    Object.keys(e.options).forEach((o) => {
      if (e.options[o] && e.options[o].makeAfterBuild) {
        e.__buildTaskOptions__
          ? (e.__buildTaskOptions__.buildStageGroup = { build: ["make"] })
          : (e.common || (e.common = {}),
            (e.common.buildStageGroup = { build: ["make"] }));

        delete e.options[o].makeAfterBuild;
      }
    });
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
