function migrateLocal(t) {
  migrateTerrainFloatWindowConfig(t);
}
function migrateTerrainFloatWindowConfig(e) {
  var i = "terrain-float-window";
  for (const r in e) {
    var t = Editor.Utils.UUID.isUUID(r);
    var o = e[r];
    if (t && o.sculpt_brush_rotate !== undefined) {
      let t = e[i];
      t = t || {};
      t[r] = o;
      e[i] = t;
      delete e[r];
    }
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
