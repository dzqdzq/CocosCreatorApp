Object.defineProperty(exports, "__esModule", { value: true });
exports.messageManager = undefined;
const timer_util_1 = require("../utils/timer-util");
class MessageManager {
  _timerUtil = new timer_util_1.TimerUtil();
  broadcast(e, ...s) {
    Editor.Message.broadcast(e, ...s);
  }
  IpcSend(e, ...s) {
    cce.Ipc.send(e, ...s);
  }
  broadcastChangeNodeMsg(e) {
    if (isPreviewProcess) {
      cc.GAME_VIEW;
    }

    this._timerUtil.callFunctionLimit(
      e,
      this.broadcast,
      "scene:change-node",
      e
    );
  }
}
const messageManager = new MessageManager();
exports.messageManager = messageManager;
