var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, n, r = n) => {
        var s = Object.getOwnPropertyDescriptor(t, n);

        if (
          !s ||
          (!("get" in s) ? !s.writable && !s.configurable : t.__esModule)
        ) {
          s = {
            enumerable: true,
            get() {
              return t[n];
            },
          };
        }

        Object.defineProperty(e, r, s);
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
    var s = (e) =>
      (s =
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
        for (var n = s(e), r = 0; r < n.length; r++) {
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
exports.b2pIpc = undefined;
exports.b2sIpc = undefined;
const ipc = __importStar(require("@base/electron-base-ipc"));
const events_1 = require("events");
class BrowserToSceneIpc extends events_1.EventEmitter {
  bind() {
    ipc.on("native-from-scene", (e, t, ...n) => {
      this.emit(t, ...n);
    });

    ipc.on("native-from-scene-preview", (e, t, ...n) => {
      this.emit(t, ...n);
    });
  }
  unbind() {}
  sendToScene(e, ...t) {
    e = { message: e, params: t };
    return ipc.sendToChannel("native-from-browser", "native-scene", e);
  }
  async requestToScene(t, ...r) {
    return new Promise((n, e) => {
      this.sendToScene(t, ...r).callback((e, t) => {
        n(e ? null : t);
      });
    });
  }
  sendToPreview(e, ...t) {
    e = { message: e, params: t };
    return ipc.sendToChannel("native-from-browser-preview", "native-scene", e);
  }
  async requestToPreview(t, ...r) {
    return new Promise((n, e) => {
      this.sendToPreview(t, ...r).callback((e, t) => {
        n(e ? null : t);
      });
    });
  }
}
const b2sIpc = new BrowserToSceneIpc();
exports.b2sIpc = b2sIpc;
class BrowserToPanelIpc extends events_1.EventEmitter {
  send(e, ...t) {
    Editor.Message.send("scene", "browser-panel", e, ...t);
  }
  async request(e, ...t) {
    return Editor.Message.request("scene", "browser-panel", e, ...t);
  }
}
const b2pIpc = new BrowserToPanelIpc();
exports.b2pIpc = b2pIpc;
