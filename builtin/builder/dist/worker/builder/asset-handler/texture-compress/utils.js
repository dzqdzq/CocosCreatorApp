var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, n = r) => {
        var o = Object.getOwnPropertyDescriptor(t, r);

        if (
          !o ||
          (!("get" in o) ? !o.writable && !o.configurable : t.__esModule)
        ) {
          o = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, n, o);
      }
    : (e, t, r, n) => {
        e[(n = n === undefined ? r : n)] = t[r];
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
    var o = (e) =>
      (o =
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
        for (var r = o(e), n = 0; n < r.length; n++) {
          if (r[n] !== "default") {
            __createBinding(t, e, r[n]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.changeSuffix = changeSuffix;
exports.getSuffix = getSuffix;
exports.changeInfoToLabel = changeInfoToLabel;
exports.roundToPowerOfTwo = roundToPowerOfTwo;
exports.checkCompressOptions = checkCompressOptions;
const Path = __importStar(require("path"));
function changeSuffix(e, t) {
  return Path.join(Path.dirname(e), Path.basename(e, Path.extname(e)) + t);
}
function getSuffix(e, t) {
  var r = cc.Texture2D.PixelFormat;

  if (e.formatSuffix && r[e.formatSuffix]) {
    t += "@" + r[e.formatSuffix];
  }

  return t;
}
function changeInfoToLabel(t) {
  return Object.keys(t)
    .map((e) => e + ":" + t[e])
    .join(",");
}
function roundToPowerOfTwo(e) {
  let t = 2;

  while (e > t) {
    t *= 2;
  }

  return t;
}
function checkCompressOptions(t, r, e) {
  var n = Object.keys(t).filter((e) => e.startsWith("etc"));

  var o = Object.keys(t).filter((e) => e.startsWith("pvr"));

  if (n.length > 1) {
    n.filter((e) => (r ? e.endsWith("rgb") : !e.endsWith("rgb"))).forEach(
      (e) => delete t[e]
    );
  }

  if (o.length > 1) {
    o.filter((e) => (r ? e.endsWith("rgb") : !e.endsWith("rgb"))).forEach(
      (e) => delete t[e]
    );
  } else if (!r && o[0] && o[0].endsWith("rgb_a")) {
    delete t[o[0]];

    console.warn(
      Editor.I18n.t("builder.warn.compress_rgb_a", {
        uuid: `{asset(${e})}`,
      })
    );
  }
}
