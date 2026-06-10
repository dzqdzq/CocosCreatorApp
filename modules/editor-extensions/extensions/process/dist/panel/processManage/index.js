var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, r, t, o = t) => {
        var n = Object.getOwnPropertyDescriptor(r, t);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : r.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return r[t];
            },
          };
        }

        Object.defineProperty(e, o, n);
      }
    : (e, r, t, o) => {
        e[(o = o === undefined ? t : o)] = r[t];
      });

var __exportStar =
  (this && this.__exportStar) ||
  ((e, r) => {
    for (var t in e) {
      if (t !== "default" && !Object.prototype.hasOwnProperty.call(r, t)) {
        __createBinding(r, e, t);
      }
    }
  });

Object.defineProperty(exports, "__esModule", { value: true });
exports.macProcess = exports.windowProcess = undefined;
__exportStar(require("./process-manage"), exports);
var win_process_manage_1 = require("./win-process-manage");

Object.defineProperty(exports, "windowProcess", {
  enumerable: true,
  get() {
    return win_process_manage_1.windowProcess;
  },
});

var mac_process_manage_1 = require("./mac-process-manage");

Object.defineProperty(exports, "macProcess", {
  enumerable: true,
  get() {
    return mac_process_manage_1.macProcess;
  },
});
