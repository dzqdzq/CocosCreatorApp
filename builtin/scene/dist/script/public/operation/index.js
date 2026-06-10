Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationPriority = undefined;
const cc_1 = require("cc");

const { getMainWindowSize } = require("../../utils/window");

let isBind = false;
const isWin32 = process.platform === "win32";
class ProportionalToScene extends cc.ResolutionPolicy.ContainerStrategy {
  apply(e, t) {
    var i = e._frameSize.width;
    var n = e._frameSize.height;
    var r = cc.game.container.style;
    var t_width = t.width;
    var t = t.height;
    var o = i / t_width;
    var d = n / t;
    let a;
    let c;
    c = o < d ? ((a = i), t * o) : ((a = t_width * d), n);
    t = Math.round((i - a) / 2);
    o = Math.round((n - c) / 2);
    a = i - 2 * t;
    c = n - 2 * o;
    this._setupContainer(e, a, c);
    r.margin = "0";
  }
}
function bindEvent(i) {
  if (!isBind) {
    isBind = true;

    if (isSceneNative) {
      let t = getMainWindowSize();
      cc_1.view.on("canvas-resize", () => {
        var e = getMainWindowSize();

        if (e.width !== t.width || e.height !== t.height) {
          t = e;
          i.emit("resize", t);
        }
      });
    } else {
      cc_1.view.on("canvas-resize", () => {
        i.emit("resize", {
          width: cc_1.game.canvas.width,
          height: cc_1.game.canvas.height,
        });
      });
    }

    if (typeof window.matchMedia == "function") {
      const t = () => {
        var window_devicePixelRatio = window.devicePixelRatio;
        window
          .matchMedia(`(resolution: ${window_devicePixelRatio}dppx)`)
          .addEventListener(
            "change",
            () => {
              window.dispatchEvent(new Event("resize"));
              t();
            },
            { once: true }
          );
      };
      t();
    }
  }
}
class Operation {
  _debug = false;
  _debugNode = null;
  _events = new Map();
  constructor() {
    bindEvent(this);

    window.addEventListener("load", () => {
      bindEvent(this);
    });
  }
  requestPointerLock() {
    cce.Ipc.send("lock-pointer", true);
  }
  exitPointerLock() {
    cce.Ipc.send("lock-pointer", false);
  }
  changePointer(e) {
    if (
      ![
        "-webkit-grab",
        "-webkit-grabbing",
        "zoom-in",
        "zoom-out",
        "n-resize",
        "s-resize",
        "e-resize",
        "w-resize",
        "ne-resize",
        "ew-resize",
        "nw-resize",
        "ns-resize",
        "se-resize",
        "sw-resize",
        "nesw-resize",
        "nwse-resize",
        "col-resize",
        "row-resize",
        "text",
        "vertical-text",
        "context-menu",
        "copy",
        "move",
        "none",
        "default",
        "pointer",
        "inherit",
        "initial",
        "alias",
        "all-scroll",
        "auto",
        "cell",
        "crosshair",
        "no-drop",
        "not-allowed",
        "progress",
        "unset",
        "wait",
      ].includes(e)
    ) {
      e = "default";
    }

    cce.Ipc.send("change-pointer", e);
  }
  get debug() {
    return this._debug;
  }
  set debug(e) {
    this._debug = e;
    this.updateDebugUI(e);
  }
  updateDebugUI(e) {
    if (e) {
      if (!this._debugNode) {
        this._debugNode = document.createElement("div");
        document.body.append(this._debugNode);

        this._debugNode.setAttribute(
          "style",
          "position: absolute; width: 5px; height: 5px;border-radius: 50%;background-color: red;"
        );
      }
    } else if (this._debugNode) {
      document.body.removeChild(this._debugNode);
      this._debugNode = null;
    }
  }
  _emit(e, ...i) {
    var n = this._events.get(e);
    if (n) {
      for (let t = 0; t < n.length; t++) {
        var r = n[t];
        let e;
        if (
          false ===
          (e = (typeof r == "function" ? r : ((r = r.listener), r))(...i))
        ) {
          return;
        }
      }
    }
  }
  emit(e, ...t) {
    return this._emit(e, ...t);
  }
  _emitMouseEvent(e, i) {
    var n = this._events.get(e);
    if (n) {
      let e = isSceneNative ? devicePixelRatio : cc.screen.devicePixelRatio;

      if (isSceneNative && !isWin32) {
        e = 1;
      }

      i.x *= e;
      i.y *= e;
      i.deltaX *= e;
      i.deltaY *= e;
      i.wheelDeltaX *= e;
      i.wheelDeltaY *= e;
      i.moveDeltaX *= e;
      i.moveDeltaY *= e;

      if (this._debug && (this.updateDebugUI(this._debug), this._debugNode)) {
        this._debugNode.style.left = i.x / e - 2 + "px";
        this._debugNode.style.top = i.y / e - 2 + "px";
      }

      for (let t = 0; t < n.length; t++) {
        var r = n[t];
        let e;
        if (
          false ===
          (e = (typeof r == "function" ? r : ((r = r.listener), r))(i))
        ) {
          return;
        }
      }
    }
  }
  on(e, t, i = undefined) {
    return this.addListener(e, t, i);
  }
  addListener(e, i, n = undefined) {
    if (!this._events.has(e)) {
      this._events.set(e, []);
    }

    var r = this._events.get(e);
    if (n) {
      let t = 0;
      for (let e = 0; e < r.length; e++) {
        if (!r[e].priority) {
          t = e;
          break;
        }
        if (r[e].priority < n) {
          t = e;
          break;
        }
        t++;
      }
      r.splice(t, 0, { listener: i, priority: n });
    } else {
      r.push(i);
    }
    return this;
  }
  removeListener(e, t) {
    if (!this._events.has(e)) {
      this._events.set(e, []);
    }

    var i = this._events.get(e);
    for (let e = 0; e < i.length; e++) {
      if (i[e] === t) {
        i.splice(e--, 1);
      }
    }
  }
}
var OperationPriority;
exports.default = new Operation();

((e) => {
  e[(e.Preview = 999)] = "Preview";
  e[(e.Gizmo = 99)] = "Gizmo";
  e[(e.Camera = 98)] = "Camera";
})(OperationPriority || (exports.OperationPriority = OperationPriority = {}));
