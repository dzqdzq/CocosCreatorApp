Object.defineProperty(exports, "__esModule", { value: true });
exports.setReady = setReady;
exports.ipcSend = ipcSend;
exports.ipcAddListener = ipcAddListener;
let isReady = true;
const waitQueue = [];
function waitReady(e) {
  if (!isReady) {
    console.debug(`Can not execute message ${e} success`);

    return new Promise((e) => {
      waitQueue.push(() => {
        e();
      });
    });
  }
}
function setReady() {
  for (isReady = true; waitQueue.length > 0; ) {
    waitQueue.shift()();
  }
}
function ipcSend(e, ...t) {
  ccWorker.Ipc.send(e, ...t);
}
function ipcAddListener(i, s) {
  ccWorker.Ipc.on(i, async (t, ...e) => {
    try {
      await waitReady(i);
      t.reply(null, await s(...e));
    } catch (e) {
      t.reply(e);
    }
  });
}
