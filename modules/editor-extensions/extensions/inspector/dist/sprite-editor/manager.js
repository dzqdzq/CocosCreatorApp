Object.defineProperty(exports, "__esModule", { value: true });
exports.changeSpriteData = changeSpriteData;
exports.changeSpriteState = changeSpriteState;
exports.open = open;
exports.update = update;
exports.close = close;
let vm = null;
let isOpened = false;
let isLocking = false;
function changeSpriteData(e) {
  if (vm) {
    vm.saveSpriteEditor(e);
  }
}
function changeSpriteState(e) {
  if ((isOpened = e) && vm) {
    Editor.Message.send("inspector", "sprite-keys", {
      userData: vm.meta.userData,
    });
  } else {
    clear();
  }
}
function open(e) {
  vm = e;

  if (!isLocking) {
    Editor.Panel.open("inspector.sprite-editor");
    isLocking = true;
  }

  update();
}
function update() {
  if (isOpened) {
    setTimeout(() => {
      Editor.Message.send("inspector", "sprite-keys", {
        userData: vm.meta.userData,
      });

      isLocking = false;
    }, 200);
  }
}
function close(e) {
  if (e === vm) {
    Editor.Panel.close("inspector.sprite-editor");
    clear();
  }
}
function clear() {
  vm = null;
  isOpened = false;
  isLocking = false;
}
