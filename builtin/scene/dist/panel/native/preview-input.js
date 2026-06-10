Object.defineProperty(exports, "__esModule", { value: true });
exports.enableInput = enableInput;
exports.registerInput = registerInput;
exports.unregisterInput = unregisterInput;
const device_adapter_1 = require("../../script/utils/device-adapter");
const ipc_1 = require("./ipc");
let leftButton = false;
let middleButton = false;
let rightButton = false;
const isWin32 = process.platform === "win32";
let previewElement = null;
let previewPanel = null;
const utils = {
  createMouseEvent(e, t) {
    var n = t.getBoundingClientRect();
    var o = isWin32 ? devicePixelRatio : 1 / devicePixelRatio;

    var n = {
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
      x: (e.pageX - n.x) * o,
      y: (e.pageY - n.y) * o,
      clientX: (e.clientX - n.x) * o,
      clientY: (e.clientY - n.y) * o,
      deltaX: e.deltaX || 0,
      deltaY: e.deltaY || 0,
      wheelDeltaX: e.wheelDeltaX || 0,
      wheelDeltaY: e.wheelDeltaY || 0,
      moveDeltaX: e.movementX || 0,
      moveDeltaY: e.movementY || 0,
      movementX: e.movementX,
      movementY: e.movementY,
      leftButton,
      middleButton,
      rightButton,
      button: e.button,
      buttons: e.buttons,
    };

    if (device_adapter_1.NativeAdapter.enable) {
      o = device_adapter_1.NativeAdapter.offsetX;

      0 < (e = device_adapter_1.NativeAdapter.offsetY)
        ? ((n.y -= e), (n.clientY -= e))
        : ((n.y += t.scrollTop), (n.clientY += t.scrollTop));

      o > 0
        ? ((n.x -= o), (n.clientX -= o))
        : ((n.x += t.scrollTop), (n.clientX += t.scrollLeft));
    }

    return n;
  },
  createKeyboardEvent(e) {
    return {
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
      key: e.key,
      keyCode: e.keyCode,
      code: e.code,
      repeat: e.repeat,
    };
  },
  createDragEvent(e, t) {
    var { type, value, name, additional } =
      Editor.UI.__protected__.DragArea.currentDragInfo || {};

    var e = utils.createMouseEvent(e, t);
    e.name = name;
    e.type = type;
    e.value = value;
    e.values = [];
    let i = [];

    if (Array.isArray(additional)) {
      e.values = additional;
      i = e.values.map((e) => e.value);
    }

    if (value && !i.includes(value)) {
      e.values.push({ value: value, type: type, name: name });
    }

    return e;
  },
  createConfirmEvent(e) {
    return { path: e.target.getAttribute("path"), value: e.target.value };
  },
  sendToScene(e, t) {
    if (previewPanel) {
      ipc_1.PanelIpc.sendToScene("handleInput", e, t);
    }
  },
};
function checkMouseButtonState(e, t) {
  leftButton = e.button === 0 ? t : leftButton;
  middleButton = e.button === 1 ? t : middleButton;
  rightButton = e.button === 2 ? t : rightButton;
}
let inputEnabled = false;
function enableInput(e) {
  inputEnabled = e;
}
function registerInput(o, e) {
  previewElement = o;
  previewPanel = e;

  o.addEventListener("mousedown", (e) => {
    function n(e) {
      if (e.movementX !== 0 || e.movementY !== 0) {
        utils.sendToScene("mouse-move", utils.createMouseEvent(e, o));
      }
    }

    if (inputEnabled) {
      document.body.style.pointerEvents = "none";
      checkMouseButtonState(e, true);
      utils.sendToScene("mouse-down", utils.createMouseEvent(e, o));

      document.addEventListener("mouseup", function e(t) {
        if (device_adapter_1.NativeAdapter.enable) {
          o._preview?.focus();
        }

        document.body.style.pointerEvents = "";
        utils.sendToScene("mouse-up", utils.createMouseEvent(t, o));
        checkMouseButtonState(t, false);
        document.removeEventListener("mouseup", e);
        document.removeEventListener("mousemove", n);
      });

      document.addEventListener("mousemove", n);
    }
  });

  o.addEventListener("mousemove", (e) => {
    if (inputEnabled && (e.movementX !== 0 || e.movementY !== 0)) {
      utils.sendToScene("mouse-move", utils.createMouseEvent(e, o));
    }
  });

  o.addEventListener("wheel", (e) => {
    if (inputEnabled) {
      utils.sendToScene("mouse-wheel", utils.createMouseEvent(e, o));
    }
  });

  o.addEventListener("keydown", (e) => {
    if (inputEnabled) {
      utils.sendToScene("keydown", utils.createKeyboardEvent(e));
    }
  });

  o.addEventListener("keyup", (e) => {
    if (inputEnabled) {
      utils.sendToScene("keyup", utils.createKeyboardEvent(e));
    }
  });
}
function unregisterInput(e) {
  e.removeEventListener("mousedown");
  e.removeEventListener("mousemove");
  e.removeEventListener("wheel");
  e.removeEventListener("keydown");
  e.removeEventListener("keyup");
}
