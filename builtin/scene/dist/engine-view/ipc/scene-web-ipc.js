Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");

const { encode, decode } = require("v-stacks");

const utils_1 = require("../../script/utils/ipc/utils");

const { encodeArgs, decodeArgs } = utils_1;

class SceneWebIpc extends events_1.EventEmitter {
  _storage = new utils_1.DataStorage();
  isReady = false;
  $webview = null;
  _events;
  messageBuffer = [];
  _sendChannel;
  _replyChannel;
  constructor(e, s, t) {
    super();
    this.$webview = e;
    this._sendChannel = s;
    this._replyChannel = t;
    this.listen();
  }
  listen() {
    this.$webview.addEventListener("ipc-message", (e) => {
      if (e.channel === this._sendChannel) {
        this._onWebviewSend(e);
      } else if (e.channel === this._replyChannel) {
        this._onWebviewSendReply(e);
      }
    });
  }
  setReady(e) {
    this.isReady = e;

    if (this.isReady) {
      this.messageBuffer.forEach((e) => {
        this.$webview.send(
          this._sendChannel,
          e.id,
          e.data.message,
          e.data.arguments
        );
      });
    }

    this.messageBuffer.length = 0;
  }
  clearBuffer() {
    this.messageBuffer.length = 0;
  }
  send(a, ...i) {
    return new Promise((t, n) => {
      var e = {
        message: a,
        arguments: i.map(utils_1.encodeArgs),
        callback(e, s) {
          if (e) {
            n(e);
          } else {
            t(s);
          }
        },
        stack: "",
      };

      var s = this._storage.add(e);
      if (!this.isReady) {
        return this.messageBuffer.push({ id: s, data: e });
      }
      this.$webview.send(this._sendChannel, s, e.message, e.arguments);
    });
  }
  async _onWebviewSend(s) {
    var [s, e, t] = s.args;
    var t = t.map(utils_1.decodeArgs);
    var n = this._events[e];
    if (!n) {
      e = new Error("Could not find the message: " + e);
      console.warn(e);

      return this.$webview.contentWindow
        ? void this.$webview.send(this._replyChannel, s, e)
        : undefined;
    }
    try {
      var a = await n(...t);

      if (this.$webview.contentWindow) {
        this.$webview.send(this._replyChannel, s, null, encodeArgs(a));
      }
    } catch (e) {
      console.error(e);

      if (this.$webview.contentWindow) {
        this.$webview.send(this._replyChannel, s, encode(e));
      }
    }
  }
  _onWebviewSendReply(e) {
    var s = e.args[0];
    let t = e.args[1];
    var e = decodeArgs(e.args[2]);
    var n = this._storage.get(s);

    if (n) {
      if (n.callback) {
        t &&
          (t.stack
            ? (t.stack = t.stack.replace(
                /^[^\n]+/,
                (e) => e + "\n    at <process:scene>"
              ))
            : (t.stack =
                t.message +
                `
        at <process:scene>`),
          (t = decode(t)));

        n.callback(t, e);
      }
    } else {
      console.warn("IPC message has been lost.");
    }

    this._storage.remove(s);
  }
}
exports.default = SceneWebIpc;
