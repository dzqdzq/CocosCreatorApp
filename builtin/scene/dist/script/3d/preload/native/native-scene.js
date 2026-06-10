var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, n, r = n) => {
        var i = Object.getOwnPropertyDescriptor(t, n);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : t.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return t[n];
            },
          };
        }

        Object.defineProperty(e, r, i);
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
    var i = (e) =>
      (i =
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
        for (var n = i(e), r = 0; r < n.length; r++) {
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
const ipc = __importStar(require("@base/electron-base-ipc"));

const Events = {
  "mouse-down": "_dispatchMouseDownEvent",
  "mouse-move": "_dispatchMouseMoveEvent",
  "mouse-up": "_dispatchMouseUpEvent",
  "mouse-wheel": "_dispatchMouseScrollEvent",
  keydown: "_dispatchKeyboardDownEvent",
  keyup: "_dispatchKeyboardUpEvent",
};

const isPreview = isPreviewProcess;

const ReceiveChannel = isPreview
  ? "native-from-browser-preview"
  : "native-from-browser";

const SendChannel = isPreview
  ? "native-from-scene-preview"
  : "native-from-scene";
const isWin32 = process.platform === "win32";
const minLength = isWin32 ? 10 : 30;
let ccInput = null;
class NativeScene {
  windowMap = new Map();
  intervalHandle = null;
  redrawTimes = 0;
  constructor() {
    ipc.registerChannel(ReceiveChannel);

    ipc.on(
      "native-scene",
      (async (e, t) => {
        var { message: t, params } = t;

        if (this[t]) {
          params = await this[t].call(this, ...params);
          e.reply(null, params);
        } else {
          console.warn(`browserToScene ${t} not exist`);
        }
      }).bind(this)
    );
  }
  createWindow(e, t, n) {
    n = Buffer.from(n, "base64");
    let r = this.windowMap.get(t);

    if (!r) {
      e.width <= 0 && (e.width = minLength);
      e.height <= 0 && (e.height = minLength);
      r = new NativeWindow(e.width, e.height, n);
      this.windowMap.set(t, r);
      this.resize(e.x, e.y, e.width, e.height, t);
    }

    return { handler: r.handler, isPreviewProcess: isPreview };
  }
  close(e) {
    this.setVisible(e, false);
    this.redirectTargetWindow(e, true);
  }
  async resize(e, t, n, r, i) {
    i = this.windowMap.get(i);
    if (i) {
      if (e && t) {
        i.x = e;
        i.y = t;
        i.setPos(e, t);
      }

      if (n && r) {
        i.width = n;
        i.height = r;
        i.setSize(n, r);
      }

      i.updateContextID?.();
      await this.redraw();
      return i.handler;
    }
  }
  redirectTargetWindow(e, t = false) {
    var n = this.windowMap.get(e);
    let r = 0;
    if (n) {
      n.renderWindow.clearCameras();
      var i;
      var e = cc.director.getScene().renderScene?.cameras ?? [];

      var s = cc.Layers.makeMaskInclude([
        cc.Layers.Enum.GIZMOS,
        cc.Layers.Enum.SCENE_GIZMO,
        cc.Layers.Enum.EDITOR,
      ]);

      for (const a of e) {
        if (!(a.node.layer & s)) {
          i = t ? cc.director.root.tempWindow : n.renderWindow;
          a.changeTargetWindow(i);
          a.update(true);
          r++;
        }
      }
    }
    return r;
  }
  async handleInput(e, t) {
    var n;
    var e = Events[e];

    if (
      e &&
      (ccInput ||
        ((n = (await Promise.resolve().then(() => __importStar(require("cc"))))
          .input),
        (ccInput = n)),
      ccInput)
    ) {
      t.windowId = 2;
      ccInput[e]?.(t);
    }
  }
  async setVisible(e, t) {
    e = this.windowMap.get(e);
    if (
      e &&
      (t
        ? (e.setPos(e.x, e.y), e.setSize(e.width, e.height))
        : (e.setPos(10, 10), e.setSize(minLength, minLength)),
      await this.redraw(),
      !isWin32)
    ) {
      e.updateContextID?.();
      return e.handler;
    }
  }
  async redraw() {
    return new Promise((e) => {
      cce.Engine?.repaintInEditMode();

      if (cc.director) {
        cc.director.once(cc.Director.EVENT_AFTER_DRAW, () => {
          e(true);
        });
      }
    });
  }
  sendToBrowser(e, ...t) {
    ipc.send(SendChannel, e, ...t);
  }
}
exports.default = new NativeScene();
