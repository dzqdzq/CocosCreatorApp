async function migrateLocal(i) {
  if (
    i.options &&
    (i.options.android &&
      typeof i.options.android.apiLevel == "string" &&
      migrateAPILevel(i.options.android.apiLevel, (e) => {
        i.options.android.apiLevel = e;
      }),
    i.options["huawei-agc"]) &&
    i.options["huawei-agc"].apiLevel
  ) {
    migrateAPILevel(i.options["huawei-agc"].apiLevel, (e) => {
      i.options["huawei-agc"].apiLevel = e;
    });
  }
}
function migrateAPILevel(e, i) {
  e = e.match("android-([0-9]+)$");

  if (e) {
    i(parseInt(e[1]));
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
