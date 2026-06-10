Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = undefined;
class MessageHandle {
  send(e, ...s) {
    ccWorker.Ipc.send(e, ...s);
  }
  on(e, r) {
    ccWorker.Ipc.on(e, async (s, ...e) => {
      try {
        s.reply(null, await r(...e));
      } catch (e) {
        s.reply(e);
      }
    });
  }
}
exports.Message = new MessageHandle();
