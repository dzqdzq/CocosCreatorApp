Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
const GIZMOS_INFOS = "gizmos-infos";
const ORIGIN_AXIS_FROM = "originAxis";
const ORIGIN_AXIS_2D_TO = "originAxis2D";
const ORIGIN_AXIS_3D_TO = "originAxis3D";
const VISIBLE_KEYS = ["x_visible", "y_visible", "z_visible"];
function migrateLocal(I) {
  for (const i in I) {
    if (i === GIZMOS_INFOS) {
      var _ = I[i];
      if (_[ORIGIN_AXIS_FROM]) {
        for (const S of VISIBLE_KEYS) {
          var O = _[ORIGIN_AXIS_FROM][S];
          _[ORIGIN_AXIS_2D_TO] = _[ORIGIN_AXIS_2D_TO] || {};
          _[ORIGIN_AXIS_2D_TO][S] = O;
          _[ORIGIN_AXIS_3D_TO] = _[ORIGIN_AXIS_3D_TO] || {};
          _[ORIGIN_AXIS_3D_TO][S] = O;
        }
        delete _[ORIGIN_AXIS_FROM];
      }
    }
  }
}
