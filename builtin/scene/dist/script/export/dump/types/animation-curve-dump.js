var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, r, t, n = t) => {
        var u = Object.getOwnPropertyDescriptor(r, t);

        if (
          !u ||
          (!("get" in u) ? !u.writable && !u.configurable : r.__esModule)
        ) {
          u = {
            enumerable: true,
            get() {
              return r[t];
            },
          };
        }

        Object.defineProperty(e, n, u);
      }
    : (e, r, t, n) => {
        e[(n = n === undefined ? t : n)] = r[t];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, r) => {
        Object.defineProperty(e, "default", { enumerable: true, value: r });
      }
    : (e, r) => {
        e.default = r;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var u = (e) =>
      (u =
        Object.getOwnPropertyNames ||
        ((e) => {
          var r;
          var t = [];
          for (r in e) {
            if (Object.prototype.hasOwnProperty.call(e, r)) {
              t[t.length] = r;
            }
          }
          return t;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var r = {};
      if (e != null) {
        for (var t = u(e), n = 0; n < t.length; n++) {
          if (t[n] !== "default") {
            __createBinding(r, e, t[n]);
          }
        }
      }
      __setModuleDefault(r, e);
      return r;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.animationCurveDump = undefined;
const real_curve_dump_1 = require("./real-curve-dump");
const cc = __importStar(require("cc"));
class AnimationCurveDump {
  encode(e, r, t) {
    real_curve_dump_1.realCurveDump.encode(e._internalCurve, r, t);
  }
  decode(e, r, t, n) {
    if (cc.js.getClassName(e) !== "cc.CurveRange") {
      e = e[r.key]._internalCurve;
      real_curve_dump_1.realCurveDump.decodeByDump(t, e, n);
    }
  }
}
exports.animationCurveDump = new AnimationCurveDump();
