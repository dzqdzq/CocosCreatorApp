function getMainWindowSize() {
  return isSceneNative
    ? jsb.ISystemWindowManager.getInstance().getWindow(1).getViewSize()
    : { width: cc.game.canvas.width, height: cc.game.canvas.height };
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMainWindowSize = getMainWindowSize;
