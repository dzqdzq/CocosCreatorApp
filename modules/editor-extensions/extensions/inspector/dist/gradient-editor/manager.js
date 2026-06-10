Object.defineProperty(exports, "__esModule", { value: true });
exports.changeGradintState = changeGradintState;
exports.changeGrandintData = changeGrandintData;
exports.open = open;
exports.update = update;
exports.close = close;
let vm = null;
let cache;
let isOpened = false;
let isLocking = false;
function changeGradintState(e) {
  if ((isOpened = e) && vm) {
    Editor.Message.send("inspector", "gradient-data", cache);
  } else {
    clear();
  }
}
function changeGrandintData(e) {
  if (vm) {
    vm.apply(e);
  }
}
function open(e, n) {
  if (!isLocking) {
    Editor.Panel.open("inspector.gradient-editor");
    isLocking = true;
  }

  vm = n;
  update(e);
}
function update(e) {
  cache = e;

  if (isOpened) {
    process.nextTick(() => {
      Editor.Message.send("inspector", "gradient-data", cache);
      isLocking = false;
    });
  }
}
function close(e) {
  if (e === vm) {
    Editor.Panel.close("inspector.gradient-editor");
    clear();
  }
}
function clear() {
  vm = null;
  isOpened = false;
  isLocking = false;
  cache = null;
}
