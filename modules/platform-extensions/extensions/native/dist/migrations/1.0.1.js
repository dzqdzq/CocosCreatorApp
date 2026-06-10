async function migrateLocal(e) {
  var o;

  if (e.options) {
    if (e.__buildTaskOptions__) {
      o = e.__buildTaskOptions__.packages.native;
      e.__buildTaskOptions__.server =
        e.__buildTaskOptions__.server || o.remoteServerAddress;
      e.__buildTaskOptions__.polyfills =
        e.__buildTaskOptions__.polyfills || o.polyfills;
    } else {
      Object.keys(e.options).forEach((o) => {
        if (e.options[o] && e.options[o].remoteServerAddress) {
          Editor.Profile.setConfig(
            o,
            "common.server",
            e.options[o].remoteServerAddress
          );

          delete e.options[o].remoteServerAddress;
        }

        if (e.options[o] && e.options[o].polyfills) {
          Editor.Profile.setConfig(
            o,
            "common.polyfills",
            e.options[o].polyfills
          );

          delete e.options[o].polyfills;
        }
      });
    }
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
