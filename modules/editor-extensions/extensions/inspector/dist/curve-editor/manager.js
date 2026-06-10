Object.defineProperty(exports, "__esModule", { value: true });
exports.changeCurveData = changeCurveData;
exports.changeCurveState = changeCurveState;
exports.drawCurve = drawCurve;
exports.open = open;
exports.update = update;
exports.close = close;
let vm = null;
let cache = null;
let isOpened = false;
let isLocking = false;
const drawHermite = require("./utils").drawHermite;
function changeCurveData(e) {
  if (vm) {
    vm.apply(e);
  }
}
function changeCurveState(e) {
  if ((isOpened = e) && vm) {
    Editor.Message.send("inspector", "curve-keys", cache);
  } else {
    clear();
    Editor.Panel.close("inspector.curve-editor");
  }
}
function drawCurve(e, r, t) {
  drawHermite(e, r, t);
}
function open(e, r) {
  cache = e;

  if (!isLocking) {
    Editor.Panel.open("inspector.curve-editor", e);
    isLocking = true;
  }

  update(e, (vm = r));
}
function update(e, r) {
  vm = r;

  if (isOpened && vm) {
    process.nextTick(() => {
      Editor.Message.send("inspector", "curve-keys", e);
      isLocking = false;
    });
  }
}
function close(e) {
  if (e === vm) {
    Editor.Panel.close("inspector.curve-editor");
    clear();
  }
}
function clear() {
  vm = null;
  isOpened = false;
  isLocking = false;
  cache = null;
}
