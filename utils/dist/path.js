var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, a = r) => {
        var n = Object.getOwnPropertyDescriptor(t, r);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : t.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, a, n);
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
    var n = (e) =>
      (n =
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
        for (var r = n(e), a = 0; a < r.length; a++) {
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

exports.format = undefined;
exports.parse = undefined;
exports.delimiter = undefined;
exports.sep = undefined;
exports.extname = undefined;
exports.basename = undefined;
exports.dirname = undefined;
exports.relative = undefined;
exports.isAbsolute = undefined;
exports.resolve = undefined;
exports.join = undefined;

exports.basenameNoExt = basenameNoExt;
exports.slash = slash;
exports.stripSep = stripSep;
exports.stripExt = stripExt;
exports.contains = contains;
exports.normalize = normalize;
const Path = __importStar(require("path"));
function basenameNoExt(e) {
  return Path.basename(e, Path.extname(e));
}
function slash(e) {
  return e.replace(/\\/g, "/");
}
function stripSep(e) {
  e = Path.normalize(e);
  let t;
  for (t = e.length - 1; t >= 0 && e[t] === Path.sep; --t) {}
  return e.substring(0, t + 1);
}
function stripExt(e) {
  var t = Path.extname(e);
  return e.substring(0, e.length - t.length);
}
function contains(e, t) {
  e = stripSep(e);
  t = stripSep(t);

  if (process.platform === "win32") {
    e = e.toLowerCase();
    t = t.toLowerCase();
  }

  return (
    e === t ||
    (Path.dirname(e) !== Path.dirname(t) &&
      e.length < t.length &&
      t.indexOf(e + Path.sep) === 0)
  );
}
function normalize(e) {
  e = Path.normalize(e);

  e =
    process.platform === "win32" &&
    /^[a-z]/.test(e[0]) &&
    !/electron.asar/.test(e)
      ? e[0].toUpperCase() + e.substr(1)
      : e;

  return e;
}
exports.join = Path.join;
exports.resolve = Path.resolve;
exports.isAbsolute = Path.isAbsolute;
exports.relative = Path.relative;
exports.dirname = Path.dirname;
exports.basename = Path.basename;
exports.extname = Path.extname;
exports.sep = Path.sep;
exports.delimiter = Path.delimiter;
exports.parse = Path.parse;
exports.format = Path.format;
