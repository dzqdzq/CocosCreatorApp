var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.status = undefined;
exports.stop = stop;
exports.start = start;
exports.init = init;
exports.release = release;
const device_adapter_1 = require("../script/utils/device-adapter");

const drag_drop_utils_1 = __importDefault(
  require("../script/utils/drag-drop-utils")
);

let leftButton = false;
let middleButton = false;
let rightButton = false;
let isClicked = false;
const utils = {
  createMouseEvent(e, t) {
    let { offsetX, offsetY } = e;

    var s = t.$scene.zoomFactor;

    var n =
      (e.target === t ||
        ((n = t.getBoundingClientRect()),
        (offsetX = e.clientX - n.x),
        (offsetY = e.clientY - n.y)),
      (offsetX *= s),
      (offsetY *= s),
      {
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
        x: offsetX,
        y: offsetY,
        clientX: offsetX,
        clientY: offsetY,
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
      });

    if (device_adapter_1.WebAdapter.enable) {
      e = device_adapter_1.WebAdapter.offsetX * s;

      0 < (s = device_adapter_1.WebAdapter.offsetY * s)
        ? ((n.y -= s), (n.clientY -= s))
        : ((n.y += t.scrollTop), (n.clientY += t.scrollTop));

      e > 0
        ? ((n.x -= e), (n.clientX -= e))
        : ((n.x += t.scrollLeft), (n.clientX += t.scrollLeft));
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
    let u = [];

    if (Array.isArray(additional)) {
      e.values = additional;
      u = e.values.map((e) => e.value);
    }

    if (value && !u.includes(value)) {
      e.values.push({ value: value, type: type, name: name });
    }

    return e;
  },
  createConfirmEvent(e) {
    return { path: e.target.getAttribute("path"), value: e.target.value };
  },
};
function stop() {
  exports.status = "pause";
}
function start() {
  exports.status = "ready";
}
function updateMouseButtonState(e) {
  leftButton = Boolean(1 & e.buttons);
  rightButton = Boolean(2 & e.buttons);
  middleButton = Boolean(4 & e.buttons);
  isClicked = leftButton || rightButton || middleButton;
}
exports.status = "pause";
const globalEventMap = new Map();
function previewMousedownDisable(e, t) {
  var a;
  var o;
  var s;
  var n;
  var u;
  var r;
  var i;
  var l;
  return (
    !!device_adapter_1.WebAdapter.enable &&
    (({
      offsetX: i,
      offsetY: r,
      width: l,
      height: a,
      screenWidth: o,
      screenHeight: s,
    } = device_adapter_1.WebAdapter),
    (u = t.getBoundingClientRect()),
    (n = e.clientX - u.x),
    (e = e.clientY - u.y),
    n < i ||
      i + l < n ||
      e < r ||
      r + a < e ||
      ((i = (u = o < l) ? t.offsetWidth - t.clientWidth : 0),
      (l = (r = s < a) ? t.offsetHeight - t.clientHeight : 0),
      u && o - i < n) ||
      (r && s - l < e))
  );
}
async function init(a) {
  function t(e) {
    if (e.movementX !== 0 || e.movementY !== 0) {
      a.ipc.send("call-method", {
        module: "Operation",
        handler: "_emitMouseEvent",
        params: ["mousemove", utils.createMouseEvent(e, a)],
        queue: false,
        timeout: true,
      });
    }
  }
  function e(e) {
    e = e;

    if (exports.status !== "pause" && isClicked) {
      a.ipc.send("call-method", {
        module: "Operation",
        handler: "_emitMouseEvent",
        params: ["mouseup", utils.createMouseEvent(e, a)],
        queue: false,
        timeout: true,
      });

      updateMouseButtonState(e);
      a.focus();
    }
  }
  function o(e) {
    e = e;

    if (exports.status !== "pause") {
      a.ipc.send("call-method", {
        module: "Operation",
        handler: "_emit",
        params: ["keyup", utils.createKeyboardEvent(e)],
        queue: false,
        timeout: true,
      });
    }
  }
  function s(e) {
    if (exports.status !== "pause" && isClicked) {
      t(e);
    }
  }
  release();
  await drag_drop_utils_1.default.init();

  a.addEventListener("dblclick", (e) => {
    if (exports.status !== "pause") {
      updateMouseButtonState(e);

      a.ipc.send("call-method", {
        module: "Operation",
        handler: "_emitMouseEvent",
        params: ["dblclick", utils.createMouseEvent(e, a)],
        queue: false,
        timeout: true,
      });
    }
  });

  a.addEventListener("mousedown", (e) => {
    if (exports.status !== "pause" && !previewMousedownDisable(e, a)) {
      updateMouseButtonState(e);

      a.ipc.send("call-method", {
        module: "Operation",
        handler: "_emitMouseEvent",
        params: ["mousedown", utils.createMouseEvent(e, a)],
        queue: false,
        timeout: true,
      });
    }
  });

  a.addEventListener("mousemove", (e) => {
    if (exports.status !== "pause" && !isClicked) {
      t(e);
    }
  });

  a.addEventListener("wheel", (e) => {
    if (exports.status !== "pause") {
      a.ipc.send("call-method", {
        module: "Operation",
        handler: "_emitMouseEvent",
        params: ["mousewheel", utils.createMouseEvent(e, a)],
        queue: false,
        timeout: true,
      });
    }
  });

  a.addEventListener("keydown", (e) => {
    if (exports.status !== "pause") {
      a.ipc.send("call-method", {
        module: "Operation",
        handler: "_emit",
        params: ["keydown", utils.createKeyboardEvent(e)],
        queue: false,
        timeout: true,
      });
    }
  });

  a.addEventListener("dragleave", (e) => {
    if (exports.status !== "pause") {
      drag_drop_utils_1.default.closeTips();
      e = utils.createDragEvent(e, a);

      a.ipc.send("call-method", {
        module: "Operation",
        handler: "_emitMouseEvent",
        params: ["onDragLeave", e],
        queue: false,
        timeout: true,
      });
    }
  });

  a.addEventListener("dragover", async (e) => {
    var t;

    if (exports.status !== "pause") {
      t = utils.createDragEvent(e, a);
      e.preventDefault();

      e.dataTransfer &&
        !drag_drop_utils_1.default.isSameType(t.values) &&
        ((e.dataTransfer.dropEffect = "none"),
        drag_drop_utils_1.default.showTips(
          Editor.I18n.t("scene.dragDrop.typeMismatch"),
          e.pageX,
          e.pageY
        ));

      a.ipc.send("call-method", {
        module: "Operation",
        handler: "_emitMouseEvent",
        params: ["onDragOver", t],
        queue: false,
        timeout: true,
      });
    }
  });

  a.addEventListener("drop", (e) => {
    if (exports.status !== "pause") {
      e.preventDefault();

      a.ipc.send("call-method", {
        module: "Operation",
        handler: "_emitMouseEvent",
        params: ["onDrop", utils.createDragEvent(e, a)],
        queue: false,
        timeout: true,
      });
    }
  });

  document.addEventListener("mousemove", s);
  document.addEventListener("mouseup", e);
  document.addEventListener("keyup", o);
  globalEventMap.set("mousemove", s);
  globalEventMap.set("mouseup", e);
  globalEventMap.set("keyup", o);
}
function release() {
  for (var [e, t] of globalEventMap.entries()) {
    document.removeEventListener(e, t);
  }
  globalEventMap.clear();
}
