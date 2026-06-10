var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, a = r) => {
        var c = Object.getOwnPropertyDescriptor(t, r);

        if (
          !c ||
          (!("get" in c) ? !c.writable && !c.configurable : t.__esModule)
        ) {
          c = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, a, c);
      }
    : (e, t, r, a) => {
        e[(a = a === undefined ? r : a)] = t[r];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var c = (e) =>
      (c =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var r = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              r[r.length] = t;
            }
          }
          return r;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var r = c(e), a = 0; a < r.length; a++) {
          if (r[a] !== "default") {
            __createBinding(t, e, r[a]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateGeometryCurve330 = migrateGeometryCurve330;
const cc = __importStar(require("cc"));
const archive_space_1 = require("./archive-space");
async function migrateGeometryCurve330(c) {
  function i(e) {
    switch (e) {
      default:
      case archive_space_1.ArchiveSpace.GeometryCurveWrapMode.Default:
      case archive_space_1.ArchiveSpace.GeometryCurveWrapMode.Normal:
      case archive_space_1.ArchiveSpace.GeometryCurveWrapMode.Clamp: {
        return cc.ExtrapolationMode.CLAMP;
      }
      case archive_space_1.ArchiveSpace.GeometryCurveWrapMode.PingPong: {
        return cc.ExtrapolationMode.PING_PONG;
      }
      case archive_space_1.ArchiveSpace.GeometryCurveWrapMode.Loop: {
        return cc.ExtrapolationMode.LOOP;
      }
    }
  }
  c.visitTypedObject(
    archive_space_1.ArchiveSpace.GEOMETRY_CURVE_TYPE_NAME,
    (e) => {
      t = e;

      a = (r = c).addTypedObject(
        archive_space_1.ArchiveSpace.REAL_CURVE_TYPE_NAME
      );

      a._times = t.keyFrames.map((e) => e.time);

      a._values = t.keyFrames.map((e) => {
        var t = r.addTypedObject(
          archive_space_1.ArchiveSpace.REAL_CURVE_KEYFRAME_VALUE_TYPE_NAME
        );
        t.interpolationMode = cc.RealInterpolationMode.CUBIC;
        t.tangentWeightMode =
          archive_space_1.ArchiveSpace.TangentWeightMode.NONE;
        t.value = e.value;
        t.leftTangent = e.inTangent;
        t.rightTangent = e.outTangent;
        t.rightTangentWeight = 0;
        t.leftTangentWeight = 0;
        t.easingMethod = 0;
        return t;
      });

      a.preExtrapolation = i(t.preWrapMode);
      a.postExtrapolation = i(t.postWrapMode);
      var r;
      var t = a;
      c.clearObject(e);
      var a = e;
      a._curve = t;
      return a;
    }
  );
}
