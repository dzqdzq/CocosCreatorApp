Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateCurveRange330 = undefined;
const archive_space_1 = require("./archive-space");
async function migrateCurveRange330(e) {
  e.visitTypedObject(
    archive_space_1.ArchiveSpace.CURVE_RANGE_TYPE_NAME,
    (i) => {
      const c = i;
      var e = (e, r) => {
        var a = i[e];

        if (a !== undefined) {
          c[r] = a._curve;
          delete i[e];
        }
      };
      e("curve", "spline");
      e("curveMin", "splineMin");
      e("curveMax", "splineMax");
    }
  );
}
exports.migrateCurveRange330 = migrateCurveRange330;
