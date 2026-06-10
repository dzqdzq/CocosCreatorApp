var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, n, r = n) => {
        var o = Object.getOwnPropertyDescriptor(t, n);

        if (
          !o ||
          (!("get" in o) ? !o.writable && !o.configurable : t.__esModule)
        ) {
          o = {
            enumerable: true,
            get() {
              return t[n];
            },
          };
        }

        Object.defineProperty(e, r, o);
      }
    : (e, t, n, r) => {
        e[(r = r === undefined ? n : r)] = t[n];
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
          var n = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              n[n.length] = t;
            }
          }
          return n;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var n = o(e), r = 0; r < n.length; r++) {
          if (n[r] !== "default") {
            __createBinding(t, e, n[r]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMangleConfig = parseMangleConfig;
const fs = __importStar(require("fs-extra"));
function mergeConfigs(e, t) {
  return {
    mangleProtected: (t.mangleProtected !== undefined ? t : e).mangleProtected,
    mangleList: [...(e.mangleList || []), ...(t.mangleList || [])],
    dontMangleList: [...(e.dontMangleList || []), ...(t.dontMangleList || [])],
    extends: e.extends,
  };
}
function parseMangleConfig(t, n) {
  if (fs.existsSync(t)) {
    var r = fs.readJSONSync(t, "utf-8");
    if (!r[n]) {
      throw new Error(`Platform ${n} not found in the configuration file.`);
    }
    let e = r[n];

    while (e.extends) {
      var o = r[e.extends];
      if (!o) {
        throw new Error(`Base configuration ${e.extends} not found.`);
      }
      e = mergeConfigs(o, e);
    }

    return e;
  }
}
