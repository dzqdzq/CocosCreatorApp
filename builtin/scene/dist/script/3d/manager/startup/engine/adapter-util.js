function importWebAdapter(e) {
  require(e);
}
async function importNativeEngine(e) {
  var e = require(e);
  var t = await Editor.Message.request("scene", "query-scene-bounds");
  e.initEngine(t.width, t.height);
  return e;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.importWebAdapter = importWebAdapter;
exports.importNativeEngine = importNativeEngine;
