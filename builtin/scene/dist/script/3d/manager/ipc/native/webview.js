Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const ipcRenderer = require("electron").ipcRenderer;
const utils_1 = require("../../../../public/ipc/utils");

const { encodeArgs, decodeArgs } = utils_1;

const { encode, decode } = require("v-stacks");

const utils_2 = require("../../../../utils/ipc/utils");

const sendChannel = isPreviewProcess
  ? utils_2.IPCChannel.PreviewSend
  : utils_2.IPCChannel.NativeSend;

const replyChannel = isPreviewProcess
  ? utils_2.IPCChannel.PreviewReply
  : utils_2.IPCChannel.NativeReply;

class WebviewIpc extends events_1.EventEmitter {
  _events;
  _storage = new utils_1.DataStorage();
  get storage() {
    return this._storage;
  }
  send(t, ...a) {
    return new Promise((n, r) => {
      var e = {
        message: t,
        arguments: a.map(utils_1.encodeArgs),
        callback(e, s) {
          if (e) {
            r(e);
          } else {
            n(s);
          }
        },
        stack: "",
      };

      var s = this._storage.add(e);
      ipcRenderer.sendToHost(sendChannel, s, e.message, e.arguments);
    });
  }
  request(e, ...s) {
    return this.send(e, ...s);
  }
}
const ipc = new WebviewIpc();
exports.default = ipc;

ipcRenderer.on(sendChannel, async (e, s, n, r) => {
  n = ipc._events[n];
  try {
    var t = await n(...r.map(utils_1.decodeArgs));
    ipcRenderer.sendToHost(replyChannel, s, null, encodeArgs(t));
  } catch (e) {
    console.log(e);
    ipcRenderer.sendToHost(replyChannel, s, encode(e));
  }
});

ipcRenderer.on(replyChannel, (e, s, n, r) => {
  var t = ipc.storage.get(s);
  if (t) {
    if (t.callback) {
      if (n) {
        typeof n.stack == "string" &&
          (n.stack = n.stack.replace(
            /^[^\n]+/,
            (e) => e + "\n    at <process:scene>"
          ));

        n = decode(n);
      }

      try {
        t.callback(n, decodeArgs(r));
      } catch (e) {
        console.error(e);
      }
    }
  } else {
    console.warn("IPC message has been lost.");
  }
  ipc.storage.remove(s);
});
