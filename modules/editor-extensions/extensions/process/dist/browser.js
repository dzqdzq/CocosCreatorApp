var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, o = r) => {
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

        Object.defineProperty(e, o, n);
      }
    : (e, t, r, o) => {
        e[(o = o === undefined ? r : o)] = t[r];
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
        for (var r = n(e), o = 0; o < r.length; o++) {
          if (r[o] !== "default") {
            __createBinding(t, e, r[o]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
const processMg = __importStar(require("./panel/utils"));
exports.methods = {
  open() {
    Editor.Panel.open("process");
  },
  queryProcessTree: processMg.queryProcessTree,
  openPanelDevTool: processMg.openPanelDevTool,
  closeProcessByPid: processMg.closeProcessByPid,
  registerProcessInfo(e, t) {
    processMg.processNameMap[e] = t;
  },
};
