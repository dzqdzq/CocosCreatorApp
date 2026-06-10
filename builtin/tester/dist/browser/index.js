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
exports.methods = undefined;
const electron_1 = require("electron");

const { autoTest } = require("./auto-test");

const ipc = __importStar(require("@base/electron-base-ipc"));
const panelManager = require("@editor/panel");
exports.methods = {
  open() {
    Editor.Panel.open("tester.panel");
  },
  "forwarding-to-window"(e, ...t) {
    var r = panelManager.getWindow(e);
    if (r) {
      const o = electron_1.BrowserWindow.fromId(r);
      if (o) {
        return new Promise((r, n) => {
          ipc
            .sendToWin(o, "package-tester:message", e, ...t)
            .callback((e, t) => {
              if (e) {
                return n(e);
              }
              r(t);
            });
        });
      }
    }
    throw new Error("The panel doesn't exist: " + e);
  },
  async "auto-test"(e, t = 0) {
    try {
      return await autoTest(e);
    } catch (e) {
      console.error(e);
      return -1;
    }
  },
};
