Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateGlobal = migrateGlobal;
const KEY = "scene";
const DEBUG_NATIVE = "debug-native";
const NATIVE_ENGINE = "native-engine";
function migrateGlobal(e) {
  for (const E in e) {
    var t;

    if (E === KEY) {
      delete (t = e[E])[DEBUG_NATIVE];
      delete t[NATIVE_ENGINE];
    }
  }
}
